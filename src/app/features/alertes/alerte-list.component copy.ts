import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Alerte } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-alerte-list2',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🔔 Alertes & Notifications"
      subtitle="Système de surveillance et alertes automatiques"
      entityName="Historique des alertes"
      [data]="filtered()"
      [columns]="columns"
      emptyMessage="Aucune alerte"
    >
      <div grid-stats class="grid grid-4" style="margin-bottom:1.5rem">
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'ACTIVE'" (click)="filterBy('ACTIVE')">
          <div class="stat-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">🔴</div>
          <div class="stat-content"><div class="stat-value">{{ countActive() }}</div><div class="stat-label">Actives</div></div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'N1'" (click)="filterBy('N1')">
          <div class="stat-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6">N1</div>
          <div class="stat-content"><div class="stat-value">{{ countN1() }}</div><div class="stat-label">Niveau 1</div></div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'N2'" (click)="filterBy('N2')">
          <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">N2</div>
          <div class="stat-content"><div class="stat-value">{{ countN2() }}</div><div class="stat-label">Niveau 2</div></div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'N3'" (click)="filterBy('N3')">
          <div class="stat-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">N3</div>
          <div class="stat-content"><div class="stat-value">{{ countN3() }}</div><div class="stat-label">Niveau 3</div></div>
        </div>
      </div>
      
      <ng-container grid-filters>
        @if (activeFilter()) {
          <span class="active-filter-banner">
            Filtre : <strong>{{ getFilterLabel() }}</strong>
            <button class="btn btn-sm btn-outline" (click)="filterBy('')" style="padding:0 0.5rem">✕</button>
          </span>
        }
      </ng-container>
    </app-generic-grid>
  `,
  styles: [`
    .stat-clickable { cursor: pointer; user-select: none; }
    .stat-clickable:hover { border-color: var(--accent); }
    .stat-active { border-color: var(--accent) !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.25); }
    .active-filter-banner {
      display: inline-flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0.75rem;
      background: rgba(99,102,241,0.06); border-radius: var(--radius-md);
      font-size: 0.85rem; color: var(--text-secondary);
    }
  `],
})
export class AlerteListComponent implements OnInit {
  private http = inject(HttpClient);
  alertes = signal<Alerte[]>([]);
  activeFilter = signal('');

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  countActive = computed(() => this.alertes().filter((a) => a.statut === 'ACTIVE').length);
  countN1 = computed(() => this.alertes().filter((a) => a.niveau === 1 && a.statut === 'ACTIVE').length);
  countN2 = computed(() => this.alertes().filter((a) => a.niveau === 2 && a.statut === 'ACTIVE').length);
  countN3 = computed(() => this.alertes().filter((a) => a.niveau === 3 && a.statut === 'ACTIVE').length);

  filtered = computed(() => {
    let data = this.alertes();
    const f = this.activeFilter();
    if (f === 'ACTIVE') data = data.filter((a) => a.statut === 'ACTIVE');
    else if (f === 'N1') data = data.filter((a) => a.niveau === 1 && a.statut === 'ACTIVE');
    else if (f === 'N2') data = data.filter((a) => a.niveau === 2 && a.statut === 'ACTIVE');
    else if (f === 'N3') data = data.filter((a) => a.niveau === 3 && a.statut === 'ACTIVE');
    return data;
  });

  columns: GridColumn[] = [
    { field: 'niveau', header: 'Niveau', type: 'badge', valueGetter: (a) => `Niveau ${a.niveau}`, badgeColor: (a) => this.getNiveauBadge(a.niveau) },
    { field: 'statut', header: 'Statut', type: 'badge', valueGetter: (a) => a.statut, badgeColor: (a) => this.getStatutBadge(a.statut) },
    { field: 'titre', header: 'Titre', type: 'link', valueGetter: (a) => a.titre, routerLink: (a) => ['/alertes', a.alerte_id], cellClass: 'font-semibold' },
    { field: 'message', header: 'Message', valueGetter: (a) => a.message, cellStyle: 'max-width:300px', cellClass: 'truncate' },
    { field: 'type', header: 'Type', valueGetter: (a) => `📂 ${a.type_alerte}`, cellClass: 'text-sm text-muted' },
    { field: 'date', header: 'Date', type: 'date', valueGetter: (a) => a.datetime_declenchement, cellClass: 'text-sm text-muted' },
  ];

  ngOnInit() {
    this.http.get<Alerte[]>('/api/alertes').subscribe((a) => this.alertes.set(a));
  }

  filterBy(filter: string) {
    this.activeFilter.set(this.activeFilter() === filter ? '' : filter);
  }

  getFilterLabel(): string {
    switch (this.activeFilter()) {
      case 'ACTIVE': return 'Actives';
      case 'N1': return 'Niveau 1';
      case 'N2': return 'Niveau 2';
      case 'N3': return 'Niveau 3';
      default: return 'Toutes';
    }
  }

  getNiveauBadge(n: number): string { return n >= 3 ? 'badge-danger' : n >= 2 ? 'badge-warning' : 'badge-info'; }
  getStatutBadge(s: string): string { return s === 'ACTIVE' ? 'badge-danger' : s === 'RESOLUE' ? 'badge-success' : 'badge-neutral'; }
}
