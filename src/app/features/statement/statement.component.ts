import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';

import { StatementEntry, DayGroup } from '../../core/models/statement.model';
import { StatementService } from '../../core/services/statement.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ScheduledBillService } from '../../core/services/scheduled-bill.service';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { TransactionCreateDialogComponent, TransactionCreateDialogData } from '../transactions/transaction-create-dialog.component';
import { ScheduledBillFormDialogComponent, ScheduledBillFormDialogData } from '../scheduled-bills/scheduled-bill-form-dialog.component';
import { TransferFormDialogComponent } from '../transfers/transfer-form-dialog.component';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAST_LIMIT = 20;
const FUTURE_LIMIT = 10;

function groupByDay(future: StatementEntry[], past: StatementEntry[]): DayGroup[] {
  // future: ascending (earliest first when rendered at top)
  // past: descending (newest first at top of past section)
  const all = [...future, ...past];
  if (!all.length) return [];

  const map = new Map<string, StatementEntry[]>();
  for (const entry of all) {
    const key = entry.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  const groups: DayGroup[] = [];
  let prevMonth = '';

  // Sort keys descending (future dates at top, past dates below — consistent with display order)
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));

  for (const key of sortedKeys) {
    const [, monthStr, dayStr] = key.split('-');
    const monthIndex = parseInt(monthStr, 10) - 1;
    const monthLabel = MONTHS[monthIndex];
    const showMonthHeader = monthLabel !== prevMonth;
    if (showMonthHeader) prevMonth = monthLabel;

    groups.push({
      dateKey: key,
      dayLabel: String(parseInt(dayStr, 10)),
      showMonthHeader,
      monthLabel,
      entries: map.get(key)!,
    });
  }

  return groups;
}

