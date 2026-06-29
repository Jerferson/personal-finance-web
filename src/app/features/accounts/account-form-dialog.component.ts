import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { Account, AccountType, CreateAccountDto, UpdateAccountDto } from '../../core/models/account.model';
import { AccountService } from '../../core/services/account.service';

export interface AccountFormDialogData {
  account?: Account;
}

@Component({
  selector: 'app-account-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './account-form-dialog.component.html',
  styleUrl: './account-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<AccountFormDialogData>(DIALOG_DATA);
  private readonly accountService = inject(AccountService);

  readonly isEdit = !!this.data.account;
  readonly submitting = signal(false);

  readonly fg = this.fb.group({
    name: [this.data.account?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    type: [this.data.account?.type ?? ('CHECKING' as AccountType), [Validators.required]],
    initialBalance: [
      this.data.account ? parseFloat(this.data.account.initialBalance) : 0,
      [Validators.min(0)],
    ],
  });

  submit() {
    if (this.fg.invalid || this.submitting()) return;
    this.submitting.set(true);
    const v = this.fg.getRawValue();

    const obs = this.isEdit
      ? this.accountService.update(this.data.account!.id, {
          name: v.name!, type: v.type as AccountType, initialBalance: Number(v.initialBalance),
        } satisfies UpdateAccountDto)
      : this.accountService.create({
          name: v.name!, type: v.type as AccountType, initialBalance: Number(v.initialBalance),
        } satisfies CreateAccountDto);

    obs.subscribe({
      next: () => { this.submitting.set(false); this.dialogRef.close(true); },
      error: () => this.submitting.set(false),
    });
  }
}
