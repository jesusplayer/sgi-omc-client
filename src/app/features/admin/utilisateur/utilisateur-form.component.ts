import { ChangeDetectionStrategy, Component, inject, input, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { GenericFormComponent } from '../../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../../shared/models/form.models';
import { Role, Site } from '../../../core/models';

@Component({
    selector: 'app-utilisateur-form',
    standalone: true,
    imports: [GenericFormComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <app-generic-form
      [title]="editMode() ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'"
      [subtitle]="editMode() ? 'Mise à jour d\\'un compte existant' : 'Création d\\'un nouveau profil d\\'accès'"
      [schema]="schema()"
      [(formData)]="formData"
      (save)="onSave()"
      (cancel)="onCancel()"
    >
    </app-generic-form>
  `
})
export class UtilisateurFormComponent {
    private router = inject(Router);
    private http = inject(HttpClient);

    item = input<any | null>(null);

    editMode = computed(() => !!this.item()?.user_id);
    formData: any = { actif: true };

    roles = toSignal(this.http.get<Role[]>('/api/roles'), { initialValue: [] });
    sites = toSignal(this.http.get<Site[]>('/api/sites'), { initialValue: [] });

    schema = computed<FormSection[]>(() => {
        const isEdit = this.editMode();
        const roleOptions = this.roles().map(r => ({ value: r.role_id, label: r.libelle }));
        const siteOptions = this.sites().map(s => ({ value: s.site_id, label: s.nom }));

        return [
            {
                fields: [
                    { key: 'login', label: 'Login', type: 'text', required: true },
                    {
                        key: 'password',
                        label: isEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe',
                        type: 'text',
                        required: !isEdit
                    }
                ],
                gridColumns: 2
            },
            {
                title: 'Informations Personnelles',
                fields: [
                    { key: 'nom', label: 'Nom', type: 'text', required: true },
                    { key: 'prenom', label: 'Prénom', type: 'text', required: true },
                    { key: 'email', label: 'Email', type: 'text', required: false },
                    { key: 'telephone', label: 'Téléphone', type: 'text', required: false }
                ],
                gridColumns: 2
            },
            {
                title: 'Affectations & Rôles',
                fields: [
                    { key: 'role_id', label: 'Rôle', type: 'select', options: roleOptions, required: true },
                    { key: 'site_principal_id', label: 'Site Principal', type: 'select', options: siteOptions, required: false },
                    { key: 'actif', label: 'Compte Actif', type: 'checkbox' }
                ],
                gridColumns: 2
            }
        ];
    });

    constructor() {
        effect(() => {
            const rawItem = this.item();
            if (rawItem) {
                this.formData = { ...rawItem, password: '' };
            } else {
                this.formData = { actif: true };
            }
        });
    }

    onSave() {
        if (this.editMode()) {
            const payload = { ...this.formData };
            if (!payload.password) delete payload.password;

            this.http.put(`/api/utilisateurs/${this.item()?.user_id}`, payload).subscribe(() => {
                this.router.navigate(['/admin/utilisateurs']);
            });
        } else {
            this.http.post('/api/utilisateurs', this.formData).subscribe(() => {
                this.router.navigate(['/admin/utilisateurs']);
            });
        }
    }

    onCancel() {
        this.router.navigate(['/admin/utilisateurs']);
    }
}
