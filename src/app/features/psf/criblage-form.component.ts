import { Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Patient } from '../../core/models';

@Component({
    selector: 'app-criblage-form',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🩺 Criblage médical</h1>
        <p>UC-02 — Criblage au Point de Sécurité Frontière</p>
      </div>
    </div>

    @if (patient()) {
      <div class="card" style="margin-bottom:1rem">
        <div class="flex items-center gap-4">
          <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:#6366f1;font-size:1.5rem">👤</div>
          <div>
            <div class="font-semibold">{{ patient()!.nom }} {{ patient()!.prenom }}</div>
            <div class="text-sm text-muted">{{ patient()!.accreditation_id }} · {{ patient()!.nationalite }} · {{ patient()!.type_personne }}</div>
          </div>
        </div>
      </div>
    }

    <form (ngSubmit)="onSubmit()" class="card">
      <div class="grid grid-2">
        <div class="form-group">
          <label>N° de vol *</label>
          <input class="form-control" [(ngModel)]="form.numero_vol" name="numero_vol" required placeholder="AF0572" />
        </div>
        <div class="form-group">
          <label>Compagnie aérienne *</label>
          <input class="form-control" [(ngModel)]="form.compagnie_aerienne" name="compagnie_aerienne" required placeholder="Air France" />
        </div>
        <div class="form-group">
          <label>Aéroport d'origine *</label>
          <input class="form-control" [(ngModel)]="form.aeroport_origine" name="aeroport_origine" required placeholder="CDG" />
        </div>
        <div class="form-group">
          <label>N° de siège</label>
          <input class="form-control" [(ngModel)]="form.numero_siege" name="numero_siege" placeholder="12A" />
        </div>
        <div class="form-group">
          <label>Date d'arrivée *</label>
          <input class="form-control" type="datetime-local" [(ngModel)]="form.date_arrivee" name="date_arrivee" required />
        </div>
        <div class="form-group">
          <label>Température (°C) *</label>
          <input class="form-control" type="number" step="0.1" [(ngModel)]="form.temperature_criblage" name="temperature_criblage" required placeholder="36.5" />
        </div>
      </div>

      <div class="form-group" style="margin-top:1rem">
        <label class="checkbox-label">
          <input type="checkbox" [(ngModel)]="form.symptomes_declares" name="symptomes_declares" />
          Symptômes déclarés
        </label>
      </div>

      @if (form.symptomes_declares) {
        <div class="form-group">
          <label>Détail des symptômes</label>
          <textarea class="form-control" [(ngModel)]="form.detail_symptomes" name="detail_symptomes" rows="2" placeholder="Céphalées, fatigue, toux…"></textarea>
        </div>
      }

      <div class="form-group" style="margin-top:1rem">
        <label>Décision frontière *</label>
        <select class="form-control" [(ngModel)]="form.decision_frontiere" name="decision_frontiere" required>
          <option value="AUTORISATION">✅ Autorisation</option>
          <option value="REFERENCE_TEST">🧪 Référence test</option>
          <option value="ISOLEMENT">⚠️ Isolement</option>
          <option value="REFOULEMENT">🚫 Refoulement</option>
        </select>
      </div>

      @if (form.decision_frontiere !== 'AUTORISATION') {
        <div class="form-group">
          <label>Motif de la décision</label>
          <textarea class="form-control" [(ngModel)]="form.motif_decision" name="motif_decision" rows="2"></textarea>
        </div>
      }

      <div class="flex gap-2 justify-between" style="margin-top:1.5rem">
        <button type="button" class="btn btn-secondary" (click)="router.navigate(['/psf'])">← Retour</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? '⏳…' : '✅ Valider le criblage' }}
        </button>
      </div>
    </form>
  `,
    styles: [`
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;
      input { width: 16px; height: 16px; accent-color: var(--accent); } }
  `],
})
export class CriblageFormComponent implements OnInit {
    id = input<string>();
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    router = inject(Router);
    patient = signal<Patient | null>(null);
    saving = signal(false);

    form: any = {
        numero_vol: '', compagnie_aerienne: '', aeroport_origine: '', numero_siege: '',
        date_arrivee: new Date().toISOString().slice(0, 16),
        temperature_criblage: 36.5, symptomes_declares: false, detail_symptomes: '',
        decision_frontiere: 'AUTORISATION', motif_decision: '',
    };

    ngOnInit() {
        const patientId = this.id();
        if (patientId) {
            this.http.get<Patient>(`/api/patients/${patientId}`).subscribe((p) => this.patient.set(p));
        }
    }

    onSubmit() {
        this.saving.set(true);
        const body = {
            ...this.form,
            patient_id: this.id(),
            psf_agent_id: this.auth.user()?.user_id,
            site_psf_id: this.auth.site()?.site_id,
        };
        this.http.post('/api/tracing-vol', body).subscribe({
            next: () => this.router.navigate(['/psf']),
            error: () => this.saving.set(false),
        });
    }
}
