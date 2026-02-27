import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Role } from '@app/core/models';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🛡️ Rôles & Permissions</h1>
        <p>Gestion des niveaux d'accès et droits des utilisateurs</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Rôles Systèmes ({{ roles().length }})</h3>
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code Rôle</th>
              <th>Libellé</th>
              <th>Description</th>
              <th>Niveau d'Accès</th>
              <th>Statut</th>
              <th style="width:150px">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (role of roles(); track role.role_id) {
              <tr [class.opacity-50]="!role.actif">
                <td class="font-medium"><a [routerLink]="['/admin/roles', role.role_id]" class="cell-link">{{ role.code_role }}</a></td>
                <td>{{ role.libelle }}</td>
                <td class="text-muted">{{ role.description }}</td>
                <td>
                  <span class="badge badge-neutral">Niv {{ role.niveau_acces }}</span>
                </td>
                <td>
                  <span class="badge" [class]="role.actif ? 'badge-success' : 'badge-neutral'">
                    {{ role.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <a [routerLink]="['/admin/roles', role.role_id]" class="btn btn-sm btn-outline">👁️ Détail</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucun rôle trouvé</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .opacity-50 { opacity: 0.6; }
    .font-medium { font-weight: 500; }
  `]
})
export class RoleListComponent implements OnInit {
  private http = inject(HttpClient);
  roles = signal<Role[]>([]);

  ngOnInit() {
    this.http.get<Role[]>('/api/roles').subscribe((r) => {
      // Sort by niveau d'accès descending
      const sorted = r.sort((a, b) => b.niveau_acces - a.niveau_acces);
      this.roles.set(sorted);
    });
  }
}
