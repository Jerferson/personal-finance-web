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
  templateUrl: './scheduled-bill-form-dialog.component.html',
  styleUrl: './scheduled-bill-form-dialog.component.scss',
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
