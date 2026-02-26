import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Patient, Lit } from '../../core/models';

@Component({
    selector: 'app-admission-form',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header"><h1>🏥 Nouvelle admission</h1></div>
    <form (ngSubmit)="onSubmit()" class="card">
      <div class="grid grid-2">
        <div class="form-group">
          <label>Patient *</label>
          <select class="form-control" [(ngModel)]="form.patient_id" name="patient_id" required>
            <option value="">-- Sélectionner --</option>
            @for (p of patients(); track p.patient_id) {
              <option [value]="p.patient_id">{{ p.accreditation_id }} — {{ p.nom }} {{ p.prenom }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>Lit *</label>
          <select class="form-control" [(ngModel)]="form.lit_id" name="lit_id" required>
            <option value="">-- Sélectionner un lit libre --</option>
            @for (l of freeLits(); track l.lit_id) {
              <option [value]="l.lit_id">{{ l.numero_lit }} ({{ l.categorie_id }})</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>État à l'entrée *</label>
          <select class="form-control" [(ngModel)]="form.etat_entree" name="etat_entree" required>
            <option value="STABLE">Stable</option><option value="GRAVE">Grave</option>
            <option value="CRITIQUE">Critique</option><option value="INCONSCIENT">Inconscient</option>
          </select>
        </div>
        <div class="form-group">
          <label>Diagnostic d'entrée</label>
          <input class="form-control" [(ngModel)]="form.diagnostic_entree" name="diagnostic_entree" />
        </div>
      </div>
      <div class="flex gap-2 justify-between" style="margin-top:1.5rem">
        <button type="button" class="btn btn-secondary" (click)="router.navigate(['/fosa'])">← Retour</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? '⏳…' : '✅ Admettre' }}</button>
      </div>
    </form>
  `,
})
export class AdmissionFormComponent implements OnInit {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    router = inject(Router);
    patients = signal<Patient[]>([]);
    freeLits = signal<Lit[]>([]);
    saving = signal(false);
    form: any = { patient_id: '', lit_id: '', etat_entree: 'STABLE', diagnostic_entree: '' };

    ngOnInit() {
        this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
        this.http.get<Lit[]>('/api/lits').subscribe((l) => this.freeLits.set(l.filter((x) => x.statut === 'LIBRE')));
    }

    onSubmit() {
        this.saving.set(true);
        const body = { ...this.form, fosa_id: this.auth.site()?.site_id, medecin_id: this.auth.user()?.user_id, admission_datetime: new Date().toISOString(), oxygene_requis: false, reanimation: false, transfusion: false };
        this.http.post('/api/prises-en-charge', body).subscribe({
            next: () => {
                // Mark lit as occupied
                this.http.put(`/api/lits/${this.form.lit_id}`, { statut: 'OCCUPE', updated_at: new Date().toISOString() }).subscribe();
                this.router.navigate(['/fosa']);
            },
            error: () => this.saving.set(false),
        });
    }
}
