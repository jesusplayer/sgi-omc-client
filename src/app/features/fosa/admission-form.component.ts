import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Patient, Lit } from '../../core/models';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-admission-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      title="🏥 Nouvelle admission"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
      saveLabel="✅ Admettre"
      alignActions="between"
      [saving]="saving()"
    ></app-generic-form>
  `,
})
export class AdmissionFormComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  patients = signal<Patient[]>([]);
  freeLits = signal<Lit[]>([]);
  saving = signal(false);

  form: any = { patient_id: '', lit_id: '', etat_entree: 'STABLE', diagnostic_entree: '' };

  currentSchema = computed(() => {
    return [
      {
        gridColumns: 2,
        fields: [
          {
            key: 'patient_id', label: 'Patient', type: 'select', required: true,
            options: this.patients().map(p => ({
              value: p.patient_id,
              label: `${p.accreditation_id} — ${p.nom} ${p.prenom}`
            }))
          },
          {
            key: 'lit_id', label: 'Lit', type: 'select', required: true,
            options: this.freeLits().map(l => ({
              value: l.lit_id,
              label: `${l.numero_lit} (${l.categorie_id})`
            }))
          },
          {
            key: 'etat_entree', label: "État à l'entrée", type: 'select', required: true,
            options: [
              { value: 'STABLE', label: 'Stable' },
              { value: 'GRAVE', label: 'Grave' },
              { value: 'CRITIQUE', label: 'Critique' },
              { value: 'INCONSCIENT', label: 'Inconscient' }
            ]
          },
          { key: 'diagnostic_entree', label: "Diagnostic d'entrée", type: 'text' }
        ]
      }
    ] as FormSection[];
  });

  ngOnInit() {
    this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
    this.http.get<Lit[]>('/api/lits').subscribe((l) => this.freeLits.set(l.filter((x) => x.statut === 'LIBRE')));
  }

  onSubmit() {
    if (!this.form.patient_id || !this.form.lit_id || !this.form.etat_entree) return;

    this.saving.set(true);
    const body = {
      ...this.form,
      fosa_id: this.auth.site()?.site_id,
      medecin_id: this.auth.user()?.user_id,
      admission_datetime: new Date().toISOString(),
      oxygene_requis: false,
      reanimation: false,
      transfusion: false
    };

    this.http.post('/api/prises-en-charge', body).subscribe({
      next: () => {
        // Mark lit as occupied
        this.http.put(`/api/lits/${this.form.lit_id}`, { statut: 'OCCUPE', updated_at: new Date().toISOString() }).subscribe();
        this.router.navigate(['/fosa']);
      },
      error: () => this.saving.set(false),
    });
  }

  onCancel() {
    this.router.navigate(['/fosa']);
  }
}
