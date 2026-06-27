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
  template: `
    <div class="cc-page">
      <div class="cc-row">
        <h2 class="cc-grow" style="margin:0">Accounts</h2>
        <button class="btn btn-primary btn-sm" (click)="openForm()">
          <i class="bi bi-plus-lg"></i> New Account
        </button>
      </div>

      <div class="cc-card" style="padding:0; overflow:hidden">
        @if (accounts().length === 0) {
          <app-empty-state icon="bi-bank" title="No accounts yet"
            subtitle="Create your first account to get started" />
        } @else {
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th class="text-end">Initial Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (row of accounts(); track row.id) {
                  <tr>
                    <td>
                      <a [routerLink]="['/accounts', row.id]" class="account-link">{{ row.name }}</a>
                    </td>
                    <td>
                      <span class="cc-chip" [class]="typeChipClass(row.type)">{{ typeLabel(row.type) }}</span>
                    </td>
                    <td class="text-end">
                      <span class="cc-amount">{{ row.initialBalance | financialAmount }}</span>
                    </td>
                    <td class="actions-cell">
                      <a class="btn btn-sm btn-outline-secondary" title="View detail"
                        [routerLink]="['/accounts', row.id]">
                        <i class="bi bi-box-arrow-up-right"></i>
                      </a>
                      <button class="btn btn-sm btn-outline-secondary" title="Edit" (click)="openForm(row)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" title="Delete" (click)="delete(row)">
                        <i class="bi bi-trash"></i>
                      </button>
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
    .account-link { text-decoration: none; font-weight: 500; color: var(--cc-primary); }
    .account-link:hover { text-decoration: underline; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; padding: 6px 16px; }
    .cc-chip-checking { background: #e0e7ff; color: #3730a3; }
    .cc-chip-savings  { background: #d1fae5; color: #065f46; }
    .cc-chip-cash     { background: #fef3c7; color: #92400e; }
  `],
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
