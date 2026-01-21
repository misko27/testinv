import { Injectable, signal, computed } from '@angular/core';
import { PortfolioHolding, PortfolioSummary } from '../models/portfolio.model';
import { StockService } from './stock.service';

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  // Exchange rate cache
  private cadToUsdRate = 1; // Default to 1, will be updated

  // Sample data for demonstration
  private readonly sampleHoldings: PortfolioHolding[] = [
    {
      id: '1',
      symbol: 'CSU.TO',
      name: 'Constellation Software Inc.',
      quantity: 5,
      averageCost: 2919.24,
      totalCost: 0, // Will be calculated with exchange rate
      currentPrice: 0,
      currency: 'CAD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '2',
      symbol: 'PYPL',
      name: 'PayPal Holdings Inc.',
      quantity: 350,
      averageCost: 61.81,
      totalCost: 21634.0,
      currentPrice: 0,
      currency: 'USD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '3',
      symbol: 'ALGN',
      name: 'Align Technology Inc.',
      quantity: 25,
      averageCost: 130.45,
      totalCost: 3261.25,
      currentPrice: 0,
      currency: 'USD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '4',
      symbol: 'NVO',
      name: 'Novo Nordisk A/S',
      quantity: 230,
      averageCost: 50.11,
      totalCost: 11525.1,
      currentPrice: 0,
      currency: 'USD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '5',
      symbol: 'TTD',
      name: 'The Trade Desk Inc.',
      quantity: 250,
      averageCost: 42.74,
      totalCost: 10686.1,
      currentPrice: 0,
      currency: 'USD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '6',
      symbol: 'BIDU',
      name: 'Baidu Inc.',
      quantity: 37,
      averageCost: 80.96,
      totalCost: 2995.52,
      currentPrice: 0,
      currency: 'USD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '7',
      symbol: 'KWEB.L',
      name: 'KraneShares CSI China Internet ETF',
      quantity: 200,
      averageCost: 20.46,
      totalCost: 4092.0,
      currentPrice: 0,
      currency: 'USD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '8',
      symbol: 'BABA',
      name: 'Alibaba Group Holding Ltd.',
      quantity: 260,
      averageCost: 95.31,
      totalCost: 24780.0,
      currentPrice: 0,
      currency: 'USD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
  ];

  readonly holdings = signal<PortfolioHolding[]>([...this.sampleHoldings]);
  readonly loading = signal(false);

  // Computed signals for portfolio summary
  readonly summary = computed(() => {
    const holdings = this.holdings();
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      holdings,
    } as PortfolioSummary;
  });

  constructor(private stockService: StockService) {
    // Update prices on service initialization
    this.updateAllPrices();
  }

  /**
   * Fetch CAD to USD exchange rate using Yahoo Finance
   */
  private async fetchCadToUsdRate(): Promise<number> {
    try {
      const quote = await this.stockService.getQuote('CADUSD=X').toPromise();
      if (quote?.price) {
        this.cadToUsdRate = quote.price;
        return quote.price;
      }
    } catch (error) {
      console.error('Failed to fetch CAD/USD rate:', error);
    }
    return this.cadToUsdRate; // Return cached or default rate
  }

  async updateAllPrices(): Promise<void> {
    this.loading.set(true);

    // Fetch exchange rate first
    await this.fetchCadToUsdRate();

    const holdings = this.holdings();
    const updatePromises = holdings.map(async (holding) => {
      try {
        const quote = await this.stockService.getQuote(holding.symbol).toPromise();
        if (quote) {
          const currency = quote.currency || 'USD';
          // Keep original price for display
          const currentPrice = quote.price;

          // Convert to USD for market value calculation
          let marketValueUsd = holding.quantity * quote.price;
          if (currency === 'CAD') {
            marketValueUsd = holding.quantity * quote.price * this.cadToUsdRate;
          }

          // Calculate total cost in USD (convert if CAD)
          let totalCostUsd = holding.quantity * holding.averageCost;
          if (currency === 'CAD') {
            totalCostUsd = holding.quantity * holding.averageCost * this.cadToUsdRate;
          }

          const gainLoss = marketValueUsd - totalCostUsd;
          const gainLossPercent = totalCostUsd > 0 ? (gainLoss / totalCostUsd) * 100 : 0;

          return {
            ...holding,
            name: holding.name,
            currentPrice,
            currency,
            marketValue: marketValueUsd,
            totalCost: totalCostUsd,
            gainLoss,
            gainLossPercent,
            lastUpdated: new Date(),
          } as PortfolioHolding;
        }
      } catch (error) {
        console.error(`Failed to update ${holding.symbol}:`, error);
      }
      return holding;
    });

    try {
      const updatedHoldings = await Promise.all(updatePromises);
      this.holdings.set(updatedHoldings);
    } catch (error) {
      console.error('Failed to update prices:', error);
    } finally {
      this.loading.set(false);
    }
  }

  addHolding(
    holding: Omit<
      PortfolioHolding,
      | 'id'
      | 'currentPrice'
      | 'currency'
      | 'marketValue'
      | 'gainLoss'
      | 'gainLossPercent'
      | 'lastUpdated'
    >,
  ): void {
    const newHolding: PortfolioHolding = {
      ...holding,
      id: Date.now().toString(),
      currentPrice: 0,
      currency: 'USD',
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    };

    this.holdings.update((current) => [...current, newHolding]);
    this.updateAllPrices();
  }

  removeHolding(id: string): void {
    this.holdings.update((current) => current.filter((h) => h.id !== id));
  }

  updateHolding(id: string, updates: Partial<PortfolioHolding>): void {
    this.holdings.update((current) => current.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  formatPercent(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  resetToSampleData(): void {
    this.holdings.set([...this.sampleHoldings]);
    this.updateAllPrices();
  }
}
