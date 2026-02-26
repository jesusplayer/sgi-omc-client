import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Orientation } from '../../core/models';

@Component({
  selector: 'app-orientation-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🚑 Orientations & Transferts</h1>
        <p>Gestion des orientations de patients vers les FOSA</p>
      </div>
      <div class="page-actions">
        <a routerLink="/regulation/orientations/nouvelle" class="btn btn-primary">+ Nouvelle orientation</a>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom:1.5rem">
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
              <th>Date/Heure</th>
              <th>FOSA Dest.</th>
              <th>Moyen transport</th>
              <th>État Départ</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (o of filtered(); track o.orientation_id) {
              <tr>
                <td class="text-sm"><a [routerLink]="['/regulation/orientations', o.orientation_id]" class="cell-link">{{ formatDate(o.heure_decision) }}</a></td>
                <td class="font-medium">{{ o.fosa_destination_id }}</td>
                <td><span class="badge badge-info">{{ o.moyen_transport }}</span></td>
                <td>
                  <span class="badge" [class]="getEtatBadge(o.etat_patient_depart)">{{ o.etat_patient_depart }}</span>
                </td>
                <td><span class="badge" [class]="getStatutBadge(o.statut)">{{ o.statut }}</span></td>
                <td>
                  <a [routerLink]="['/regulation/orientations', o.orientation_id, 'editer']" class="btn btn-sm btn-outline" title="Éditer">✏️</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucune orientation</td></tr>
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
  `],
})
export class OrientationListComponent implements OnInit {
  private http = inject(HttpClient);

  allOrientations = signal<Orientation[]>([]);
  filtered = signal<Orientation[]>([]);
  activeFilter = signal('');
  searchTerm = signal('');

  countEnAttente = computed(() => this.allOrientations().filter(o => o.statut === 'EN_ATTENTE').length);
  countEnCours = computed(() => this.allOrientations().filter(o => o.statut === 'EN_COURS').length);
  countArrives = computed(() => this.allOrientations().filter(o => o.statut === 'ARRIVE').length);

  ngOnInit() {
    this.http.get<Orientation[]>('/api/orientations').subscribe((res) => {
      this.allOrientations.set(res);
      this.filtered.set(res);
    });
  }

  filterBy(filter: string) {
    this.activeFilter.set(this.activeFilter() === filter ? '' : filter);
    this.applyFilter();
  }

  getFilterLabel(): string {
    switch (this.activeFilter()) {
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_COURS': return 'En cours (Transit)';
      case 'ARRIVE': return 'Arrivés';
      default: return 'Toutes';
    }
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.applyFilter();
  }

  private applyFilter() {
    let data = this.allOrientations();
    const f = this.activeFilter();
    if (f) data = data.filter((o) => o.statut === f);
    const term = this.searchTerm().toLowerCase();
    if (term) {
      data = data.filter((o) =>
        o.motif_evacuation.toLowerCase().includes(term) ||
        o.fosa_destination_id.toLowerCase().includes(term) ||
        o.moyen_transport.toLowerCase().includes(term)
      );
    }
    this.filtered.set(data);
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
