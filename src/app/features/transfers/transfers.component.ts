import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Transfer } from '../../core/models/transfer.model';
import { TransferService } from '../../core/services/transfer.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BsPaginatorComponent, PageEvent } from '../../shared/components/bs-paginator/bs-paginator.component';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';
import { TransferFormDialogComponent } from './transfer-form-dialog.component';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [DatePipe, FinancialAmountPipe, EmptyStateComponent, BsPaginatorComponent],
  templateUrl: './transfers.component.html',
  styleUrl: './transfers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransfersComponent {
  private readonly transferService = inject(TransferService);
  private readonly dialog          = inject(DialogService);
  private readonly notify          = inject(NotificationService);

  readonly transfers  = signal<Transfer[]>([]);
  readonly total      = signal(0);
  readonly pageIndex  = signal(0);
  readonly pageSize   = signal(20);

  constructor() {
    this.load();
  }

  private load(): void {
    this.transferService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe(res => {
      this.transfers.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  openCreate(): void {
    const ref = this.dialog.open<boolean>(TransferFormDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe(ok => {
      if (ok) { this.notify.success('Transfer completed successfully'); this.load(); }
    });
  }
}
