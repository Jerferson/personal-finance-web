import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';

import { Account } from '../../core/models/account.model';
import { CreateTransferDto } from '../../core/models/transfer.model';
import { AccountService } from '../../core/services/account.service';
import { NotificationService } from '../../core/services/notification.service';
import { TransferService } from '../../core/services/transfer.service';

function differentAccounts(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const from = group.get('fromAccountId')?.value;
    const to   = group.get('toAccountId')?.value;
    return from && to && from === to ? { sameAccount: true } : null;
  };
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-transfer-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transfer-form-dialog.component.html',
  styleUrl: './transfer-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(DialogRef<boolean>);
  private readonly transferService = inject(TransferService);
  private readonly accountService = inject(AccountService);
  private readonly notify = inject(NotificationService);

  readonly accounts = signal<Account[]>([]);
  readonly submitting = signal(false);

  readonly fg = this.fb.group(
    {
      fromAccountId: ['', [Validators.required]],
      toAccountId:   ['', [Validators.required]],
      amount:        [null as number | null, [Validators.required, Validators.min(0.01)]],
      transferDate:  [todayIso(), [Validators.required]],
      description:   ['', [Validators.required]],
    },
    { validators: differentAccounts() },
  );

  constructor() {
    this.accountService.getAll(1, 100).subscribe(res => this.accounts.set(res.data));
  }

  submit() {
    if (this.fg.invalid || this.submitting()) return;
    this.submitting.set(true);
    const v = this.fg.getRawValue();
    const dto: CreateTransferDto = {
      fromAccountId: v.fromAccountId!,
      toAccountId:   v.toAccountId!,
      amount:        Number(v.amount).toFixed(2),
      transferDate:  v.transferDate!,
      description:   v.description!,
    };
    this.transferService.create(dto, crypto.randomUUID()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notify.success('Transfer completed');
        this.dialogRef.close(true);
      },
      error: () => this.submitting.set(false),
    });
  }
}
