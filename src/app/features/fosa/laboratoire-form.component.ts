import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ResultatLabo, TypeExamen, Interpretation } from '../../core/models';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-laboratoire-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Saisir Résultat' : '➕ Nouvelle Prescription'"
      [subtitle]="isEdit() ? 'Saisie des résultats d\\'examen par le laboratoire' : 'Prescription d\\'un examen de laboratoire pour une admission (FOSA)'"
      maxWidth="800px"
      alignActions="between"
      [schema]="formSchema"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
      [saveLabel]="isEdit() ? '💾 Enregistrer résultat' : '✅ Créer prescription'"
      [saving]="saving()"
      [disableSave]="!form.pec_id || !form.libelle_examen || !form.datetime_prelevement"
    ></app-generic-form>
  `,
})
export class LaboratoireFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);

  isEdit = signal(false);
  private cdr = inject(ChangeDetectorRef);
  resultatId = '';
  saving = signal(false);

  nowDate = new Date();
  nowStr = new Date(this.nowDate.getTime() - this.nowDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  formSchema: FormSection[] = [
    {
      title: 'Prescription',
      gridColumns: 2,
      fields: [
        { key: 'pec_id', label: 'ID Prise en charge (PEC)', type: 'text', required: true, placeholder: 'Ex: PEC-12345' },
        { key: 'datetime_prelevement', label: 'Date & Heure prélèvement', type: 'text', required: true },
        {
          key: 'type_examen', label: "Type d'examen", type: 'select', required: true,
          options: [
            { value: 'BIOLOGIE', label: 'Biologie' },
            { value: 'IMAGERIE', label: 'Imagerie' },
            { value: 'PCR', label: 'PCR' },
            { value: 'SEROLOGIE', label: 'Sérologie' },
            { value: 'ANATOMO_PATHO', label: 'Anatomo-Pathologie' },
            { value: 'AUTRE', label: 'Autre' }
          ]
        },
        { key: 'libelle_examen', label: "Libellé de l'examen", type: 'text', required: true, placeholder: 'Ex: NFS, Scanner crânien...' }
      ]
    },
    {
      title: 'Résultats',
      gridColumns: 2,
      fields: [
        {
          key: 'interpretation', label: 'Interprétation', type: 'select', required: true,
          options: [
            { value: 'EN_ATTENTE', label: 'En attente (Prescrit)' },
            { value: 'NORMAL', label: 'Normal' },
            { value: 'ANORMAL_BAS', label: 'Anormal (Bas)' },
            { value: 'ANORMAL_HAUT', label: 'Anormal (Haut)' },
            { value: 'POSITIF', label: 'Positif' },
            { value: 'NEGATIF', label: 'Négatif' },
            { value: 'CRITIQUE', label: 'Critique / Alerte' }
          ]
        },
        { key: 'valeur', label: 'Valeur textuelle', type: 'text', placeholder: 'Ex: Présence de plasmodium' }
      ]
    },
    {
      gridColumns: 3,
      fields: [
        { key: 'valeur_numerique', label: 'Valeur Numérique', type: 'number', step: '0.01' },
        { key: 'unite', label: 'Unité', type: 'text', placeholder: 'Ex: g/dL, UI/L' },
        { key: 'valeur_normale_min', label: 'Plage Min', type: 'number' },
        { key: 'valeur_normale_max', label: 'Plage Max', type: 'number' }
      ]
    },
    {
      fields: [
        { key: 'commentaire', label: 'Commentaire du biologiste / radiologue', type: 'textarea', placeholder: 'Observations...' },
        { key: 'datetime_resultat', label: 'Date & Heure résultat', type: 'text' }
      ]
    }
  ];

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

      // Lock primary prescription fields if edit
      this.formSchema[0].fields.forEach(f => f.disabled = true);

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
    if (!this.form.pec_id || !this.form.libelle_examen || !this.form.datetime_prelevement) return;

    this.saving.set(true);
    const payload = { ...this.form };

    if (payload.datetime_prelevement) payload.datetime_prelevement = new Date(payload.datetime_prelevement).toISOString();
    if (payload.datetime_resultat) payload.datetime_resultat = new Date(payload.datetime_resultat).toISOString();

    if (this.isEdit()) {
      if (!payload.datetime_resultat && payload.interpretation !== 'EN_ATTENTE') {
        payload.datetime_resultat = new Date().toISOString();
      }
      this.http.put(`/api/laboratoire/${this.resultatId}`, payload).subscribe({
        next: () => this.router.navigate(['/fosa/laboratoire']),
        error: () => this.saving.set(false)
      });
    } else {
      payload.created_at = new Date().toISOString();
      this.http.post('/api/laboratoire', payload).subscribe({
        next: () => this.router.navigate(['/fosa/laboratoire']),
        error: () => this.saving.set(false)
      });
    }
  }

  onCancel() {
    this.router.navigate(['/fosa/laboratoire']);
  }
}
