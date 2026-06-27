import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PaginatedResponse } from '../models/pagination.model';

export interface LedgerAccount {
  id: string;
  name: string;
  code: string;
  type: string;
  accountId: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LedgerAccountService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, limit = 100): Observable<PaginatedResponse<LedgerAccount>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<LedgerAccount>>('/ledger-accounts', { params });
  }

  getById(id: string): Observable<LedgerAccount> {
    return this.http.get<LedgerAccount>(`/ledger-accounts/${id}`);
  }
}
