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
  template: `
    <div class="cc-page">
      <div class="cc-row">
        <h2 class="cc-grow" style="margin:0">Journal Entries</h2>
        <span class="audit-badge">Audit log</span>
      </div>

      <!-- Filters -->
      <div class="cc-card" style="padding:12px 16px">
        <form [formGroup]="filterFg" class="filter-row">
          <select class="form-select form-select-sm filter-field" formControlName="sourceType">
            <option value="">All sources</option>
            <option value="SIMPLE_TRANSACTION">Transaction</option>
            <option value="SCHEDULED_BILL">Scheduled Bill</option>
            <option value="TRANSFER">Transfer</option>
            <option value="MANUAL">Manual</option>
            <option value="SEED">Seed</option>
          </select>

          <select class="form-select form-select-sm filter-field" formControlName="status">
            <option value="">All statuses</option>
            <option value="POSTED">Posted</option>
            <option value="VOIDED">Voided</option>
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
        @if (entries().length === 0) {
          <app-empty-state icon="bi-journal-text" title="No journal entries found"
            subtitle="Journal entries are created automatically for transactions, scheduled bills, and transfers" />
        } @else {
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (row of entries(); track row.id) {
                  <tr [class.voided-row]="row.status === 'VOIDED'">
                    <td>{{ row.entryDate | date:'MMM d, y' }}</td>
                    <td class="desc-cell">{{ row.description }}</td>
                    <td>
                      <span class="cc-chip" [class]="sourceChipClass(row.sourceType)">
                        {{ sourceLabel(row.sourceType) }}
                      </span>
                    </td>
                    <td>
                      <span class="cc-chip" [class]="'cc-chip-' + row.status.toLowerCase()">
                        {{ row.status }}
                      </span>
                    </td>
                    <td class="ref-cell">
                      {{ row.sourceId ? row.sourceId.slice(0, 8) + '…' : '—' }}
                    </td>
                    <td class="actions-cell">
                      @if (canVoid(row)) {
                        <button class="btn btn-sm btn-outline-danger" title="Void entry" (click)="voidEntry(row)">
                          <i class="bi bi-slash-circle"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <app-bs-paginator
          [length]="total()"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[20, 50, 100]"
          (page)="onPageChange($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .audit-badge {
      display: inline-flex; align-items: center; padding: 2px 10px;
      border-radius: 99px; font-size: 11px; font-weight: 600; letter-spacing: .04em;
      background: var(--cc-primary-soft); color: var(--cc-primary);
    }
    .filter-row  { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .filter-field { min-width: 130px; flex: 1; }

    .desc-cell { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ref-cell  { font-family: monospace; font-size: 12px; color: var(--cc-muted); }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; padding: 4px 16px; min-width: 56px; }
    .voided-row td { opacity: 0.45; }

    .chip-transaction  { background: #e0e7ff; color: #3730a3; }
    .chip-scheduled    { background: var(--cc-warning-soft); color: var(--cc-warning); }
    .chip-transfer     { background: #f3e8ff; color: #7e22ce; }
    .chip-manual       { background: #f3f4f6; color: #374151; }
    .chip-seed         { background: #f3f4f6; color: #9ca3af; }
  `],
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
