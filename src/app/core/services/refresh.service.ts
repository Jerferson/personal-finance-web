import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RefreshService {
  private readonly _refresh$ = new Subject<void>();
  readonly refresh$ = this._refresh$.asObservable();

  emit(): void {
    this._refresh$.next();
  }
}
