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
  template: `
    <div class="modal-header">
      <div class="confirm-title-row">
        <span [class]="iconWrapClass">
          <i class="bi" [class]="iconClass"></i>
        </span>
        <h5 class="modal-title">{{ data.title }}</h5>
      </div>
    </div>
    <div class="modal-body">
      <p class="mb-0 confirm-message">{{ data.message }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">
        {{ data.cancelLabel ?? 'Cancel' }}
      </button>
      <button type="button" [class]="confirmBtnClass" (click)="dialogRef.close(true)">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </div>
  `,
  styles: [`
    .confirm-title-row {
      display: flex; align-items: center; gap: 12px;
    }
    .confirm-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .icon-danger  { background: var(--cc-danger-soft);  color: var(--cc-danger); }
    .icon-primary { background: var(--cc-primary-soft); color: var(--cc-primary); }
    .icon-warning { background: var(--cc-warning-soft); color: var(--cc-warning); }
    .confirm-message { font-size: 14px; }
  `],
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
