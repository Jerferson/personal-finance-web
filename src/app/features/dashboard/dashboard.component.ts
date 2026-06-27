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
  template: `
    <div class="cc-page">

      <!-- Header -->
      <div class="dash-header">
        <div>
          <p class="dash-eyebrow">Financial Overview</p>
          <h2 class="dash-title">Dashboard</h2>
          <p class="dash-subtitle">{{ monthLabel }}</p>
        </div>
      </div>

      <!-- Account balance cards -->
      <div>
        <p class="cc-section-title">Account Balances</p>
        @if (accountBalances().length === 0) {
          <div class="cc-card">
            <app-empty-state icon="bi-bank" title="No accounts yet"
              subtitle="Create your first account to track balances" />
            <div class="text-center pb-3">
              <a class="btn btn-primary btn-sm" routerLink="/accounts">Go to Accounts</a>
            </div>
          </div>
        } @else {
          <div class="accounts-scroll">
            @for (item of accountBalances(); track item.account.id) {
              <a class="balance-card cc-card" [routerLink]="['/accounts', item.account.id]">
                <span class="cc-chip acct-type-chip" [class]="typeChipClass(item.account.type)">
                  {{ typeLabel(item.account.type) }}
                </span>
                <p class="acct-name">{{ item.account.name }}</p>
                @if (item.balance) {
                  <p class="acct-balance"
                    [class.positive]="isPositive(item.balance.balance)"
                    [class.negative]="!isPositive(item.balance.balance)">
                    {{ item.balance.balance | financialAmount }}
                  </p>
                } @else {
                  <p class="acct-balance muted">—</p>
                }
              </a>
            }
          </div>
        }
      </div>

      <!-- Summary + Projection -->
      <div class="insight-grid">

        <!-- Monthly summary -->
        <div class="cc-card">
          <p class="cc-section-title">Monthly Summary</p>
          @if (monthlySummary(); as s) {
            <div class="metrics-row">
              <div class="metric">
                <p class="metric-label">Income</p>
                <p class="metric-value cc-amount-income">{{ s.totalIncome | financialAmount }}</p>
              </div>
              <div class="metric-divider"></div>
              <div class="metric">
                <p class="metric-label">Expenses</p>
                <p class="metric-value cc-amount-expense">{{ s.totalExpense | financialAmount }}</p>
              </div>
              <div class="metric-divider"></div>
              <div class="metric">
                <p class="metric-label">Net</p>
                <p class="metric-value"
                  [class.cc-amount-income]="isPositive(s.netAmount)"
                  [class.cc-amount-expense]="!isPositive(s.netAmount)">
                  {{ s.netAmount | financialAmount }}
                </p>
              </div>
            </div>
          } @else {
            <p class="text-muted mt-3 mb-2">No data for this month yet.</p>
          }
          <a class="btn btn-link ps-0 mt-1" routerLink="/reports">
            <i class="bi bi-arrow-right"></i> View reports
          </a>
        </div>

        <!-- Budget projection -->
        <div class="cc-card">
          <p class="cc-section-title">Projection — end of month</p>
          @if (projection(); as p) {
            <div class="metrics-row">
              <div class="metric">
                <p class="metric-label">Current</p>
                <p class="metric-value">{{ p.currentBalance | financialAmount }}</p>
              </div>
              <div class="metric-divider"></div>
              <div class="metric">
                <p class="metric-label">In</p>
                <p class="metric-value cc-amount-income">{{ p.scheduledIncome | financialAmount }}</p>
              </div>
              <div class="metric-divider"></div>
              <div class="metric">
                <p class="metric-label">Out</p>
                <p class="metric-value cc-amount-expense">{{ p.scheduledExpenses | financialAmount }}</p>
              </div>
              <div class="metric-divider"></div>
              <div class="metric">
                <p class="metric-label">Projected</p>
                <p class="metric-value"
                  [class.cc-amount-income]="isPositive(p.projectedBalance)"
                  [class.cc-amount-expense]="!isPositive(p.projectedBalance)">
                  {{ p.projectedBalance | financialAmount }}
                </p>
              </div>
            </div>
          } @else {
            <p class="text-muted mt-3 mb-2">No scheduled bills found.</p>
          }
          <a class="btn btn-link ps-0 mt-1" routerLink="/scheduled-bills">
            <i class="bi bi-arrow-right"></i> View scheduled bills
          </a>
        </div>

      </div>

      <!-- Recent transactions -->
      <div class="cc-card table-card">
        <div class="cc-row table-card-header">
          <p class="cc-section-title cc-grow" style="margin:0">Recent Transactions</p>
          <a class="btn btn-link btn-sm" routerLink="/transactions">View all</a>
        </div>

        @if (recentTxns().length === 0) {
          <app-empty-state icon="bi-receipt" title="No transactions yet"
            subtitle="Create a transaction to start tracking your finances" />
        } @else {
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th class="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (row of recentTxns(); track row.id) {
                  <tr>
                    <td>{{ row.transactionDate | date:'MMM d' }}</td>
                    <td class="desc-cell">{{ row.description }}</td>
                    <td><span class="cc-chip" [class]="'cc-chip-' + row.type.toLowerCase()">{{ row.type }}</span></td>
                    <td class="text-end">
                      <span class="cc-amount"
                        [class.cc-amount-income]="row.type === 'INCOME'"
                        [class.cc-amount-expense]="row.type === 'EXPENSE'">
                        {{ row.amount | financialAmount }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .dash-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .dash-eyebrow {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.18em; color: var(--cc-primary); margin: 0 0 6px;
    }
    .dash-title  {
      margin: 0; font-family: var(--cc-display-font); font-size: 28px;
      font-weight: 800; letter-spacing: -0.03em; color: var(--cc-text);
    }
    .dash-subtitle { margin: 4px 0 0; color: var(--cc-muted); font-size: 14px; }

    .accounts-scroll {
      display: flex; gap: 14px; overflow-x: auto; padding-bottom: 4px;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
    .balance-card {
      flex-shrink: 0; min-width: 190px; text-decoration: none; display: block;
    }
    .acct-type-chip { margin-bottom: 10px; }
    .acct-name  { margin: 0 0 4px; font-size: 12px; font-weight: 500; color: var(--cc-muted); }
    .acct-balance {
      margin: 0; font-family: var(--cc-display-font); font-size: 24px; font-weight: 800;
      letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
    }
    .acct-balance.positive { color: var(--cc-success); }
    .acct-balance.negative { color: var(--cc-danger); }
    .acct-balance.muted    { color: var(--cc-muted); }

    .cc-chip-checking { background: #e0e7ff; color: #3730a3; }
    .cc-chip-savings  { background: #d1fae5; color: #065f46; }
    .cc-chip-cash     { background: #fef3c7; color: #92400e; }

    .insight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .insight-grid { grid-template-columns: 1fr; } }

    .metrics-row { display: flex; align-items: stretch; margin-top: 16px; }
    .metric { flex: 1; text-align: center; padding: 4px 8px; }
    .metric-divider { width: 1px; background: var(--cc-border); }
    .metric-label { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--cc-muted); }
    .metric-value {
      margin: 0; font-family: var(--cc-display-font); font-size: 20px;
      font-weight: 700; letter-spacing: -0.025em; font-variant-numeric: tabular-nums;
    }

    .desc-cell { max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .table-card { padding: 0; overflow: hidden; }
    .table-card-header { padding: 16px 20px 0; }
  `],
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
