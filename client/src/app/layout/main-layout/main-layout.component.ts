import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  labelEn: string;
  icon: string;
  route: string;
  badge?: string;
  isPos?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styles: []
})
export class MainLayoutComponent {
  isSidebarOpen = signal(true);
  isArabic = signal(true);
  currentTime = signal('');

  navItems: NavItem[] = [
    { label: 'نقطة البيع (POS)', labelEn: 'Cashier (POS)', icon: 'cart', route: '/pos', isPos: true },
    { label: 'الرئيسية والتقارير', labelEn: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'المنتجات والمخزون', labelEn: 'Products & Inventory', icon: 'box', route: '/products' },
    { label: 'فواتير المبيعات', labelEn: 'Sales Invoices', icon: 'receipt', route: '/sales' },
    { label: 'المشتريات والموردين', labelEn: 'Purchases & Suppliers', icon: 'truck', route: '/purchases' },
    { label: 'العملاء والديون', labelEn: 'Customers & Debts', icon: 'users', route: '/customers' },
    { label: 'الخزينة اليومية', labelEn: 'Cash Drawer', icon: 'cash', route: '/cash-drawer' },
    { label: 'الموظفين والسلف', labelEn: 'Employees & Advances', icon: 'user-check', route: '/employees' },
    { label: 'التقارير والإحصائيات', labelEn: 'Reports & Analytics', icon: 'chart', route: '/reports' },
  ];

  constructor() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  toggleLanguage() {
    this.isArabic.update(v => !v);
    const htmlTag = document.documentElement;
    if (this.isArabic()) {
      htmlTag.setAttribute('dir', 'rtl');
      htmlTag.setAttribute('lang', 'ar');
    } else {
      htmlTag.setAttribute('dir', 'ltr');
      htmlTag.setAttribute('lang', 'en');
    }
  }

  private updateClock() {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString(this.isArabic() ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
  }
}
