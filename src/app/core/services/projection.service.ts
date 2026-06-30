import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BudgetProjection, CashflowProjection } from '../models/projection.model';

@Injectable({ providedIn: 'root' })
export class ProjectionService {
  private readonly http = inject(HttpClient);

  getBudget(until: string, accountId?: string): Observable<BudgetProjection> {
    let params = new HttpParams().set('until', until);
    if (accountId) params = params.set('accountId', accountId);
    return this.http.get<BudgetProjection>('/projections/budget', { params });
  }

  getCashflow(months = 13): Observable<CashflowProjection> {
    const params = new HttpParams().set('months', months);
    return this.http.get<CashflowProjection>('/projections/cashflow', { params });
  }
}
