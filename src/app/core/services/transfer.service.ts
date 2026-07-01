import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateTransferDto, Transfer } from '../models/transfer.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, limit = 20): Observable<PaginatedResponse<Transfer>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<Transfer>>('/transfers', { params });
  }

  create(dto: CreateTransferDto, idempotencyKey: string): Observable<Transfer> {
    return this.http.post<Transfer>('/transfers', dto, {
      headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/transfers/${id}`);
  }
}
