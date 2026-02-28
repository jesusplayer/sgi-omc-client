import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Role } from '../../../core/models';
import { switchMap, map, catchError, of } from 'rxjs';

@Component({
    selector: 'app-utilisateur-detail',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>Détail Utilisateur</h1>
        <p>{{ itemWithRole()?.login || 'Profil' }}</p>
      </div>
    </div>
    
    @if (itemWithRole(); as data) {
      <div class="card p-6 outline-none">
          <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Informations du Compte</h3>
          <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                   <span class="block text-sm font-medium text-gray-500">Login</span>
                   <span class="block font-medium">{{ data.login }}</span>
              </div>
              <div>
                   <span class="block text-sm font-medium text-gray-500">Nom Prénom</span>
                   <span class="block font-medium">{{ data.nom }} {{ data.prenom }}</span>
              </div>
              <div>
                   <span class="block text-sm font-medium text-gray-500">Email</span>
                   <span class="block font-medium">{{ data.email || '—' }}</span>
              </div>
              <div>
                   <span class="block text-sm font-medium text-gray-500">Téléphone</span>
                   <span class="block font-medium">{{ data.telephone || '—' }}</span>
              </div>
              <div>
                   <span class="block text-sm font-medium text-gray-500">Rôle Associé</span>
                   <span class="badge badge-info mt-1 inline-block">{{ data.roleLabel }}</span>
              </div>
              <div>
                   <span class="block text-sm font-medium text-gray-500">Statut du Compte</span>
                   <span class="badge mt-1 inline-block" [class.badge-success]="data.actif" [class.badge-danger]="!data.actif">
                     {{ data.actif ? 'Actif' : 'Inactif' }}
                   </span>
              </div>
          </div>
          
          <h3 class="mb-4 mt-8 text-lg font-semibold text-gray-800 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700 pt-6">Système</h3>
          <div class="grid grid-cols-2 gap-4">
              <div>
                   <span class="block text-sm font-medium text-gray-500">Domaine</span>
                   <span class="block font-medium">{{ data.site_principal_id || 'Tous Systèmes' }}</span>
              </div>
              <div>
                   <span class="block text-sm font-medium text-gray-500">Création</span>
                   <span class="block font-mono text-sm mt-1">{{ data.user_id }}</span>
              </div>
          </div>
          
          <div class="flex gap-2 mt-8">
              <button class="btn btn-secondary" (click)="onBack()">← Retour</button>
              <button class="btn btn-primary" (click)="onEdit()">Modifier</button>
          </div>
      </div>
    }
  `
})
export class UtilisateurDetailComponent {
    private router = inject(Router);
    private http = inject(HttpClient);

    item = input<any | null>(null);

    itemWithRole = toSignal(
        toObservable(this.item).pipe(
            switchMap(rawItem => {
                if (!rawItem) return of(null);
                if (rawItem.role_id) {
                    return this.http.get<Role>(`/api/roles/${rawItem.role_id}`).pipe(
                        map(role => ({ ...rawItem, roleLabel: role.libelle })),
                        catchError(() => of({ ...rawItem, roleLabel: rawItem.role_id }))
                    );
                }
                return of({ ...rawItem });
            })
        )
    );

    onEdit() {
        this.router.navigate(['/admin/utilisateurs', this.item()?.user_id, 'editer']);
    }

    onBack() {
        this.router.navigate(['/admin/utilisateurs']);
    }
}
