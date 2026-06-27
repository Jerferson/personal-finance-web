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
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ isEdit ? 'Edit Category' : 'New Category' }}</h5>
      <button type="button" class="btn-close" (click)="dialogRef.close(false)"></button>
    </div>

    <div class="modal-body">
      <form [formGroup]="fg" (ngSubmit)="submit()">
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input class="form-control" formControlName="name" autocomplete="off"
            [class.is-invalid]="fg.controls.name.invalid && fg.controls.name.touched" />
          <div class="invalid-feedback">Name is required</div>
        </div>

        <div class="mb-3">
          <label class="form-label">Type</label>
          <select class="form-select" formControlName="type">
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
      </form>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">Cancel</button>
      <button type="button" class="btn btn-primary" [disabled]="fg.invalid || submitting()" (click)="submit()">
        @if (submitting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
        {{ isEdit ? 'Save' : 'Create' }}
      </button>
    </div>
  `,
  styles: [`.modal-body { min-width: 320px; }`],
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
