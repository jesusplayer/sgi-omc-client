import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Patient } from '../../core/models';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      title="🩺 Nouvelle consultation"
      subtitle="UC-05/06/07 — Consultation médicale au PMA"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
      saveLabel="✅ Enregistrer la consultation"
      alignActions="between"
      [saving]="saving()"
    ></app-generic-form>
  `,
})
export class ConsultationFormComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  patients = signal<Patient[]>([]);
  saving = signal(false);

  form: any = {
    patient_id: '', motif: '', ta_systolique: null, ta_diastolique: null,
    pouls: null, temperature: null, saturation_o2: null, glasgow_score: null,
    diagnostic_presomptif: '', soins_prodigues: '', decision: 'RETOUR_POSTE',
  };

  currentSchema = computed(() => {
    return [
      {
        title: '👤 Patient',
        fields: [
          {
            key: 'patient_id',
            label: 'Patient',
            type: 'select',
            required: true,
            options: this.patients().map(p => ({
              value: p.patient_id,
              label: `${p.accreditation_id} — ${p.nom} ${p.prenom}`
            }))
          }
        ]
      },
      {
        title: '📋 Motif & Symptômes',
        fields: [
          { key: 'motif', label: 'Motif de consultation', type: 'textarea', required: true, placeholder: 'Décrire le motif…' }
        ]
      },
      {
        title: '🩸 Signes vitaux',
        gridColumns: 3,
        fields: [
          { key: 'ta_systolique', label: 'TA Systolique (mmHg)', type: 'number', placeholder: '120' },
          { key: 'ta_diastolique', label: 'TA Diastolique (mmHg)', type: 'number', placeholder: '80' },
          { key: 'pouls', label: 'Pouls (bpm)', type: 'number', placeholder: '72' },
          { key: 'temperature', label: 'Température (°C)', type: 'number', step: '0.1', placeholder: '36.5' },
          { key: 'saturation_o2', label: 'SpO2 (%)', type: 'number', placeholder: '98' },
          { key: 'glasgow_score', label: 'Score Glasgow', type: 'number', min: 3, max: 15, placeholder: '15' }
        ]
      },
      {
        title: '💊 Diagnostic & Soins',
        gridColumns: 2,
        fields: [
          { key: 'diagnostic_presomptif', label: 'Diagnostic présomptif', type: 'text' },
          {
            key: 'decision', label: 'Décision', type: 'select', required: true,
            options: [
              { value: 'RETOUR_POSTE', label: '✅ Retour au poste' },
              { value: 'OBSERVATION', label: '👁️ Observation' },
              { value: 'EVACUATION_FOSA', label: '🚑 Évacuation FOSA' },
              { value: 'HOSPITALISATION', label: '🏥 Hospitalisation' }
            ]
          }
        ]
      },
      {
        fields: [
          { key: 'soins_prodigues', label: 'Soins prodigués', type: 'textarea', placeholder: 'Soins administrés…' }
        ]
      }
    ] as FormSection[];
  });

  ngOnInit() {
    this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
  }

  onSubmit() {
    if (!this.form.patient_id || !this.form.motif || !this.form.decision) return;

    this.saving.set(true);
    const body = {
      ...this.form,
      site_id: this.auth.site()?.site_id,
      agent_id: this.auth.user()?.user_id,
      heure_arrivee: new Date().toISOString(),
      heure_consultation: new Date().toISOString(),
    };
    this.http.post('/api/consultations', body).subscribe({
      next: () => this.router.navigate(['/pma']),
      error: () => this.saving.set(false),
    });
  }

  onCancel() {
    this.router.navigate(['/pma']);
  }
}
