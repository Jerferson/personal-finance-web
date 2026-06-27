import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { forkJoin } from 'rxjs';

import { Account } from '../../core/models/account.model';
import { Category, CategoryType } from '../../core/models/category.model';
import { Project } from '../../core/models/project.model';
import { ScheduledBill, CreateScheduledBillDto, UpdateScheduledBillDto } from '../../core/models/scheduled-bill.model';
import { TransactionType } from '../../core/models/transaction.model';
import { AccountService } from '../../core/services/account.service';
import { CategoryService } from '../../core/services/category.service';
import { ProjectService } from '../../core/services/project.service';
import { ScheduledBillService } from '../../core/services/scheduled-bill.service';

export interface ScheduledBillFormDialogData {
  bill?: ScheduledBill;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-scheduled-bill-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ isEdit ? 'Edit Scheduled Bill' : 'New Scheduled Bill' }}</h5>
      <button type="button" class="btn-close" (click)="dialogRef.close(false)"></button>
    </div>

    <div class="modal-body">
      <form [formGroup]="fg" (ngSubmit)="submit()">
        <div class="mb-3">
          <label class="form-label">Account</label>
          <select class="form-select" formControlName="accountId"
            [class.is-invalid]="fg.controls.accountId.invalid && fg.controls.accountId.touched">
            <option value="">Select account…</option>
            @for (a of accounts(); track a.id) {
              <option [value]="a.id">{{ a.name }}</option>
            }
          </select>
          <div class="invalid-feedback">Account is required</div>
        </div>

        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="form-label">Type</label>
            <select class="form-select" formControlName="type">
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
          <div class="col-6">
            <label class="form-label">Category</label>
            <select class="form-select" formControlName="categoryId"
              [class.is-invalid]="fg.controls.categoryId.invalid && fg.controls.categoryId.touched">
              <option value="">Select category…</option>
              @for (c of filteredCategories(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
            <div class="invalid-feedback">Category is required</div>
          </div>
        </div>

        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="form-label">Amount</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input class="form-control" type="number" step="0.01" min="0.01" formControlName="amount"
                [class.is-invalid]="fg.controls.amount.invalid && fg.controls.amount.touched" />
              <div class="invalid-feedback">Enter a value greater than 0</div>
            </div>
          </div>
          <div class="col-6">
            <label class="form-label">Due Date</label>
            <input class="form-control" type="date" formControlName="dueDate"
              [class.is-invalid]="fg.controls.dueDate.invalid && fg.controls.dueDate.touched" />
            <div class="invalid-feedback">Due date is required</div>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Description</label>
          <input class="form-control" formControlName="description" autocomplete="off"
            [class.is-invalid]="fg.controls.description.invalid && fg.controls.description.touched" />
          <div class="invalid-feedback">Description is required</div>
        </div>

        <div class="mb-2">
          <label class="form-label">Project <span class="text-muted">(optional)</span></label>
          <select class="form-select" formControlName="projectId">
            <option value="">— None —</option>
            @for (p of projects(); track p.id) {
              <option [value]="p.id">{{ p.name }}</option>
            }
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
  styles: [`.modal-body { min-width: 400px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledBillFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<ScheduledBillFormDialogData>(DIALOG_DATA);
  private readonly scheduledBillService = inject(ScheduledBillService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly projectService = inject(ProjectService);

  readonly isEdit = !!this.data.bill;
  readonly submitting = signal(false);
  readonly accounts   = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly projects   = signal<Project[]>([]);
  readonly selectedType = signal<CategoryType>(this.data.bill?.type ?? 'EXPENSE');

  readonly filteredCategories = computed(() =>
    this.categories().filter(c => c.type === this.selectedType()),
  );

  readonly fg = this.fb.group({
    accountId:   [this.data.bill?.accountId ?? '',                     [Validators.required]],
    type:        [this.data.bill?.type ?? ('EXPENSE' as CategoryType), [Validators.required]],
    categoryId:  [this.data.bill?.categoryId ?? '',                    [Validators.required]],
    amount:      [this.data.bill ? parseFloat(this.data.bill.amount) : null as number | null, [Validators.required, Validators.min(0.01)]],
    dueDate:     [this.data.bill?.dueDate ?? todayIso(),               [Validators.required]],
    description: [this.data.bill?.description ?? '',                   [Validators.required]],
    projectId:   [this.data.bill?.projectId ?? ''],
  });

  constructor() {
    forkJoin({
      accounts:   this.accountService.getAll(1, 100),
      categories: this.categoryService.getAll(1, 100),
      projects:   this.projectService.getAll(1, 100),
    }).subscribe(({ accounts, categories, projects }) => {
      this.accounts.set(accounts.data);
      this.categories.set(categories.data.sort((a, b) => a.name.localeCompare(b.name)));
      this.projects.set(projects.data);
    });

    this.fg.controls.type.valueChanges.subscribe(type => {
      if (type) this.selectedType.set(type as CategoryType);
      this.fg.controls.categoryId.reset('');
    });
  }

  submit() {
    if (this.fg.invalid || this.submitting()) return;
    this.submitting.set(true);
    const v = this.fg.getRawValue();
    const dto: CreateScheduledBillDto = {
      accountId:   v.accountId!,
      categoryId:  v.categoryId!,
      type:        v.type as TransactionType,
      amount:      Number(v.amount).toFixed(2),
      dueDate:     v.dueDate!,
      description: v.description!,
      ...(v.projectId ? { projectId: v.projectId } : {}),
    };
    const obs = this.isEdit
      ? this.scheduledBillService.update(this.data.bill!.id, dto satisfies UpdateScheduledBillDto)
      : this.scheduledBillService.create(dto, crypto.randomUUID());

    obs.subscribe({
      next:  () => { this.submitting.set(false); this.dialogRef.close(true); },
      error: () => this.submitting.set(false),
    });
  }
}
