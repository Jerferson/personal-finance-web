import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <i class="bi {{ icon() }} empty-icon"></i>
      <p class="empty-title">{{ title() }}</p>
      @if (subtitle()) {
        <p class="empty-subtitle">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: var(--cc-muted);
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.35;
    }
    .empty-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 8px;
      color: var(--cc-text);
    }
    .empty-subtitle { font-size: 14px; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  icon = input<string>('bi-inbox');
  title = input<string>('No items found');
  subtitle = input<string>('');
}
