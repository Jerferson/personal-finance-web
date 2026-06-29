import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MonthlyExpensesReport, MonthlySummaryReport } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FinancialAmountPipe } from '../../shared/pipes/financial-amount.pipe';

function isoMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  return new Date(+y, +m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, FinancialAmountPipe, EmptyStateComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  private readonly reportService = inject(ReportService);
  private readonly fb = inject(FormBuilder);

  readonly monthCtrl = this.fb.control(isoMonth());
  readonly expenses  = signal<MonthlyExpensesReport | null>(null);
  readonly summary   = signal<MonthlySummaryReport | null>(null);
  readonly activeTab = signal<'expenses' | 'summary'>('expenses');

  readonly currentMonthLabel = () => monthLabel(this.monthCtrl.value ?? isoMonth());

  constructor() {
    this.loadReports(this.monthCtrl.value!);
    this.monthCtrl.valueChanges.subscribe(month => { if (month) this.loadReports(month); });
  }

  private loadReports(month: string) {
    this.expenses.set(null);
    this.summary.set(null);
    forkJoin({
      expenses: this.reportService.getMonthlyExpenses(month),
      summary:  this.reportService.getMonthlySummary(month),
    }).subscribe(({ expenses, summary }) => {
      this.expenses.set(expenses);
      this.summary.set(summary);
    });
  }

  isPositive(value: string): boolean { return parseFloat(value) >= 0; }
}
