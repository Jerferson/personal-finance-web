import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { CreateProjectDto, Project, UpdateProjectDto } from '../../core/models/project.model';
import { ProjectService } from '../../core/services/project.service';

export interface ProjectFormDialogData {
  project?: Project;
}

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './project-form-dialog.component.html',
  styleUrl: './project-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<ProjectFormDialogData>(DIALOG_DATA);
  private readonly projectService = inject(ProjectService);

  readonly isEdit = !!this.data.project;
  readonly submitting = signal(false);

  readonly fg = this.fb.group({
    name:        [this.data.project?.name ?? '',        [Validators.required, Validators.maxLength(100)]],
    description: [this.data.project?.description ?? ''],
    startDate:   [this.data.project?.startDate ?? ''],
    endDate:     [this.data.project?.endDate ?? ''],
  });

  submit() {
    if (this.fg.invalid || this.submitting()) return;
    this.submitting.set(true);
    const v = this.fg.getRawValue();
    const dto: CreateProjectDto = {
      name: v.name!,
      ...(v.description ? { description: v.description } : {}),
      ...(v.startDate    ? { startDate: v.startDate }    : {}),
      ...(v.endDate      ? { endDate: v.endDate }        : {}),
    };
    const obs = this.isEdit
      ? this.projectService.update(this.data.project!.id, dto satisfies UpdateProjectDto)
      : this.projectService.create(dto);

    obs.subscribe({
      next: () => { this.submitting.set(false); this.dialogRef.close(true); },
      error: () => this.submitting.set(false),
    });
  }
}
