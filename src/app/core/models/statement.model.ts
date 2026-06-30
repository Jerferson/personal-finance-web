export type StatementEntryType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type StatementSourceType = 'TRANSACTION' | 'SCHEDULED_BILL' | 'TRANSFER';
export type StatementStatus = 'POSTED' | 'VOIDED' | 'SCHEDULED';

export interface StatementEntry {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: StatementEntryType;
  sourceType: StatementSourceType;
  status: StatementStatus;
  isScheduled: boolean;
  accountId: string;
  accountName: string;
  categoryId?: string;
  categoryName?: string;
  projectId?: string;
  projectName?: string;
  relatedAccountId?: string;
  relatedAccountName?: string;
  transactionId?: string;
  scheduledBillId?: string;
}

export interface StatementInitialResponse {
  future: StatementEntry[];
  past: StatementEntry[];
  hasMoreFuture: boolean;
  hasMorePast: boolean;
}

export interface StatementPageResponse {
  entries: StatementEntry[];
  hasMore: boolean;
}

export interface DayGroup {
  dateKey: string;
  dayLabel: string;
  showMonthHeader: boolean;
  monthLabel: string;
  entries: StatementEntry[];
}
