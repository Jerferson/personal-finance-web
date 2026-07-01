import { ChangeDetectionStrategy, Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';

import { Account, AccountBalance } from '../../core/models/account.model';
import { CashflowProjection, MonthlyProjection } from '../../core/models/projection.model';
import { MonthlySummaryReport } from '../../core/models/report.model';
import { Transaction } from '../../core/models/transaction.model';
import { AccountService } from '../../core/services/account.service';
import { ProjectionService } from '../../core/services/projection.service';
import { ReportService } from '../../core/services/report.service';
import { TransactionService } from '../../core/services/transaction.service';
import { RefreshService } from '../../core/services/refresh.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';

interface AccountWithBalance {
  account: Account;
  balance: AccountBalance | null;
}

const MONTHS_AHEAD = 13;

function isoMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, FinancialAmountPipe, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly accountService    = inject(AccountService);
  private readonly reportService     = inject(ReportService);
  private readonly projectionService = inject(ProjectionService);
  private readonly transactionService = inject(TransactionService);
  private readonly refreshService    = inject(RefreshService);
  private readonly destroyRef        = inject(DestroyRef);

  readonly currentMonth    = isoMonth();
  readonly summaryLabel    = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  readonly accountBalances = signal<AccountWithBalance[]>([]);
  readonly monthlySummary  = signal<MonthlySummaryReport | null>(null);
  readonly cashflow        = signal<CashflowProjection | null>(null);
  readonly recentTxns      = signal<Transaction[]>([]);

  readonly projectionIndex = signal(0);

  readonly projectionMonth = computed<MonthlyProjection | null>(() => {
    const cf = this.cashflow();
    if (!cf) return null;
    return cf.months[this.projectionIndex()] ?? null;
  });

  readonly projectionLabel = computed(() => {
    const cf = this.cashflow();
    if (!cf) return '';
    return monthLabel(cf.months[this.projectionIndex()]?.month ?? this.currentMonth);
  });

  readonly totalBalance = computed(() =>
    this.accountBalances()
      .reduce((sum, item) => sum + parseFloat(item.balance?.balance ?? '0'), 0)
      .toFixed(2),
  );

  readonly canGoPrev = computed(() => this.projectionIndex() > 0);
  readonly canGoNext = computed(() => {
    const cf = this.cashflow();
    return cf ? this.projectionIndex() < cf.months.length - 1 : false;
  });

  constructor() {
    this.load();
    this.refreshService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  private load(): void {
    forkJoin({
      accounts:   this.accountService.getAll(1, 100),
      summary:    this.reportService.getMonthlySummary(this.currentMonth).pipe(catchError(() => of(null))),
      cashflow:   this.projectionService.getCashflow(MONTHS_AHEAD).pipe(catchError(() => of(null))),
      recentTxns: this.transactionService.getAll({ limit: 15, page: 1 }),
    }).subscribe(({ accounts, summary, cashflow, recentTxns }) => {
      this.monthlySummary.set(summary);
      this.cashflow.set(cashflow);
      this.recentTxns.set(recentTxns.data);

      if (accounts.data.length === 0) { this.accountBalances.set([]); return; }

      forkJoin(
        accounts.data.map(a =>
          this.accountService.getBalance(a.id).pipe(
            map(b => ({ account: a, balance: b })),
            catchError(() => of({ account: a, balance: null })),
          ),
        ),
      ).subscribe(ab => this.accountBalances.set(ab));
    });
  }

  prevMonth(): void { if (this.canGoPrev()) this.projectionIndex.update(i => i - 1); }
  nextMonth(): void { if (this.canGoNext()) this.projectionIndex.update(i => i + 1); }

  isPositive(value: string | null | undefined): boolean {
    return parseFloat(value ?? '0') >= 0;
  }

  typeLabel(type: string): string {
    return ({ CHECKING: 'Checking', SAVINGS: 'Savings', CASH: 'Cash' } as Record<string, string>)[type] ?? type;
  }

  typeChipClass(type: string): string {
    return 'cc-chip-' + type.toLowerCase();
  }
}
