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
  templateUrl: './account-detail.component.html',
  styleUrl: './account-detail.component.scss',
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
