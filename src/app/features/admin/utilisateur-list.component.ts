import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Utilisateur, Role } from '../../core/models';

@Component({
  selector: 'app-utilisateur-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>👥 Gestion des utilisateurs</h1>
        <p>Administration des comptes et rôles</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Utilisateurs ({{ filtered().length }})</h3>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr><th>Login</th><th>Nom Prénom</th><th>Email</th><th>Rôle</th><th>Site</th><th>Statut</th></tr>
          </thead>
          <tbody>
            @for (u of filtered(); track u.user_id) {
              <tr>
                <td><code>{{ u.login }}</code></td>
                <td class="font-medium">{{ u.nom }} {{ u.prenom }}</td>
                <td class="text-sm">{{ u.email ?? '—' }}</td>
                <td><span class="badge badge-info">{{ getRoleName(u.role_id) }}</span></td>
                <td class="text-sm">{{ u.site_principal_id ?? '—' }}</td>
                <td><span class="badge" [class]="u.actif ? 'badge-success' : 'badge-danger'">{{ u.actif ? 'Actif' : 'Inactif' }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class UtilisateurListComponent implements OnInit {
  private http = inject(HttpClient);
  users = signal<Utilisateur[]>([]);
  roles = signal<Role[]>([]);
  filtered = signal<Utilisateur[]>([]);
  searchTerm = signal('');

  ngOnInit() {
    this.http.get<Utilisateur[]>('/api/utilisateurs').subscribe((u) => { this.users.set(u); this.filtered.set(u); });
    this.http.get<Role[]>('/api/roles').subscribe((r) => this.roles.set(r));
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    const term = this.searchTerm().toLowerCase();
    if (!term) { this.filtered.set(this.users()); return; }
    this.filtered.set(this.users().filter((u) =>
      u.login.toLowerCase().includes(term) ||
      u.nom.toLowerCase().includes(term) ||
      u.prenom.toLowerCase().includes(term) ||
      (u.email?.toLowerCase().includes(term) ?? false)
    ));
  }

  getRoleName(id: string): string { return this.roles().find((r) => r.role_id === id)?.libelle ?? id; }
}
