export interface StockQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface StockTimeSeries {
  symbol: string;
  data: StockTimeSeriesEntry[];
}

export interface StockTimeSeriesEntry {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
