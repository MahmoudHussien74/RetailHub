import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryDto } from '../../../../core/models/category-brand.model';

@Component({
  selector: 'app-category-combobox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full" #containerRef>
      <!-- Trigger Button -->
      <button
        type="button"
        (click)="toggleOpen()"
        class="w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs"
        [class.border-emerald-500]="isOpen()"
        [class.ring-2]="isOpen()"
        [class.ring-emerald-500/20]="isOpen()"
        [class.border-slate-200]="!isOpen()"
        [class.dark:border-slate-700]="!isOpen()"
      >
        <div class="flex items-center gap-2 truncate">
          <!-- Folder / Category icon -->
          <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
          </svg>
          <span class="truncate text-slate-800 dark:text-slate-100">
            {{ selectedCategoryName() }}
          </span>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          @if (selectedCategory()) {
            <span
              (click)="onClearSelection($event)"
              class="w-4 h-4 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 flex items-center justify-center text-[10px] transition-colors"
              title="إلغاء اختيار التصنيف"
            >
              ✕
            </span>
          }
          <svg
            class="w-4 h-4 text-slate-400 transition-transform duration-200"
            [class.rotate-180]="isOpen()"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </button>

      <!-- Dropdown Popover -->
      @if (isOpen()) {
        <div
          class="absolute z-50 mt-1.5 w-full min-w-[220px] max-w-[320px] start-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-scale-in"
        >
          <!-- Search Header Input -->
          <div class="p-2 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40">
            <div class="relative">
              <input
                #categorySearchInput
                type="text"
                [ngModel]="searchCategoryQuery()"
                (ngModelChange)="searchCategoryQuery.set($event)"
                placeholder="بحث في التصنيفات..."
                class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 ps-8 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <svg class="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              @if (searchCategoryQuery().trim()) {
                <button
                  type="button"
                  (click)="searchCategoryQuery.set('')"
                  class="absolute end-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              }
            </div>
          </div>

          <!-- Options List -->
          <div class="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            <!-- "All Categories" Option -->
            <button
              type="button"
              (click)="selectCategory(null)"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-right"
              [class.bg-emerald-50]="selectedCategory() === null"
              [class.text-emerald-700]="selectedCategory() === null"
              [class.dark:bg-emerald-950/40]="selectedCategory() === null"
              [class.dark:text-emerald-400]="selectedCategory() === null"
              [class.hover:bg-slate-100]="selectedCategory() !== null"
              [class.dark:hover:bg-slate-700/50]="selectedCategory() !== null"
              [class.text-slate-700]="selectedCategory() !== null"
              [class.dark:text-slate-200]="selectedCategory() !== null"
            >
              <span>كل التصنيفات (الكل)</span>
              @if (selectedCategory() === null) {
                <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              }
            </button>

            <!-- Categorized Options -->
            @for (cat of filteredCategories(); track cat.id) {
              <button
                type="button"
                (click)="selectCategory(cat.id)"
                class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-right"
                [class.bg-emerald-50]="selectedCategory() === cat.id"
                [class.text-emerald-700]="selectedCategory() === cat.id"
                [class.dark:bg-emerald-950/40]="selectedCategory() === cat.id"
                [class.dark:text-emerald-400]="selectedCategory() === cat.id"
                [class.hover:bg-slate-100]="selectedCategory() !== cat.id"
                [class.dark:hover:bg-slate-700/50]="selectedCategory() !== cat.id"
                [class.text-slate-700]="selectedCategory() !== cat.id"
                [class.dark:text-slate-200]="selectedCategory() !== cat.id"
              >
                <div class="flex items-center gap-2 truncate">
                  <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="selectedCategory() === cat.id" [class.bg-slate-300]="selectedCategory() !== cat.id"></span>
                  <span class="truncate">{{ cat.nameAr }}</span>
                </div>
                @if (selectedCategory() === cat.id) {
                  <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                }
              </button>
            }

            @if (filteredCategories().length === 0) {
              <div class="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                لا يوجد تصنيف بهذا الاسم
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in {
      animation: scaleIn 0.15s ease-out;
    }
  `]
})
export class CategoryComboboxComponent {
  categories = input<CategoryDto[]>([]);
  selectedCategory = input<string | null>(null);

  categoryChange = output<string | null>();

  @ViewChild('containerRef') containerRef!: ElementRef;
  @ViewChild('categorySearchInput') categorySearchInput?: ElementRef<HTMLInputElement>;

  isOpen = signal<boolean>(false);
  searchCategoryQuery = signal<string>('');

  selectedCategoryName = computed(() => {
    const id = this.selectedCategory();
    if (!id) return 'كل التصنيفات (الكل)';
    const found = this.categories().find(c => c.id === id);
    return found ? found.nameAr : 'كل التصنيفات (الكل)';
  });

  filteredCategories = computed(() => {
    const q = this.searchCategoryQuery().trim().toLowerCase();
    const list = this.categories();
    if (!q) return list;
    return list.filter(c =>
      c.nameAr.toLowerCase().includes(q) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(q))
    );
  });

  toggleOpen(): void {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      this.searchCategoryQuery.set('');
      setTimeout(() => {
        this.categorySearchInput?.nativeElement?.focus();
      }, 50);
    }
  }

  selectCategory(categoryId: string | null): void {
    this.categoryChange.emit(categoryId);
    this.isOpen.set(false);
  }

  onClearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.categoryChange.emit(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && this.containerRef && !this.containerRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
