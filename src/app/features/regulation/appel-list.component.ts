import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppelRegulation } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-appel-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="📞 Régulation médicale"
      subtitle="Gestion des appels et régulation des moyens"
      entityName="Appels"
      [data]="filtered()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucun appel"
    >
      <div grid-stats class="grid grid-4" style="margin-bottom:1.5rem">
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === ''" (click)="filterBy('')">
          <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">📞</div>
          <div class="stat-content">
            <div class="stat-value">{{ allAppels().length }}</div>
            <div class="stat-label">Total appels</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'EN_COURS'" (click)="filterBy('EN_COURS')">
          <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ countEnCours() }}</div>
            <div class="stat-label">En cours</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'RESOLU'" (click)="filterBy('RESOLU')">
          <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:#10b981">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ countResolus() }}</div>
            <div class="stat-label">Résolus</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'MOYENS'" (click)="filterBy('MOYENS')">
          <div class="stat-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">🚑</div>
          <div class="stat-content">
            <div class="stat-value">{{ countMoyens() }}</div>
            <div class="stat-label">Moyens engagés</div>
          </div>
        </div>
      </div>

      <ng-container grid-filters>
        @if (activeFilter()) {
          <span class="active-filter-banner" style="display:inline-flex; align-items:center; gap:0.5rem">
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
      padding: 0.4rem 0.75rem;
      background: rgba(99,102,241,0.06); border-radius: var(--radius-md);
      font-size: 0.85rem; color: var(--text-secondary);
    }
  `],
})
export class AppelListComponent implements OnInit {
  private http = inject(HttpClient);
  allAppels = signal<AppelRegulation[]>([]);
  activeFilter = signal('');

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  countEnCours = computed(() => this.allAppels().filter((a) => a.statut === 'EN_COURS').length);
  countResolus = computed(() => this.allAppels().filter((a) => a.statut === 'RESOLU').length);
  countMoyens = computed(() => this.allAppels().filter((a) => a.moyen_engage === 'AMBULANCE' || a.moyen_engage === 'SMUR').length);

  filtered = computed(() => {
    let data = this.allAppels();
    const f = this.activeFilter();
    if (f === 'EN_COURS') data = data.filter((a) => a.statut === 'EN_COURS');
    else if (f === 'RESOLU') data = data.filter((a) => a.statut === 'RESOLU');
    else if (f === 'MOYENS') data = data.filter((a) => a.moyen_engage === 'AMBULANCE' || a.moyen_engage === 'SMUR');
    return data;
  });

  columns: GridColumn[] = [
    { field: 'date', header: 'Date/Heure', type: 'link', valueGetter: (a) => this.formatDate(a.datetime_appel), routerLink: (a) => ['/regulation', a.appel_id], cellClass: 'text-sm' },
    { field: 'appelant', header: 'Appelant', valueGetter: (a) => `${a.type_appelant} ${a.nom_appelant ? '— ' + a.nom_appelant : ''}` },
    { field: 'motif', header: 'Motif', valueGetter: (a) => a.motif_appel, cellStyle: 'max-width:200px', cellClass: 'truncate' },
    { field: 'gravite', header: 'Gravité', type: 'badge', valueGetter: (a) => `P${a.niveau_gravite}`, badgeColor: (a) => this.getGraviteBadge(a.niveau_gravite) },
    { field: 'moyen', header: 'Moyen', type: 'badge', valueGetter: (a) => a.moyen_engage, badgeColor: () => 'badge-info' },
    { field: 'statut', header: 'Statut', type: 'badge', valueGetter: (a) => a.statut, badgeColor: (a) => this.getStatutBadge(a.statut) }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '🧭 Orientations', route: ['/regulation/orientations'], class: 'btn-outline' },
    { label: '+ Nouvel appel', route: ['/regulation/nouveau'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (a) => ['/regulation', a.appel_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<AppelRegulation[]>('/api/appels-regulation').subscribe((a) => this.allAppels.set(a));
  }

  filterBy(filter: string) {
    this.activeFilter.set(this.activeFilter() === filter ? '' : filter);
  }

  getFilterLabel(): string {
    switch (this.activeFilter()) {
      case 'EN_COURS': return 'En cours';
      case 'RESOLU': return 'Résolus';
      case 'MOYENS': return 'Moyens engagés';
      default: return 'Tous';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  getGraviteBadge(g: number): string {
    if (g >= 4) return 'badge-danger';
    if (g >= 3) return 'badge-warning';
    return 'badge-info';
  }

  getStatutBadge(s: string): string {
    switch (s) { case 'RESOLU': return 'badge-success'; case 'EN_COURS': return 'badge-warning'; case 'TRANSMIS': return 'badge-info'; default: return 'badge-neutral'; }
  }
}
