import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Patient } from '../../core/models';

@Component({
    selector: 'app-consultation-form',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🩺 Nouvelle consultation</h1>
        <p>UC-05/06/07 — Consultation médicale au PMA</p>
      </div>
    </div>

    <form (ngSubmit)="onSubmit()" class="card">
      <h3 style="margin-bottom:1rem">👤 Patient</h3>
      <div class="form-group">
        <label>Patient *</label>
        <select class="form-control" [(ngModel)]="form.patient_id" name="patient_id" required>
          <option value="">-- Sélectionner --</option>
          @for (p of patients(); track p.patient_id) {
            <option [value]="p.patient_id">{{ p.accreditation_id }} — {{ p.nom }} {{ p.prenom }}</option>
          }
        </select>
      </div>

      <h3 style="margin:1.5rem 0 0.75rem">📋 Motif & Symptômes</h3>
      <div class="form-group">
        <label>Motif de consultation *</label>
        <textarea class="form-control" [(ngModel)]="form.motif" name="motif" required rows="2" placeholder="Décrire le motif…"></textarea>
      </div>

      <h3 style="margin:1.5rem 0 0.75rem">🩸 Signes vitaux</h3>
      <div class="grid grid-3">
        <div class="form-group">
          <label>TA Systolique (mmHg)</label>
          <input class="form-control" type="number" [(ngModel)]="form.ta_systolique" name="ta_systolique" placeholder="120" />
        </div>
        <div class="form-group">
          <label>TA Diastolique (mmHg)</label>
          <input class="form-control" type="number" [(ngModel)]="form.ta_diastolique" name="ta_diastolique" placeholder="80" />
        </div>
        <div class="form-group">
          <label>Pouls (bpm)</label>
          <input class="form-control" type="number" [(ngModel)]="form.pouls" name="pouls" placeholder="72" />
        </div>
        <div class="form-group">
          <label>Température (°C)</label>
          <input class="form-control" type="number" step="0.1" [(ngModel)]="form.temperature" name="temperature" placeholder="36.5" />
        </div>
        <div class="form-group">
          <label>SpO2 (%)</label>
          <input class="form-control" type="number" [(ngModel)]="form.saturation_o2" name="saturation_o2" placeholder="98" />
        </div>
        <div class="form-group">
          <label>Score Glasgow</label>
          <input class="form-control" type="number" min="3" max="15" [(ngModel)]="form.glasgow_score" name="glasgow_score" placeholder="15" />
        </div>
      </div>

      <h3 style="margin:1.5rem 0 0.75rem">💊 Diagnostic & Soins</h3>
      <div class="grid grid-2">
        <div class="form-group">
          <label>Diagnostic présomptif</label>
          <input class="form-control" [(ngModel)]="form.diagnostic_presomptif" name="diagnostic_presomptif" />
        </div>
        <div class="form-group">
          <label>Décision *</label>
          <select class="form-control" [(ngModel)]="form.decision" name="decision" required>
            <option value="RETOUR_POSTE">✅ Retour au poste</option>
            <option value="OBSERVATION">👁️ Observation</option>
            <option value="EVACUATION_FOSA">🚑 Évacuation FOSA</option>
            <option value="HOSPITALISATION">🏥 Hospitalisation</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Soins prodigués</label>
        <textarea class="form-control" [(ngModel)]="form.soins_prodigues" name="soins_prodigues" rows="2" placeholder="Soins administrés…"></textarea>
      </div>

      <div class="flex gap-2 justify-between" style="margin-top:1.5rem">
        <button type="button" class="btn btn-secondary" (click)="router.navigate(['/pma'])">← Retour</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? '⏳…' : '✅ Enregistrer la consultation' }}
        </button>
      </div>
    </form>
  `,
})
export class ConsultationFormComponent implements OnInit {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    router = inject(Router);
    patients = signal<Patient[]>([]);
    saving = signal(false);

    form: any = {
        patient_id: '', motif: '', ta_systolique: null, ta_diastolique: null,
        pouls: null, temperature: null, saturation_o2: null, glasgow_score: null,
        diagnostic_presomptif: '', soins_prodigues: '', decision: 'RETOUR_POSTE',
    };

    ngOnInit() {
        this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
    }

    onSubmit() {
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
}
