import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Vaccination } from '../../core/models';

@Component({
  selector: 'app-voyageur-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Modifier' : '🛫 Enregistrer' }} voyageur</h1>
        <p>{{ isEdit() ? 'Modifier la fiche du voyageur' : 'UC-01 — Créer une fiche patient au point d\\'entrée sanitaire' }}</p>
      </div>
    </div>

    <form (ngSubmit)="onSubmit()" class="card">
      <div class="grid grid-2">
        <div class="form-group">
          <label for="accreditation_id">N° Accréditation OMC *</label>
          <input id="accreditation_id" class="form-control" [(ngModel)]="form.accreditation_id" name="accreditation_id" required placeholder="OMC-2026-XXXXX" />
        </div>
        <div class="form-group">
          <label for="type_personne">Type de personne *</label>
          <select id="type_personne" class="form-control" [(ngModel)]="form.type_personne" name="type_personne" required>
            <option value="">-- Sélectionner --</option>
            <option value="DELEGUE">Délégué</option>
            <option value="JOURNALISTE">Journaliste</option>
            <option value="VISITEUR">Visiteur</option>
            <option value="EXPOSANT">Exposant</option>
            <option value="PERSONNEL">Personnel</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
        <div class="form-group">
          <label for="nom">Nom *</label>
          <input id="nom" class="form-control" [(ngModel)]="form.nom" name="nom" required />
        </div>
        <div class="form-group">
          <label for="prenom">Prénom *</label>
          <input id="prenom" class="form-control" [(ngModel)]="form.prenom" name="prenom" required />
        </div>
        <div class="form-group">
          <label for="sexe">Sexe *</label>
          <select id="sexe" class="form-control" [(ngModel)]="form.sexe" name="sexe" required>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="A">Autre</option>
          </select>
        </div>
        <div class="form-group">
          <label for="date_naissance">Date de naissance</label>
          <input id="date_naissance" class="form-control" type="date" [(ngModel)]="form.date_naissance" name="date_naissance" />
        </div>
        <div class="form-group">
          <label for="nationalite">Nationalité *</label>
          <input id="nationalite" class="form-control" [(ngModel)]="form.nationalite" name="nationalite" required placeholder="ex: FRA, USA, CMR" />
        </div>
        <div class="form-group">
          <label for="pays_provenance">Pays de provenance *</label>
          <input id="pays_provenance" class="form-control" [(ngModel)]="form.pays_provenance" name="pays_provenance" required placeholder="ex: FRA" />
        </div>
        <div class="form-group">
          <label for="contact_local">Contact local</label>
          <input id="contact_local" class="form-control" [(ngModel)]="form.contact_local" name="contact_local" placeholder="+237 6XX XX XX XX" />
        </div>
        <div class="form-group">
          <label for="commentaire_medical">Commentaire médical</label>
          <textarea id="commentaire_medical" class="form-control" [(ngModel)]="form.commentaire_medical" name="commentaire_medical" rows="2"></textarea>
        </div>
      </div>

      <h3 style="margin:1.5rem 0 0.75rem">💉 Statut vaccinal</h3>
      <div class="flex gap-4" style="flex-wrap:wrap">
        @for (vax of vaccinations(); track vax.vaccination_id) {
          <label class="checkbox-label" [class.obligatory]="vax.obligatoire">
            <input type="checkbox" [(ngModel)]="vaccinsState[vax.libelle]" [name]="'vax_'+vax.vaccination_id" />
            {{ vax.libelle }}
            @if (vax.obligatoire) { <span class="badge badge-danger" style="font-size:0.6rem;padding:0.1rem 0.4rem">Requis</span> }
          </label>
        }
      </div>

      @if (error()) {
        <div class="error-msg" style="margin-top:1rem">{{ error() }}</div>
      }

      <div class="flex gap-2 justify-between" style="margin-top:1.5rem">
        <button type="button" class="btn btn-secondary" (click)="router.navigate(['/psf'])">← Retour</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? '⏳ Enregistrement…' : isEdit() ? '💾 Modifier' : '✅ Enregistrer le voyageur' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .checkbox-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.875rem; cursor: pointer;
      input { width: 16px; height: 16px; accent-color: var(--accent); }
    }
    .error-msg {
      background: rgba(239,68,68,0.1); color: var(--danger);
      padding: 0.65rem 0.85rem; border-radius: var(--radius-md);
      font-size: 0.85rem;
    }
  `],
})
export class VoyageurFormComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  isEdit = signal(false);
  saving = signal(false);
  error = signal('');
  patientId = '';

  vaccinations = signal<Vaccination[]>([]);
  vaccinsState: Record<string, boolean> = {};

  form: any = {
    accreditation_id: '', nom: '', prenom: '', sexe: 'M', date_naissance: '',
    nationalite: '', pays_provenance: '', type_personne: '', contact_local: '', commentaire_medical: '',
  };

  ngOnInit() {
    // Load dynamic vaccinations from the reference table
    this.http.get<Vaccination[]>('/api/vaccinations').subscribe((v) => {
      const actives = v.filter((x) => x.actif);
      this.vaccinations.set(actives);
      actives.forEach((vax) => {
        if (!(vax.libelle in this.vaccinsState)) {
          this.vaccinsState[vax.libelle] = false;
        }
      });
    });

    // Edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.patientId = id;
      this.http.get<any>(`/api/patients/${id}`).subscribe((p) => {
        this.form = {
          accreditation_id: p.accreditation_id, nom: p.nom, prenom: p.prenom, sexe: p.sexe,
          date_naissance: p.date_naissance ?? '', nationalite: p.nationalite,
          pays_provenance: p.pays_provenance, type_personne: p.type_personne,
          contact_local: p.contact_local ?? '', commentaire_medical: p.commentaire_medical ?? '',
        };
        if (p.statut_vaccinal) {
          Object.entries(p.statut_vaccinal).forEach(([k, v]) => {
            this.vaccinsState[k] = !!v;
          });
        }
      });
    }
  }

  onSubmit() {
    if (!this.form.accreditation_id || !this.form.nom || !this.form.prenom || !this.form.nationalite || !this.form.pays_provenance || !this.form.type_personne) {
      this.error.set('Veuillez remplir tous les champs obligatoires');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const body = {
      ...this.form,
      statut_vaccinal: { ...this.vaccinsState },
      created_by: this.auth.user()?.user_id,
    };

    const req$ = this.isEdit()
      ? this.http.put(`/api/patients/${this.patientId}`, body)
      : this.http.post('/api/patients', body);

    req$.subscribe({
      next: () => this.router.navigate(['/psf']),
      error: () => {
        this.saving.set(false);
        this.error.set('Erreur lors de l\'enregistrement');
      },
    });
  }
}
