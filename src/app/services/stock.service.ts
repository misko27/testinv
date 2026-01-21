import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import {
  StockQuote,
  StockSearchResult,
  StockTimeSeries,
  StockTimeSeriesEntry,
} from '../models/stock.model';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  // Point to the local Node.js proxy server
  private readonly BASE_URL = 'http://localhost:3000/api';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get real-time quote for a stock symbol (via Yahoo Finance)
   */
  getQuote(symbol: string): Observable<StockQuote | null> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<any>(`${this.BASE_URL}/quote/${symbol}`).pipe(
      map((data) => {
        this.loading.set(false);
        if (!data) {
          this.error.set('No data found for this symbol');
          return null;
        }

        return {
          symbol: data.symbol,
          open: data.regularMarketOpen,
          high: data.regularMarketDayHigh,
          low: data.regularMarketDayLow,
          price: data.regularMarketPrice,
          volume: data.regularMarketVolume,
          latestTradingDay: new Date(data.regularMarketTime).toISOString().split('T')[0],
          previousClose: data.regularMarketPreviousClose,
          change: data.regularMarketChange,
          changePercent: data.regularMarketChangePercent?.toFixed(2) + '%',
          currency: data.currency || 'USD',
        } as StockQuote;
      }),
      catchError((err) => {
        this.loading.set(false);
        this.error.set('Failed to fetch stock data. Please try again.');
        console.error('Stock API error:', err);
        return of(null);
      }),
    );
  }

  /**
   * Search for stocks by keyword (via Yahoo Finance)
   */
  searchStocks(keyword: string): Observable<StockSearchResult[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<any>(`${this.BASE_URL}/search/${keyword}`).pipe(
      map((response) => {
        this.loading.set(false);
        const quotes = response.quotes || [];

        return quotes
          .filter((q: any) => q.isYahooFinance)
          .map((match: any) => ({
            symbol: match.symbol,
            name: match.shortname || match.longname,
            type: match.quoteType,
            region: match.exchange,
            currency: match.currency || 'USD',
          })) as StockSearchResult[];
      }),
      catchError((err) => {
        this.loading.set(false);
        this.error.set('Failed to search stocks. Please try again.');
        console.error('Stock search error:', err);
        return of([]);
      }),
    );
  }

  /**
   * Get daily time series data for a stock (via Yahoo Finance)
   */
  getDailyTimeSeries(symbol: string): Observable<StockTimeSeries | null> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<any[]>(`${this.BASE_URL}/history/${symbol}`).pipe(
      map((response) => {
        this.loading.set(false);
        if (!response || response.length === 0) {
          this.error.set('No time series data found');
          return null;
        }

        const data: StockTimeSeriesEntry[] = response
          .map((entry: any) => ({
            date: new Date(entry.date).toISOString().split('T')[0],
            open: entry.open,
            high: entry.high,
            low: entry.low,
            close: entry.close,
            volume: entry.volume,
          }))
          .reverse(); // Newest first

        return { symbol, data };
      }),
      catchError((err) => {
        this.loading.set(false);
        this.error.set('Failed to fetch time series data.');
        console.error('Time series error:', err);
        return of(null);
      }),
    );
  }
}
