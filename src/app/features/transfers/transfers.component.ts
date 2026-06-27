import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

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
  selector: 'app-transfers',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="cc-page">
      <h2 style="margin:0">New Transfer</h2>

      <div class="cc-card form-card">
        <p class="cc-section-title">Move money between accounts</p>

        <form [formGroup]="fg" (ngSubmit)="submit()" class="transfer-form">

          <div class="account-row">
            <div class="flex-grow-1">
              <label class="form-label">From Account</label>
              <select class="form-select" formControlName="fromAccountId"
                [class.is-invalid]="fg.controls.fromAccountId.invalid && fg.controls.fromAccountId.touched">
                <option value="">Select account…</option>
                @for (a of accounts(); track a.id) {
                  <option [value]="a.id">{{ a.name }}</option>
                }
              </select>
              <div class="invalid-feedback">Required</div>
            </div>

            <i class="bi bi-arrow-right transfer-arrow"></i>

            <div class="flex-grow-1">
              <label class="form-label">To Account</label>
              <select class="form-select" formControlName="toAccountId"
                [class.is-invalid]="fg.controls.toAccountId.invalid && fg.controls.toAccountId.touched">
                <option value="">Select account…</option>
                @for (a of accounts(); track a.id) {
                  <option [value]="a.id">{{ a.name }}</option>
                }
              </select>
              <div class="invalid-feedback">Required</div>
            </div>
          </div>

          @if (fg.hasError('sameAccount') && fg.controls.toAccountId.touched) {
            <p class="same-account-error">From and To accounts must be different.</p>
          }

          <div class="row g-2">
            <div class="col-6">
              <label class="form-label">Amount</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input class="form-control" type="number" step="0.01" min="0.01" formControlName="amount"
                  [class.is-invalid]="fg.controls.amount.invalid && fg.controls.amount.touched" />
                <div class="invalid-feedback">Enter a value greater than 0</div>
              </div>
            </div>
            <div class="col-6">
              <label class="form-label">Transfer Date</label>
              <input class="form-control" type="date" formControlName="transferDate"
                [class.is-invalid]="fg.controls.transferDate.invalid && fg.controls.transferDate.touched" />
              <div class="invalid-feedback">Date is required</div>
            </div>
          </div>

          <div>
            <label class="form-label">Description</label>
            <input class="form-control" formControlName="description" autocomplete="off"
              [class.is-invalid]="fg.controls.description.invalid && fg.controls.description.touched" />
            <div class="invalid-feedback">Description is required</div>
          </div>

          <div class="d-flex justify-content-end mt-2">
            <button class="btn btn-primary" type="submit" [disabled]="fg.invalid || submitting()">
              @if (submitting()) {
                <span class="spinner-border spinner-border-sm me-1"></span>
              } @else {
                <i class="bi bi-arrow-left-right me-1"></i>
              }
              Transfer
            </button>
          </div>
        </form>

        <div class="hint-box mt-3">
          <i class="bi bi-info-circle hint-icon"></i>
          <p class="hint-text mb-0">
            Transfers are recorded as journal entries and do not appear in Transactions.
            To view transfer history, go to <strong>Journal Entries</strong> and filter by
            <em>Source: Transfer</em>.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-card { max-width: 560px; }
    .transfer-form { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
    .account-row { display: flex; align-items: flex-end; gap: 12px; }
    .transfer-arrow { font-size: 20px; color: var(--cc-muted); flex-shrink: 0; padding-bottom: 8px; }
    .same-account-error { color: var(--cc-danger); font-size: 12px; margin: 0; }

    .hint-box { display: flex; gap: 10px; align-items: flex-start; padding: 12px;
      background: var(--cc-primary-soft); border-radius: 8px; }
    .hint-icon { color: var(--cc-primary); font-size: 18px; flex-shrink: 0; margin-top: 1px; }
    .hint-text { font-size: 13px; color: var(--cc-primary-deep); line-height: 1.5; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransfersComponent {
  private readonly fb = inject(FormBuilder);
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
        this.notify.success('Transfer completed successfully');
        this.fg.reset({
          fromAccountId: '', toAccountId: '', amount: null,
          transferDate: todayIso(), description: '',
        });
      },
      error: () => this.submitting.set(false),
    });
  }
}
