import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppSettingsStore {
  readonly language = signal<'ar' | 'en'>(
    (localStorage.getItem('rh_language') as 'ar' | 'en') || 'ar'
  );
  readonly isSidebarOpen = signal(true);

  readonly isArabic = computed(() => this.language() === 'ar');

  setLanguage(lang: 'ar' | 'en'): void {
    this.language.set(lang);
    localStorage.setItem('rh_language', lang);
    const html = document.documentElement;
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);
  }

  toggleLanguage(): void {
    this.setLanguage(this.isArabic() ? 'en' : 'ar');
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }
}
