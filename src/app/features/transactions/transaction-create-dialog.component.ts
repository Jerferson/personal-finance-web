import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { forkJoin } from 'rxjs';

import { CategoryType } from '../../core/models/category.model';
import { Account } from '../../core/models/account.model';
import { Category } from '../../core/models/category.model';
import { Project } from '../../core/models/project.model';
import { CreateTransactionDto, TransactionType } from '../../core/models/transaction.model';
import { AccountService } from '../../core/services/account.service';
import { CategoryService } from '../../core/services/category.service';
import { ProjectService } from '../../core/services/project.service';
import { TransactionService } from '../../core/services/transaction.service';

export interface TransactionCreateDialogData {
  accountId?: string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-transaction-create-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-create-dialog.component.html',
  styleUrl: './transaction-create-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<TransactionCreateDialogData>(DIALOG_DATA);
  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly projectService = inject(ProjectService);

  readonly submitting = signal(false);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly selectedType = signal<CategoryType>('EXPENSE');

  readonly filteredCategories = computed(() =>
    this.categories().filter(c => c.type === this.selectedType()),
  );

  readonly fg = this.fb.group({
    accountId:       [this.data.accountId ?? '',  [Validators.required]],
    type:            ['EXPENSE' as CategoryType,   [Validators.required]],
    categoryId:      ['',                          [Validators.required]],
    amount:          [null as number | null,        [Validators.required, Validators.min(0.01)]],
    transactionDate: [todayIso(),                  [Validators.required]],
    description:     ['',                          [Validators.required]],
    projectId:       [''],
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
    const dto: CreateTransactionDto = {
      accountId:       v.accountId!,
      categoryId:      v.categoryId!,
      type:            v.type as TransactionType,
      amount:          Number(v.amount).toFixed(2),
      transactionDate: v.transactionDate!,
      description:     v.description!,
      ...(v.projectId ? { projectId: v.projectId } : {}),
    };
    this.transactionService.create(dto, crypto.randomUUID()).subscribe({
      next: () => { this.submitting.set(false); this.dialogRef.close(true); },
      error: () => this.submitting.set(false),
    });
  }
}
