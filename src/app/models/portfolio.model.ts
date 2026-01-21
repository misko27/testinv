export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number; // Cost per share when bought
  totalCost: number; // quantity * averageCost
  currentPrice: number;
  marketValue: number; // quantity * currentPrice
  gainLoss: number; // marketValue - totalCost
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