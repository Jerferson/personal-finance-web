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
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ isEdit ? 'Edit Project' : 'New Project' }}</h5>
      <button type="button" class="btn-close" (click)="dialogRef.close(false)"></button>
    </div>

    <div class="modal-body">
      <form [formGroup]="fg" (ngSubmit)="submit()">
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input class="form-control" formControlName="name" autocomplete="off"
            [class.is-invalid]="fg.controls.name.invalid && fg.controls.name.touched" />
          <div class="invalid-feedback">Name is required</div>
        </div>

        <div class="mb-3">
          <label class="form-label">Description</label>
          <textarea class="form-control" formControlName="description" rows="3"></textarea>
        </div>

        <div class="row g-2">
          <div class="col-6">
            <label class="form-label">Start Date</label>
            <input class="form-control" type="date" formControlName="startDate" />
          </div>
          <div class="col-6">
            <label class="form-label">End Date</label>
            <input class="form-control" type="date" formControlName="endDate" />
          </div>
        </div>
      </form>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">Cancel</button>
      <button type="button" class="btn btn-primary" [disabled]="fg.invalid || submitting()" (click)="submit()">
        @if (submitting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
        {{ isEdit ? 'Save' : 'Create' }}
      </button>
    </div>
  `,
  styles: [`.modal-body { min-width: 380px; }`],
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
