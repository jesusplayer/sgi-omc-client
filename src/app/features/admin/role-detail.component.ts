import { Component, inject, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { Role } from '@app/core/models';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (role(); as r) {
      <div class="page-header">
        <div>
          <h1>{{ r.libelle }}</h1>
          <p class="text-muted">Code: {{ r.code_role }}</p>
        </div>
        <div class="page-actions">
          <a [routerLink]="['/admin/roles', r.role_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1.5rem">
        <div class="card">
          <div class="card-header">
            <h3>Informations Générales</h3>
            <span class="badge" [class]="r.actif ? 'badge-success' : 'badge-neutral'">
              {{ r.actif ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <div class="card-body detail-grid">
            <div class="detail-item" style="grid-column: 1 / -1">
              <span class="detail-label">Description</span>
              <span class="detail-value">{{ r.description }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Niveau d'Accès</span>
              <span class="detail-value font-medium">{{ r.niveau_acces }}</span>
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
                    <span class="badge" [class.badge-success]="r.permissions![mod]?.read" [class.badge-neutral]="!r.permissions![mod]?.read">Lecture</span>
                    <span class="badge" [class.badge-primary]="r.permissions![mod]?.write" [class.badge-neutral]="!r.permissions![mod]?.write">Écriture</span>
                    @if (r.permissions![mod]?.delete) {
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
export class RoleDetailComponent {
  item = input<Role | null>(null);

  role = computed(() => this.item());

  permissionsKeys = computed(() => {
    const r = this.role();
    if (!r || !r.permissions) return [];
    return Object.keys(r.permissions);
  });

  hasWildcard = computed(() => {
    const r = this.role();
    return r?.permissions?.['*'] !== undefined;
  });
}
