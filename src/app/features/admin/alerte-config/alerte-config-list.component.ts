import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigurationAlerte } from '../../../core/models';
import { GenericGridComponent } from '../../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-alerte-config-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="⚠️ Règles d'alerte"
      subtitle="Configuration des seuils et paramètres de notification"
      entityName="Règles d'alerte"
      [data]="configs()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucune règle d'alerte configurée"
    ></app-generic-grid>
  `
})
export class AlerteConfigListComponent implements OnInit {
  private http = inject(HttpClient);

  configs = signal<ConfigurationAlerte[]>([]);

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  columns: GridColumn[] = [
    { field: 'code', header: 'Code Règle', type: 'link', valueGetter: (c) => c.code_regle, routerLink: (c) => ['/admin/alertes-config', c.config_id], cellClass: 'font-medium' },
    { field: 'libelle', header: 'Libellé', valueGetter: (c) => c.libelle },
    { field: 'entite', header: 'Entité / Champ', valueGetter: (c) => `${c.entite_source} (${c.champ_surveille})` },
    { field: 'canaux', header: 'Canaux Notif.', valueGetter: (c) => c.canaux_notif.join(', ') },
    {
      field: 'actif', header: 'Statut', type: 'badge',
      valueGetter: (c) => c.active ? 'Active' : 'Inactive',
      badgeColor: (c) => c.active ? 'badge-success' : 'badge-neutral'
    }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouvelle règle', route: ['/admin/alertes-config/nouvelle'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '👁️', label: 'Détail', title: 'Détail', routeFn: (c) => ['/admin/alertes-config', c.config_id], class: 'btn-outline' },
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (c) => ['/admin/alertes-config', c.config_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<ConfigurationAlerte[]>('/api/configurations-alerte').subscribe((c) => this.configs.set(c));
  }
}
