import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Orientation, MoyenTransport, EtatPatient, StatutOrientation } from '../../core/models';

@Component({
    selector: 'app-orientation-form',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Modifier' : '➕ Nouvelle' }} orientation</h1>
        <p>{{ isEdit() ? 'Mise à jour d\'une orientation' : 'Initier un transfert de patient vers une FOSA' }}</p>
      </div>
    </div>

    <div class="card" style="max-width:800px">
      <form (ngSubmit)="onSubmit()">
        <h2 style="font-size:1.1rem;margin-bottom:1rem;color:var(--text-primary)">Informations de transfert</h2>
        
        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">FOSA Destination *</label>
            <input class="form-control" [(ngModel)]="form.fosa_destination_id" name="fosa_destination_id" required placeholder="ID du site FOSA" />
          </div>
          <div class="form-group">
            <label class="form-label">FOSA Alternative</label>
            <input class="form-control" [(ngModel)]="form.fosa_alternative_id" name="fosa_alternative_id" placeholder="En cas de manque de place" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Motif d'évacuation *</label>
          <textarea class="form-control" [(ngModel)]="form.motif_evacuation" name="motif_evacuation" rows="2" required placeholder="Motif médical du transfert"></textarea>
        </div>

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Moyen de transport *</label>
            <select class="form-control" [(ngModel)]="form.moyen_transport" name="moyen_transport" required>
              <option value="AMBULANCE">Ambulance</option>
              <option value="SMUR">SMUR</option>
              <option value="TAXI">Taxi</option>
              <option value="VEHICULE_PERSO">Véhicule personnel</option>
              <option value="MARCHE">À pied</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">État du patient (Départ) *</label>
            <select class="form-control" [(ngModel)]="form.etat_patient_depart" name="etat_patient_depart" required>
              <option value="STABLE">Stable</option>
              <option value="GRAVE">Grave</option>
              <option value="CRITIQUE">Critique</option>
              <option value="INCONSCIENT">Inconscient</option>
            </select>
          </div>
        </div>

        <h2 style="font-size:1.1rem;margin-bottom:1rem;color:var(--text-primary)">Statut & Chronologie</h2>
        
        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Statut *</label>
          <select class="form-control" [(ngModel)]="form.statut" name="statut" required>
            <option value="EN_ATTENTE">En attente de départ</option>
            <option value="EN_COURS">En cours de transfert (Transit)</option>
            <option value="ARRIVE">Arrivé à destination</option>
            <option value="REFUSE">Refusé par la FOSA</option>
            <option value="ANNULE">Annulé</option>
            <option value="DECES_TRANSIT">Décès pdt le transfert</option>
          </select>
        </div>

        <div class="grid grid-3" style="gap:1rem;margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">Heure décision</label>
            <input type="datetime-local" class="form-control" [(ngModel)]="form.heure_decision" name="heure_decision" />
          </div>
          <div class="form-group">
            <label class="form-label">Heure départ</label>
            <input type="datetime-local" class="form-control" [(ngModel)]="form.heure_depart" name="heure_depart" />
          </div>
          <div class="form-group">
            <label class="form-label">Heure arrivée FOSA</label>
            <input type="datetime-local" class="form-control" [(ngModel)]="form.heure_arrivee_fosa" name="heure_arrivee_fosa" />
          </div>
        </div>
        
        @if (form.statut === 'REFUSE') {
          <div class="form-group" style="margin-bottom:1rem">
            <label class="form-label text-danger">Motif du refus *</label>
            <input class="form-control" style="border-color:var(--danger)" [(ngModel)]="form.motif_refus" name="motif_refus" placeholder="Pourquoi la FOSA a-t-elle refusé ?" />
          </div>
        }

        <div class="flex gap-2" style="margin-top:2rem">
          <button type="submit" class="btn btn-primary" [disabled]="!form.fosa_destination_id || !form.motif_evacuation">
            {{ isEdit() ? '💾 Enregistrer' : '✅ Créer' }}
          </button>
          <button type="button" class="btn btn-outline" (click)="onCancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class OrientationFormComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    isEdit = signal(false);
    orientationId = '';

    nowDate = new Date();
    nowStr = new Date(this.nowDate.getTime() - this.nowDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    form: Partial<Orientation> = {
        fosa_destination_id: '',
        motif_evacuation: '',
        moyen_transport: 'AMBULANCE',
        etat_patient_depart: 'STABLE',
        statut: 'EN_ATTENTE',
        heure_decision: this.nowStr
    };

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit.set(true);
            this.orientationId = id;
            this.http.get<Orientation>(`/api/orientations/${id}`).subscribe((o) => {
                this.form = { ...o };
                if (o.heure_decision) this.form.heure_decision = o.heure_decision.slice(0, 16);
                if (o.heure_depart) this.form.heure_depart = o.heure_depart.slice(0, 16);
                if (o.heure_arrivee_fosa) this.form.heure_arrivee_fosa = o.heure_arrivee_fosa.slice(0, 16);
            });
        }
    }

    onSubmit() {
        if (!this.form.fosa_destination_id || !this.form.motif_evacuation) return;

        // Normalise datetime strings to basic ISO
        const payload = { ...this.form };
        if (payload.heure_decision) payload.heure_decision = new Date(payload.heure_decision).toISOString();
        if (payload.heure_depart) payload.heure_depart = new Date(payload.heure_depart).toISOString();
        if (payload.heure_arrivee_fosa) payload.heure_arrivee_fosa = new Date(payload.heure_arrivee_fosa).toISOString();

        if (this.isEdit()) {
            this.http.put(`/api/orientations/${this.orientationId}`, payload).subscribe(() => {
                this.router.navigate(['/regulation/orientations']);
            });
        } else {
            payload.created_at = new Date().toISOString();
            this.http.post('/api/orientations', payload).subscribe(() => {
                this.router.navigate(['/regulation/orientations']);
            });
        }
    }

    onCancel() {
        this.router.navigate(['/regulation/orientations']);
    }
}
