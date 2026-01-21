import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { StockQuote, StockSearchResult } from '../../models/stock.model';

@Component({
  selector: 'app-stock-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-info.html',
  styleUrl: './stock-info.scss',
})
export class StockInfo {
  private stockService = inject(StockService);

  searchQuery = signal('');
  selectedSymbol = signal<string | null>(null);
  quote = signal<StockQuote | null>(null);
  searchResults = signal<StockSearchResult[]>([]);

  // Expose service signals
  readonly loading = this.stockService.loading;
  readonly error = this.stockService.error;

  // Popular stocks for quick access
  readonly popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA'];

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.stockService.searchStocks(query).subscribe((results) => {
      this.searchResults.set(results);
    });
  }

  selectStock(symbol: string): void {
    this.selectedSymbol.set(symbol);
    this.searchResults.set([]);
    this.searchQuery.set('');
    this.loadQuote(symbol);
  }

  loadQuote(symbol: string): void {
    this.stockService.getQuote(symbol).subscribe((data) => {
      this.quote.set(data);
    });
  }

  refreshQuote(): void {
    const symbol = this.selectedSymbol();
    if (symbol) {
      this.loadQuote(symbol);
    }
  }

  clearSelection(): void {
    this.selectedSymbol.set(null);
    this.quote.set(null);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatVolume(value: number): string {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + 'B';
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + 'M';
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(2) + 'K';
    }
    return value.toString();
  }

  isPositiveChange(quote: StockQuote): boolean {
    return quote.change >= 0;
  }
}