@Component({
  selector: 'app-statement',
  standalone: true,
  imports: [FinancialAmountPipe],
  templateUrl: './statement.component.html',
  styleUrl: './statement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementComponent implements AfterViewInit, OnDestroy {
  @ViewChild('topSentinel')    private topSentinel!:    ElementRef<HTMLElement>;
  @ViewChild('bottomSentinel') private bottomSentinel!: ElementRef<HTMLElement>;

  private readonly statementService    = inject(StatementService);
  private readonly transactionService  = inject(TransactionService);
  private readonly scheduledBillService = inject(ScheduledBillService);
  private readonly dialog              = inject(DialogService);
  private readonly notify              = inject(NotificationService);
  private readonly zone                = inject(NgZone);

  readonly futureEntries  = signal<StatementEntry[]>([]);
  readonly pastEntries    = signal<StatementEntry[]>([]);
  readonly hasMoreFuture  = signal(false);
  readonly hasMorePast    = signal(false);
  readonly loadingFuture  = signal(false);
  readonly loadingPast    = signal(false);
  readonly initialLoading = signal(true);
  readonly showAddMenu    = signal(false);

  readonly grouped = computed(() => groupByDay(this.futureEntries(), this.pastEntries()));

  private topObserver!:    IntersectionObserver;
  private bottomObserver!: IntersectionObserver;

  constructor() {
    this.loadInitial();
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.topObserver = new IntersectionObserver(
        entries => { if (entries[0].isIntersecting) this.zone.run(() => this.loadMoreFuture()); },
        { threshold: 0.1 },
      );
      this.bottomObserver = new IntersectionObserver(
        entries => { if (entries[0].isIntersecting) this.zone.run(() => this.loadMorePast()); },
        { threshold: 0.1 },
      );
      this.topObserver.observe(this.topSentinel.nativeElement);
      this.bottomObserver.observe(this.bottomSentinel.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.topObserver?.disconnect();
    this.bottomObserver?.disconnect();
  }

  private loadInitial(): void {
    this.initialLoading.set(true);
    this.statementService.getInitial().subscribe({
      next: res => {
        this.futureEntries.set(res.future);
        this.pastEntries.set(res.past);
        this.hasMoreFuture.set(res.hasMoreFuture);
        this.hasMorePast.set(res.hasMorePast);
        this.initialLoading.set(false);
      },
      error: () => this.initialLoading.set(false),
    });
  }

  loadMorePast(): void {
    if (this.loadingPast() || !this.hasMorePast()) return;
    this.loadingPast.set(true);
    const skip = this.pastEntries().length;
    this.statementService.getPast(skip, PAST_LIMIT).subscribe({
      next: res => {
        this.pastEntries.update(prev => [...prev, ...res.entries]);
        this.hasMorePast.set(res.hasMore);
        this.loadingPast.set(false);
      },
      error: () => this.loadingPast.set(false),
    });
  }

  loadMoreFuture(): void {
    if (this.loadingFuture() || !this.hasMoreFuture()) return;
    this.loadingFuture.set(true);
    const skip = this.futureEntries().length;
    const prevScrollHeight = document.documentElement.scrollHeight;

    this.statementService.getFuture(skip, FUTURE_LIMIT).subscribe({
      next: res => {
        this.futureEntries.update(prev => [...res.entries, ...prev]);
        this.hasMoreFuture.set(res.hasMore);
        this.loadingFuture.set(false);
        requestAnimationFrame(() => {
          const delta = document.documentElement.scrollHeight - prevScrollHeight;
          window.scrollBy(0, delta);
        });
      },
      error: () => this.loadingFuture.set(false),
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  deleteTransaction(entry: StatementEntry): void {
    if (!entry.transactionId) return;
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        title: 'Delete Transaction',
        message: `Delete "${entry.description}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
      width: '400px',
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.transactionService.delete(entry.transactionId!).subscribe(() => {
          this.notify.success('Transaction deleted');
          this.loadInitial();
        });
      }
    });
  }

  postScheduledBill(entry: StatementEntry): void {
    if (!entry.scheduledBillId) return;
    this.scheduledBillService.post(entry.scheduledBillId).subscribe(() => {
      this.notify.success('Bill posted as transaction');
      this.loadInitial();
    });
  }

  cancelScheduledBill(entry: StatementEntry): void {
    if (!entry.scheduledBillId) return;
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Scheduled Bill',
        message: `Cancel "${entry.description}"?`,
        confirmLabel: 'Cancel Bill',
      },
      width: '400px',
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.scheduledBillService.cancel(entry.scheduledBillId!).subscribe(() => {
          this.notify.success('Scheduled bill cancelled');
          this.loadInitial();
        });
      }
    });
  }

  editScheduledBill(entry: StatementEntry): void {
    if (!entry.scheduledBillId) return;
    this.scheduledBillService.getById(entry.scheduledBillId).subscribe(bill => {
      const ref = this.dialog.open<boolean, ScheduledBillFormDialogData>(
        ScheduledBillFormDialogComponent,
        { data: { bill }, width: '480px' },
      );
      ref.afterClosed().subscribe(ok => { if (ok) { this.notify.success('Bill updated'); this.loadInitial(); } });
    });
  }

  // ── Create dialogs ────────────────────────────────────────────────────────────

  toggleAddMenu(): void {
    this.showAddMenu.update(v => !v);
  }

  openCreateTransaction(): void {
    this.showAddMenu.set(false);
    const ref = this.dialog.open<boolean, TransactionCreateDialogData>(
      TransactionCreateDialogComponent,
      { data: {}, width: '480px' },
    );
    ref.afterClosed().subscribe(ok => { if (ok) { this.notify.success('Transaction created'); this.loadInitial(); } });
  }

  openCreateScheduledBill(): void {
    this.showAddMenu.set(false);
    const ref = this.dialog.open<boolean, ScheduledBillFormDialogData>(
      ScheduledBillFormDialogComponent,
      { data: {}, width: '480px' },
    );
    ref.afterClosed().subscribe(ok => { if (ok) { this.notify.success('Scheduled bill created'); this.loadInitial(); } });
  }

  openCreateTransfer(): void {
    this.showAddMenu.set(false);
    const ref = this.dialog.open<boolean>(TransferFormDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe(ok => { if (ok) this.loadInitial(); });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  amountSign(entry: StatementEntry): string {
    if (entry.type === 'INCOME') return '+';
    if (entry.type === 'EXPENSE') return '-';
    return '';
  }

  entryIcon(entry: StatementEntry): string {
    if (entry.sourceType === 'TRANSFER') return 'bi-arrow-left-right';
    if (entry.isScheduled) return 'bi-clock';
    if (entry.type === 'INCOME') return 'bi-arrow-down-circle';
    return 'bi-arrow-up-circle';
  }
}
