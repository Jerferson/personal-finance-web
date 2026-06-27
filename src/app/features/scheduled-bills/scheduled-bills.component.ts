import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Account } from '../../core/models/account.model';
import { Category } from '../../core/models/category.model';
import { ScheduledBill, ScheduledBillStatus } from '../../core/models/scheduled-bill.model';
import { AccountService } from '../../core/services/account.service';
import { CategoryService } from '../../core/services/category.service';
import { ScheduledBillService } from '../../core/services/scheduled-bill.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';
import { ScheduledBillFormDialogComponent, ScheduledBillFormDialogData } from './scheduled-bill-form-dialog.component';

@Component({
  selector: 'app-scheduled-bills',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, FinancialAmountPipe, EmptyStateComponent],
  template: `
    <div class="cc-page">
      <div class="cc-row">
        <h2 class="cc-grow" style="margin:0">Scheduled Bills</h2>
        <button class="btn btn-primary btn-sm" (click)="openForm()">
          <i class="bi bi-plus-lg"></i> New Scheduled Bill
        </button>
      </div>

      <!-- Filters -->
      <div class="cc-card" style="padding:12px 16px">
        <form [formGroup]="filterFg" class="filter-row">
          <select class="form-select form-select-sm filter-field" formControlName="status">
            <option value="">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="POSTED">Posted</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <input class="form-control form-control-sm filter-field" type="date"
            formControlName="startDate" placeholder="From" />

          <input class="form-control form-control-sm filter-field" type="date"
            formControlName="endDate" placeholder="To" />

          <button class="btn btn-outline-secondary btn-sm" type="button" (click)="clearFilters()">
            <i class="bi bi-x-lg"></i> Clear
          </button>
        </form>
      </div>

      <!-- Table -->
      <div class="cc-card" style="padding:0; overflow:hidden">
        @if (bills().length === 0) {
          <app-empty-state icon="bi-calendar-check" title="No scheduled bills found"
            subtitle="Create scheduled bills to plan your upcoming income and expenses" />
        } @else {
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Due Date</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th class="text-end">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (row of bills(); track row.id) {
                  <tr [class.row-posted]="row.status === 'POSTED'"
                      [class.row-cancelled]="row.status === 'CANCELLED'">
                    <td>{{ row.dueDate | date:'MMM d, y' }}</td>
                    <td class="desc-cell">{{ row.description }}</td>
                    <td>{{ accountMap().get(row.accountId)?.name ?? '—' }}</td>
                    <td>{{ categoryMap().get(row.categoryId)?.name ?? '—' }}</td>
                    <td><span class="cc-chip" [class]="'cc-chip-' + row.type.toLowerCase()">{{ row.type }}</span></td>
                    <td><span class="cc-chip" [class]="statusChipClass(row.status)">{{ row.status }}</span></td>
                    <td class="text-end">
                      <span class="cc-amount"
                        [class.cc-amount-income]="row.type === 'INCOME'"
                        [class.cc-amount-expense]="row.type === 'EXPENSE'">
                        {{ row.amount | financialAmount }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      @if (row.status === 'SCHEDULED') {
                        <button class="btn btn-sm btn-outline-secondary" title="Edit" (click)="openForm(row)">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" title="Post (mark as paid)" (click)="postBill(row)">
                          <i class="bi bi-check-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" title="Cancel" (click)="cancelBill(row)">
                          <i class="bi bi-x-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Delete" (click)="deleteBill(row)">
                          <i class="bi bi-trash"></i>
                        </button>
                      }
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
    .filter-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .filter-field { min-width: 130px; flex: 1; }
    .desc-cell { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .actions-cell { display: flex; gap: 2px; justify-content: flex-end; padding: 4px 16px; min-width: 160px; }
    .row-posted    td { opacity: 0.6; }
    .row-cancelled td { opacity: 0.4; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledBillsComponent {
  private readonly scheduledBillService = inject(ScheduledBillService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly bills = signal<ScheduledBill[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly accountMap  = computed(() => new Map(this.accounts().map(a => [a.id, a])));
  readonly categoryMap = computed(() => new Map(this.categories().map(c => [c.id, c])));

  readonly filterFg = this.fb.group({ status: [''], startDate: [''], endDate: [''] });

  constructor() {
    forkJoin({
      accounts:   this.accountService.getAll(1, 100),
      categories: this.categoryService.getAll(1, 100),
    }).subscribe(({ accounts, categories }) => {
      this.accounts.set(accounts.data);
      this.categories.set(categories.data);
      this.load();
    });
    this.filterFg.valueChanges.subscribe(() => this.load());
  }

  private load() {
    const f = this.filterFg.value;
    this.scheduledBillService.getAll({
      limit: 100,
      ...(f.status    ? { status:    f.status as ScheduledBillStatus } : {}),
      ...(f.startDate ? { startDate: f.startDate }                     : {}),
      ...(f.endDate   ? { endDate:   f.endDate }                       : {}),
    }).subscribe(res => this.bills.set(res.data));
  }

  clearFilters() { this.filterFg.reset({ status: '', startDate: '', endDate: '' }); }

  statusChipClass(status: ScheduledBillStatus): string {
    return { SCHEDULED: 'cc-chip-scheduled', POSTED: 'cc-chip-posted', CANCELLED: 'cc-chip-cancelled' }[status];
  }

  openForm(bill?: ScheduledBill) {
    const ref = this.dialog.open<boolean, ScheduledBillFormDialogData>(
      ScheduledBillFormDialogComponent,
      { data: { bill }, width: '480px' },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) { this.load(); this.notify.success(bill ? 'Scheduled bill updated' : 'Scheduled bill created'); }
    });
  }

  postBill(bill: ScheduledBill) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        title: 'Post Scheduled Bill',
        message: `Post "${bill.description}"? This will create a transaction and cannot be undone.`,
        confirmLabel: 'Post', confirmColor: 'primary',
      }, width: '420px',
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.scheduledBillService.post(bill.id, crypto.randomUUID()).subscribe(() => {
          this.notify.success('Bill posted — transaction created');
          this.load();
        });
      }
    });
  }

  cancelBill(bill: ScheduledBill) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Scheduled Bill',
        message: `Cancel "${bill.description}"? This cannot be undone.`,
        confirmLabel: 'Cancel Bill',
      }, width: '400px',
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.scheduledBillService.cancel(bill.id, crypto.randomUUID()).subscribe(() => {
          this.notify.success('Scheduled bill cancelled');
          this.load();
        });
      }
    });
  }

  deleteBill(bill: ScheduledBill) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        title: 'Delete Scheduled Bill',
        message: `Delete "${bill.description}"? This cannot be undone.`,
        confirmLabel: 'Delete',
      }, width: '380px',
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.scheduledBillService.delete(bill.id).subscribe(() => {
          this.notify.success('Scheduled bill deleted');
          this.load();
        });
      }
    });
  }
}
