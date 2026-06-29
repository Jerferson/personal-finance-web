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
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
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
