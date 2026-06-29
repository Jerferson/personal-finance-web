import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { Category, CategoryType, CreateCategoryDto, UpdateCategoryDto } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';

export interface CategoryFormDialogData {
  category?: Category;
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<CategoryFormDialogData>(DIALOG_DATA);
  private readonly categoryService = inject(CategoryService);

  readonly isEdit = !!this.data.category;
  readonly submitting = signal(false);

  readonly fg = this.fb.group({
    name: [this.data.category?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    type: [this.data.category?.type ?? ('EXPENSE' as CategoryType), [Validators.required]],
  });

  submit() {
    if (this.fg.invalid || this.submitting()) return;
    this.submitting.set(true);
    const v = this.fg.getRawValue();

    const obs = this.isEdit
      ? this.categoryService.update(this.data.category!.id, { name: v.name!, type: v.type as CategoryType } satisfies UpdateCategoryDto)
      : this.categoryService.create({ name: v.name!, type: v.type as CategoryType } satisfies CreateCategoryDto);

    obs.subscribe({
      next: () => { this.submitting.set(false); this.dialogRef.close(true); },
      error: () => this.submitting.set(false),
    });
  }
}
