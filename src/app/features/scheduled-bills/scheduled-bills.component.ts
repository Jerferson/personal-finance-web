import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { RefreshService } from '../../core/services/refresh.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';
import { ScheduledBillFormDialogComponent, ScheduledBillFormDialogData } from './scheduled-bill-form-dialog.component';

@Component({
  selector: 'app-scheduled-bills',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, FinancialAmountPipe, EmptyStateComponent],
  templateUrl: './scheduled-bills.component.html',
  styleUrl: './scheduled-bills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledBillsComponent {
  private readonly scheduledBillService = inject(ScheduledBillService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);
  private readonly refreshService = inject(RefreshService);
  private readonly destroyRef = inject(DestroyRef);
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
    this.refreshService.refresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
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
    return { SCHEDULED: 'cc-chip-scheduled', POSTED: 'cc-chip-posted' }[status];
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
        this.scheduledBillService.post(bill.id).subscribe(() => {
          this.notify.success('Bill posted — transaction created');
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
