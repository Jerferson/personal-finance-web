import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { JournalEntry, QueryJournalEntryParams } from '../models/journal-entry.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class JournalEntryService {
  private readonly http = inject(HttpClient);

  getAll(query: QueryJournalEntryParams = {}): Observable<PaginatedResponse<JournalEntry>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<JournalEntry>>('/journal-entries', { params });
  }

  getById(id: string): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`/journal-entries/${id}`);
  }

  void(id: string, idempotencyKey: string): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`/journal-entries/${id}/void`, {}, {
      headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
    });
  }
}
