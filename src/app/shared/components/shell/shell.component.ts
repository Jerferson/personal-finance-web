import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoadingComponent } from '../loading/loading.component';
import { ToastContainerComponent } from '../toast/toast-container.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingComponent, ToastContainerComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'bi-speedometer2',    route: '/dashboard' },
    { label: 'Extrato',        icon: 'bi-list-check',      route: '/extrato' },
    { label: 'Reports',        icon: 'bi-bar-chart',       route: '/reports' },
    { label: 'Accounts',       icon: 'bi-bank',            route: '/accounts' },
    { label: 'Categories',     icon: 'bi-tag',             route: '/categories' },
    { label: 'Projects',       icon: 'bi-folder',          route: '/projects' },
    { label: 'Transactions',   icon: 'bi-receipt',         route: '/transactions' },
    { label: 'Scheduled Bills',icon: 'bi-calendar-check',  route: '/scheduled-bills' },
    { label: 'Transfers',      icon: 'bi-arrow-left-right',route: '/transfers' },
  ];
}
