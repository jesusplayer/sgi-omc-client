import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CategorieLit } from '../../core/models';

@Component({
  selector: 'app-categorie-lit-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🛏️ Catégories de Lits</h1>
        <p>Référentiel des types de lits pour les FOSA</p>
      </div>
      <div class="page-actions">
        <a routerLink="/admin/categories-lits/nouvelle" class="btn btn-primary">+ Nouvelle catégorie</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Catégories ({{ filtered().length }})</h3>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Couleur</th>
              <th>Code</th>
              <th>Libellé</th>
              <th>Statut</th>
              <th style="width:200px">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (cat of filtered(); track cat.categorie_id) {
              <tr>
                <td>
                  <div [style.background]="cat.couleur_dashboard || '#ccc'" style="width:24px;height:24px;border-radius:4px"></div>
                </td>
                <td class="font-medium"><a [routerLink]="['/admin/categories-lits', cat.categorie_id, 'editer']" class="cell-link">{{ cat.code }}</a></td>
                <td>{{ cat.libelle }}</td>
                <td>
                  <span class="badge" [class]="cat.actif ? 'badge-success' : 'badge-neutral'">
                    {{ cat.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <a [routerLink]="['/admin/categories-lits', cat.categorie_id, 'editer']" class="btn btn-sm btn-outline">✏️ Éditer</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="text-center text-muted" style="padding:2rem">Aucune catégorie configurée</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class CategorieLitListComponent implements OnInit {
  private http = inject(HttpClient);
  categories = signal<CategorieLit[]>([]);
  filtered = signal<CategorieLit[]>([]);
  searchTerm = signal('');

  ngOnInit() {
    this.http.get<CategorieLit[]>('/api/categories-lits').subscribe((c) => { this.categories.set(c); this.filtered.set(c); });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    const term = this.searchTerm().toLowerCase();
    if (!term) { this.filtered.set(this.categories()); return; }
    this.filtered.set(this.categories().filter((c) =>
      c.code.toLowerCase().includes(term) ||
      c.libelle.toLowerCase().includes(term) ||
      (c.description?.toLowerCase().includes(term) ?? false)
    ));
  }
}
