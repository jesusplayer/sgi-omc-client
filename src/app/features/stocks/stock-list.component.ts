import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Stock, CatalogueProduit, Site } from '../../core/models';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>📦 Gestion des stocks</h1>
        <p>Inventaire et suivi des produits médicaux</p>
      </div>
      <div class="page-actions" style="display:flex; gap:1rem; align-items:center">
        <select class="form-control" style="width:220px" (change)="onSiteChange($event)">
          <option value="">Tous les sites</option>
          @for (s of sites(); track s.site_id) {
            <option [value]="s.site_id">{{ s.nom }}</option>
          }
        </select>
        <a routerLink="/stocks/mouvements" class="btn btn-outline">🔄 Mouvements</a>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:1.5rem">
      <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === ''" (click)="filterByStatut('')">
        <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">📦</div>
        <div class="stat-content"><div class="stat-value">{{ stocks().length }}</div><div class="stat-label">Références</div></div>
      </div>
      <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'NORMAL'" (click)="filterByStatut('NORMAL')">
        <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:#10b981">✅</div>
        <div class="stat-content"><div class="stat-value">{{ countNormal() }}</div><div class="stat-label">Normal</div></div>
      </div>
      <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'ALERTE'" (click)="filterByStatut('ALERTE')">
        <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">⚠️</div>
        <div class="stat-content"><div class="stat-value">{{ countAlerte() }}</div><div class="stat-label">Alerte/Critique</div></div>
      </div>
      <div class="stat-card stat-clickable" [class.stat-active]="activeFilter() === 'RUPTURE'" (click)="filterByStatut('RUPTURE')">
        <div class="stat-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">🚫</div>
        <div class="stat-content"><div class="stat-value">{{ countRupture() }}</div><div class="stat-label">Ruptures</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          @if (activeFilter()) {
            <span class="active-filter-banner" style="display:inline-flex">
              Filtre : <strong>{{ activeFilter() }}</strong>
              <button class="btn btn-sm btn-outline" (click)="filterByStatut('')">✕</button>
            </span>
          }
        </div>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Site</th>
              <th>Disponible</th>
              <th>Initial</th>
              <th>Seuil alerte</th>
              <th>Statut</th>
              <th>Jauge</th>
            </tr>
          </thead>
          <tbody>
            @for (s of filtered(); track s.stock_id) {
              <tr>
                <td class="font-medium"><a [routerLink]="['/stocks', s.stock_id]" class="cell-link">{{ getProduit(s.produit_id) }}</a></td>
                <td class="text-sm">{{ getSite(s.site_id) }}</td>
                <td class="font-semibold">{{ s.quantite_disponible }} {{ s.unite }}</td>
                <td class="text-muted">{{ s.quantite_initiale }}</td>
                <td>{{ s.seuil_alerte }}</td>
                <td><span class="badge" [class]="getStatutBadge(s.statut)">{{ s.statut }}</span></td>
                <td style="width:120px">
                  <div class="gauge">
                    <div class="gauge-fill" [class]="getStatutBadge(s.statut)" [style.width.%]="getPercent(s)"></div>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center text-muted" style="padding:2rem">Aucun stock</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .gauge { height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; }
    .gauge-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .gauge-fill.badge-success { background: var(--success); }
    .gauge-fill.badge-warning { background: var(--warning); }
    .gauge-fill.badge-danger { background: var(--danger); }
    .gauge-fill.badge-neutral { background: var(--text-muted); }
    .gauge-fill.badge-info { background: var(--info); }
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
export class StockListComponent implements OnInit {
  private http = inject(HttpClient);
  stocks = signal<Stock[]>([]);
  produits = signal<CatalogueProduit[]>([]);
  sites = signal<Site[]>([]);
  filtered = signal<Stock[]>([]);
  activeFilter = signal('');
  searchTerm = signal('');
  private siteFilter = '';

  countNormal = computed(() => this.stocks().filter((s) => s.statut === 'NORMAL').length);
  countAlerte = computed(() => this.stocks().filter((s) => s.statut === 'ALERTE' || s.statut === 'CRITIQUE').length);
  countRupture = computed(() => this.stocks().filter((s) => s.statut === 'RUPTURE').length);

  ngOnInit() {
    this.http.get<Stock[]>('/api/stocks').subscribe((s) => { this.stocks.set(s); this.applyFilters(); });
    this.http.get<CatalogueProduit[]>('/api/catalogue-produits').subscribe((p) => this.produits.set(p));
    this.http.get<Site[]>('/api/sites').subscribe((s) => this.sites.set(s));
  }

  getProduit(id: string): string { return this.produits().find((p) => p.produit_id === id)?.designation ?? id; }
  getSite(id: string): string { return this.sites().find((s) => s.site_id === id)?.nom ?? id; }
  getStatutBadge(s: string): string { switch (s) { case 'NORMAL': return 'badge-success'; case 'ALERTE': return 'badge-warning'; case 'CRITIQUE': case 'RUPTURE': return 'badge-danger'; default: return 'badge-neutral'; } }
  getPercent(s: Stock): number { return s.quantite_initiale > 0 ? Math.min(100, (s.quantite_disponible / s.quantite_initiale) * 100) : 0; }

  filterByStatut(statut: string) {
    // Toggle: clicking the same card again resets the filter
    this.activeFilter.set(this.activeFilter() === statut ? '' : statut);
    this.applyFilters();
  }

  onSiteChange(e: Event) {
    this.siteFilter = (e.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.applyFilters();
  }

  private applyFilters() {
    let result = this.stocks();
    if (this.siteFilter) result = result.filter((s) => s.site_id === this.siteFilter);
    const sf = this.activeFilter();
    if (sf === 'NORMAL') result = result.filter((s) => s.statut === 'NORMAL');
    else if (sf === 'ALERTE') result = result.filter((s) => s.statut === 'ALERTE' || s.statut === 'CRITIQUE');
    else if (sf === 'RUPTURE') result = result.filter((s) => s.statut === 'RUPTURE');
    const term = this.searchTerm().toLowerCase();
    if (term) {
      result = result.filter((s) =>
        this.getProduit(s.produit_id).toLowerCase().includes(term) ||
        this.getSite(s.site_id).toLowerCase().includes(term)
      );
    }
    this.filtered.set(result);
  }
}
