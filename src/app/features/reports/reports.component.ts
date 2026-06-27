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
  template: `
    <div class="cc-page">
      <div class="cc-row">
        <h2 class="cc-grow" style="margin:0">Reports</h2>
        <div style="width:200px">
          <input class="form-control form-control-sm" type="month" [formControl]="monthCtrl" />
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'expenses'"
            (click)="activeTab.set('expenses')">
            <i class="bi bi-bar-chart me-1"></i> Monthly Expenses
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'summary'"
            (click)="activeTab.set('summary')">
            <i class="bi bi-clipboard-data me-1"></i> Monthly Summary
          </button>
        </li>
      </ul>

      <!-- Tab: Monthly Expenses -->
      @if (activeTab() === 'expenses') {
        <div>
          @if (expenses(); as e) {
            @if (e.categories.length === 0) {
              <app-empty-state icon="bi-bar-chart" title="No expense data"
                subtitle="No posted expenses found for {{ currentMonthLabel() }}" />
            } @else {
              <div class="cc-card summary-card">
                <p class="cc-section-title">Total Expenses</p>
                <p class="summary-amount cc-amount-expense">{{ e.totalExpenses | financialAmount }}</p>
              </div>

              <div class="cc-card" style="padding:0; overflow:hidden">
                <div class="table-responsive">
                  <table class="cat-table">
                    <thead>
                      <tr>
                        <th class="col-name">Category</th>
                        <th class="col-bar"></th>
                        <th class="col-pct">%</th>
                        <th class="col-amount">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (cat of e.categories; track cat.categoryId) {
                        <tr>
                          <td class="col-name">{{ cat.categoryName }}</td>
                          <td class="col-bar">
                            <div class="pct-track">
                              <div class="pct-fill" [style.width.%]="cat.percentage"></div>
                            </div>
                          </td>
                          <td class="col-pct">{{ cat.percentage | number:'1.1-1' }}%</td>
                          <td class="col-amount cc-amount cc-amount-expense">
                            {{ cat.total | financialAmount }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          } @else {
            <app-empty-state icon="bi-bar-chart" title="No data"
              subtitle="Select a month to view expenses" />
          }
        </div>
      }

      <!-- Tab: Monthly Summary -->
      @if (activeTab() === 'summary') {
        <div>
          @if (summary(); as s) {
            <div class="metrics-grid">
              <div class="cc-card metric-card">
                <p class="metric-label">Income</p>
                <p class="metric-value cc-amount-income">{{ s.totalIncome | financialAmount }}</p>
              </div>
              <div class="cc-card metric-card">
                <p class="metric-label">Expenses</p>
                <p class="metric-value cc-amount-expense">{{ s.totalExpense | financialAmount }}</p>
              </div>
              <div class="cc-card metric-card">
                <p class="metric-label">Net</p>
                <p class="metric-value"
                  [class.cc-amount-income]="isPositive(s.netAmount)"
                  [class.cc-amount-expense]="!isPositive(s.netAmount)">
                  {{ s.netAmount | financialAmount }}
                </p>
              </div>
            </div>

            @if (expenses(); as e) {
              @if (e.categories.length > 0) {
                <div class="cc-card">
                  <p class="cc-section-title">Expenses by category</p>
                  <div class="cat-summary-list">
                    @for (cat of e.categories; track cat.categoryId) {
                      <div class="cat-summary-row">
                        <span class="cat-summary-name">{{ cat.categoryName }}</span>
                        <span class="cc-amount cc-amount-expense">{{ cat.total | financialAmount }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          } @else {
            <app-empty-state icon="bi-clipboard-data" title="No data"
              subtitle="Select a month to view the summary" />
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .summary-card { display: flex; flex-direction: column; gap: 4px; }
    .summary-amount { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

    .cat-table { width: 100%; border-collapse: collapse; }
    .cat-table thead tr { border-bottom: 1px solid var(--cc-border); }
    .cat-table th, .cat-table td { padding: 10px 16px; text-align: left; font-size: 14px; }
    .cat-table th { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--cc-muted); }
    .cat-table tbody tr:not(:last-child) { border-bottom: 1px solid var(--cc-border); }
    .cat-table tbody tr:hover { background: rgba(0,0,0,.02); }

    .col-name   { min-width: 140px; }
    .col-bar    { width: 100%; }
    .col-pct    { min-width: 52px; text-align: right; color: var(--cc-muted); font-size: 12px; white-space: nowrap; }
    .col-amount { min-width: 100px; text-align: right; white-space: nowrap; }

    .pct-track { height: 6px; background: var(--cc-danger-soft); border-radius: 99px; overflow: hidden; }
    .pct-fill  { height: 100%; background: var(--cc-danger); border-radius: 99px; transition: width .3s; }

    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr; } }

    .metric-card { text-align: center; }
    .metric-label { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--cc-muted); }
    .metric-value { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

    .cat-summary-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .cat-summary-row  { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
    .cat-summary-name { color: var(--cc-text); }
  `],
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
