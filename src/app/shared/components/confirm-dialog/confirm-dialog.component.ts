import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<ConfirmDialogData>(DIALOG_DATA);

  get confirmBtnClass(): string {
    return this.data.confirmColor === 'primary'
      ? 'btn btn-primary'
      : 'btn btn-danger';
  }

  get iconWrapClass(): string {
    if (this.data.confirmColor === 'primary') return 'confirm-icon-wrap icon-primary';
    if (this.data.confirmColor === 'accent')  return 'confirm-icon-wrap icon-warning';
    return 'confirm-icon-wrap icon-danger';
  }

  get iconClass(): string {
    if (this.data.confirmColor === 'primary') return 'bi-check-circle';
    if (this.data.confirmColor === 'accent')  return 'bi-exclamation-circle';
    return 'bi-exclamation-triangle';
  }
}
