import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  QueryTransactionParams,
} from '../models/transaction.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);

  getAll(query: QueryTransactionParams = {}): Observable<PaginatedResponse<Transaction>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<Transaction>>('/transactions', { params });
  }

  getById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`/transactions/${id}`);
  }

  create(dto: CreateTransactionDto, idempotencyKey: string): Observable<Transaction> {
    return this.http.post<Transaction>('/transactions', dto, {
      headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
    });
  }

  update(id: string, dto: UpdateTransactionDto): Observable<Transaction> {
    return this.http.patch<Transaction>(`/transactions/${id}`, dto);
  }

  void(id: string, idempotencyKey: string): Observable<Transaction> {
    return this.http.post<Transaction>(`/transactions/${id}/void`, {}, {
      headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
    });
  }
}
