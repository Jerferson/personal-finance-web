import { inject, Injectable } from '@angular/core';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { Observable } from 'rxjs';

export { DIALOG_DATA as BS_DIALOG_DATA };
export { DialogRef as BsDialogRef };

export interface BsDialogConfig<D = unknown> {
  data?: D;
  width?: string;
}

export class BsDialogRefWrapper<R = unknown> {
  constructor(private readonly ref: DialogRef<R>) {}

  afterClosed(): Observable<R | undefined> {
    return this.ref.closed;
  }

  close(result?: R): void {
    this.ref.close(result);
  }
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<R = unknown, D = unknown>(
    component: ComponentType<unknown>,
    config?: BsDialogConfig<D>,
  ): BsDialogRefWrapper<R> {
    const ref = this.dialog.open<R>(component, {
      data: config?.data,
      panelClass: 'bs-dialog-panel',
      hasBackdrop: true,
      backdropClass: 'bs-dialog-backdrop',
      ...(config?.width ? { width: config.width } : {}),
    });
    return new BsDialogRefWrapper<R>(ref);
  }
}
