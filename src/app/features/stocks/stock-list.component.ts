import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Stock, CatalogueProduit, Site } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="📦 Gestion des stocks"
      subtitle="Inventaire et suivi des produits médicaux"
      entityName="Stocks"
      [data]="filtered()"
      [columns]="columns"
      [headerActions]="headerActions"
      emptyMessage="Aucun stock"
    >
      <div grid-stats class="grid grid-4" style="margin-bottom:1.5rem">
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

      <ng-container grid-filters>
        @if (activeFilter()) {
          <span class="active-filter-banner" style="display:inline-flex; align-items:center; gap:0.5rem">
            Filtre : <strong>{{ activeFilter() }}</strong>
            <button class="btn btn-sm btn-outline" (click)="filterByStatut('')" style="padding:0 0.5rem">✕</button>
          </span>
        }
        <select class="form-control" style="width:220px; margin-left:1rem" (change)="onSiteChange($event)">
          <option value="">Tous les sites</option>
          @for (s of sites(); track s.site_id) {
            <option [value]="s.site_id">{{ s.nom }}</option>
          }
        </select>
        <input class="form-control" style="width:250px; margin-left:1rem" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
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
export class StockListComponent implements OnInit {
  private http = inject(HttpClient);
  stocks = signal<Stock[]>([]);
  produits = signal<CatalogueProduit[]>([]);
  sites = signal<Site[]>([]);
  activeFilter = signal('');
  searchTerm = signal('');
  private siteFilter = '';

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  countNormal = computed(() => this.stocks().filter((s) => s.statut === 'NORMAL').length);
  countAlerte = computed(() => this.stocks().filter((s) => s.statut === 'ALERTE' || s.statut === 'CRITIQUE').length);
  countRupture = computed(() => this.stocks().filter((s) => s.statut === 'RUPTURE').length);

  filtered = computed(() => {
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
    return result;
  });

  columns: GridColumn[] = [
    { field: 'produit', header: 'Produit', type: 'link', valueGetter: (s) => this.getProduit(s.produit_id), routerLink: (s) => ['/stocks', s.stock_id], cellClass: 'font-medium' },
    { field: 'site', header: 'Site', valueGetter: (s) => this.getSite(s.site_id), cellClass: 'text-sm' },
    { field: 'disponible', header: 'Disponible', valueGetter: (s) => `${s.quantite_disponible} ${s.unite}`, cellClass: 'font-semibold' },
    { field: 'initial', header: 'Initial', valueGetter: (s) => s.quantite_initiale, cellClass: 'text-muted' },
    { field: 'seuil', header: 'Seuil alerte', valueGetter: (s) => s.seuil_alerte },
    { field: 'statut', header: 'Statut', type: 'badge', valueGetter: (s) => s.statut, badgeColor: (s) => this.getStatutBadge(s.statut) },
    { field: 'jauge', header: 'Remplissage', valueGetter: (s) => s.quantite_initiale > 0 ? Math.min(100, Math.round((s.quantite_disponible / s.quantite_initiale) * 100)) + '%' : '0%', cellClass: 'text-muted' }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '📝 Ajustement', route: ['/stocks/inventaire'], class: 'btn-outline', title: 'Inventaire Physique' },
    { label: '🔄 Mouvements', route: ['/stocks/mouvements'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<Stock[]>('/api/stocks').subscribe((s) => this.stocks.set(s));
    this.http.get<CatalogueProduit[]>('/api/catalogue-produits').subscribe((p) => this.produits.set(p));
    this.http.get<Site[]>('/api/sites').subscribe((s) => this.sites.set(s));
  }

  getProduit(id: string): string { return this.produits().find((p) => p.produit_id === id)?.designation ?? id; }
  getSite(id: string): string { return this.sites().find((s) => s.site_id === id)?.nom ?? id; }
  getStatutBadge(s: string): string { switch (s) { case 'NORMAL': return 'badge-success'; case 'ALERTE': return 'badge-warning'; case 'CRITIQUE': case 'RUPTURE': return 'badge-danger'; default: return 'badge-neutral'; } }

  filterByStatut(statut: string) {
    this.activeFilter.set(this.activeFilter() === statut ? '' : statut);
  }

  onSiteChange(e: Event) {
    this.siteFilter = (e.target as HTMLSelectElement).value;
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
}
