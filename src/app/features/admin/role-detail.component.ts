import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { Role } from '@app/core/models';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (role()) {
      <div class="page-header">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <a routerLink="/admin/roles" class="text-muted" style="text-decoration:none">← Retour aux rôles</a>
          </div>
          <h1>{{ role()?.libelle }}</h1>
          <p class="text-muted">Code: {{ role()?.code_role }}</p>
        </div>
        <div class="page-actions">
          <!-- Only ADMIN role can be disabled if it's not the last one, but for simplicity we allow disabling EXCEPT ADMIN itself or we follow specs: "Désactiver Rôle ADMIN uniquement". Actually, MLD says no creation/deletion. -->
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1.5rem">
        <div class="card">
          <div class="card-header">
            <h3>Informations Générales</h3>
            <span class="badge" [class]="role()?.actif ? 'badge-success' : 'badge-neutral'">
              {{ role()?.actif ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <div class="card-body detail-grid">
            <div class="detail-item" style="grid-column: 1 / -1">
              <span class="detail-label">Description</span>
              <span class="detail-value">{{ role()?.description }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Niveau d'Accès</span>
              <span class="detail-value font-medium">{{ role()?.niveau_acces }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Permissions (RBAC)</h3>
          </div>
          <div class="card-body">
            @if (hasWildcard()) {
              <div class="alert alert-warning mb-3">
                <strong>Attention:</strong> Ce rôle possède l'accès total au système (*).
              </div>
            }
            <div class="permissions-list">
              @for (mod of permissionsKeys(); track mod) {
                <div class="perm-row">
                  <div class="perm-module">{{ mod === '*' ? 'TOUT LE SYSTÈME' : mod | uppercase }}</div>
                  <div class="perm-actions">
                    <span class="badge" [class.badge-success]="role()?.permissions![mod]?.read" [class.badge-neutral]="!role()?.permissions![mod]?.read">Lecture</span>
                    <span class="badge" [class.badge-primary]="role()?.permissions![mod]?.write" [class.badge-neutral]="!role()?.permissions![mod]?.write">Écriture</span>
                    @if (role()?.permissions![mod]?.delete) {
                      <span class="badge badge-danger">Suppression</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="loading">Chargement...</div>
    }
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-value { font-size: 1rem; color: var(--text-primary); }
    .font-medium { font-weight: 500;}
    .flex { display: flex; } .items-center { align-items: center; } .gap-2 { gap: 0.5rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 0.75rem; }
    .permissions-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .perm-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-body); border-radius: 4px; border: 1px solid var(--border-color); }
    .perm-module { font-weight: 600; font-size: 0.9em; }
    .perm-actions { display: flex; gap: 0.25rem; }
  `]
})
export class RoleDetailComponent implements OnInit {
  private http = inject(HttpClient);
  item = input<any | null>(null);

  role = computed(() => this.item() as Role | null);

  permissionsKeys = computed(() => {
    const r = this.role();
    if (!r || !r.permissions) return [];
    return Object.keys(r.permissions);
  });

  hasWildcard = computed(() => {
    const r = this.role();
    return r?.permissions?.['*'] !== undefined;
  });

  ngOnInit() {
    const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (id) {
      
    }
  }
}
