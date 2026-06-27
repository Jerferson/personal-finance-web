import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

@Component({
  selector: 'app-bs-paginator',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="d-flex align-items-center justify-content-between py-2 px-3 border-top">
      <div class="d-flex align-items-center gap-2 text-muted small">
        <span>Rows per page:</span>
        <select class="form-select form-select-sm" style="width:72px"
          [ngModel]="pageSize()"
          (ngModelChange)="onSizeChange($event)">
          @for (opt of pageSizeOptions(); track opt) {
            <option [value]="opt">{{ opt }}</option>
          }
        </select>
        <span>{{ rangeLabel() }}</span>
      </div>

      <nav aria-label="Pagination">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="pageIndex() === 0">
            <button class="page-link" (click)="prev()" [disabled]="pageIndex() === 0">
              <i class="bi bi-chevron-left"></i>
            </button>
          </li>
          @for (p of pageNumbers(); track $index) {
            @if (p === -1) {
              <li class="page-item disabled"><span class="page-link">…</span></li>
            } @else {
              <li class="page-item" [class.active]="p === pageIndex()">
                <button class="page-link" (click)="goTo(p)">{{ p + 1 }}</button>
              </li>
            }
          }
          <li class="page-item" [class.disabled]="pageIndex() >= totalPages() - 1">
            <button class="page-link" (click)="next()" [disabled]="pageIndex() >= totalPages() - 1">
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BsPaginatorComponent {
  length = input<number>(0);
  pageSize = input<number>(10);
  pageIndex = input<number>(0);
  pageSizeOptions = input<number[]>([10, 20, 50]);
  page = output<PageEvent>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.length() / this.pageSize())));

  readonly rangeLabel = computed(() => {
    const start = this.pageIndex() * this.pageSize() + 1;
    const end = Math.min(start + this.pageSize() - 1, this.length());
    return `${start}–${end} of ${this.length()}`;
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur = this.pageIndex();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages: number[] = [0];
    if (cur > 2) pages.push(-1);
    for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i);
    if (cur < total - 3) pages.push(-1);
    pages.push(total - 1);
    return pages;
  });

  prev(): void { if (this.pageIndex() > 0) this.emit(this.pageIndex() - 1); }
  next(): void { if (this.pageIndex() < this.totalPages() - 1) this.emit(this.pageIndex() + 1); }
  goTo(p: number): void { this.emit(p); }

  onSizeChange(size: number): void {
    this.page.emit({ pageIndex: 0, pageSize: +size, length: this.length() });
  }

  private emit(pageIndex: number): void {
    this.page.emit({ pageIndex, pageSize: this.pageSize(), length: this.length() });
  }
}
