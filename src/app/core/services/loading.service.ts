import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly _visible = signal(false);

  readonly isLoading = this._visible.asReadonly();

  show(): void {
    this.count++;
    if (this.timer === null) {
      this.timer = setTimeout(() => {
        this.timer = null;
        if (this.count > 0) this._visible.set(true);
      }, 150);
    }
  }

  hide(): void {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this._visible.set(false);
    }
  }
}
