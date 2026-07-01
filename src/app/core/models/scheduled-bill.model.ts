import { TransactionType } from './transaction.model';

export type ScheduledBillStatus = 'SCHEDULED' | 'POSTED';

export interface ScheduledBill {
  id: string;
  accountId: string;
  categoryId: string;
  projectId?: string;
  transactionId?: string;
  type: TransactionType;
  amount: string;
  description: string;
  dueDate: string;
  status: ScheduledBillStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledBillDto {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  dueDate: string;
  description: string;
  projectId?: string;
}

export type UpdateScheduledBillDto = Partial<CreateScheduledBillDto>;

export interface QueryScheduledBillParams {
  accountId?: string;
  categoryId?: string;
  projectId?: string;
  type?: TransactionType;
  status?: ScheduledBillStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
