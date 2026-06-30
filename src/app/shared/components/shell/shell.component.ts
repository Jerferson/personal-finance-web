import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoadingComponent } from '../loading/loading.component';
import { ToastContainerComponent } from '../toast/toast-container.component';
import { DialogService } from '../../services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TransactionCreateDialogComponent, TransactionCreateDialogData } from '../../../features/transactions/transaction-create-dialog.component';
import { ScheduledBillFormDialogComponent, ScheduledBillFormDialogData } from '../../../features/scheduled-bills/scheduled-bill-form-dialog.component';
import { TransferFormDialogComponent } from '../../../features/transfers/transfer-form-dialog.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingComponent, ToastContainerComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);

  readonly fabOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'bi-speedometer2',    route: '/dashboard' },
    { label: 'Extrato',        icon: 'bi-list-check',      route: '/extrato' },
    { label: 'Reports',        icon: 'bi-bar-chart',       route: '/reports' },
    { label: 'Accounts',       icon: 'bi-bank',            route: '/accounts' },
    { label: 'Categories',     icon: 'bi-tag',             route: '/categories' },
    { label: 'Projects',       icon: 'bi-folder',          route: '/projects' },
    { label: 'Transactions',   icon: 'bi-receipt',         route: '/transactions' },
    { label: 'Scheduled Bills',icon: 'bi-calendar-check',  route: '/scheduled-bills' },
    { label: 'Transfers',      icon: 'bi-arrow-left-right',route: '/transfers' },
  ];

  toggleFab(): void {
    this.fabOpen.update(v => !v);
  }

  closeFab(): void {
    this.fabOpen.set(false);
  }

  openTransaction(): void {
    this.fabOpen.set(false);
    const ref = this.dialog.open<boolean, TransactionCreateDialogData>(
      TransactionCreateDialogComponent,
      { data: {}, width: '480px' },
    );
    ref.afterClosed().subscribe((ok: boolean | undefined) => { if (ok) this.notify.success('Transaction created'); });
  }

  openScheduledBill(): void {
    this.fabOpen.set(false);
    const ref = this.dialog.open<boolean, ScheduledBillFormDialogData>(
      ScheduledBillFormDialogComponent,
      { data: {}, width: '480px' },
    );
    ref.afterClosed().subscribe((ok: boolean | undefined) => { if (ok) this.notify.success('Scheduled bill created'); });
  }

  openTransfer(): void {
    this.fabOpen.set(false);
    this.dialog.open<boolean>(TransferFormDialogComponent, { width: '480px' });
  }
}
