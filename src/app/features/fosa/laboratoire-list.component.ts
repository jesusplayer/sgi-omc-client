import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ResultatLabo } from '../../core/models';

@Component({
  selector: 'app-laboratoire-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🔬 Laboratoire & Imagerie</h1>
        <p>Gestion des prescriptions et résultats d'examens (FOSA)</p>
      </div>
      <div class="page-actions">
        <a routerLink="/fosa/laboratoire/prescription" class="btn btn-primary">+ Nouvelle prescription</a>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom:1.5rem">
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

    <div class="card">
      <div class="card-header">
        <div>
          @if (activeFilter()) {
            <span class="active-filter-banner" style="display:inline-flex">
              Filtre : <strong>{{ getFilterLabel() }}</strong>
              <button class="btn btn-sm btn-outline" (click)="filterBy('')">✕</button>
            </span>
          }
        </div>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date Prélèvement</th>
              <th>Type</th>
              <th>Examen</th>
              <th>ID Admission (PEC)</th>
              <th>Interprétation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (ex of filtered(); track ex.resultat_id) {
              <tr>
                <td class="text-sm">
                  <a [routerLink]="['/fosa/laboratoire', ex.resultat_id]" class="cell-link">
                    {{ formatDate(ex.datetime_prelevement) }}
                  </a>
                </td>
                <td><span class="badge badge-neutral">{{ ex.type_examen }}</span></td>
                <td class="font-medium"><a [routerLink]="['/fosa/laboratoire', ex.resultat_id]" class="cell-link">{{ ex.libelle_examen }}</a></td>
                <td class="text-muted"><a [routerLink]="['/fosa', ex.pec_id]" class="cell-link">{{ ex.pec_id.substring(0,8) }}...</a></td>
                <td>
                  <span class="badge" [class]="getInterpretationBadge(ex.interpretation)">
                    {{ ex.interpretation }}
                  </span>
                </td>
                <td>
                  <a [routerLink]="['/fosa/laboratoire', ex.resultat_id, 'editer']" class="btn btn-sm btn-outline" title="Saisir résultat">✏️ Saisir</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucun examen de laboratoire</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .stat-clickable { cursor: pointer; user-select: none; }
    .stat-clickable:hover { border-color: var(--accent); }
    .stat-active { border-color: var(--accent) !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.25); }
    .active-filter-banner {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem;
      margin-bottom: 1rem; background: rgba(99,102,241,0.06); border-radius: var(--radius-md);
      font-size: 0.85rem; color: var(--text-secondary);
    }
  `]
})
export class LaboratoireListComponent implements OnInit {
  private http = inject(HttpClient);

  allExamens = signal<ResultatLabo[]>([]);
  filtered = signal<ResultatLabo[]>([]);
  activeFilter = signal('');
  searchTerm = signal('');

  countEnAttente = computed(() => this.allExamens().filter(e => e.interpretation === 'EN_ATTENTE').length);
  countCritiques = computed(() => this.allExamens().filter(e => e.interpretation === 'CRITIQUE').length);

  ngOnInit() {
    this.http.get<ResultatLabo[]>('/api/laboratoire').subscribe((res) => {
      this.allExamens.set(res);
      this.filtered.set(res);
    });
  }

  filterBy(filter: string) {
    this.activeFilter.set(this.activeFilter() === filter ? '' : filter);
    this.applyFilter();
  }

  getFilterLabel(): string {
    switch (this.activeFilter()) {
      case 'EN_ATTENTE': return 'En attente résultats';
      case 'CRITIQUE': return 'Résultats critiques';
      case 'TERMINE': return 'Résultats terminés';
      default: return 'Tous';
    }
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.applyFilter();
  }

  private applyFilter() {
    let data = this.allExamens();
    const f = this.activeFilter();
    if (f === 'TERMINE') data = data.filter(e => e.interpretation !== 'EN_ATTENTE');
    else if (f) data = data.filter(e => e.interpretation === f);
    const term = this.searchTerm().toLowerCase();
    if (term) {
      data = data.filter((e) =>
        e.libelle_examen.toLowerCase().includes(term) ||
        e.type_examen.toLowerCase().includes(term) ||
        (e.valeur?.toLowerCase().includes(term) ?? false)
      );
    }
    this.filtered.set(data);
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
      case 'POSITIF': return 'badge-danger'; // Ou un style custom pour anormal (ex. orange foncé)
      default: return 'badge-neutral';
    }
  }
}
