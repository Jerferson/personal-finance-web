export interface AccountProjection {
  accountId: string;
  accountName: string;
  currentBalance: string;
  scheduledIncome: string;
  scheduledExpenses: string;
  projectedBalance: string;
}

export interface BudgetProjection {
  until: string;
  currentBalance: string;
  scheduledIncome: string;
  scheduledExpenses: string;
  projectedBalance: string;
  accounts: AccountProjection[];
}

export interface MonthlyProjection {
  month: string;
  startingBalance: string;
  scheduledIncome: string;
  scheduledExpenses: string;
  projectedEndBalance: string;
}

export interface CashflowProjection {
  currentBalance: string;
  months: MonthlyProjection[];
}
