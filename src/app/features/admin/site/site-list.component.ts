import { Component, inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Site } from '../../../core/models';
import { SiteService } from '../../../core/services/site.service';
import { GenericGridComponent } from '../../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-site-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🏥 Gestion des sites"
      subtitle="Référentiel des sites physiques (PSF, PMA, FOSA, Régulation)"
      entityName="Sites"
      [data]="sitesResource.value() || []"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucun site configuré"
    ></app-generic-grid>
  `
})
export class SiteListComponent {
  private siteService = inject(SiteService);

  sitesResource = this.siteService.getAll();

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  columns: GridColumn[] = [
    { field: 'code', header: 'Code', valueGetter: (s) => s.code_site, cellClass: 'font-medium text-muted' },
    { field: 'nom', header: 'Nom du site', type: 'link', valueGetter: (s) => s.nom, routerLink: (s) => ['/admin/sites', s.site_id], cellClass: 'font-medium' },
    { field: 'type', header: 'Type', type: 'badge', valueGetter: (s) => s.type_site, badgeColor: () => 'badge-info' },
    {
      field: 'capacite', header: 'Capacité lits',
      valueGetter: (s) => {
        if (['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'].includes(s.type_site)) {
          return `${s.lits_occupes || 0} / ${s.capacite_lits || 0}`;
        }
        return '—';
      }
    },
    {
      field: 'actif', header: 'Statut', type: 'badge',
      valueGetter: (s) => s.actif ? 'Actif' : 'Inactif',
      badgeColor: (s) => s.actif ? 'badge-success' : 'badge-neutral'
    }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouveau site', route: ['/admin/sites/nouveau'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (s) => ['/admin/sites', s.site_id, 'editer'], class: 'btn-outline' }
  ];
}

