import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../services/portfolio.service';
import { PortfolioHolding } from '../../models/portfolio.model';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
})
export class Portfolio {
  private portfolioService = inject(PortfolioService);

  // Sorting state
  sortColumn = signal<string>('symbol');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Chart colors - distinct palette
  private readonly colors = [
    '#4361ee',
    '#10b981',
    '#f72585',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
    '#ef4444',
    '#84cc16',
    '#ec4899',
    '#14b8a6',
  ];

  // Expose service signals
  readonly holdings = this.portfolioService.holdings;
  readonly summary = this.portfolioService.summary;
  readonly loading = this.portfolioService.loading;

  // Sorted holdings
  readonly sortedHoldings = computed(() => {
    const holdings = [...this.holdings()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return holdings.sort((a, b) => {
      let aVal: any = a[column as keyof PortfolioHolding];
      let bVal: any = b[column as keyof PortfolioHolding];

      // Handle string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  // Computed allocation data for chart
  readonly allocation = computed(() => {
    const holdings = this.holdings();
    const totalValue = this.summary().totalValue;

    if (totalValue === 0) return [];

    return holdings
      .map((h, i) => ({
        symbol: h.symbol,
        name: h.name,
        value: h.marketValue,
        percent: (h.marketValue / totalValue) * 100,
        color: this.colors[i % this.colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  });

  // Generate conic gradient for donut chart
  readonly chartGradient = computed(() => {
    const alloc = this.allocation();
    if (alloc.length === 0) return 'conic-gradient(#e0e0e0 0% 100%)';

    let gradient = 'conic-gradient(';
    let cumulative = 0;

    alloc.forEach((item, i) => {
      const start = cumulative;
      cumulative += item.percent;
      gradient += `${item.color} ${start}% ${cumulative}%`;
      if (i < alloc.length - 1) gradient += ', ';
    });

    gradient += ')';
    return gradient;
  });

  refreshPrices(): void {
    this.portfolioService.updateAllPrices();
  }

  removeHolding(id: string): void {
    if (confirm('Are you sure you want to remove this holding?')) {
      this.portfolioService.removeHolding(id);
    }
  }

  toggleSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  // Formatting helpers
  formatCurrency = (value: number) => this.portfolioService.formatCurrency(value);
  formatPercent = (value: number) => this.portfolioService.formatPercent(value);

  formatPriceWithCurrency(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  }

  isPositive(value: number): boolean {
    return value >= 0;
  }
}
