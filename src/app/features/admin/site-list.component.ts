import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Site } from '../../core/models';

@Component({
  selector: 'app-site-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🏥 Gestion des sites</h1>
        <p>Référentiel des sites physiques (PSF, PMA, FOSA, Régulation)</p>
      </div>
      <div class="page-actions">
        <a routerLink="/admin/sites/nouveau" class="btn btn-primary">+ Nouveau site</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Sites ({{ filtered().length }})</h3>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom du site</th>
              <th>Type</th>
              <th>Capacité lits</th>
              <th>Statut</th>
              <th style="width:200px">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (s of filtered(); track s.site_id) {
              <tr>
                <td class="font-medium text-muted">{{ s.code_site }}</td>
                <td class="font-medium"><a [routerLink]="['/admin/sites', s.site_id]" class="cell-link">{{ s.nom }}</a></td>
                <td>
                  <span class="badge badge-info">{{ s.type_site }}</span>
                </td>
                <td>
                  @if (['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'].includes(s.type_site)) {
                    <span class="text-sm">{{ s.lits_occupes }} / {{ s.capacite_lits }}</span>
                  } @else {
                    <span class="text-muted text-sm">—</span>
                  }
                </td>
                <td>
                  <span class="badge" [class]="s.actif ? 'badge-success' : 'badge-neutral'">
                    {{ s.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <a [routerLink]="['/admin/sites', s.site_id, 'editer']" class="btn btn-sm btn-outline">✏️ Éditer</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucun site configuré</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class SiteListComponent implements OnInit {
  private http = inject(HttpClient);
  sites = signal<Site[]>([]);
  filtered = signal<Site[]>([]);
  searchTerm = signal('');

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<Site[]>('/api/sites').subscribe((res) => {
      this.sites.set(res); this.filtered.set(res);
    });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    const term = this.searchTerm().toLowerCase();
    if (!term) { this.filtered.set(this.sites()); return; }
    this.filtered.set(this.sites().filter((s) =>
      s.code_site.toLowerCase().includes(term) ||
      s.nom.toLowerCase().includes(term) ||
      s.type_site.toLowerCase().includes(term)
    ));
  }
}
