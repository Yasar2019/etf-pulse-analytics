import { NextRequest, NextResponse } from "next/server";
import { getBusinessQuantHoldings, type PortfolioHolding } from "@/lib/providers/businessQuantPortfolio";
import { getAlphaVantageETFProfile } from "@/lib/providers/alphaVantage";
import { getCachedFundUniverse } from "@/lib/services/fundUniverse";
import { etfProvider } from "@/lib/provider";

export const dynamic = "force-dynamic";

type InputHolding = { ticker?: string; weight?: number };
type WeightedBucket = { bucket: string; weightPct: number };

type FundRow = {
  ticker: string;
  weight: number;
  normalizedWeight: number;
  fundName?: string;
  expenseRatioPct?: number;
  rawHoldings: PortfolioHolding[];
  sectors: WeightedBucket[];
  countries: WeightedBucket[];
  stats: Awaited<ReturnType<typeof etfProvider.getPerformanceStats>> | null;
  holdingsSource: "businessquant" | "alpha-vantage" | "none";
};

function normalizeTicker(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
}

function aggregateBuckets(rows: Array<{ weight: number; exposure: WeightedBucket[] }>) {
  const map = new Map<string, number>();
  for (const row of rows) {
    for (const item of row.exposure) {
      map.set(item.bucket, (map.get(item.bucket) ?? 0) + (row.weight * item.weightPct / 100));
    }
  }
  return [...map.entries()].map(([bucket, weightPct]) => ({ bucket, weightPct: Number(weightPct.toFixed(2)) })).sort((a,b)=>b.weightPct-a.weightPct);
}

function bucketHoldings(rows: PortfolioHolding[], field: "sector" | "country"): WeightedBucket[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const bucket = row[field] || "Other";
    map.set(bucket, (map.get(bucket) ?? 0) + Math.abs(row.weightPct));
  }
  const total = [...map.values()].reduce((s,v)=>s+v,0) || 1;
  return [...map.entries()].map(([bucket, value]) => ({ bucket, weightPct: value / total * 100 })).sort((a,b)=>b.weightPct-a.weightPct);
}

function hhi(weights: number[]) {
  return weights.reduce((sum, w) => sum + Math.pow(w / 100, 2), 0);
}

