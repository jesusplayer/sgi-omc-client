import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface AdminCard {
  icon: string;
  label: string;
  description: string;
  route: string;
  count: number;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-admin-hub',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>⚙️ Administration</h1>
        <p>Gestion des paramètres et référentiels du système</p>
      </div>
    </div>

    <div class="admin-grid">
      @for (card of cards(); track card.route) {
        <a [routerLink]="card.route" class="admin-card">
          <div class="admin-card-icon" [style.background]="card.bgColor" [style.color]="card.color">
            {{ card.icon }}
          </div>
          <div class="admin-card-body">
            <h3>{{ card.label }}</h3>
            <p>{{ card.description }}</p>
          </div>
          <div class="admin-card-count" [style.color]="card.color">{{ card.count }}</div>
          <div class="admin-card-arrow">→</div>
        </a>
      }
    </div>
  `,
  styles: [`
    .admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }
    .admin-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }
    .admin-card:hover {
      border-color: var(--accent);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .admin-card-icon {
      width: 52px; height: 52px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .admin-card-body {
      flex: 1; min-width: 0;
      h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.15rem; }
      p { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
    }
    .admin-card-count {
      font-size: 1.5rem;
      font-weight: 700;
      min-width: 30px;
      text-align: center;
    }
    .admin-card-arrow {
      color: var(--text-muted);
      font-size: 1.2rem;
      transition: transform 0.2s;
    }
    .admin-card:hover .admin-card-arrow {
      transform: translateX(4px);
      color: var(--accent);
    }
  `],
})
export class AdminHubComponent implements OnInit {
  private http = inject(HttpClient);
  cards = signal<AdminCard[]>([
    {
      icon: '👥', label: 'Utilisateurs', description: 'Gestion des comptes et rôles',
      route: '/admin/utilisateurs', count: 0, color: '#6366f1', bgColor: 'rgba(99,102,241,0.1)',
    },
    {
      icon: '💉', label: 'Vaccinations', description: 'Référentiel des vaccinations PSF',
      route: '/admin/vaccinations', count: 0, color: '#10b981', bgColor: 'rgba(16,185,129,0.1)',
    },
    {
      icon: '🏥', label: 'Sites', description: 'Référentiel des sites physiques',
      route: '/admin/sites', count: 0, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)',
    },
    {
      icon: '🗂️', label: 'Catégories Lits', description: 'Types de lits FOSA',
      route: '/admin/categories-lits', count: 0, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)',
    },
    {
      icon: '🛏️', label: 'Lits FOSA', description: 'Inventaire des lits',
      route: '/admin/lits', count: 0, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)',
    },
    {
      icon: '📦', label: 'Catalogue Produits', description: 'Médicaments & Consommables',
      route: '/admin/catalogue', count: 0, color: '#10b981', bgColor: 'rgba(16,185,129,0.1)',
    },
    {
      icon: '⚠️', label: 'Règles d\'alerte', description: 'Configuration des seuils et notifications',
      route: '/admin/alertes-config', count: 0, color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)',
    },
    {
      icon: '🛡️', label: 'Rôles', description: 'Niveaux d\'accès et permissions',
      route: '/admin/roles', count: 0, color: '#f97316', bgColor: 'rgba(249,115,22,0.1)',
    },
    {
      icon: '📋', label: 'Journal d\'Audit', description: 'Traçabilité des actions utilisateurs',
      route: '/admin/audit', count: 0, color: '#64748b', bgColor: 'rgba(100,116,139,0.1)',
    },
  ]);

  ngOnInit() {
    this.http.get<any[]>('/api/utilisateurs').subscribe((u) => {
      this.updateCount('utilisateurs', u.length);
    });
    this.http.get<any[]>('/api/vaccinations').subscribe((v) => {
      this.updateCount('vaccinations', v.length);
    });
    this.http.get<any[]>('/api/sites').subscribe((s) => {
      this.updateCount('sites', s.length);
    });
    this.http.get<any[]>('/api/categories-lits').subscribe((c) => {
      this.updateCount('categories-lits', c.length);
    });
    this.http.get<any[]>('/api/lits').subscribe((l) => {
      this.updateCount('lits', l.length);
    });
    this.http.get<any[]>('/api/configurations-alerte').subscribe((c) => {
      this.updateCount('alertes-config', c.length);
    });
    this.http.get<any[]>('/api/catalogue-produits').subscribe((c) => {
      this.updateCount('catalogue', c.length);
    });
    this.http.get<any[]>('/api/roles').subscribe((r) => {
      this.updateCount('roles', r.length);
    });
    this.http.get<any[]>('/api/audit-logs').subscribe((a) => {
      this.updateCount('audit', a.length);
    });
  }

  private updateCount(routeFragment: string, count: number) {
    this.cards.update((c) => c.map((card) =>
      card.route.endsWith(routeFragment) ? { ...card, count } : card
    ));
  }
}
