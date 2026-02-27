import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Orientation, MoyenTransport, EtatPatient, StatutOrientation } from '../../core/models';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-orientation-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier orientation' : '➕ Nouvelle orientation'"
      [subtitle]="isEdit() ? 'Mise à jour d\\'une orientation' : 'Initier un transfert de patient vers une FOSA'"
      maxWidth="800px"
      alignActions="between"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
      [saveLabel]="isEdit() ? '💾 Enregistrer' : '✅ Créer'"
      [saving]="saving()"
      [disableSave]="!form.fosa_destination_id || !form.motif_evacuation"
    ></app-generic-form>
  `,
})
export class OrientationFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);

  isEdit = signal(false);
  private cdr = inject(ChangeDetectorRef);
  orientationId = '';
  saving = signal(false);

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

  localStatut = signal('EN_ATTENTE');

  baseSchema: FormSection[] = [
    {
      title: 'Informations de transfert',
      gridColumns: 2,
      fields: [
        { key: 'fosa_destination_id', label: 'FOSA Destination', type: 'text', required: true, placeholder: 'ID du site FOSA' },
        { key: 'fosa_alternative_id', label: 'FOSA Alternative', type: 'text', placeholder: 'En cas de manque de place' }
      ]
    },
    {
      fields: [
        { key: 'motif_evacuation', label: "Motif d'évacuation", type: 'textarea', required: true, placeholder: 'Motif médical du transfert' }
      ]
    },
    {
      gridColumns: 2,
      fields: [
        {
          key: 'moyen_transport', label: 'Moyen de transport', type: 'select', required: true,
          options: [
            { value: 'AMBULANCE', label: 'Ambulance' },
            { value: 'SMUR', label: 'SMUR' },
            { value: 'TAXI', label: 'Taxi' },
            { value: 'VEHICULE_PERSO', label: 'Véhicule personnel' },
            { value: 'MARCHE', label: 'À pied' }
          ]
        },
        {
          key: 'etat_patient_depart', label: 'État du patient (Départ)', type: 'select', required: true,
          options: [
            { value: 'STABLE', label: 'Stable' },
            { value: 'GRAVE', label: 'Grave' },
            { value: 'CRITIQUE', label: 'Critique' },
            { value: 'INCONSCIENT', label: 'Inconscient' }
          ]
        }
      ]
    },
    {
      title: 'Statut & Chronologie',
      fields: [
        {
          key: 'statut', label: 'Statut', type: 'select', required: true,
          options: [
            { value: 'EN_ATTENTE', label: 'En attente de départ' },
            { value: 'EN_COURS', label: 'En cours de transfert (Transit)' },
            { value: 'ARRIVE', label: 'Arrivé à destination' },
            { value: 'REFUSE', label: 'Refusé par la FOSA' },
            { value: 'ANNULE', label: 'Annulé' },
            { value: 'DECES_TRANSIT', label: 'Décès pdt le transfert' }
          ]
        }
      ]
    },
    {
      gridColumns: 3,
      fields: [
        { key: 'heure_decision', label: 'Heure décision', type: 'text' },
        { key: 'heure_depart', label: 'Heure départ', type: 'text' },
        { key: 'heure_arrivee_fosa', label: 'Heure arrivée FOSA', type: 'text' }
      ]
    }
  ];

  currentSchema = computed(() => {
    const schema = structuredClone(this.baseSchema);
    if (this.localStatut() === 'REFUSE') {
      schema.push({
        fields: [
          { key: 'motif_refus', label: 'Motif du refus', type: 'text', required: true, placeholder: 'Pourquoi la FOSA a-t-elle refusé ?' }
        ]
      });
    }
    return schema;
  });

  ngOnInit() {
    setInterval(() => {
      if (this.form.statut !== this.localStatut()) {
        this.localStatut.set(this.form.statut || 'EN_ATTENTE');
      }
    }, 100);

    const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.orientationId = id;
      const o = this.item();
      if (o) {
        this.form = { ...o };
        this.cdr.markForCheck();
        if (o.heure_decision) this.form.heure_decision = o.heure_decision.slice(0, 16);
        if (o.heure_depart) this.form.heure_depart = o.heure_depart.slice(0, 16);
        if (o.heure_arrivee_fosa) this.form.heure_arrivee_fosa = o.heure_arrivee_fosa.slice(0, 16);
      }
    }
  }

  onSubmit() {
    if (!this.form.fosa_destination_id || !this.form.motif_evacuation) return;
    this.saving.set(true);

    // Normalise datetime strings to basic ISO
    const payload = { ...this.form };
    if (payload.heure_decision) payload.heure_decision = new Date(payload.heure_decision).toISOString();
    if (payload.heure_depart) payload.heure_depart = new Date(payload.heure_depart).toISOString();
    if (payload.heure_arrivee_fosa) payload.heure_arrivee_fosa = new Date(payload.heure_arrivee_fosa).toISOString();

    if (this.isEdit()) {
      this.http.put(`/api/orientations/${this.orientationId}`, payload).subscribe({
        next: () => this.router.navigate(['/regulation/orientations']),
        error: () => this.saving.set(false)
      });
    } else {
      payload.created_at = new Date().toISOString();
      this.http.post('/api/orientations', payload).subscribe({
        next: () => this.router.navigate(['/regulation/orientations']),
        error: () => this.saving.set(false)
      });
    }
  }

  onCancel() {
    this.router.navigate(['/regulation/orientations']);
  }
}
