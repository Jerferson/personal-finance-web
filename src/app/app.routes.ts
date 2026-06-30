import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./features/accounts/accounts.component').then(m => m.AccountsComponent),
      },
      {
        path: 'accounts/:id',
        loadComponent: () =>
          import('./features/accounts/account-detail.component').then(m => m.AccountDetailComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then(m => m.CategoriesComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects.component').then(m => m.ProjectsComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
      },
      {
        path: 'scheduled-bills',
        loadComponent: () =>
          import('./features/scheduled-bills/scheduled-bills.component').then(m => m.ScheduledBillsComponent),
      },
      {
        path: 'transfers',
        loadComponent: () =>
          import('./features/transfers/transfers.component').then(m => m.TransfersComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
