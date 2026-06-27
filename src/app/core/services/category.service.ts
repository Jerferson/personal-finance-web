import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, limit = 100): Observable<PaginatedResponse<Category>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<Category>>('/categories', { params });
  }

  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`/categories/${id}`);
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>('/categories', dto);
  }

  update(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return this.http.patch<Category>(`/categories/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/categories/${id}`);
  }
}