function normalizeExpenseRatio(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return value <= 1 ? value * 100 : value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const raw = Array.isArray(body?.holdings) ? body.holdings as InputHolding[] : [];
    const holdings = raw.map(h => ({ ticker: normalizeTicker(h.ticker), weight: Number(h.weight ?? 0) }))
      .filter(h => h.ticker && Number.isFinite(h.weight) && h.weight > 0)
      .slice(0, 10);

    if (!holdings.length) return NextResponse.json({ error: "Add at least one ETF with a positive weight." }, { status: 400 });
    const totalInputWeight = holdings.reduce((sum,h)=>sum+h.weight,0);
    const normalized = holdings.map(h => ({ ...h, normalizedWeight: h.weight / totalInputWeight * 100 }));

    const { universe } = await getCachedFundUniverse().catch(()=>({universe:null,businessQuantError:null}));
    const universeMap = new Map((universe?.rows ?? []).map(r=>[r.ticker.toUpperCase(),r]));

    const fundRows: FundRow[] = await Promise.all(normalized.map(async h => {
      const cached = universeMap.get(h.ticker);
      const [bqHoldings, stats] = await Promise.all([
        getBusinessQuantHoldings(h.ticker).catch(()=>null),
        etfProvider.getPerformanceStats(h.ticker).catch(()=>null),
      ]);

      let rawHoldings = bqHoldings ?? [];
      let sectors = bqHoldings ? bucketHoldings(bqHoldings,"sector") : [];
      let countries = bqHoldings ? bucketHoldings(bqHoldings,"country") : [];
      let holdingsSource: FundRow["holdingsSource"] = bqHoldings ? "businessquant" : "none";
      let expenseRatioPct = cached?.expenseRatioPct;
      let fundName = cached?.fundName;

      if (!bqHoldings || expenseRatioPct === undefined) {
        const alpha = await getAlphaVantageETFProfile(h.ticker).catch(()=>null);
        if (alpha) {
          if (!bqHoldings && alpha.holdings.length) {
            rawHoldings = alpha.holdings.map(x=>({key:x.symbol,name:x.name,ticker:x.symbol,weightPct:x.weight}));
            sectors = alpha.sectors.map(x=>({bucket:x.sector,weightPct:x.weight}));
            countries = [];
            holdingsSource = "alpha-vantage";
          }
          expenseRatioPct = expenseRatioPct ?? normalizeExpenseRatio(alpha.expenseRatio);
        }
      }

      return {
        ...h,
        fundName,
        expenseRatioPct,
        rawHoldings,
        sectors,
        countries,
        stats,
        holdingsSource,
      };
    }));

    const weightedExpense = fundRows.reduce((sum,r)=>sum + r.normalizedWeight * (r.expenseRatioPct ?? 0) / 100, 0);
    const expenseCoverage = fundRows.filter(r=>r.expenseRatioPct!==undefined).reduce((sum,r)=>sum+r.normalizedWeight,0);
    const weightedVolatility = fundRows.reduce((sum,r)=>sum + r.normalizedWeight * (r.stats?.annualizedVolatility ?? 0) / 100, 0);
    const riskCoverage = fundRows.filter(r=>r.stats).reduce((sum,r)=>sum+r.normalizedWeight,0);

    const sectorExposure = aggregateBuckets(fundRows.map(r=>({weight:r.normalizedWeight,exposure:r.sectors})));
    const countryExposure = aggregateBuckets(fundRows.map(r=>({weight:r.normalizedWeight,exposure:r.countries})));

    const underlying = new Map<string,{ key:string; ticker?:string; name:string; weightPct:number }>();
    for (const fund of fundRows) {
      for (const h of fund.rawHoldings) {
        const contribution = fund.normalizedWeight * h.weightPct / 100;
        const current = underlying.get(h.key);
        if (current) current.weightPct += contribution;
        else underlying.set(h.key,{key:h.key,ticker:h.ticker,name:h.name,weightPct:contribution});
      }
    }
    const underlyingHoldings = [...underlying.values()].sort((a,b)=>b.weightPct-a.weightPct).map(h=>({...h,weightPct:Number(h.weightPct.toFixed(2))}));

    const pairwiseOverlaps: Array<{a:string;b:string;overlapPct:number}> = [];
    for (let i=0;i<fundRows.length;i++) {
      const a = fundRows[i];
      const mapA = new Map(a.rawHoldings.map(h=>[h.key,h.weightPct]));
      for (let j=i+1;j<fundRows.length;j++) {
        const b = fundRows[j];
        let overlap = 0;
        for (const h of b.rawHoldings) overlap += Math.min(Math.abs(mapA.get(h.key) ?? 0), Math.abs(h.weightPct));
        pairwiseOverlaps.push({a:a.ticker,b:b.ticker,overlapPct:Number(overlap.toFixed(2))});
      }
    }
    pairwiseOverlaps.sort((a,b)=>b.overlapPct-a.overlapPct);

    const holdingsCoverage = fundRows.filter(r=>r.rawHoldings.length).reduce((sum,r)=>sum+r.normalizedWeight,0);
    const countryCoverage = fundRows.filter(r=>r.countries.length).reduce((sum,r)=>sum+r.normalizedWeight,0);
    const fundConcentration = hhi(fundRows.map(r=>r.normalizedWeight));
    const sectorConcentration = sectorExposure.length ? hhi(sectorExposure.map(x=>x.weightPct)) : 1;
    const countryConcentration = countryExposure.length ? hhi(countryExposure.map(x=>x.weightPct)) : 1;
    const underlyingConcentration = underlyingHoldings.length ? hhi(underlyingHoldings.map(x=>x.weightPct)) : 1;
    const averagePairOverlap = pairwiseOverlaps.length ? pairwiseOverlaps.reduce((s,x)=>s+x.overlapPct,0)/pairwiseOverlaps.length : 0;

    const concentrationPenalty = Math.min(35, fundConcentration * 24 + sectorConcentration * 18 + countryConcentration * 10 + underlyingConcentration * 20);
    const overlapPenalty = Math.min(25, averagePairOverlap * 0.25);
    const combinedCoverage = Math.min(expenseCoverage,riskCoverage,holdingsCoverage);
    const coveragePenalty = ((100-combinedCoverage)/100)*15;
    const diversificationScore = Math.max(0, Math.min(100, Math.round(100-concentrationPenalty-overlapPenalty-coveragePenalty)));

    const portfolioRisk = weightedVolatility < 12 ? "Low" : weightedVolatility < 22 ? "Moderate" : "High";

    return NextResponse.json({
      mode: "live-derived",
      totalInputWeight: Number(totalInputWeight.toFixed(2)),
      holdings: fundRows.map(r=>({
        ticker:r.ticker,
        inputWeight:r.weight,
        normalizedWeight:Number(r.normalizedWeight.toFixed(2)),
        fundName:r.fundName,
        expenseRatioPct:r.expenseRatioPct,
        annualizedVolatility:r.stats?.annualizedVolatility,
        holdingsSource:r.holdingsSource,
      })),
      metrics: {
        weightedExpenseRatioPct: Number(weightedExpense.toFixed(3)),
        expenseCoveragePct: Number(expenseCoverage.toFixed(1)),
        weightedVolatilityPct: Number(weightedVolatility.toFixed(2)),
        riskCoveragePct: Number(riskCoverage.toFixed(1)),
        holdingsCoveragePct: Number(holdingsCoverage.toFixed(1)),
        countryCoveragePct: Number(countryCoverage.toFixed(1)),
        risk: portfolioRisk,
        diversificationScore,
        averagePairOverlapPct: Number(averagePairOverlap.toFixed(2)),
      },
      sectorExposure: sectorExposure.slice(0,15),
      countryExposure: countryExposure.slice(0,15),
      underlyingHoldings: underlyingHoldings.slice(0,25),
      pairwiseOverlaps: pairwiseOverlaps.slice(0,20),
      methodology: "Diversification score is a heuristic based on fund-weight concentration, sector/country concentration, underlying-holding concentration, pairwise ETF overlap, and provider coverage. BusinessQuant holdings are preferred; Alpha Vantage is used as a lower-call fallback when available. It is not an investment recommendation.",
      providers: {
        businessQuant: Boolean(process.env.BUSINESSQUANT_API_KEY?.trim()),
        alphaVantage: Boolean(process.env.ALPHA_VANTAGE_API_KEY?.trim()),
        twelveData: Boolean(process.env.TWELVE_DATA_API_KEY?.trim()),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Portfolio analysis failed" }, { status: 500 });
  }
}
