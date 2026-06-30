import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatementInitialResponse, StatementPageResponse } from '../models/statement.model';

@Injectable({ providedIn: 'root' })
export class StatementService {
  private readonly http = inject(HttpClient);

  getInitial(): Observable<StatementInitialResponse> {
    return this.http.get<StatementInitialResponse>('/statement', {
      params: new HttpParams().set('mode', 'initial'),
    });
  }

  getPast(skip: number, limit = 20): Observable<StatementPageResponse> {
    const params = new HttpParams()
      .set('mode', 'past')
      .set('skip', skip)
      .set('limit', limit);
    return this.http.get<StatementPageResponse>('/statement', { params });
  }

  getFuture(skip: number, limit = 10): Observable<StatementPageResponse> {
    const params = new HttpParams()
      .set('mode', 'future')
      .set('skip', skip)
      .set('limit', limit);
    return this.http.get<StatementPageResponse>('/statement', { params });
  }
}
