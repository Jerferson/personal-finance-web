import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { Project } from '../../core/models/project.model';
import { Transaction, UpdateTransactionDto } from '../../core/models/transaction.model';
import { ProjectService } from '../../core/services/project.service';
import { TransactionService } from '../../core/services/transaction.service';

export interface TransactionEditDialogData {
  transaction: Transaction;
}

@Component({
  selector: 'app-transaction-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Edit Transaction</h5>
      <button type="button" class="btn-close" (click)="dialogRef.close(false)"></button>
    </div>

    <div class="modal-body">
      <form [formGroup]="fg" (ngSubmit)="submit()">
        <div class="mb-3">
          <label class="form-label">Description</label>
          <input class="form-control" formControlName="description" autocomplete="off"
            [class.is-invalid]="fg.controls.description.invalid && fg.controls.description.touched" />
          <div class="invalid-feedback">Description is required</div>
        </div>

        <div class="mb-2">
          <label class="form-label">Project <span class="text-muted">(optional)</span></label>
          <select class="form-select" formControlName="projectId">
            <option value="">— None —</option>
            @for (p of projects(); track p.id) {
              <option [value]="p.id">{{ p.name }}</option>
            }
          </select>
        </div>
      </form>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">Cancel</button>
      <button type="button" class="btn btn-primary" [disabled]="fg.invalid || submitting()" (click)="submit()">
        @if (submitting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
        Save
      </button>
    </div>
  `,
  styles: [`.modal-body { min-width: 360px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<TransactionEditDialogData>(DIALOG_DATA);
  private readonly transactionService = inject(TransactionService);
  private readonly projectService = inject(ProjectService);

  readonly submitting = signal(false);
  readonly projects = signal<Project[]>([]);

  readonly fg = this.fb.group({
    description: [this.data.transaction.description, [Validators.required]],
    projectId:   [this.data.transaction.projectId ?? ''],
  });

  constructor() {
    this.projectService.getAll(1, 100).subscribe(res => this.projects.set(res.data));
  }

  submit() {
    if (this.fg.invalid || this.submitting()) return;
    this.submitting.set(true);
    const v = this.fg.getRawValue();
    const dto: UpdateTransactionDto = { description: v.description!, projectId: v.projectId || null };

    this.transactionService.update(this.data.transaction.id, dto).subscribe({
      next: () => { this.submitting.set(false); this.dialogRef.close(true); },
      error: () => this.submitting.set(false),
    });
  }
}
