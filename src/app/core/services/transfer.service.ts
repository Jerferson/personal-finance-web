import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateTransferDto, Transfer } from '../models/transfer.model';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly http = inject(HttpClient);

  create(dto: CreateTransferDto, idempotencyKey: string): Observable<Transfer> {
    return this.http.post<Transfer>('/transfers', dto, {
      headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
    });
  }
}
