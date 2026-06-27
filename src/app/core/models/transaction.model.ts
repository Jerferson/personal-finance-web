import { CategoryType } from './category.model';

export type TransactionType = CategoryType;
export type TransactionStatus = 'POSTED' | 'VOIDED';

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  projectId?: string;
  journalEntryId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  description: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  transactionDate: string;
  description: string;
  projectId?: string;
}

export interface UpdateTransactionDto {
  description?: string;
  projectId?: string | null;
}

export interface QueryTransactionParams {
  accountId?: string;
  categoryId?: string;
  projectId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
