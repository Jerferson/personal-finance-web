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
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
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
