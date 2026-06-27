import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Category } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CategoryFormDialogComponent, CategoryFormDialogData } from './category-form-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <div class="cc-page">
      <div class="cc-row">
        <h2 class="cc-grow" style="margin:0">Categories</h2>
        <button class="btn btn-primary btn-sm" (click)="openForm()">
          <i class="bi bi-plus-lg"></i> New Category
        </button>
      </div>

      @if (income().length > 0) {
        <div class="cc-card" style="padding:0; overflow:hidden">
          <div style="padding:16px 20px 0">
            <p class="cc-section-title">Income</p>
          </div>
          <ul class="list-group list-group-flush">
            @for (cat of income(); track cat.id) {
              <li class="list-group-item d-flex align-items-center gap-2 px-4">
                <i class="bi bi-graph-up-arrow income-icon"></i>
                <span class="flex-grow-1">{{ cat.name }}</span>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary" title="Edit" (click)="openForm(cat)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" title="Delete" (click)="delete(cat)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </li>
            }
          </ul>
        </div>
      }

      @if (expense().length > 0) {
        <div class="cc-card" style="padding:0; overflow:hidden">
          <div style="padding:16px 20px 0">
            <p class="cc-section-title">Expenses</p>
          </div>
          <ul class="list-group list-group-flush">
            @for (cat of expense(); track cat.id) {
              <li class="list-group-item d-flex align-items-center gap-2 px-4">
                <i class="bi bi-graph-down-arrow expense-icon"></i>
                <span class="flex-grow-1">{{ cat.name }}</span>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary" title="Edit" (click)="openForm(cat)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" title="Delete" (click)="delete(cat)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </li>
            }
          </ul>
        </div>
      }

      @if (categories().length === 0) {
        <app-empty-state icon="bi-tag" title="No categories yet"
          subtitle="Create income and expense categories to organize your transactions" />
      }
    </div>
  `,
  styles: [`
    .income-icon  { color: var(--cc-success); font-size: 16px; }
    .expense-icon { color: var(--cc-danger);  font-size: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);

  readonly categories = signal<Category[]>([]);
  readonly income = () => this.categories().filter(c => c.type === 'INCOME');
  readonly expense = () => this.categories().filter(c => c.type === 'EXPENSE');

  constructor() { this.load(); }

  private load() {
    this.categoryService.getAll(1, 100).subscribe(res =>
      this.categories.set(res.data.sort((a, b) => a.name.localeCompare(b.name))),
    );
  }

  openForm(category?: Category) {
    const ref = this.dialog.open<boolean, CategoryFormDialogData>(
      CategoryFormDialogComponent,
      { data: { category }, width: '380px' },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) { this.load(); this.notify.success(category ? 'Category updated' : 'Category created'); }
    });
  }

  delete(category: Category) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete Category',
          message: `Delete "${category.name}"? This cannot be undone.`,
          confirmLabel: 'Delete',
        },
        width: '380px',
      },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.categoryService.delete(category.id).subscribe(() => {
          this.notify.success('Category deleted');
          this.load();
        });
      }
    });
  }
}
