import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CatalogueProduit } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-catalogue-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="📦 Catalogue Produits"
      subtitle="Référentiel des médicaments, équipements et consommables"
      entityName="Produits catalogués"
      [data]="filteredProduits()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucun produit trouvé"
    >
      <select grid-filters class="form-control" [value]="selectedCategory()" (change)="onCategoryChange($event)" style="max-width:200px">
        <option value="">Toutes les catégories</option>
        <option value="MEDICAMENT">Médicament</option>
        <option value="EPI">EPI</option>
        <option value="MATERIEL">Matériel</option>
        <option value="CONSOMMABLE">Consommable</option>
        <option value="AUTRE">Autre</option>
      </select>
    </app-generic-grid>
  `
})
export class CatalogueListComponent implements OnInit {
  private http = inject(HttpClient);

  produits = signal<CatalogueProduit[]>([]);
  selectedCategory = signal('');

  filteredProduits = computed(() => {
    let result = this.produits();
    if (this.selectedCategory()) {
      result = result.filter(p => p.categorie === this.selectedCategory());
    }
    return result;
  });

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  columns: GridColumn[] = [
    { field: 'code', header: 'Code', valueGetter: (p) => p.code_produit, cellClass: 'font-medium text-sm' },
    {
      field: 'designation', header: 'Désignation',
      type: 'link', routerLink: (p) => ['/admin/catalogue', p.produit_id],
      valueGetter: (p) => `${p.designation}\n${p.dci ? p.dci + ' ' + (p.dosage || '') : ''}`,
      cellClass: 'font-medium font-pre-wrap'
    },
    { field: 'categorie', header: 'Catégorie', type: 'badge', valueGetter: (p) => p.categorie, badgeColor: () => 'badge-neutral' },
    { field: 'unite', header: 'Unité', valueGetter: (p) => p.unite_base },
    { field: 'froid', header: 'Froid', valueGetter: (p) => p.necessite_froid ? '❄️' : '' },
    {
      field: 'actif', header: 'Statut', type: 'badge',
      valueGetter: (p) => p.actif ? 'Actif' : 'Inactif',
      badgeColor: (p) => p.actif ? 'badge-success' : 'badge-neutral'
    }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouveau produit', route: ['/admin/catalogue/nouveau'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (p) => ['/admin/catalogue', p.produit_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<CatalogueProduit[]>('/api/catalogue-produits').subscribe(res => this.produits.set(res));
  }

  onCategoryChange(e: Event) {
    this.selectedCategory.set((e.target as HTMLSelectElement).value);
  }
}
