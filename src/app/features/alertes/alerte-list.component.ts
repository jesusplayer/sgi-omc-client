import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Alerte } from '../../core/models';

@Component({
  selector: 'app-alerte-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🔔 Alertes & Notifications</h1>
        <p>Système de surveillance et alertes automatiques</p>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom:1.5rem">
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

    <div class="flex" style="gap:1rem;margin-bottom:1rem;align-items:center">
      <div style="flex:1">
        @if (activeFilter()) {
          <span class="active-filter-banner" style="display:inline-flex">
            Filtre : <strong>{{ getFilterLabel() }}</strong>
            <button class="btn btn-sm btn-outline" (click)="filterBy('')">✕</button>
          </span>
        }
      </div>
      <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
    </div>

    <div class="alert-cards">
      @for (a of filtered(); track a.alerte_id) {
        <a [routerLink]="['/alertes', a.alerte_id]" class="card alert-card" [class]="'border-level-' + a.niveau" style="text-decoration:none;color:inherit">
          <div class="flex items-center justify-between" style="margin-bottom:0.5rem">
            <span class="badge" [class]="getNiveauBadge(a.niveau)">Niveau {{ a.niveau }}</span>
            <span class="badge" [class]="getStatutBadge(a.statut)">{{ a.statut }}</span>
          </div>
          <h3 class="font-semibold" style="margin-bottom:0.35rem">{{ a.titre }}</h3>
          <p class="text-sm" style="margin-bottom:0.5rem;color:var(--text-secondary)">{{ a.message }}</p>
          <div class="flex gap-4 text-xs text-muted">
            <span>📂 {{ a.type_alerte }}</span>
            <span>📅 {{ formatDate(a.datetime_declenchement) }}</span>
            @if (a.valeur_declenchante) { <span>📊 {{ a.valeur_declenchante }} (seuil: {{ a.seuil_configure }})</span> }
          </div>
        </a>
      } @empty {
        <div class="card text-center text-muted" style="padding:3rem">Aucune alerte</div>
      }
    </div>
  `,
  styles: [`
    .alert-cards { display: flex; flex-direction: column; gap: 0.75rem; }
    .alert-card { transition: border-color 0.2s; }
    .border-level-1 { border-left: 4px solid var(--alert-1); }
    .border-level-2 { border-left: 4px solid var(--alert-2); }
    .border-level-3 { border-left: 4px solid var(--alert-3); }
    .stat-clickable { cursor: pointer; user-select: none; }
    .stat-clickable:hover { border-color: var(--accent); }
    .stat-active { border-color: var(--accent) !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.25); }
    .active-filter-banner {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem;
      background: rgba(99,102,241,0.06); border-radius: var(--radius-md);
      font-size: 0.85rem; color: var(--text-secondary);
    }
  `],
})
export class AlerteListComponent implements OnInit {
  private http = inject(HttpClient);
  alertes = signal<Alerte[]>([]);
  filtered = signal<Alerte[]>([]);
  activeFilter = signal('');
  searchTerm = signal('');
  countActive = computed(() => this.alertes().filter((a) => a.statut === 'ACTIVE').length);
  countN1 = computed(() => this.alertes().filter((a) => a.niveau === 1 && a.statut === 'ACTIVE').length);
  countN2 = computed(() => this.alertes().filter((a) => a.niveau === 2 && a.statut === 'ACTIVE').length);
  countN3 = computed(() => this.alertes().filter((a) => a.niveau === 3 && a.statut === 'ACTIVE').length);

  ngOnInit() {
    this.http.get<Alerte[]>('/api/alertes').subscribe((a) => { this.alertes.set(a); this.applyFilter(); });
  }

  filterBy(filter: string) {
    this.activeFilter.set(this.activeFilter() === filter ? '' : filter);
    this.applyFilter();
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

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.applyFilter();
  }

  private applyFilter() {
    let data = this.alertes();
    const f = this.activeFilter();
    if (f === 'ACTIVE') data = data.filter((a) => a.statut === 'ACTIVE');
    else if (f === 'N1') data = data.filter((a) => a.niveau === 1 && a.statut === 'ACTIVE');
    else if (f === 'N2') data = data.filter((a) => a.niveau === 2 && a.statut === 'ACTIVE');
    else if (f === 'N3') data = data.filter((a) => a.niveau === 3 && a.statut === 'ACTIVE');
    const term = this.searchTerm().toLowerCase();
    if (term) {
      data = data.filter((a) =>
        a.titre.toLowerCase().includes(term) ||
        a.message.toLowerCase().includes(term) ||
        a.type_alerte.toLowerCase().includes(term)
      );
    }
    this.filtered.set(data);
  }

  getNiveauBadge(n: number): string { return n >= 3 ? 'badge-danger' : n >= 2 ? 'badge-warning' : 'badge-info'; }
  getStatutBadge(s: string): string { return s === 'ACTIVE' ? 'badge-danger' : s === 'RESOLUE' ? 'badge-success' : 'badge-neutral'; }
  formatDate(iso: string): string { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
}
