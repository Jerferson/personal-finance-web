export type JournalEntryStatus = 'POSTED' | 'VOIDED';
export type JournalEntrySourceType =
  | 'MANUAL'
  | 'SIMPLE_TRANSACTION'
  | 'SCHEDULED_BILL'
  | 'TRANSFER'
  | 'SEED';

export interface JournalEntry {
  id: string;
  entryDate: string;
  description: string;
  sourceType: JournalEntrySourceType;
  sourceId?: string;
  status: JournalEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QueryJournalEntryParams {
  status?: JournalEntryStatus;
  sourceType?: JournalEntrySourceType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
