import { Component, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { BreadcrumbComponent } from '../shared/breadcrumb.component';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  children?: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Sidebar -->
    <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🏥</span>
          @if (!sidebarCollapsed()) {
            <div class="logo-text">
              <span class="logo-title">SGI</span>
              <span class="logo-sub">OMC 2026</span>
            </div>
          }
        </div>
        <button class="btn-icon toggle-btn" (click)="toggleSidebar()">
          {{ sidebarCollapsed() ? '☰' : '✕' }}
        </button>
      </div>

      <nav class="sidebar-nav">
        @for (item of visibleNav(); track item.route) {
          @if (item.children) {
            <!-- Parent with children -->
            <div class="nav-group" [class.open]="isGroupOpen(item.route)">
              <a class="nav-item nav-parent"
                 [routerLink]="item.route"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: true}"
                 [title]="item.label"
                 (click)="toggleGroup($event, item.route)">
                <span class="nav-icon">{{ item.icon }}</span>
                @if (!sidebarCollapsed()) {
                  <span class="nav-label">{{ item.label }}</span>
                  <span class="nav-chevron">{{ isGroupOpen(item.route) ? '▾' : '›' }}</span>
                }
              </a>
              @if (isGroupOpen(item.route) && !sidebarCollapsed()) {
                <div class="nav-children">
                  @for (child of item.children; track child.route) {
                    <a class="nav-item nav-child"
                       [routerLink]="child.route"
                       routerLinkActive="active"
                       [routerLinkActiveOptions]="{exact: true}"
                       [title]="child.label">
                      <span class="nav-icon">{{ child.icon }}</span>
                      <span class="nav-label">{{ child.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          } @else {
            <!-- Regular nav item -->
            <a class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="active"
               [title]="item.label">
              <span class="nav-icon">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          }
        }
      </nav>

      <div class="sidebar-footer">
        @if (!sidebarCollapsed()) {
          <div class="user-info">
            <div class="user-avatar">{{ auth.userName().charAt(0) }}</div>
            <div class="user-details">
              <span class="user-name">{{ auth.userName() }}</span>
              <span class="user-role">{{ auth.roleLabel() }}</span>
            </div>
          </div>
        }
        <div class="flex gap-1">
          <a routerLink="/mot-de-passe" class="btn-icon" title="Changer le mot de passe" style="font-size:1rem">🔒</a>
          <button class="btn-icon logout-btn" (click)="auth.logout()" title="Déconnexion">
            🚪
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile overlay -->
    @if (mobileOpen()) {
      <div class="mobile-overlay" (click)="mobileOpen.set(false)"></div>
    }

    <!-- Main content -->
    <main class="main-content" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Top header -->
      <header class="top-header">
        <button class="btn-icon mobile-toggle" (click)="mobileOpen.set(!mobileOpen())">☰</button>
        <h2 class="page-title">Couverture Sanitaire OMC</h2>
        <div class="header-actions">
          <span class="badge badge-info">Offline ✓</span>
          <span class="header-date">{{ today }}</span>
        </div>
      </header>

      <div class="content-area">
        <app-breadcrumb />
        <router-outlet />
      </div>
    </main>
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; }

    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-sidebar);
      color: var(--text-sidebar);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 100;
      transition: width 0.25s ease;
      overflow: hidden;
      &.collapsed { width: var(--sidebar-collapsed); }
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      .logo-icon { font-size: 1.6rem; }
      .logo-text { display: flex; flex-direction: column; }
      .logo-title { font-size: 1.1rem; font-weight: 700; color: #fff; letter-spacing: 1px; }
      .logo-sub { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; }
    }

    .toggle-btn { color: var(--text-sidebar); }

    .sidebar-nav {
      flex: 1;
      padding: 0.5rem;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      color: var(--text-sidebar);
      transition: all 0.2s;
      margin-bottom: 2px;
      text-decoration: none;
      cursor: pointer;
      &:hover { background: var(--bg-sidebar-hover); color: #fff; }
      &.active {
        background: var(--bg-sidebar-active);
        color: var(--text-sidebar-active);
        font-weight: 600;
      }
    }
    .nav-icon { font-size: 1.15rem; min-width: 24px; text-align: center; }
    .nav-label { font-size: 0.875rem; white-space: nowrap; flex: 1; }

    /* Collapsible admin group */
    .nav-parent { position: relative; }
    .nav-chevron {
      font-size: 0.75rem;
      color: var(--text-muted);
      transition: transform 0.2s;
    }
    .nav-children {
      padding-left: 0.5rem;
      margin-top: 2px;
      animation: slideDown 0.2s ease;
    }
    .nav-child {
      padding: 0.5rem 0.85rem 0.5rem 1rem;
      font-size: 0.82rem;
      .nav-icon { font-size: 0.95rem; }
    }
    @keyframes slideDown {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 400px; }
    }

    .sidebar-footer {
      padding: 0.75rem 1rem;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
    }
    .user-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .user-name { font-size: 0.8rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 0.7rem; color: var(--text-muted); }

    .logout-btn { color: var(--text-sidebar); &:hover { color: var(--danger); } }

    .mobile-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 99;
      display: none;
    }

    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      transition: margin-left 0.25s ease;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      &.sidebar-collapsed { margin-left: var(--sidebar-collapsed); }
    }

    .top-header {
      height: var(--header-height);
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      gap: 1rem;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .page-title { font-size: 1rem; font-weight: 600; flex: 1; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .header-date { font-size: 0.8rem; color: var(--text-muted); }
    .mobile-toggle { display: none; }

    .content-area { flex: 1; padding: 1.5rem; }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        &.collapsed { transform: translateX(-100%); }
      }
      .mobile-overlay { display: block; }
      .main-content, .main-content.sidebar-collapsed { margin-left: 0; }
      .mobile-toggle { display: flex; }
    }
  `],
})
export class ShellComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  sidebarCollapsed = signal(false);
  mobileOpen = signal(false);
  openGroups = signal<Record<string, boolean>>({});

  today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  private adminChildren: NavItem[] = [
    { label: 'Utilisateurs', icon: '👥', route: '/admin/utilisateurs' },
    { label: 'Vaccinations', icon: '💉', route: '/admin/vaccinations' },
    { label: 'Sites', icon: '🏥', route: '/admin/sites' },
    { label: 'Catégories Lits', icon: '🗂️', route: '/admin/categories-lits' },
    { label: 'Lits FOSA', icon: '🛏️', route: '/admin/lits' },
    { label: 'Catalogue', icon: '📦', route: '/admin/catalogue' },
    { label: 'Règles d\'alerte', icon: '⚠️', route: '/admin/alertes-config' },
    { label: 'Rôles & Permissions', icon: '🛡️', route: '/admin/roles' },
    { label: 'Journal d\'Audit', icon: '📋', route: '/admin/audit' },
  ];

  private fosaChildren: NavItem[] = [
    { label: 'Admissions', icon: '📥', route: '/fosa/admissions' },
    { label: 'Plan des lits', icon: '🛏️', route: '/fosa/lits' },
    { label: 'Laboratoire', icon: '🔬', route: '/fosa/laboratoire' },
  ];

  private allNav: NavItem[] = [
    { label: 'Tableau de bord', icon: '📊', route: '/dashboard' },
    { label: 'Criblage PSF', icon: '🛫', route: '/psf', roles: ['ADMIN', 'DATA', 'OPERATEUR'] },
    { label: 'Consultations PMA', icon: '🩺', route: '/pma', roles: ['ADMIN', 'DATA', 'OPERATEUR'] },
    { label: 'Régulation', icon: '📞', route: '/regulation', roles: ['ADMIN', 'DATA', 'REG'] },
    { label: 'Soins FOSA', icon: '🏥', route: '/fosa', roles: ['ADMIN', 'DATA', 'OPERATEUR'], children: this.fosaChildren },
    { label: 'Stocks', icon: '📦', route: '/stocks', roles: ['ADMIN', 'DATA', 'OPERATEUR'] },
    { label: 'Alertes', icon: '🔔', route: '/alertes' },
    { label: 'Administration', icon: '⚙️', route: '/admin', roles: ['ADMIN'], children: this.adminChildren },
  ];

  visibleNav = signal<NavItem[]>([]);

  constructor() {
    const code = this.auth.roleCode();
    this.visibleNav.set(
      this.allNav.filter(
        (item) => !item.roles || item.roles.includes(code) || code === 'ADMIN'
      )
    );

    // Auto-open groups if current URL is under a parent group
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.checkAutoExpand((e as NavigationEnd).urlAfterRedirects);
    });

    // Also check initial URL
    this.checkAutoExpand(this.router.url);
  }

  private checkAutoExpand(url: string) {
    const groups = { ...this.openGroups() };
    if (url.startsWith('/admin')) groups['/admin'] = true;
    if (url.startsWith('/fosa')) groups['/fosa'] = true;
    this.openGroups.set(groups);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  isGroupOpen(route: string): boolean {
    return !!this.openGroups()[route];
  }

  toggleGroup(event: Event, route: string) {
    if (this.sidebarCollapsed()) return;
    this.openGroups.update((groups) => ({
      ...groups,
      [route]: !groups[route]
    }));
  }
}
