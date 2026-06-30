import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { RefreshService } from '../../core/services/refresh.service';
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
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);
  private readonly refreshService = inject(RefreshService);
  private readonly destroyRef = inject(DestroyRef);
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
    accountId: [''], type: [''], startDate: [''], endDate: [''],
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
    this.refreshService.refresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  private load() {
    const f = this.filterFg.value;
    const query: QueryTransactionParams = {
      page: this.pageIndex() + 1, limit: this.pageSize(),
      ...(f.accountId ? { accountId: f.accountId } : {}),
      ...(f.type      ? { type:      f.type as 'INCOME' | 'EXPENSE' } : {}),
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
    this.filterFg.reset({ accountId: '', type: '', startDate: '', endDate: '' });
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

  deleteTransaction(transaction: Transaction) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete Transaction',
          message: `Delete "${transaction.description}"? This action cannot be undone.`,
          confirmLabel: 'Delete',
        },
        width: '400px',
      },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.transactionService.delete(transaction.id).subscribe(() => {
          this.notify.success('Transaction deleted');
          this.load();
        });
      }
    });
  }
}
