import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MonthlyExpensesReport, MonthlySummaryReport } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  getMonthlyExpenses(month: string, accountId?: string): Observable<MonthlyExpensesReport> {
    let params = new HttpParams().set('month', month);
    if (accountId) params = params.set('accountId', accountId);
    return this.http.get<MonthlyExpensesReport>('/reports/monthly-expenses', { params });
  }

  getMonthlySummary(month: string): Observable<MonthlySummaryReport> {
    const params = new HttpParams().set('month', month);
    return this.http.get<MonthlySummaryReport>('/reports/monthly-summary', { params });
  }
}
