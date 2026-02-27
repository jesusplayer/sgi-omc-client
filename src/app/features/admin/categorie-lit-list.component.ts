import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CategorieLit } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-categorie-lit-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🛏️ Catégories de Lits"
      subtitle="Référentiel des types de lits pour les FOSA"
      entityName="Catégories"
      [data]="categories()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucune catégorie configurée"
    ></app-generic-grid>
  `
})
export class CategorieLitListComponent implements OnInit {
  private http = inject(HttpClient);

  categories = signal<CategorieLit[]>([]);

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  columns: GridColumn[] = [
    {
      field: 'couleur', header: 'Couleur', type: 'badge',
      valueGetter: (c) => c.couleur_dashboard || '#ccc',
      cellStyle: "width:60px"
    },
    { field: 'code', header: 'Code', type: 'link', valueGetter: (c) => c.code, routerLink: (c) => ['/admin/categories-lits', c.categorie_id], cellClass: 'font-medium' },
    { field: 'libelle', header: 'Libellé', valueGetter: (c) => c.libelle },
    {
      field: 'actif', header: 'Statut', type: 'badge',
      valueGetter: (c) => c.actif ? 'Actif' : 'Inactif',
      badgeColor: (c) => c.actif ? 'badge-success' : 'badge-neutral'
    }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouvelle catégorie', route: ['/admin/categories-lits/nouvelle'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (c) => ['/admin/categories-lits', c.categorie_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<CategorieLit[]>('/api/categories-lits').subscribe((c) => this.categories.set(c));
  }
}
