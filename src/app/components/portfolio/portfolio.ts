import { Component, signal, inject } from '@angular/core';
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

  // Expose service signals
  readonly holdings = this.portfolioService.holdings;
  readonly summary = this.portfolioService.summary;
  readonly loading = this.portfolioService.loading;

  refreshPrices(): void {
    this.portfolioService.updateAllPrices();
  }

  removeHolding(id: string): void {
    if (confirm('Are you sure you want to remove this holding?')) {
      this.portfolioService.removeHolding(id);
    }
  }

  // Formatting helpers
  formatCurrency = (value: number) => this.portfolioService.formatCurrency(value);
  formatPercent = (value: number) => this.portfolioService.formatPercent(value);

  isPositive(value: number): boolean {
    return value >= 0;
  }
}
