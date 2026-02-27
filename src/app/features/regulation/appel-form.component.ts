import { Component, inject, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-appel-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      title="📞 Nouvel appel de régulation"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
      saveLabel="✅ Enregistrer"
      alignActions="between"
      [saving]="saving()"
    ></app-generic-form>
  `,
})
export class AppelFormComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  saving = signal(false);

  form: any = {
    type_appelant: 'PMA', nom_appelant: '', telephone_appelant: '', localisation: '',
    motif_appel: '', niveau_gravite: 2, moyen_engage: 'CONSEIL_TEL', conseil_telephone: ''
  };

  localMoyenEngage = signal('CONSEIL_TEL');

  baseSchema: FormSection[] = [
    {
      gridColumns: 2,
      fields: [
        {
          key: 'type_appelant', label: "Type d'appelant", type: 'select', required: true,
          options: [
            { value: 'PMA', label: 'PMA' },
            { value: 'PSF', label: 'PSF' },
            { value: 'HOTEL', label: 'Hôtel' },
            { value: 'DELEGATION', label: 'Délégation' },
            { value: 'POLICE', label: 'Police' },
            { value: 'AUTRE', label: 'Autre' }
          ]
        },
        { key: 'nom_appelant', label: "Nom de l'appelant", type: 'text' },
        { key: 'telephone_appelant', label: 'Téléphone', type: 'text' },
        { key: 'localisation', label: 'Localisation', type: 'text', required: true, placeholder: 'Site / Adresse' }
      ]
    },
    {
      fields: [
        { key: 'motif_appel', label: "Motif de l'appel", type: 'textarea', required: true }
      ]
    },
    {
      gridColumns: 2,
      fields: [
        { key: 'niveau_gravite', label: 'Niveau de gravité (1-5)', type: 'number', min: 1, max: 5, required: true },
        {
          key: 'moyen_engage', label: 'Moyen engagé', type: 'select', required: true,
          options: [
            { value: 'CONSEIL_TEL', label: 'Conseil téléphonique' },
            { value: 'MEDECIN_SITE', label: 'Médecin sur site' },
            { value: 'AMBULANCE', label: 'Ambulance' },
            { value: 'SMUR', label: 'SMUR' },
            { value: 'AUCUN', label: 'Aucun' }
          ]
        }
      ]
    }
  ];

  currentSchema = computed(() => {
    const schema = structuredClone(this.baseSchema);
    if (this.localMoyenEngage() === 'CONSEIL_TEL') {
      schema.push({
        fields: [
          { key: 'conseil_telephone', label: 'Conseil donné', type: 'textarea' }
        ]
      });
    }
    return schema;
  });

  ngOnInit() {
    setInterval(() => {
      if (this.form.moyen_engage !== this.localMoyenEngage()) {
        this.localMoyenEngage.set(this.form.moyen_engage);
      }
    }, 100);
  }

  onSubmit() {
    if (!this.form.type_appelant || !this.form.localisation || !this.form.motif_appel || !this.form.niveau_gravite || !this.form.moyen_engage) return;

    this.saving.set(true);
    const body = { ...this.form, regulateur_id: this.auth.user()?.user_id, datetime_appel: new Date().toISOString(), statut: 'EN_COURS' };
    this.http.post('/api/appels-regulation', body).subscribe({
      next: () => this.router.navigate(['/regulation']),
      error: () => this.saving.set(false)
    });
  }

  onCancel() {
    this.router.navigate(['/regulation']);
  }
}
