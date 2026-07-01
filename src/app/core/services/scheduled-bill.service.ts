import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ScheduledBill,
  CreateScheduledBillDto,
  UpdateScheduledBillDto,
  QueryScheduledBillParams,
} from '../models/scheduled-bill.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ScheduledBillService {
  private readonly http = inject(HttpClient);

  getAll(query: QueryScheduledBillParams = {}): Observable<PaginatedResponse<ScheduledBill>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<ScheduledBill>>('/scheduled-bills', { params });
  }

  getById(id: string): Observable<ScheduledBill> {
    return this.http.get<ScheduledBill>(`/scheduled-bills/${id}`);
  }

  create(dto: CreateScheduledBillDto, idempotencyKey: string): Observable<ScheduledBill> {
    return this.http.post<ScheduledBill>('/scheduled-bills', dto, {
      headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
    });
  }

  update(id: string, dto: UpdateScheduledBillDto): Observable<ScheduledBill> {
    return this.http.patch<ScheduledBill>(`/scheduled-bills/${id}`, dto);
  }

  post(id: string): Observable<ScheduledBill> {
    return this.http.post<ScheduledBill>(`/scheduled-bills/${id}/post`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/scheduled-bills/${id}`);
  }
}
