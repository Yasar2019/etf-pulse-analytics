import { NextRequest, NextResponse } from "next/server";
import { getBusinessQuantExposure } from "@/lib/providers/businessQuant";
import { getBusinessQuantHoldings, getBusinessQuantOverview } from "@/lib/providers/businessQuantPortfolio";
import { etfProvider } from "@/lib/provider";

export const dynamic = "force-dynamic";

type InputHolding = { ticker?: string; weight?: number };
type WeightedBucket = { bucket: string; weightPct: number };

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

function hhi(weights: number[]) {
  return weights.reduce((sum, w) => sum + Math.pow(w / 100, 2), 0);
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

    const fundRows = await Promise.all(normalized.map(async h => {
      const [overview, sectors, countries, rawHoldings, stats] = await Promise.all([
        getBusinessQuantOverview(h.ticker).catch(()=>null),
        getBusinessQuantExposure(h.ticker, "sector").catch(()=>null),
        getBusinessQuantExposure(h.ticker, "country").catch(()=>null),
        getBusinessQuantHoldings(h.ticker).catch(()=>null),
        etfProvider.getPerformanceStats(h.ticker).catch(()=>null),
      ]);
      return { ...h, overview, sectors: sectors ?? [], countries: countries ?? [], rawHoldings: rawHoldings ?? [], stats };
    }));

    const weightedExpense = fundRows.reduce((sum,r)=>sum + r.normalizedWeight * (r.overview?.netExpenseRatioPct ?? 0) / 100, 0);
    const expenseCoverage = fundRows.filter(r=>r.overview?.netExpenseRatioPct!==undefined).reduce((sum,r)=>sum+r.normalizedWeight,0);
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

    const fundConcentration = hhi(fundRows.map(r=>r.normalizedWeight));
    const sectorConcentration = sectorExposure.length ? hhi(sectorExposure.map(x=>x.weightPct)) : 1;
    const countryConcentration = countryExposure.length ? hhi(countryExposure.map(x=>x.weightPct)) : 1;
    const underlyingConcentration = underlyingHoldings.length ? hhi(underlyingHoldings.map(x=>x.weightPct)) : 1;
    const averagePairOverlap = pairwiseOverlaps.length ? pairwiseOverlaps.reduce((s,x)=>s+x.overlapPct,0)/pairwiseOverlaps.length : 0;

    const concentrationPenalty = Math.min(35, fundConcentration * 24 + sectorConcentration * 18 + countryConcentration * 10 + underlyingConcentration * 20);
    const overlapPenalty = Math.min(25, averagePairOverlap * 0.25);
    const coveragePenalty = ((100-Math.min(expenseCoverage,riskCoverage))/100)*10;
    const diversificationScore = Math.max(0, Math.min(100, Math.round(100-concentrationPenalty-overlapPenalty-coveragePenalty)));

    const portfolioRisk = weightedVolatility < 12 ? "Low" : weightedVolatility < 22 ? "Moderate" : "High";

    return NextResponse.json({
      mode: "live-derived",
      totalInputWeight: Number(totalInputWeight.toFixed(2)),
      holdings: fundRows.map(r=>({
        ticker:r.ticker,
        inputWeight:r.weight,
        normalizedWeight:Number(r.normalizedWeight.toFixed(2)),
        fundName:r.overview?.fundName,
        expenseRatioPct:r.overview?.netExpenseRatioPct,
        annualizedVolatility:r.stats?.annualizedVolatility,
      })),
      metrics: {
        weightedExpenseRatioPct: Number(weightedExpense.toFixed(3)),
        expenseCoveragePct: Number(expenseCoverage.toFixed(1)),
        weightedVolatilityPct: Number(weightedVolatility.toFixed(2)),
        riskCoveragePct: Number(riskCoverage.toFixed(1)),
        risk: portfolioRisk,
        diversificationScore,
        averagePairOverlapPct: Number(averagePairOverlap.toFixed(2)),
      },
      sectorExposure: sectorExposure.slice(0,15),
      countryExposure: countryExposure.slice(0,15),
      underlyingHoldings: underlyingHoldings.slice(0,25),
      pairwiseOverlaps: pairwiseOverlaps.slice(0,20),
      methodology: "Diversification score is a heuristic based on fund-weight concentration, sector/country concentration, underlying-holding concentration, pairwise ETF overlap, and provider coverage. It is not an investment recommendation.",
      providers: {
        businessQuant: Boolean(process.env.BUSINESSQUANT_API_KEY?.trim()),
        twelveData: Boolean(process.env.TWELVE_DATA_API_KEY?.trim()),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Portfolio analysis failed" }, { status: 500 });
  }
}
