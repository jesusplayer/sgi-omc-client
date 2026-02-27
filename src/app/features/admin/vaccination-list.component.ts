import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Vaccination } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-vaccination-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="💉 Gestion des vaccinations"
      subtitle="Référentiel des vaccinations pour le criblage PSF"
      entityName="Vaccinations"
      [data]="vaccinations()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucune vaccination configurée"
    ></app-generic-grid>
  `
})
export class VaccinationListComponent implements OnInit {
  private http = inject(HttpClient);

  vaccinations = signal<Vaccination[]>([]);

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  columns: GridColumn[] = [
    { field: 'libelle', header: 'Libellé', type: 'link', valueGetter: (v) => v.libelle, routerLink: (v) => ['/admin/vaccinations', v.vaccination_id], cellClass: 'font-medium' },
    {
      field: 'obligatoire', header: 'Obligatoire', type: 'badge',
      valueGetter: (v) => v.obligatoire ? 'Obligatoire' : 'Optionnel',
      badgeColor: (v) => v.obligatoire ? 'badge-danger' : 'badge-info'
    },
    {
      field: 'actif', header: 'Statut', type: 'badge',
      valueGetter: (v) => v.actif ? 'Actif' : 'Inactif',
      badgeColor: (v) => v.actif ? 'badge-success' : 'badge-neutral'
    },
    { field: 'created_at', header: 'Créé le', type: 'date', valueGetter: (v) => v.created_at, cellClass: 'text-sm text-muted' }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouvelle vaccination', route: ['/admin/vaccinations/nouveau'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (v) => ['/admin/vaccinations', v.vaccination_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<Vaccination[]>('/api/vaccinations').subscribe((v) => this.vaccinations.set(v));
  }
}
