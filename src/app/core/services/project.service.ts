import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Project, ProjectSummary, CreateProjectDto, UpdateProjectDto } from '../models/project.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, limit = 20): Observable<PaginatedResponse<Project>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<Project>>('/projects', { params });
  }

  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`/projects/${id}`);
  }

  getSummary(id: string): Observable<ProjectSummary> {
    return this.http.get<ProjectSummary>(`/projects/${id}/summary`);
  }

  create(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>('/projects', dto);
  }

  update(id: string, dto: UpdateProjectDto): Observable<Project> {
    return this.http.patch<Project>(`/projects/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/projects/${id}`);
  }
}
