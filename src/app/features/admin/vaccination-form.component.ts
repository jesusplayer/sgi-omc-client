import { Component, inject, signal, OnInit, ChangeDetectorRef, input, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-vaccination-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier vaccination' : '➕ Nouvelle vaccination'"
      [subtitle]="isEdit() ? 'Modifier les informations de la vaccination' : 'Ajouter une nouvelle vaccination au référentiel'"
      maxWidth="600px"
      [schema]="formSchema"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
    ></app-generic-form>
  `,
})
export class VaccinationFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);
  private cdr = inject(ChangeDetectorRef);

  isEdit = signal(false);
  vaccinationId = '';

  formSchema: FormSection[] = [
    {
      fields: [
        { key: 'libelle', label: 'Libellé', type: 'text', required: true, placeholder: 'Ex: Fièvre jaune' },
        { key: 'obligatoire', label: 'Vaccination obligatoire (Requise lors du criblage PSF)', type: 'checkbox' },
        { key: 'actif', label: 'Actif', type: 'checkbox' }
      ]
    }
  ];

  form = { libelle: '', obligatoire: false, actif: true };

  ngOnInit() {
    const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.vaccinationId = id;
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
      this.http.put(`/api/vaccinations/${this.vaccinationId}`, this.form).subscribe(() => {
        this.router.navigate(['/admin/vaccinations']);
      });
    } else {
      this.http.post('/api/vaccinations', { ...this.form, created_at: new Date().toISOString() }).subscribe(() => {
        this.router.navigate(['/admin/vaccinations']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/vaccinations']);
  }
}
