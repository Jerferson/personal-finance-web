import { inject, Injectable } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toast = inject(ToastService);

  success(message: string): void { this.toast.success(message); }
  error(message: string): void   { this.toast.error(message); }
  info(message: string): void    { this.toast.info(message); }
}
