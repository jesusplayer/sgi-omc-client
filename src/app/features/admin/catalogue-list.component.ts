import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CatalogueProduit } from '../../core/models';

@Component({
    selector: 'app-catalogue-list',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>📦 Catalogue Produits</h1>
        <p>Référentiel des médicaments, équipements et consommables</p>
      </div>
      <div class="page-actions">
        <a routerLink="/admin/catalogue/nouveau" class="btn btn-primary">+ Nouveau produit</a>
      </div>
    </div>

    <div class="card">
      <div class="flex" style="gap:1rem;margin-bottom:1.5rem">
        <input type="text" class="form-control" placeholder="Rechercher par code ou désignation..." [value]="searchQuery()" (input)="onSearch($event)" style="max-width:300px" />
        
        <select class="form-control" [value]="selectedCategory()" (change)="onCategoryChange($event)" style="max-width:200px">
          <option value="">Toutes les catégories</option>
          <option value="MEDICAMENT">Médicament</option>
          <option value="EPI">EPI</option>
          <option value="MATERIEL">Matériel</option>
          <option value="CONSOMMABLE">Consommable</option>
          <option value="AUTRE">Autre</option>
        </select>
      </div>

      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th>Catégorie</th>
              <th>Unité</th>
              <th>Froid</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filteredProduits(); track p.produit_id) {
              <tr>
                <td class="font-medium text-sm">{{ p.code_produit }}</td>
                <td>
                  <div class="font-medium">{{ p.designation }}</div>
                  @if (p.dci) { <div class="text-sm text-muted">{{ p.dci }} {{ p.dosage }}</div> }
                </td>
                <td><span class="badge badge-neutral">{{ p.categorie }}</span></td>
                <td>{{ p.unite_base }}</td>
                <td>
                  @if (p.necessite_froid) { <span title="Nécessite chaîne du froid">❄️</span> }
                </td>
                <td>
                  <span class="badge" [class]="p.actif ? 'badge-success' : 'badge-neutral'">
                    {{ p.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <a [routerLink]="['/admin/catalogue', p.produit_id, 'editer']" class="btn btn-sm btn-outline">✏️ Éditer</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center text-muted" style="padding:2rem">Aucun produit trouvé</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class CatalogueListComponent implements OnInit {
    private http = inject(HttpClient);

    produits = signal<CatalogueProduit[]>([]);
    searchQuery = signal('');
    selectedCategory = signal('');

    filteredProduits = computed(() => {
        let result = this.produits();

        if (this.selectedCategory()) {
            result = result.filter(p => p.categorie === this.selectedCategory());
        }

        if (this.searchQuery().trim()) {
            const q = this.searchQuery().toLowerCase();
            result = result.filter(p =>
                p.code_produit.toLowerCase().includes(q) ||
                p.designation.toLowerCase().includes(q) ||
                (p.dci && p.dci.toLowerCase().includes(q))
            );
        }

        return result;
    });

    ngOnInit() {
        this.http.get<CatalogueProduit[]>('/api/catalogue').subscribe(res => this.produits.set(res));
    }

    onSearch(e: Event) {
        this.searchQuery.set((e.target as HTMLInputElement).value);
    }

    onCategoryChange(e: Event) {
        this.selectedCategory.set((e.target as HTMLSelectElement).value);
    }
}
