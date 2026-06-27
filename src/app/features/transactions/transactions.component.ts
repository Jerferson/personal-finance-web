import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Account } from '../../core/models/account.model';
import { Category } from '../../core/models/category.model';
import { Transaction, QueryTransactionParams } from '../../core/models/transaction.model';
import { AccountService } from '../../core/services/account.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BsPaginatorComponent, PageEvent } from '../../shared/components/bs-paginator/bs-paginator.component';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';
import { TransactionCreateDialogComponent, TransactionCreateDialogData } from './transaction-create-dialog.component';
import { TransactionEditDialogComponent, TransactionEditDialogData } from './transaction-edit-dialog.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    FinancialAmountPipe,
    EmptyStateComponent,
    BsPaginatorComponent,
  ],
  template: `
    <div class="cc-page">
      <div class="cc-row">
        <h2 class="cc-grow" style="margin:0">Transactions</h2>
        <button class="btn btn-primary btn-sm" (click)="openCreate()">
          <i class="bi bi-plus-lg"></i> New Transaction
        </button>
      </div>

      <!-- Filters -->
      <div class="cc-card">
        <form [formGroup]="filterFg" class="filter-row">
          <select class="form-select form-select-sm filter-field" formControlName="accountId">
            <option value="">All accounts</option>
            @for (a of accounts(); track a.id) {
              <option [value]="a.id">{{ a.name }}</option>
            }
          </select>

          <select class="form-select form-select-sm filter-field" formControlName="type">
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>

          <select class="form-select form-select-sm filter-field" formControlName="status">
            <option value="">All statuses</option>
            <option value="POSTED">Posted</option>
            <option value="VOIDED">Voided</option>
          </select>

          <input class="form-control form-control-sm filter-field" type="date"
            formControlName="startDate" placeholder="From" />

          <input class="form-control form-control-sm filter-field" type="date"
            formControlName="endDate" placeholder="To" />

          <button class="btn btn-outline-secondary btn-sm" type="button" (click)="clearFilters()">
            <i class="bi bi-x-lg"></i> Clear
          </button>
        </form>
      </div>

      <!-- Table -->
      <div class="cc-card" style="padding:0; overflow:hidden">
        @if (transactions().length === 0) {
          <app-empty-state icon="bi-receipt" title="No transactions found"
            subtitle="Adjust filters or create a new transaction" />
        } @else {
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th class="text-end">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (row of transactions(); track row.id) {
                  <tr [class.voided-row]="row.status === 'VOIDED'">
                    <td>{{ row.transactionDate | date:'MMM d, y' }}</td>
                    <td class="desc-cell">{{ row.description }}</td>
                    <td>{{ accountMap().get(row.accountId)?.name ?? '—' }}</td>
                    <td>{{ categoryMap().get(row.categoryId)?.name ?? '—' }}</td>
                    <td><span class="cc-chip" [class]="'cc-chip-' + row.type.toLowerCase()">{{ row.type }}</span></td>
                    <td><span class="cc-chip" [class]="'cc-chip-' + row.status.toLowerCase()">{{ row.status }}</span></td>
                    <td class="text-end">
                      <span class="cc-amount"
                        [class.cc-amount-income]="row.type === 'INCOME'"
                        [class.cc-amount-expense]="row.type === 'EXPENSE'">
                        {{ row.amount | financialAmount }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      @if (row.status === 'POSTED') {
                        <button class="btn btn-sm btn-outline-secondary" title="Edit" (click)="openEdit(row)">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Void" (click)="voidTransaction(row)">
                          <i class="bi bi-slash-circle"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <app-bs-paginator
          [length]="total()"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .filter-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .filter-field { min-width: 130px; flex: 1; }
    .desc-cell { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; padding: 4px 16px; min-width: 80px; }
    .voided-row td { opacity: 0.5; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  readonly transactions = signal<Transaction[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);

  readonly accountMap = computed(() => new Map(this.accounts().map(a => [a.id, a])));
  readonly categoryMap = computed(() => new Map(this.categories().map(c => [c.id, c])));

  readonly filterFg = this.fb.group({
    accountId: [''], type: [''], status: [''], startDate: [''], endDate: [''],
  });

  constructor() {
    const qp = this.route.snapshot.queryParams;
    if (qp['accountId']) {
      this.filterFg.patchValue({ accountId: qp['accountId'] }, { emitEvent: false });
    }

    forkJoin({
      accounts:   this.accountService.getAll(1, 100),
      categories: this.categoryService.getAll(1, 100),
    }).subscribe(({ accounts, categories }) => {
      this.accounts.set(accounts.data);
      this.categories.set(categories.data);
      this.load();
    });

    this.filterFg.valueChanges.subscribe(() => { this.pageIndex.set(0); this.load(); });
  }

  private load() {
    const f = this.filterFg.value;
    const query: QueryTransactionParams = {
      page: this.pageIndex() + 1, limit: this.pageSize(),
      ...(f.accountId ? { accountId: f.accountId } : {}),
      ...(f.type      ? { type:      f.type as 'INCOME' | 'EXPENSE' }  : {}),
      ...(f.status    ? { status:    f.status as 'POSTED' | 'VOIDED' } : {}),
      ...(f.startDate ? { startDate: f.startDate } : {}),
      ...(f.endDate   ? { endDate:   f.endDate }   : {}),
    };
    this.transactionService.getAll(query).subscribe(res => {
      this.transactions.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  clearFilters() {
    this.filterFg.reset({ accountId: '', type: '', status: '', startDate: '', endDate: '' });
  }

  openCreate() {
    const accountId = this.filterFg.value.accountId || undefined;
    const ref = this.dialog.open<boolean, TransactionCreateDialogData>(
      TransactionCreateDialogComponent,
      { data: { accountId }, width: '480px' },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) { this.load(); this.notify.success('Transaction created'); }
    });
  }

  openEdit(transaction: Transaction) {
    const ref = this.dialog.open<boolean, TransactionEditDialogData>(
      TransactionEditDialogComponent,
      { data: { transaction }, width: '400px' },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) { this.load(); this.notify.success('Transaction updated'); }
    });
  }

  voidTransaction(transaction: Transaction) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Void Transaction',
          message: `Void "${transaction.description}"? This will reverse the journal entry and cannot be undone.`,
          confirmLabel: 'Void',
        },
        width: '400px',
      },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.transactionService.void(transaction.id, crypto.randomUUID()).subscribe(() => {
          this.notify.success('Transaction voided');
          this.load();
        });
      }
    });
  }
}
