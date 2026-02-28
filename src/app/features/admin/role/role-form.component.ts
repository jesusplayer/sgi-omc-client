import { Component, inject, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Role } from '@app/core/models';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? 'Modifier le Rôle' : 'Nouveau Rôle' }}</h1>
        <p class="text-muted">{{ isEdit() ? 'Mise à jour des accès et permissions' : 'Création d\\'un nouveau niveau d\\'accès' }}</p>
      </div>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
      
      <!-- GENERAL INFO -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Informations Générales</h3>
        <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label>Code Rôle</label>
              <input type="text" class="form-control" formControlName="code_role" [readOnly]="isEdit()" />
            </div>
            
            <div class="form-group">
              <label>Libellé</label>
              <input type="text" class="form-control" formControlName="libelle" />
            </div>
            
            <div class="form-group">
              <label>Niveau d'Accès (1-5)</label>
              <input type="number" class="form-control" formControlName="niveau_acces" min="1" max="5" />
            </div>

            <div class="form-group flex items-center mt-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" formControlName="actif" />
                <span>Rôle Actif</span>
              </label>
            </div>

            <div class="form-group" style="grid-column: 1 / -1">
              <label>Description</label>
              <textarea class="form-control" formControlName="description" rows="2"></textarea>
            </div>
        </div>
      </div>

      <!-- PERMISSIONS -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Permissions (RBAC)</h3>
        
        <div formArrayName="permissionsList" class="flex flex-col gap-4">
          @for (perm of permissionsList.controls; track $index) {
            <div [formGroupName]="$index" class="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">
              
              <div class="form-group mb-0 flex-1">
                <label class="text-xs text-muted block mb-1">Module</label>
                <input type="text" class="form-control" formControlName="module" placeholder="ex: patient, consultation, ou *" />
              </div>
              
              <div class="flex items-center gap-4 mt-5">
                <label class="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" formControlName="read" /> <span>Lecture</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" formControlName="write" /> <span>Écriture</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" formControlName="delete" /> <span class="text-red-500">Suppression</span>
                </label>
                <button type="button" class="btn btn-outline border-red-500 text-red-500 hover:bg-red-50 ml-4" (click)="removePermission($index)">Retirer</button>
              </div>
            </div>
          }
        </div>

        <button type="button" class="btn btn-outline mt-4" (click)="addPermission()">+ Ajouter un module de permission</button>
      </div>

      <!-- ACTIONS -->
      <div class="flex gap-2">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">Annuler</button>
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Enregistrer</button>
      </div>

    </form>
  `,
    styles: [`
    .flex { display: flex; } .flex-col { flex-direction: column; } .gap-4 { gap: 1rem; } .gap-6 { gap: 1.5rem; }
    .items-center { align-items: center; } .gap-1 { gap: 0.25rem; } .gap-2 { gap: 0.5rem; } 
    .mb-0 { margin-bottom: 0; } .mb-1 { margin-bottom: 0.25rem; } .mb-4 { margin-bottom: 1rem; } .mt-4 { margin-top: 1rem; } .mt-5 { margin-top: 1.25rem; } .mt-6 { margin-top: 1.5rem; }
    .text-xs { font-size: 0.75rem; } .text-lg { font-size: 1.125rem; } .font-semibold { font-weight: 600; }
    .border { border-width: 1px; } .rounded { border-radius: 4px; } .p-4 { padding: 1rem; } .p-6 { padding: 1.5rem; }
    .flex-1 { flex: 1; } .cursor-pointer { cursor: pointer; } .text-red-500 { color: #ef4444; } .border-red-500 { border-color: #ef4444; }
    .bg-gray-50 { background-color: #f9fafb; } .border-gray-200 { border-color: #e5e7eb; }
    .grid { display: grid; } .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  `]
})
export class RoleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private http = inject(HttpClient);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    isEdit = signal(false);
    roleId = '';

    form = this.fb.group({
        code_role: ['', Validators.required],
        libelle: ['', Validators.required],
        niveau_acces: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
        description: [''],
        actif: [true],
        permissionsList: this.fb.array([])
    });

    get permissionsList() {
        return this.form.get('permissionsList') as FormArray;
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit.set(true);
            this.roleId = id;
            this.http.get<Role>(`/api/roles/${id}`).subscribe(role => {
                this.form.patchValue({
                    code_role: role.code_role,
                    libelle: role.libelle,
                    niveau_acces: role.niveau_acces,
                    description: role.description,
                    actif: role.actif
                });

                // Parse permissions Record into FormArray
                if (role.permissions) {
                    Object.keys(role.permissions).forEach(moduleKey => {
                        const perms = role.permissions[moduleKey];
                        this.permissionsList.push(this.fb.group({
                            module: [moduleKey, Validators.required],
                            read: [!!perms.read],
                            write: [!!perms.write],
                            delete: [!!perms.delete]
                        }));
                    });
                }
            });
        } else {
            // Add one empty permission by default
            this.addPermission();
        }
    }

    addPermission() {
        this.permissionsList.push(this.fb.group({
            module: ['', Validators.required],
            read: [false],
            write: [false],
            delete: [false]
        }));
    }

    removePermission(index: number) {
        this.permissionsList.removeAt(index);
    }

    onSubmit() {
        if (this.form.invalid) return;

        const val = this.form.value;

        // Convert permissionsList back to Record<string, Record<string, boolean>>
        const permissionsMap: Record<string, Record<string, boolean>> = {};
        if (val.permissionsList) {
            val.permissionsList.forEach((p: any) => {
                if (p.module) {
                    permissionsMap[p.module] = {
                        read: p.read,
                        write: p.write,
                        delete: p.delete
                    };
                }
            });
        }

        const payload: Partial<Role> = {
            code_role: val.code_role as any,
            libelle: val.libelle!,
            niveau_acces: val.niveau_acces!,
            description: val.description || '',
            actif: val.actif!,
            permissions: permissionsMap
        };

        if (this.isEdit()) {
            this.http.put(`/api/roles/${this.roleId}`, payload).subscribe(() => {
                this.router.navigate(['/admin/roles']);
            });
        } else {
            payload.role_id = 'role-' + Date.now(); // mock ID generation
            this.http.post('/api/roles', payload).subscribe(() => {
                this.router.navigate(['/admin/roles']);
            });
        }
    }

    onCancel() {
        this.router.navigate(['/admin/roles']);
    }
}
