import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import {
  JournalEntry,
  JournalEntrySourceType,
  JournalEntryStatus,
  QueryJournalEntryParams,
} from '../../core/models/journal-entry.model';
import { JournalEntryService } from '../../core/services/journal-entry.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BsPaginatorComponent, PageEvent } from '../../shared/components/bs-paginator/bs-paginator.component';

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, EmptyStateComponent, BsPaginatorComponent],
  templateUrl: './journal-entries.component.html',
  styleUrl: './journal-entries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalEntriesComponent {
  private readonly journalEntryService = inject(JournalEntryService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly entries   = signal<JournalEntry[]>([]);
  readonly total     = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize  = signal(20);

  readonly filterFg = this.fb.group({
    sourceType: [''], status: [''], startDate: [''], endDate: [''],
  });

  constructor() {
    this.load();
    this.filterFg.valueChanges.subscribe(() => { this.pageIndex.set(0); this.load(); });
  }

  private load() {
    const f = this.filterFg.value;
    const query: QueryJournalEntryParams = {
      page: this.pageIndex() + 1, limit: this.pageSize(),
      ...(f.sourceType ? { sourceType: f.sourceType as JournalEntrySourceType } : {}),
      ...(f.status     ? { status:     f.status as JournalEntryStatus }          : {}),
      ...(f.startDate  ? { startDate:  f.startDate }                             : {}),
      ...(f.endDate    ? { endDate:    f.endDate }                               : {}),
    };
    this.journalEntryService.getAll(query).subscribe(res => {
      this.entries.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  clearFilters() {
    this.filterFg.reset({ sourceType: '', status: '', startDate: '', endDate: '' });
  }

  canVoid(entry: JournalEntry): boolean {
    return entry.status === 'POSTED' &&
      (entry.sourceType === 'TRANSFER' || entry.sourceType === 'MANUAL');
  }

  sourceLabel(type: JournalEntrySourceType): string {
    const labels: Record<JournalEntrySourceType, string> = {
      SIMPLE_TRANSACTION: 'Transaction', SCHEDULED_BILL: 'Scheduled',
      TRANSFER: 'Transfer', MANUAL: 'Manual', SEED: 'Seed',
    };
    return labels[type] ?? type;
  }

  sourceChipClass(type: JournalEntrySourceType): string {
    const classes: Record<JournalEntrySourceType, string> = {
      SIMPLE_TRANSACTION: 'chip-transaction', SCHEDULED_BILL: 'chip-scheduled',
      TRANSFER: 'chip-transfer', MANUAL: 'chip-manual', SEED: 'chip-seed',
    };
    return classes[type] ?? '';
  }

  voidEntry(entry: JournalEntry) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        title: 'Void Journal Entry',
        message: `Void "${entry.description}"? This will reverse the financial effect and cannot be undone.`,
        confirmLabel: 'Void',
      },
      width: '440px',
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.journalEntryService.void(entry.id, crypto.randomUUID()).subscribe(() => {
          this.notify.success('Journal entry voided');
          this.load();
        });
      }
    });
  }
}
