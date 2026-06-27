export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalIncome: string;
  totalExpense: string;
  netAmount: string;
  expensesByCategory: {
    categoryId: string;
    categoryName: string;
    total: string;
  }[];
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export type UpdateProjectDto = Partial<CreateProjectDto>;
