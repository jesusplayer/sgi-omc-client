import { Component, inject, signal, OnInit, ChangeDetectorRef, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Vaccination } from '../../core/models';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-voyageur-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <div class="error-msg" style="margin-top:1rem; margin-bottom: 1rem;">{{ error() }}</div>
    }

    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier voyageur' : '🛫 Enregistrer voyageur'"
      [subtitle]="isEdit() ? 'Modifier la fiche du voyageur' : 'UC-01 — Créer une fiche patient au point d\\'entrée sanitaire'"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
      [saveLabel]="isEdit() ? '💾 Modifier' : '✅ Enregistrer le voyageur'"
      alignActions="between"
      [saving]="saving()"
    ></app-generic-form>
  `,
  styles: [`
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
  item = input<any | null>(null);
  private router = inject(Router);

  isEdit = signal(false);
  private cdr = inject(ChangeDetectorRef);
  saving = signal(false);
  error = signal('');
  patientId = '';

  vaccinations = signal<Vaccination[]>([]);

  form: any = {
    accreditation_id: '', nom: '', prenom: '', sexe: 'M', date_naissance: '',
    nationalite: '', pays_provenance: '', type_personne: '', contact_local: '', commentaire_medical: '',
  };

  currentSchema = computed(() => {
    const vaxFields = this.vaccinations().map(vax => ({
      key: `vax_${vax.libelle}`,
      label: vax.obligatoire ? `${vax.libelle} (Requis)` : vax.libelle,
      type: 'checkbox' as const
    }));

    return [
      {
        gridColumns: 2,
        fields: [
          { key: 'accreditation_id', label: 'N° Accréditation OMC', type: 'text', required: true, placeholder: 'OMC-2026-XXXXX' },
          {
            key: 'type_personne', label: 'Type de personne', type: 'select', required: true,
            options: [
              { value: 'DELEGUE', label: 'Délégué' },
              { value: 'JOURNALISTE', label: 'Journaliste' },
              { value: 'VISITEUR', label: 'Visiteur' },
              { value: 'EXPOSANT', label: 'Exposant' },
              { value: 'PERSONNEL', label: 'Personnel' },
              { value: 'AUTRE', label: 'Autre' }
            ]
          },
          { key: 'nom', label: 'Nom', type: 'text', required: true },
          { key: 'prenom', label: 'Prénom', type: 'text', required: true },
          {
            key: 'sexe', label: 'Sexe', type: 'select', required: true,
            options: [
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Féminin' },
              { value: 'A', label: 'Autre' }
            ]
          },
          // Using text for date fallback as standard type doesn't exist yet but it's handled properly by the browser typically on standard inputs natively if 'type="date"' in generic-form
          { key: 'date_naissance', label: 'Date de naissance', type: 'text' },
          { key: 'nationalite', label: 'Nationalité', type: 'text', required: true, placeholder: 'ex: FRA, USA, CMR' },
          { key: 'pays_provenance', label: 'Pays de provenance', type: 'text', required: true, placeholder: 'ex: FRA' },
          { key: 'contact_local', label: 'Contact local', type: 'text', placeholder: '+237 6XX XX XX XX' },
          { key: 'commentaire_medical', label: 'Commentaire médical', type: 'textarea' }
        ]
      },
      {
        title: '💉 Statut vaccinal',
        gridColumns: 4, // Layout vaccinations in a 4-col grid
        fields: vaxFields
      }
    ] as FormSection[];
  });

  ngOnInit() {
    this.http.get<Vaccination[]>('/api/vaccinations').subscribe((v) => {
      const actives = v.filter((x: any) => x.actif);
      this.vaccinations.set(actives);

      // Initialize the checkboxes based on vaccinations dynamically downloaded
      actives.forEach((vax: any) => {
        if (!(`vax_${vax.libelle}` in this.form)) {
          this.form[`vax_${vax.libelle}`] = false;
        }
      });
    });

    const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.patientId = id;
      const p = this.item();
      if (p) {
        this.form = {
          ...this.form,
          accreditation_id: p.accreditation_id, nom: p.nom, prenom: p.prenom, sexe: p.sexe,
          date_naissance: p.date_naissance ?? '', nationalite: p.nationalite,
          pays_provenance: p.pays_provenance, type_personne: p.type_personne,
          contact_local: p.contact_local ?? '', commentaire_medical: p.commentaire_medical ?? '',
        };
        if (p.statut_vaccinal) {
          Object.entries(p.statut_vaccinal).forEach(([k, v]) => {
            this.form[`vax_${k}`] = !!v;
          });
          this.cdr.markForCheck();
        }
      }
    }
  }

  onSubmit() {
    if (!this.form.accreditation_id || !this.form.nom || !this.form.prenom || !this.form.nationalite || !this.form.pays_provenance || !this.form.type_personne) {
      this.error.set('Veuillez remplir tous les champs obligatoires');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const statut_vaccinal: Record<string, boolean> = {};
    const keys = Object.keys(this.form).filter(k => k.startsWith('vax_'));
    keys.forEach(k => {
      const vaxName = k.replace('vax_', '');
      statut_vaccinal[vaxName] = this.form[k];
    });

    // clean up form payload from the dynamic vax fields for the main object request
    const bodyForm = { ...this.form };
    keys.forEach(k => delete bodyForm[k]);

    const body = {
      ...bodyForm,
      statut_vaccinal,
      created_by: this.auth.user()?.user_id,
    };

    const req$ = this.isEdit()
      ? this.http.put(`/api/patients/${this.patientId}`, body)
      : this.http.post('/api/patients', body);

    req$.subscribe({
      next: () => this.router.navigate(['/psf']),
      error: () => {
        this.saving.set(false);
        this.error.set("Erreur lors de l'enregistrement");
      }
    });
  }

  onCancel() {
    this.router.navigate(['/psf']);
  }
}
