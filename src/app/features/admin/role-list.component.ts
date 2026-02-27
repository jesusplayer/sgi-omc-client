import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Role } from '@app/core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🛡️ Rôles & Permissions"
      subtitle="Gestion des niveaux d'accès et droits des utilisateurs"
      entityName="Rôles Systèmes"
      [data]="roles()"
      [columns]="columns"
      [rowActions]="rowActions"
      [headerActions]="headerActions"
      emptyMessage="Aucun rôle trouvé"
    ></app-generic-grid>
  `
})
export class RoleListComponent implements OnInit {
  private http = inject(HttpClient);

  roles = signal<Role[]>([]);

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  columns: GridColumn[] = [
    { field: 'code', header: 'Code Rôle', type: 'link', valueGetter: (r) => r.code_role, routerLink: (r) => ['/admin/roles', r.role_id], cellClass: 'font-medium' },
    { field: 'libelle', header: 'Libellé', valueGetter: (r) => r.libelle },
    { field: 'description', header: 'Description', valueGetter: (r) => r.description, cellClass: 'text-muted' },
    { field: 'niveau', header: "Niveau d'Accès", type: 'badge', valueGetter: (r) => `Niv ${r.niveau_acces}`, badgeColor: () => 'badge-neutral' },
    {
      field: 'actif', header: 'Statut', type: 'badge',
      valueGetter: (r) => r.actif ? 'Actif' : 'Inactif',
      badgeColor: (r) => r.actif ? 'badge-success' : 'badge-neutral'
    }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouveau rôle', route: ['/admin/roles/nouveau'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '👁️', label: 'Détail', title: 'Détail', routeFn: (r) => ['/admin/roles', r.role_id], class: 'btn-info' },
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (r) => ['/admin/roles', r.role_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<Role[]>('/api/roles').subscribe((r) => {
      // Sort by niveau d'accès descending
      const sorted = r.sort((a, b) => b.niveau_acces - a.niveau_acces);
      this.roles.set(sorted);
    });
  }
}
