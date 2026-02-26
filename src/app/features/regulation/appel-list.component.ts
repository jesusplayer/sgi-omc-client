import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AppelRegulation } from '../../core/models';

@Component({
  selector: 'app-appel-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>📞 Régulation médicale</h1>
        <p>Gestion des appels et régulation des moyens</p>
      </div>
      <div class="page-actions" style="display:flex; gap:1rem; align-items:center">
        <a routerLink="/regulation/orientations" class="btn btn-outline">🧭 Orientations</a>
        <a routerLink="/regulation/nouveau" class="btn btn-primary">+ Nouvel appel</a>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom:1.5rem">
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
              <th>Appelant</th>
              <th>Motif</th>
              <th>Gravité</th>
              <th>Moyen</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (a of filtered(); track a.appel_id) {
              <tr>
                <td class="text-sm"><a [routerLink]="['/regulation', a.appel_id]" class="cell-link">{{ formatDate(a.datetime_appel) }}</a></td>
                <td>{{ a.type_appelant }} {{ a.nom_appelant ? '— ' + a.nom_appelant : '' }}</td>
                <td class="truncate" style="max-width:200px">{{ a.motif_appel }}</td>
                <td>
                  <span class="badge" [class]="getGraviteBadge(a.niveau_gravite)">P{{ a.niveau_gravite }}</span>
                </td>
                <td><span class="badge badge-info">{{ a.moyen_engage }}</span></td>
                <td><span class="badge" [class]="getStatutBadge(a.statut)">{{ a.statut }}</span></td>
                <td>
                  <a [routerLink]="['/regulation', a.appel_id, 'editer']" class="btn btn-sm btn-outline" title="Éditer">✏️</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center text-muted" style="padding:2rem">Aucun appel</td></tr>
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
export class AppelListComponent implements OnInit {
  private http = inject(HttpClient);
  allAppels = signal<AppelRegulation[]>([]);
  filtered = signal<AppelRegulation[]>([]);
  activeFilter = signal('');
  searchTerm = signal('');
  countEnCours = computed(() => this.allAppels().filter((a) => a.statut === 'EN_COURS').length);
  countResolus = computed(() => this.allAppels().filter((a) => a.statut === 'RESOLU').length);
  countMoyens = computed(() => this.allAppels().filter((a) => a.moyen_engage === 'AMBULANCE' || a.moyen_engage === 'SMUR').length);

  ngOnInit() {
    this.http.get<AppelRegulation[]>('/api/appels-regulation').subscribe((a) => { this.allAppels.set(a); this.filtered.set(a); });
  }

  filterBy(filter: string) {
    this.activeFilter.set(this.activeFilter() === filter ? '' : filter);
    this.applyFilter();
  }

  getFilterLabel(): string {
    switch (this.activeFilter()) {
      case 'EN_COURS': return 'En cours';
      case 'RESOLU': return 'Résolus';
      case 'MOYENS': return 'Moyens engagés';
      default: return 'Tous';
    }
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.applyFilter();
  }

  private applyFilter() {
    let data = this.allAppels();
    const f = this.activeFilter();
    if (f === 'EN_COURS') data = data.filter((a) => a.statut === 'EN_COURS');
    else if (f === 'RESOLU') data = data.filter((a) => a.statut === 'RESOLU');
    else if (f === 'MOYENS') data = data.filter((a) => a.moyen_engage === 'AMBULANCE' || a.moyen_engage === 'SMUR');
    const term = this.searchTerm().toLowerCase();
    if (term) {
      data = data.filter((a) =>
        a.motif_appel.toLowerCase().includes(term) ||
        (a.nom_appelant?.toLowerCase().includes(term) ?? false) ||
        a.localisation.toLowerCase().includes(term) ||
        a.type_appelant.toLowerCase().includes(term)
      );
    }
    this.filtered.set(data);
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
