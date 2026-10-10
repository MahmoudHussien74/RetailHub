import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/sales/sales.component').then(m => m.SalesComponent)
      },
      {
        path: 'purchases',
        loadComponent: () => import('./features/purchases/purchases.component').then(m => m.PurchasesComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent)
      },
      {
        path: 'cash-drawer',
        loadComponent: () => import('./features/cash-drawer/cash-drawer.component').then(m => m.CashDrawerComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employees.component').then(m => m.EmployeesComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'stock-adjustments',
        loadComponent: () => import('./features/stock-adjustments/stock-adjustments.component').then(m => m.StockAdjustmentsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
