export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: string;
  ledgerAccountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountBalance {
  accountId: string;
  accountName: string;
  date: string;
  initialBalance: string;
  totalDebits: string;
  totalCredits: string;
  balance: string;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  initialBalance?: number;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  initialBalance?: number;
}
