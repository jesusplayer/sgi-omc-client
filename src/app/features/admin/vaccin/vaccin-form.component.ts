import { Component, inject, signal, OnInit, ChangeDetectorRef, input, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { GenericFormComponent } from '../../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../../shared/models/form.models';

@Component({
    selector: 'app-vaccin-form',
    standalone: true,
    imports: [GenericFormComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier vaccin' : '➕ Nouveau vaccin'"
      [subtitle]="isEdit() ? 'Modifier les informations du vaccin' : 'Ajouter un nouveau vaccin au référentiel'"
      maxWidth="600px"
      [schema]="formSchema"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
    ></app-generic-form>
  `,
})
export class VaccinFormComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    item = input<any | null>(null);
    private cdr = inject(ChangeDetectorRef);

    isEdit = signal(false);
    vaccinId = '';

    formSchema: FormSection[] = [
        {
            fields: [
                { key: 'libelle', label: 'Libellé', type: 'text', required: true, placeholder: 'Ex: Fièvre jaune' },
                { key: 'obligatoire', label: 'Vaccin obligatoire (Requis lors du criblage PSF)', type: 'checkbox' },
                { key: 'actif', label: 'Actif', type: 'checkbox' }
            ]
        }
    ];

    form = { libelle: '', obligatoire: false, actif: true };

    ngOnInit() {
        const id = this.item() ? (this.item()?.vaccin_id || this.item()?.id) : null;
        if (id) {
            this.isEdit.set(true);
            this.vaccinId = id;
            const v = this.item();
            if (v) {
                this.form = { libelle: v.libelle, obligatoire: v.obligatoire, actif: v.actif };
                this.cdr.markForCheck();
            }
        }
    }

    onSubmit() {
        if (!this.form.libelle) return;
        if (this.isEdit()) {
            this.http.put(`/api/vaccins/${this.vaccinId}`, this.form).subscribe(() => {
                this.router.navigate(['/admin/vaccins']);
            });
        } else {
            this.http.post('/api/vaccins', { ...this.form, created_at: new Date().toISOString() }).subscribe(() => {
                this.router.navigate(['/admin/vaccins']);
            });
        }
    }

    onCancel() {
        this.router.navigate(['/admin/vaccins']);
    }
}
