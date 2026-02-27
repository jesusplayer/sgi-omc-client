import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Orientation } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-orientation-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🚑 Orientations & Transferts"
      subtitle="Gestion des orientations de patients vers les FOSA"
      entityName="Orientations"
      [data]="filtered()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucune orientation"
    >
      <div grid-stats class="grid grid-4" style="margin-bottom:1.5rem">
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === ''" (click)="filterBy('')">
          <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">🚑</div>
          <div class="stat-content">
            <div class="stat-value">{{ allOrientations().length }}</div>
            <div class="stat-label">Total orientations</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'EN_ATTENTE'" (click)="filterBy('EN_ATTENTE')">
          <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ countEnAttente() }}</div>
            <div class="stat-label">En attente</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'EN_COURS'" (click)="filterBy('EN_COURS')">
          <div class="stat-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6">🚐</div>
          <div class="stat-content">
            <div class="stat-value">{{ countEnCours() }}</div>
            <div class="stat-label">En cours</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'ARRIVE'" (click)="filterBy('ARRIVE')">
          <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:#10b981">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ countArrives() }}</div>
            <div class="stat-label">Arrivés</div>
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
export class OrientationListComponent implements OnInit {
  private http = inject(HttpClient);

  allOrientations = signal<Orientation[]>([]);
  activeFilter = signal('');

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  countEnAttente = computed(() => this.allOrientations().filter(o => o.statut === 'EN_ATTENTE').length);
  countEnCours = computed(() => this.allOrientations().filter(o => o.statut === 'EN_COURS').length);
  countArrives = computed(() => this.allOrientations().filter(o => o.statut === 'ARRIVE').length);

  filtered = computed(() => {
    let data = this.allOrientations();
    const f = this.activeFilter();
    if (f) data = data.filter((o) => o.statut === f);
    return data;
  });

  columns: GridColumn[] = [
    { field: 'date', header: 'Date/Heure', type: 'link', valueGetter: (o) => this.formatDate(o.heure_decision), routerLink: (o) => ['/regulation/orientations', o.orientation_id], cellClass: 'text-sm' },
    { field: 'fosa', header: 'FOSA Dest.', valueGetter: (o) => o.fosa_destination_id, cellClass: 'font-medium' },
    { field: 'moyen', header: 'Moyen transport', type: 'badge', valueGetter: (o) => o.moyen_transport, badgeColor: () => 'badge-info' },
    { field: 'etat', header: 'État Départ', type: 'badge', valueGetter: (o) => o.etat_patient_depart, badgeColor: (o) => this.getEtatBadge(o.etat_patient_depart) },
    { field: 'statut', header: 'Statut', type: 'badge', valueGetter: (o) => o.statut, badgeColor: (o) => this.getStatutBadge(o.statut) }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouvelle orientation', route: ['/regulation/orientations/nouvelle'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (o) => ['/regulation/orientations', o.orientation_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<Orientation[]>('/api/orientations').subscribe((res) => {
      this.allOrientations.set(res);
    });
  }

  filterBy(filter: string) {
    this.activeFilter.set(this.activeFilter() === filter ? '' : filter);
  }

  getFilterLabel(): string {
    switch (this.activeFilter()) {
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_COURS': return 'En cours (Transit)';
      case 'ARRIVE': return 'Arrivés';
      default: return 'Toutes';
    }
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  getEtatBadge(e: string): string {
    switch (e) {
      case 'STABLE': return 'badge-success';
      case 'GRAVE': return 'badge-warning';
      case 'CRITIQUE':
      case 'INCONSCIENT': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }

  getStatutBadge(s: string): string {
    switch (s) {
      case 'ARRIVE': return 'badge-success';
      case 'EN_COURS': return 'badge-info';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'REFUSE':
      case 'ANNULE':
      case 'DECES_TRANSIT': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }
}
