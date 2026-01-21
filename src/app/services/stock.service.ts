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
  private readonly API_KEY = 'NXEGYKFS2VLPL7RY'; // Replace with your API key for full access
  private readonly BASE_URL = 'https://www.alphavantage.co/query';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get real-time quote for a stock symbol
   */
  getQuote(symbol: string): Observable<StockQuote | null> {
    this.loading.set(true);
    this.error.set(null);

    const url = `${this.BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.API_KEY}`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        this.loading.set(false);
        const quote = response['Global Quote'];

        if (!quote || Object.keys(quote).length === 0) {
          this.error.set('No data found for this symbol');
          return null;
        }

        return {
          symbol: quote['01. symbol'],
          open: parseFloat(quote['02. open']),
          high: parseFloat(quote['03. high']),
          low: parseFloat(quote['04. low']),
          price: parseFloat(quote['05. price']),
          volume: parseInt(quote['06. volume']),
          latestTradingDay: quote['07. latest trading day'],
          previousClose: parseFloat(quote['08. previous close']),
          change: parseFloat(quote['09. change']),
          changePercent: quote['10. change percent'],
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
   * Search for stocks by keyword
   */
  searchStocks(keyword: string): Observable<StockSearchResult[]> {
    this.loading.set(true);
    this.error.set(null);

    const url = `${this.BASE_URL}?function=SYMBOL_SEARCH&keywords=${keyword}&apikey=${this.API_KEY}`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        this.loading.set(false);
        const matches = response['bestMatches'] || [];

        return matches.map((match: any) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          currency: match['8. currency'],
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
   * Get daily time series data for a stock
   */
  getDailyTimeSeries(symbol: string): Observable<StockTimeSeries | null> {
    this.loading.set(true);
    this.error.set(null);

    const url = `${this.BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.API_KEY}`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        this.loading.set(false);
        const timeSeries = response['Time Series (Daily)'];

        if (!timeSeries) {
          this.error.set('No time series data found');
          return null;
        }

        const data: StockTimeSeriesEntry[] = Object.entries(timeSeries)
          .slice(0, 30) // Last 30 days
          .map(([date, values]: [string, any]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume']),
          }));

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
