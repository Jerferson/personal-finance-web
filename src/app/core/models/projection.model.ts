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
