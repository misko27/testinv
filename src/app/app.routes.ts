import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'stocks',
    pathMatch: 'full',
  },
  {
    path: 'stocks',
    loadComponent: () => import('./components/stock-info/stock-info').then((m) => m.StockInfo),
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./components/portfolio/portfolio').then((m) => m.Portfolio),
  },
];
