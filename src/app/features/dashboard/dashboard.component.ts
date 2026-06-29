import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';

import { Account, AccountBalance } from '../../core/models/account.model';
import { BudgetProjection } from '../../core/models/projection.model';
import { MonthlySummaryReport } from '../../core/models/report.model';
import { Transaction } from '../../core/models/transaction.model';
import { AccountService } from '../../core/services/account.service';
import { ProjectionService } from '../../core/services/projection.service';
import { ReportService } from '../../core/services/report.service';
import { TransactionService } from '../../core/services/transaction.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';

interface AccountWithBalance {
  account: Account;
  balance: AccountBalance | null;
}

function isoMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function endOfMonthIso(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
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
  private readonly accountService = inject(AccountService);
  private readonly reportService = inject(ReportService);
  private readonly projectionService = inject(ProjectionService);
  private readonly transactionService = inject(TransactionService);

  readonly currentMonth = isoMonth();
  readonly endOfMonth = endOfMonthIso();
  readonly monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  readonly accountBalances = signal<AccountWithBalance[]>([]);
  readonly monthlySummary = signal<MonthlySummaryReport | null>(null);
  readonly projection = signal<BudgetProjection | null>(null);
  readonly recentTxns = signal<Transaction[]>([]);

  constructor() {
    forkJoin({
      accounts:   this.accountService.getAll(1, 100),
      summary:    this.reportService.getMonthlySummary(this.currentMonth).pipe(catchError(() => of(null))),
      projection: this.projectionService.getBudget(this.endOfMonth).pipe(catchError(() => of(null))),
      recentTxns: this.transactionService.getAll({ limit: 5, page: 1 }),
    }).subscribe(({ accounts, summary, projection, recentTxns }) => {
      this.monthlySummary.set(summary);
      this.projection.set(projection);
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
