import { Pipe, PipeTransform } from '@angular/core';

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

@Pipe({ name: 'financialAmount', standalone: true })
export class FinancialAmountPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return formatter.format(0);
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? formatter.format(0) : formatter.format(num);
  }
}
