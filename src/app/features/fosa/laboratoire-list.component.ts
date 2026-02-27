import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ResultatLabo } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-laboratoire-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🔬 Laboratoire & Imagerie"
      subtitle="Gestion des prescriptions et résultats d'examens (FOSA)"
      entityName="Examens"
      [data]="filtered()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucun examen de laboratoire"
    >
      <div grid-stats class="grid grid-4" style="margin-bottom:1.5rem">
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === ''" (click)="filterBy('')">
          <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">🧪</div>
          <div class="stat-content">
            <div class="stat-value">{{ allExamens().length }}</div>
            <div class="stat-label">Total examens</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'EN_ATTENTE'" (click)="filterBy('EN_ATTENTE')">
          <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ countEnAttente() }}</div>
            <div class="stat-label">En attente résultats</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'CRITIQUE'" (click)="filterBy('CRITIQUE')">
          <div class="stat-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ countCritiques() }}</div>
            <div class="stat-label">Résultats critiques</div>
          </div>
        </div>
        <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'TERMINE'" (click)="filterBy('TERMINE')">
          <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:#10b981">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ allExamens().length - countEnAttente() }}</div>
            <div class="stat-label">Résultats reçus</div>
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
  `]
})
export class LaboratoireListComponent implements OnInit {
  private http = inject(HttpClient);

  allExamens = signal<ResultatLabo[]>([]);
  activeFilter = signal('');

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  countEnAttente = computed(() => this.allExamens().filter(e => e.interpretation === 'EN_ATTENTE').length);
  countCritiques = computed(() => this.allExamens().filter(e => e.interpretation === 'CRITIQUE').length);

  filtered = computed(() => {
    let data = this.allExamens();
    const f = this.activeFilter();
    if (f === 'TERMINE') data = data.filter(e => e.interpretation !== 'EN_ATTENTE');
    else if (f) data = data.filter(e => e.interpretation === f);
    return data;
  });

  columns: GridColumn[] = [
    { field: 'date', header: 'Date Prélèvement', type: 'link', valueGetter: (ex) => this.formatDate(ex.datetime_prelevement), routerLink: (ex) => ['/fosa/laboratoire', ex.resultat_id], cellClass: 'text-sm' },
    { field: 'type', header: 'Type', type: 'badge', valueGetter: (ex) => ex.type_examen, badgeColor: () => 'badge-neutral' },
    { field: 'examen', header: 'Examen', type: 'link', valueGetter: (ex) => ex.libelle_examen, routerLink: (ex) => ['/fosa/laboratoire', ex.resultat_id], cellClass: 'font-medium' },
    { field: 'pec', header: 'ID Admission (PEC)', type: 'link', valueGetter: (ex) => (ex.pec_id || '').substring(0, 8) + '...', routerLink: (ex) => ['/fosa', ex.pec_id], cellClass: 'text-muted' },
    { field: 'interpretation', header: 'Interprétation', type: 'badge', valueGetter: (ex) => ex.interpretation, badgeColor: (ex) => this.getInterpretationBadge(ex.interpretation) }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouvelle prescription', route: ['/fosa/laboratoire/prescription'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', label: 'Saisir', title: 'Saisir résultat', routeFn: (ex) => ['/fosa/laboratoire', ex.resultat_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<ResultatLabo[]>('/api/laboratoire').subscribe((res) => {
      this.allExamens.set(res);
    });
  }

  filterBy(filter: string) {
    this.activeFilter.set(this.activeFilter() === filter ? '' : filter);
  }

  getFilterLabel(): string {
    switch (this.activeFilter()) {
      case 'EN_ATTENTE': return 'En attente résultats';
      case 'CRITIQUE': return 'Résultats critiques';
      case 'TERMINE': return 'Résultats terminés';
      default: return 'Tous';
    }
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  getInterpretationBadge(interpretation: string): string {
    switch (interpretation) {
      case 'NORMAL':
      case 'NEGATIF': return 'badge-success';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'CRITIQUE': return 'badge-danger';
      case 'ANORMAL_BAS':
      case 'ANORMAL_HAUT':
      case 'POSITIF': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }
}
