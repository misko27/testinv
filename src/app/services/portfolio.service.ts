import { Injectable, signal, computed } from '@angular/core';
import { PortfolioHolding, PortfolioSummary } from '../models/portfolio.model';
import { StockService } from './stock.service';

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private readonly STORAGE_KEY = 'portfolio-holdings';

  // Sample data for demonstration
  private readonly sampleHoldings: PortfolioHolding[] = [
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 10,
      averageCost: 150.0,
      totalCost: 1500.0,
      currentPrice: 0,
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '2',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      quantity: 5,
      averageCost: 2500.0,
      totalCost: 12500.0,
      currentPrice: 0,
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
    {
      id: '3',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      quantity: 8,
      averageCost: 300.0,
      totalCost: 2400.0,
      currentPrice: 0,
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    },
  ];

  readonly holdings = signal<PortfolioHolding[]>(this.loadHoldings());
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
    // Initialize with sample data if no holdings exist
    if (this.holdings().length === 0) {
      this.holdings.set(this.sampleHoldings);
      this.saveHoldings();
    }

    // Update prices on service initialization
    this.updateAllPrices();
  }

  private loadHoldings(): PortfolioHolding[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((h: any) => ({
        ...h,
        lastUpdated: new Date(h.lastUpdated),
      }));
    }
    return [];
  }

  private saveHoldings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.holdings()));
  }

  async updateAllPrices(): Promise<void> {
    this.loading.set(true);

    const holdings = this.holdings();
    const updatePromises = holdings.map(async (holding) => {
      try {
        const quote = await this.stockService.getQuote(holding.symbol).toPromise();
        if (quote) {
          const marketValue = holding.quantity * quote.price;
          const gainLoss = marketValue - holding.totalCost;
          const gainLossPercent = holding.totalCost > 0 ? (gainLoss / holding.totalCost) * 100 : 0;

          return {
            ...holding,
            name: holding.name,
            currentPrice: quote.price,
            marketValue,
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
      this.saveHoldings();
    } catch (error) {
      console.error('Failed to update prices:', error);
    } finally {
      this.loading.set(false);
    }
  }

  addHolding(
    holding: Omit<
      PortfolioHolding,
      'id' | 'currentPrice' | 'marketValue' | 'gainLoss' | 'gainLossPercent' | 'lastUpdated'
    >,
  ): void {
    const newHolding: PortfolioHolding = {
      ...holding,
      id: Date.now().toString(),
      currentPrice: 0,
      marketValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    };

    this.holdings.update((current) => [...current, newHolding]);
    this.saveHoldings();
    this.updateAllPrices();
  }

  removeHolding(id: string): void {
    this.holdings.update((current) => current.filter((h) => h.id !== id));
    this.saveHoldings();
  }

  updateHolding(id: string, updates: Partial<PortfolioHolding>): void {
    this.holdings.update((current) => current.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    this.saveHoldings();
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
}
