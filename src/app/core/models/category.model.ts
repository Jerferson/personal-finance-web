export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: CategoryType;
}
