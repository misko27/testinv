export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number; // Cost per share when bought (in original currency)
  totalCost: number; // quantity * averageCost (converted to USD)
  currentPrice: number; // Price in original currency for display
  currency: string; // Original currency (USD, CAD, etc.)
  marketValue: number; // quantity * currentPrice converted to USD
  gainLoss: number; // marketValue - totalCost (both in USD)
  gainLossPercent: number; // (gainLoss / totalCost) * 100
  lastUpdated: Date;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: PortfolioHolding[];
}
