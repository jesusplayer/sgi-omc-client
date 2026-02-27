import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Lit, Site, CategorieLit } from '../../core/models';

@Component({
  selector: 'app-lit-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🛏️ Gestion des Lits</h1>
        <p>Inventaire et statut des lits physiques par site FOSA</p>
      </div>
      <div class="page-actions">
        <a routerLink="/admin/lits/nouveau" class="btn btn-primary">+ Nouveau lit</a>
      </div>
    </div>

    <div class="card">
      <div class="flex" style="gap:1rem;margin-bottom:1.5rem">
        <select class="form-control" [value]="selectedSite()" (change)="onSiteChange($event)" style="max-width:300px">
          <option value="">Tous les sites FOSA</option>
          @for (s of sites(); track s.site_id) {
            <option [value]="s.site_id">{{ s.nom }}</option>
          }
        </select>
        
        <select class="form-control" [value]="selectedStatus()" (change)="onStatusChange($event)" style="max-width:200px">
          <option value="">Tous les statuts</option>
          <option value="LIBRE">Libre</option>
          <option value="OCCUPE">Occupé</option>
          <option value="HORS_SERVICE">Hors service</option>
          <option value="RESERVE">Réservé</option>
        </select>
        <input class="form-control" style="max-width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>

      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Site FOSA</th>
              <th>Numéro</th>
              <th>Catégorie</th>
              <th>Statut</th>
              <th>Dernière Maj.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (lit of filteredLits(); track lit.lit_id) {
              <tr>
                <td>{{ getSiteName(lit.site_id) }}</td>
                <td class="font-medium"><a [routerLink]="['/admin/lits', lit.lit_id, 'editer']" class="cell-link">{{ lit.numero_lit }}</a></td>
                <td>{{ getCategoryName(lit.categorie_id) }}</td>
                <td>
                  <span class="badge" [class]="getStatusBadge(lit.statut)">{{ lit.statut }}</span>
                </td>
                <td class="text-sm text-muted">{{ formatDate(lit.updated_at) }}</td>
                <td>
                  <a [routerLink]="['/admin/lits', lit.lit_id, 'editer']" class="btn btn-sm btn-outline">✏️ Éditer</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucun lit trouvé</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class LitListComponent implements OnInit {
  private http = inject(HttpClient);

  lits = signal<Lit[]>([]);
  sites = signal<Site[]>([]);
  categories = signal<CategorieLit[]>([]);

  selectedSite = signal('');
  selectedStatus = signal('');
  searchTerm = signal('');

  filteredLits = computed(() => {
    let result = this.lits();
    if (this.selectedSite()) {
      result = result.filter(l => l.site_id === this.selectedSite());
    }
    if (this.selectedStatus()) {
      result = result.filter(l => l.statut === this.selectedStatus());
    }
    const term = this.searchTerm().toLowerCase();
    if (term) {
      result = result.filter(l =>
        l.numero_lit.toLowerCase().includes(term) ||
        this.getSiteName(l.site_id).toLowerCase().includes(term) ||
        this.getCategoryName(l.categorie_id).toLowerCase().includes(term)
      );
    }
    return result;
  });

  ngOnInit() {
    this.http.get<Lit[]>('/api/lits').subscribe(res => this.lits.set(res));
    // Load sites and filter FOSA/PMA
    this.http.get<Site[]>('/api/sites').subscribe(res => {
      this.sites.set(res.filter(s => ['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'].includes(s.type_site)));
    });
    this.http.get<CategorieLit[]>('/api/categories-lits').subscribe(res => this.categories.set(res));
  }

  onSiteChange(e: Event) {
    this.selectedSite.set((e.target as HTMLSelectElement).value);
  }

  onStatusChange(e: Event) {
    this.selectedStatus.set((e.target as HTMLSelectElement).value);
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  getSiteName(id: string): string {
    return this.sites().find(s => s.site_id === id)?.nom || 'Inconnu';
  }

  getCategoryName(id: string): string {
    return this.categories().find(c => c.categorie_id === id)?.libelle || 'Inconnu';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  getStatusBadge(s: string): string {
    switch (s) {
      case 'LIBRE': return 'badge-success';
      case 'OCCUPE': return 'badge-danger';
      case 'RESERVE': return 'badge-warning';
      case 'HORS_SERVICE': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  }
}
