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
  templateUrl: './transaction-edit-dialog.component.html',
  styleUrl: './transaction-edit-dialog.component.scss',
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
