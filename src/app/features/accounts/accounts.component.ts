import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Account, AccountType } from '../../core/models/account.model';
import { AccountService } from '../../core/services/account.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';
import { AccountFormDialogComponent, AccountFormDialogData } from './account-form-dialog.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [RouterLink, FinancialAmountPipe, EmptyStateComponent],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsComponent {
  private readonly accountService = inject(AccountService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);

  readonly accounts = signal<Account[]>([]);

  constructor() { this.load(); }

  private load() {
    this.accountService.getAll(1, 100).subscribe(res => this.accounts.set(res.data));
  }

  typeLabel(type: AccountType): string {
    return { CHECKING: 'Checking', SAVINGS: 'Savings', CASH: 'Cash' }[type] ?? type;
  }

  typeChipClass(type: AccountType): string {
    return 'cc-chip-' + type.toLowerCase();
  }

  openForm(account?: Account) {
    const ref = this.dialog.open<boolean, AccountFormDialogData>(
      AccountFormDialogComponent,
      { data: { account }, width: '420px' },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.load();
        this.notify.success(account ? 'Account updated' : 'Account created');
      }
    });
  }

  delete(account: Account) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete Account',
          message: `Delete "${account.name}"? This cannot be undone.`,
          confirmLabel: 'Delete',
        },
        width: '380px',
      },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.accountService.delete(account.id).subscribe(() => {
          this.notify.success('Account deleted');
          this.load();
        });
      }
    });
  }
}
