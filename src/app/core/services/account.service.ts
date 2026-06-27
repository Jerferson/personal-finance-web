import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Account, AccountBalance, CreateAccountDto, UpdateAccountDto } from '../models/account.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, limit = 20): Observable<PaginatedResponse<Account>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<Account>>('/accounts', { params });
  }

  getById(id: string): Observable<Account> {
    return this.http.get<Account>(`/accounts/${id}`);
  }

  getBalance(id: string, date?: string): Observable<AccountBalance> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<AccountBalance>(`/accounts/${id}/balance`, { params });
  }

  create(dto: CreateAccountDto): Observable<Account> {
    return this.http.post<Account>('/accounts', dto);
  }

  update(id: string, dto: UpdateAccountDto): Observable<Account> {
    return this.http.patch<Account>(`/accounts/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/accounts/${id}`);
  }
}
