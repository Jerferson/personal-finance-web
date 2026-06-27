import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Project } from '../../core/models/project.model';
import { ProjectService } from '../../core/services/project.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ProjectFormDialogComponent, ProjectFormDialogData } from './project-form-dialog.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent],
  template: `
    <div class="cc-page">
      <div class="cc-row">
        <h2 class="cc-grow" style="margin:0">Projects</h2>
        <button class="btn btn-primary btn-sm" (click)="openForm()">
          <i class="bi bi-plus-lg"></i> New Project
        </button>
      </div>

      <div class="cc-card" style="padding:0; overflow:hidden">
        @if (projects().length === 0) {
          <app-empty-state icon="bi-folder" title="No projects yet"
            subtitle="Track expenses by project to see spending breakdowns" />
        } @else {
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start</th>
                  <th>End</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (row of projects(); track row.id) {
                  <tr>
                    <td>
                      <span class="project-name">{{ row.name }}</span>
                      @if (row.description) {
                        <span class="project-desc">{{ row.description }}</span>
                      }
                    </td>
                    <td>{{ row.startDate ? (row.startDate | date:'mediumDate') : '—' }}</td>
                    <td>
                      @if (row.endDate) {
                        {{ row.endDate | date:'mediumDate' }}
                      } @else {
                        <span class="ongoing">Ongoing</span>
                      }
                    </td>
                    <td class="actions-cell">
                      <button class="btn btn-sm btn-outline-secondary" title="Edit" (click)="openForm(row)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" title="Delete" (click)="delete(row)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .project-name { display: block; font-weight: 500; }
    .project-desc { display: block; font-size: 12px; color: var(--cc-muted); margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
    .ongoing { color: var(--cc-success); font-weight: 500; font-size: 13px; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; padding: 6px 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);

  readonly projects = signal<Project[]>([]);

  constructor() { this.load(); }

  private load() {
    this.projectService.getAll(1, 100).subscribe(res => this.projects.set(res.data));
  }

  openForm(project?: Project) {
    const ref = this.dialog.open<boolean, ProjectFormDialogData>(
      ProjectFormDialogComponent,
      { data: { project }, width: '440px' },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) { this.load(); this.notify.success(project ? 'Project updated' : 'Project created'); }
    });
  }

  delete(project: Project) {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete Project',
          message: `Delete "${project.name}"? This cannot be undone.`,
          confirmLabel: 'Delete',
        },
        width: '380px',
      },
    );
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.projectService.delete(project.id).subscribe(() => {
          this.notify.success('Project deleted');
          this.load();
        });
      }
    });
  }
}
