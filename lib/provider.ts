import { ETF } from "./types";
import { etfs } from "./demoData";

/**
 * Data-provider contract. Replace DemoETFProvider with a licensed vendor/API
 * without changing page components.
 */
export interface ETFDataProvider {
  listETFs(): Promise<ETF[]>;
  getETF(symbol: string): Promise<ETF | null>;
}

export class DemoETFProvider implements ETFDataProvider {
  async listETFs() { return etfs; }
  async getETF(symbol: string) { return etfs.find(e => e.symbol === symbol.toUpperCase()) ?? null; }
}

export const etfProvider: ETFDataProvider = new DemoETFProvider();
