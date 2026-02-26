import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Lit, CategorieLit, Site } from '../../core/models';

@Component({
    selector: 'app-lit-plan',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🛏️ Plan d'occupation des lits</h1>
        <p>Vue en temps réel de la disponibilité</p>
      </div>
      <div class="page-actions">
        <select class="form-control" style="width:220px" (change)="onSiteChange($event)">
          @for (s of fosaSites(); track s.site_id) {
            <option [value]="s.site_id">{{ s.nom }}</option>
          }
        </select>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:1.5rem">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">🛏️</div>
        <div class="stat-content"><div class="stat-value">{{ totalBeds() }}</div><div class="stat-label">Total lits</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:#10b981">✅</div>
        <div class="stat-content"><div class="stat-value">{{ freeBeds() }}</div><div class="stat-label">Libres</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">🔴</div>
        <div class="stat-content"><div class="stat-value">{{ occupiedBeds() }}</div><div class="stat-label">Occupés</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">📊</div>
        <div class="stat-content"><div class="stat-value">{{ tauxOcc() }}%</div><div class="stat-label">Taux d'occupation</div></div>
      </div>
    </div>

    <!-- Lit plan by category -->
    @for (cat of categories(); track cat.categorie_id) {
      <div class="card" style="margin-bottom:1rem">
        <div class="card-header">
          <h3>
            <span class="cat-dot" [style.background]="cat.couleur_dashboard ?? '#6366f1'"></span>
            {{ cat.libelle }}
          </h3>
          <span class="text-sm text-muted">{{ getCatCount(cat.categorie_id) }} lits</span>
        </div>
        <div class="lit-grid">
          @for (lit of getLitsByCat(cat.categorie_id); track lit.lit_id) {
            <div class="lit-cell" [class]="'lit-' + lit.statut.toLowerCase()" [title]="lit.numero_lit + ' — ' + lit.statut">
              <span class="lit-num">{{ lit.numero_lit }}</span>
              <span class="lit-status">{{ getStatusIcon(lit.statut) }}</span>
            </div>
          }
        </div>
      </div>
    }

    <!-- Legend -->
    <div class="card legend">
      <div class="flex gap-4" style="flex-wrap:wrap">
        <span class="legend-item"><span class="lit-cell lit-libre" style="width:28px;height:28px;font-size:0.7rem">✅</span> Libre</span>
        <span class="legend-item"><span class="lit-cell lit-occupe" style="width:28px;height:28px;font-size:0.7rem">🔴</span> Occupé</span>
        <span class="legend-item"><span class="lit-cell lit-reserve" style="width:28px;height:28px;font-size:0.7rem">🔵</span> Réservé</span>
        <span class="legend-item"><span class="lit-cell lit-hors_service" style="width:28px;height:28px;font-size:0.7rem">⚫</span> Hors service</span>
      </div>
    </div>
  `,
    styles: [`
    .cat-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 0.5rem; }
    .lit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 0.5rem; }
    .lit-cell {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 0.5rem; border-radius: var(--radius-md); border: 2px solid; min-height: 60px;
      transition: transform 0.15s;
      &:hover { transform: scale(1.05); }
    }
    .lit-libre { border-color: var(--occ-green); background: rgba(16,185,129,0.08); }
    .lit-occupe { border-color: var(--occ-red); background: rgba(239,68,68,0.08); }
    .lit-reserve { border-color: var(--info); background: rgba(59,130,246,0.08); }
    .lit-hors_service { border-color: var(--text-muted); background: rgba(148,163,184,0.08); opacity: 0.6; }
    .lit-num { font-size: 0.75rem; font-weight: 600; }
    .lit-status { font-size: 1rem; }
    .legend { padding: 0.75rem 1rem; }
    .legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; }
  `],
})
export class LitPlanComponent implements OnInit {
    private http = inject(HttpClient);
    lits = signal<Lit[]>([]);
    categories = signal<CategorieLit[]>([]);
    fosaSites = signal<Site[]>([]);
    selectedSite = signal('site-fosa-chu');

    totalBeds = signal(0);
    freeBeds = signal(0);
    occupiedBeds = signal(0);
    tauxOcc = signal('0');

    ngOnInit() {
        this.http.get<CategorieLit[]>('/api/categories-lit').subscribe((c) => this.categories.set(c));
        this.http.get<Site[]>('/api/sites').subscribe((s) => {
            this.fosaSites.set(s.filter((x) => x.type_site === 'FOSA'));
            this.loadLits();
        });
    }

    loadLits() {
        this.http.get<Lit[]>('/api/lits').subscribe((all) => {
            const site = this.selectedSite();
            const forSite = all.filter((l) => l.site_id === site);
            this.lits.set(forSite);
            const active = forSite.filter((l) => l.statut !== 'HORS_SERVICE');
            const occ = forSite.filter((l) => l.statut === 'OCCUPE');
            this.totalBeds.set(active.length);
            this.freeBeds.set(forSite.filter((l) => l.statut === 'LIBRE').length);
            this.occupiedBeds.set(occ.length);
            this.tauxOcc.set(active.length > 0 ? ((occ.length / active.length) * 100).toFixed(1) : '0');
        });
    }

    onSiteChange(e: Event) {
        this.selectedSite.set((e.target as HTMLSelectElement).value);
        this.loadLits();
    }

    getLitsByCat(catId: string): Lit[] { return this.lits().filter((l) => l.categorie_id === catId); }
    getCatCount(catId: string): number { return this.getLitsByCat(catId).length; }
    getStatusIcon(s: string): string { switch (s) { case 'LIBRE': return '✅'; case 'OCCUPE': return '🔴'; case 'RESERVE': return '🔵'; default: return '⚫'; } }
}
