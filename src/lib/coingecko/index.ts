import { CoinGeckoBaseClient, CoinGeckoConfig } from './base';
import { MarketsClient } from './markets';

export class CoinGeckoClient extends CoinGeckoBaseClient {
  public markets: MarketsClient;

  constructor(config: CoinGeckoConfig = {}) {
    super(config);
    this.markets = new MarketsClient(config);
  }
}

export function createCoinGeckoClient(apiKey?: string, usePro?: boolean): CoinGeckoClient {
  return new CoinGeckoClient({ apiKey, usePro });
}

export * from './base';
export * from './markets';

