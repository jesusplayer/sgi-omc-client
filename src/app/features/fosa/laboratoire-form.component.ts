import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ResultatLabo, TypeExamen, Interpretation } from '../../core/models';

@Component({
  selector: 'app-laboratoire-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Saisir Résultat' : '➕ Nouvelle Prescription' }}</h1>
        <p>{{ isEdit() ? "Saisie des résultats d'examen par le laboratoire" : "Prescription d'un examen de laboratoire pour une admission (FOSA)" }}</p>
      </div>
    </div>

    <div class="card" style="max-width:800px">
      <form (ngSubmit)="onSubmit()">
        <h2 style="font-size:1.1rem;margin-bottom:1rem;color:var(--text-primary)">Prescription</h2>
        
        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">ID Prise en charge (PEC) *</label>
            <input class="form-control" [(ngModel)]="form.pec_id" name="pec_id" [disabled]="isEdit()" required placeholder="Ex: PEC-12345" />
          </div>
          <div class="form-group">
            <label class="form-label">Date & Heure prélèvement *</label>
            <input type="datetime-local" class="form-control" [(ngModel)]="form.datetime_prelevement" name="datetime_prelevement" [disabled]="isEdit()" required />
          </div>
        </div>

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Type d'examen *</label>
            <select class="form-control" [(ngModel)]="form.type_examen" name="type_examen" [disabled]="isEdit()" required>
              <option value="BIOLOGIE">Biologie</option>
              <option value="IMAGERIE">Imagerie</option>
              <option value="PCR">PCR</option>
              <option value="SEROLOGIE">Sérologie</option>
              <option value="ANATOMO_PATHO">Anatomo-Pathologie</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Libellé de l'examen *</label>
            <input class="form-control" [(ngModel)]="form.libelle_examen" name="libelle_examen" [disabled]="isEdit()" required placeholder="Ex: NFS, Scanner crânien..." />
          </div>
        </div>

        <!-- Section des résultats (visible ou éditable uniquement en mode édition / réception) -->
        <h2 style="font-size:1.1rem;margin-bottom:1rem;margin-top:2rem;color:var(--text-primary)">Résultats</h2>

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Interprétation *</label>
            <select class="form-control" [(ngModel)]="form.interpretation" name="interpretation" required>
              <option value="EN_ATTENTE">En attente (Prescrit)</option>
              <option value="NORMAL">Normal</option>
              <option value="ANORMAL_BAS">Anormal (Bas)</option>
              <option value="ANORMAL_HAUT">Anormal (Haut)</option>
              <option value="POSITIF">Positif</option>
              <option value="NEGATIF">Négatif</option>
              <option value="CRITIQUE">Critique / Alerte</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Valeur textuelle</label>
            <input class="form-control" [(ngModel)]="form.valeur" name="valeur" placeholder="Ex: Présence de plasmodium" />
          </div>
        </div>

        <div class="grid grid-3" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Valeur Numérique</label>
            <input type="number" step="0.01" class="form-control" [(ngModel)]="form.valeur_numerique" name="valeur_numerique" />
          </div>
          <div class="form-group">
            <label class="form-label">Unité</label>
            <input class="form-control" [(ngModel)]="form.unite" name="unite" placeholder="Ex: g/dL, UI/L" />
          </div>
          <div class="form-group">
            <label class="form-label">Plage de référence (Min - Max)</label>
            <div class="flex" style="gap:0.5rem">
              <input type="number" class="form-control" [(ngModel)]="form.valeur_normale_min" name="valeur_normale_min" placeholder="Min" />
              <input type="number" class="form-control" [(ngModel)]="form.valeur_normale_max" name="valeur_normale_max" placeholder="Max" />
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Commentaire du biologiste / radiologue</label>
          <textarea class="form-control" [(ngModel)]="form.commentaire" name="commentaire" rows="3" placeholder="Observations..."></textarea>
        </div>
        
        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Date & Heure résultat</label>
          <input type="datetime-local" class="form-control" [(ngModel)]="form.datetime_resultat" name="datetime_resultat" />
        </div>

        <div class="flex gap-2" style="margin-top:2rem">
          <button type="submit" class="btn btn-primary" [disabled]="!form.pec_id || !form.libelle_examen || !form.datetime_prelevement">
            {{ isEdit() ? '💾 Enregistrer résultat' : '✅ Créer prescription' }}
          </button>
          <button type="button" class="btn btn-outline" (click)="onCancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class LaboratoireFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);

  isEdit = signal(false);
    private cdr = inject(ChangeDetectorRef);
  resultatId = '';

  nowDate = new Date();
  nowStr = new Date(this.nowDate.getTime() - this.nowDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  form: Partial<ResultatLabo> = {
    pec_id: '',
    type_examen: 'BIOLOGIE',
    libelle_examen: '',
    interpretation: 'EN_ATTENTE',
    datetime_prelevement: this.nowStr
  };

  ngOnInit() {
    const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.resultatId = id;
      const res = this.item();
      if (res) {
        this.form = { ...res };
        if (res.datetime_prelevement) this.form.datetime_prelevement = res.datetime_prelevement.slice(0, 16);
        if (res.datetime_resultat) this.form.datetime_resultat = res.datetime_resultat.slice(0, 16);
                this.cdr.markForCheck();
      }
    }
  }

  onSubmit() {
    if (!this.form.pec_id || !this.form.libelle_examen) return;

    const payload = { ...this.form };
    if (payload.datetime_prelevement) payload.datetime_prelevement = new Date(payload.datetime_prelevement).toISOString();
    if (payload.datetime_resultat) payload.datetime_resultat = new Date(payload.datetime_resultat).toISOString();

    if (this.isEdit()) {
      if (!payload.datetime_resultat && payload.interpretation !== 'EN_ATTENTE') {
        payload.datetime_resultat = new Date().toISOString();
      }
      this.http.put(`/api/laboratoire/${this.resultatId}`, payload).subscribe(() => {
        this.router.navigate(['/fosa/laboratoire']);
      });
    } else {
      payload.created_at = new Date().toISOString();
      this.http.post('/api/laboratoire', payload).subscribe(() => {
        this.router.navigate(['/fosa/laboratoire']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/fosa/laboratoire']);
  }
}
