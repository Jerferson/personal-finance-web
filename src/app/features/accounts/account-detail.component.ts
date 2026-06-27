import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';

import { Account, AccountBalance } from '../../core/models/account.model';
import { Transaction } from '../../core/models/transaction.model';
import { AccountService } from '../../core/services/account.service';
import { TransactionService } from '../../core/services/transaction.service';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface PageData {
  account: Account;
  balance: AccountBalance;
  transactions: Transaction[];
}

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, FinancialAmountPipe, EmptyStateComponent],
  template: `
    @if (loading()) {
      <div class="top-loading-bar"></div>
    }

    @if (data(); as d) {
      <div class="cc-page">
        <div class="cc-row">
          <a class="btn btn-sm btn-outline-secondary" routerLink="/accounts" title="Back to Accounts">
            <i class="bi bi-arrow-left"></i>
          </a>
          <h2 class="cc-grow" style="margin:0">{{ d.account.name }}</h2>
          <span class="cc-chip" [class]="typeChipClass(d.account.type)">{{ typeLabel(d.account.type) }}</span>
        </div>

        <!-- Balance cards -->
        <div class="balance-grid">
          <div class="cc-card balance-main">
            <p class="bal-label">Current Balance</p>
            <p class="bal-value"
              [class.positive]="isPositive(d.balance.balance)"
              [class.negative]="!isPositive(d.balance.balance)">
              {{ d.balance.balance | financialAmount }}
            </p>
            <p class="bal-date">as of {{ d.balance.date | date:'mediumDate' }}</p>
          </div>

          <div class="cc-card balance-breakdown">
            <div class="breakdown-row">
              <span class="breakdown-label">Initial Balance</span>
              <span class="cc-amount">{{ d.balance.initialBalance | financialAmount }}</span>
            </div>
            <div class="breakdown-row">
              <span class="breakdown-label">Total Income</span>
              <span class="cc-amount cc-amount-income">+ {{ d.balance.totalDebits | financialAmount }}</span>
            </div>
            <div class="breakdown-row">
              <span class="breakdown-label">Total Expenses</span>
              <span class="cc-amount cc-amount-expense">- {{ d.balance.totalCredits | financialAmount }}</span>
            </div>
          </div>
        </div>

        <!-- Recent transactions -->
        <div class="cc-card" style="padding:0; overflow:hidden">
          <div class="cc-row" style="padding:16px 20px 0">
            <p class="cc-section-title cc-grow" style="margin:0">Recent Transactions</p>
            <a class="btn btn-link btn-sm" routerLink="/transactions"
              [queryParams]="{ accountId: d.account.id }">View all</a>
          </div>

          @if (d.transactions.length === 0) {
            <app-empty-state icon="bi-receipt" title="No transactions"
              subtitle="Transactions for this account will appear here" />
          } @else {
            <div class="table-responsive">
              <table class="table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th class="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of d.transactions; track row.id) {
                    <tr>
                      <td>{{ row.transactionDate | date:'MMM d' }}</td>
                      <td>{{ row.description }}</td>
                      <td>
                        <span class="cc-chip" [class]="'cc-chip-' + row.status.toLowerCase()">{{ row.status }}</span>
                      </td>
                      <td class="text-end">
                        <span class="cc-amount" [class]="'cc-amount-' + row.type.toLowerCase()">
                          {{ row.type === 'EXPENSE' ? '- ' : '+ ' }}{{ row.amount | financialAmount }}
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
    }
  `,
  styles: [`
    .balance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .balance-grid { grid-template-columns: 1fr; } }

    .balance-main { text-align: center; }
    .bal-label { margin: 0; font-size: 13px; color: var(--cc-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .bal-value { margin: 8px 0 4px; font-size: 36px; font-weight: 700; letter-spacing: -0.02em; }
    .bal-value.positive { color: var(--cc-success); }
    .bal-value.negative { color: var(--cc-danger); }
    .bal-date { margin: 0; font-size: 12px; color: var(--cc-muted); }

    .balance-breakdown { display: flex; flex-direction: column; gap: 12px; justify-content: center; }
    .breakdown-row { display: flex; justify-content: space-between; align-items: center; }
    .breakdown-label { font-size: 14px; color: var(--cc-muted); }

    .cc-chip-checking { background: #e0e7ff; color: #3730a3; }
    .cc-chip-savings  { background: #d1fae5; color: #065f46; }
    .cc-chip-cash     { background: #fef3c7; color: #92400e; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDetailComponent {
  private readonly accountService = inject(AccountService);
  private readonly transactionService = inject(TransactionService);

  id = input<string>('');
  readonly loading = signal(false);
  readonly data = signal<PageData | null>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.loading.set(true);
      forkJoin({
        account: this.accountService.getById(id),
        balance: this.accountService.getBalance(id),
        transactions: this.transactionService
          .getAll({ accountId: id, limit: 10 })
          .pipe(map(res => res.data)),
      }).subscribe({
        next: d => { this.data.set(d); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  typeLabel(type: string): string {
    return ({ CHECKING: 'Checking', SAVINGS: 'Savings', CASH: 'Cash' } as Record<string, string>)[type] ?? type;
  }

  typeChipClass(type: string): string { return 'cc-chip-' + type.toLowerCase(); }
  isPositive(value: string): boolean  { return parseFloat(value) >= 0; }
}
