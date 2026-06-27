export interface MonthlyExpensesReport {
  month: string;
  totalExpenses: string;
  categories: {
    categoryId: string;
    categoryName: string;
    total: string;
    percentage: number;
  }[];
}

export interface MonthlySummaryReport {
  month: string;
  totalIncome: string;
  totalExpense: string;
  netAmount: string;
}
