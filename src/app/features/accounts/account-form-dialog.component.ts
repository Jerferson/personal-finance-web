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
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ isEdit ? 'Edit Account' : 'New Account' }}</h5>
      <button type="button" class="btn-close" (click)="dialogRef.close(false)"></button>
    </div>

    <div class="modal-body">
      <form [formGroup]="fg" (ngSubmit)="submit()" class="dialog-form">
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input class="form-control" formControlName="name" autocomplete="off"
            [class.is-invalid]="fg.controls.name.invalid && fg.controls.name.touched" />
          <div class="invalid-feedback">Name is required</div>
        </div>

        <div class="mb-3">
          <label class="form-label">Type</label>
          <select class="form-select" formControlName="type">
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
            <option value="CASH">Cash</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Initial Balance</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input class="form-control" type="number" step="0.01" min="0" formControlName="initialBalance"
              [class.is-invalid]="fg.controls.initialBalance.invalid && fg.controls.initialBalance.touched" />
            <div class="invalid-feedback">Must be 0 or greater</div>
          </div>
        </div>
      </form>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">Cancel</button>
      <button type="button" class="btn btn-primary" [disabled]="fg.invalid || submitting()" (click)="submit()">
        @if (submitting()) {
          <span class="spinner-border spinner-border-sm me-1"></span>
        }
        {{ isEdit ? 'Save' : 'Create' }}
      </button>
    </div>
  `,
  styles: [`.dialog-form { min-width: 340px; }`],
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
