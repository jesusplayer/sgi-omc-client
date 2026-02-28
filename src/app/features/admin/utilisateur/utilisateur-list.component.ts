import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Utilisateur, Role } from '../../../core/models';
import { GenericGridComponent } from '../../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction } from '../../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-utilisateur-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GenericGridComponent],
  template: `
    <app-generic-grid
      title="👥 Gestion des utilisateurs"
      subtitle="Administration des comptes et rôles"
      entityName="Utilisateurs"
      [data]="usersData()"
      [columns]="columns"
      [rowActions]="rowActions"
    ></app-generic-grid>
  `
})
export class UtilisateurListComponent implements OnInit {
  private http = inject(HttpClient);

  users = signal<Utilisateur[]>([]);
  roles = signal<Role[]>([]);

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  usersData = computed(() => {
    const roles = this.roles();
    return this.users().map(u => ({
      ...u,
      roleName: roles.find(r => r.role_id === u.role_id)?.libelle ?? u.role_id
    }));
  });

  columns: GridColumn[] = [
    { field: 'login', header: 'Login', valueGetter: (u) => u.login, cellClass: 'font-mono' },
    { field: 'nomComplet', header: 'Nom Prénom', valueGetter: (u) => `${u.nom} ${u.prenom}`, type: 'link', routerLink: (u) => ['/admin/utilisateurs', u.user_id], cellClass: 'font-medium' },
    { field: 'email', header: 'Email', valueGetter: (u) => u.email ?? '—' },
    { field: 'roleName', header: 'Rôle', type: 'badge', badgeColor: () => 'badge-info' },
    { field: 'site', header: 'Site', valueGetter: (u) => u.site_principal_id ?? '—' },
    {
      field: 'actif', header: 'Statut', type: 'badge',
      valueGetter: (u) => u.actif ? 'Actif' : 'Inactif',
      badgeColor: (u) => u.actif ? 'badge-success' : 'badge-danger'
    }
  ];

  rowActions: GridRowAction[] = [];

  ngOnInit() {
    this.http.get<Utilisateur[]>('/api/utilisateurs').subscribe((u) => this.users.set(u));
    this.http.get<Role[]>('/api/roles').subscribe((r) => this.roles.set(r));
  }
}
