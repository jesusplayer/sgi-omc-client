import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Vaccin } from '../../../core/models';
import { GenericGridComponent } from '../../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../../shared/components/generic-grid/grid.models';

@Component({
    selector: 'app-vaccin-list',
    standalone: true,
    imports: [GenericGridComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <app-generic-grid
      title="💉 Gestion des vaccins"
      subtitle="Référentiel des vaccins pour le criblage PSF"
      entityName="Vaccins"
      [data]="vaccins()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucun vaccin configuré"
    ></app-generic-grid>
  `
})
export class VaccinListComponent implements OnInit {
    private http = inject(HttpClient);

    vaccins = signal<Vaccin[]>([]);

    @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

    columns: GridColumn[] = [
        { field: 'libelle', header: 'Libellé', type: 'link', valueGetter: (v) => v.libelle, routerLink: (v) => ['/admin/vaccins', v.vaccin_id], cellClass: 'font-medium' },
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
        { label: '+ Nouveau vaccin', route: ['/admin/vaccins/nouveau'], class: 'btn-primary' }
    ];

    rowActions: GridRowAction[] = [
        { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (v) => ['/admin/vaccins', v.vaccin_id, 'editer'], class: 'btn-outline' }
    ];

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.http.get<Vaccin[]>('/api/vaccins').subscribe((v) => this.vaccins.set(v));
    }
}
