import { Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigurationAlerte, Operateur, CanalNotification } from '@app/core/models';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-alerte-config-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier la Règle' : '➕ Nouvelle Règle d\\'Alerte'"
      subtitle="Configuration des paramètres système d'alerte"
      alignActions="between"
      maxWidth="800px"
      [schema]="formSchema"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
    ></app-generic-form>
  `
})
export class AlerteConfigFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);

  isEdit = signal(false);
  configId: string | null = null;

  formSchema: FormSection[] = [
    {
      title: 'Informations Générales',
      gridColumns: 2,
      fields: [
        { key: 'code_regle', label: 'Code Règle', type: 'text', required: true, placeholder: 'ex: TEMP_CRIBLAGE' },
        { key: 'libelle', label: 'Libellé', type: 'text', required: true, placeholder: "Courte description de l'alerte" }
      ]
    },
    {
      title: 'Déclenchement',
      gridColumns: 2,
      fields: [
        {
          key: 'entite_source', label: 'Entité Source', type: 'select', required: true,
          options: [
            { value: 'TRACING_VOL', label: 'Tracing Vol' },
            { value: 'STOCK', label: 'Stock' },
            { value: 'SITE', label: 'Site (FOSA/PMA)' },
            { value: 'CONSULTATION', label: 'Consultation' },
            { value: 'RESULTAT_LABO', label: 'Résultat Labo' },
            { value: 'PRISE_EN_CHARGE', label: 'Prise en Charge' }
          ]
        },
        { key: 'champ_surveille', label: 'Champ Surveillé', type: 'text', required: true, placeholder: 'ex: temperature' },
        {
          key: 'operateur', label: 'Opérateur', type: 'select', required: true,
          options: [
            { value: 'GT', label: 'Supérieur à (>)' },
            { value: 'GTE', label: 'Sup. ou égal (>=)' },
            { value: 'LT', label: 'Inférieur à (<)' },
            { value: 'LTE', label: 'Inf. ou égal (<=)' },
            { value: 'EQ', label: 'Égal à (=)' },
            { value: 'NEQ', label: 'Différent de (!=)' }
          ]
        }
      ]
    },
    {
      title: 'Seuils de déclenchement (au moins un requis)',
      gridColumns: 3,
      fields: [
        { key: 'seuil_niveau1', label: 'Seuil Niveau 1', type: 'number', step: 'any' },
        { key: 'seuil_niveau2', label: 'Seuil Niveau 2', type: 'number', step: 'any' },
        { key: 'seuil_niveau3', label: 'Seuil Niveau 3', type: 'number', step: 'any' }
      ]
    },
    {
      title: 'Diffusion',
      gridColumns: 2,
      fields: [
        { key: 'canaux_notif', label: 'Canaux de Notification (Sép. par virgule)', type: 'text', required: true, placeholder: 'PUSH, SMS, EMAIL, IN_APP' },
        { key: 'roles_destinataires', label: 'Rôles Destinataires (Sép. par virgule)', type: 'text', required: true, placeholder: 'DATA, EPI, ADMIN, REG' },
        { key: 'cooldown_min', label: 'Cooldown (minutes)', type: 'number', required: true, min: 0 },
        { key: 'active', label: 'Règle active immédiatement', type: 'checkbox' }
      ]
    }
  ];

  form: any = {
    code_regle: '',
    libelle: '',
    entite_source: '',
    champ_surveille: '',
    operateur: 'GTE',
    seuil_niveau1: null,
    seuil_niveau2: null,
    seuil_niveau3: null,
    canaux_notif: 'PUSH, IN_APP',
    roles_destinataires: 'DATA, ADMIN',
    cooldown_min: 15,
    active: true
  };

  ngOnInit() {
    this.configId = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (this.configId) {
      this.isEdit.set(true);

      // Disable 'code_regle' field in edit mode
      this.formSchema[0].fields[0].disabled = true;

      const c = this.item();
      if (c) {
        this.form = {
          ...c,
          canaux_notif: c.canaux_notif.join(', '),
          roles_destinataires: c.roles_destinataires.join(', ')
        };
      }
    }
  }

  onSubmit() {
    if (!this.form.code_regle || !this.form.libelle || !this.form.entite_source || !this.form.champ_surveille) return;

    if (this.form.seuil_niveau1 === null && this.form.seuil_niveau2 === null && this.form.seuil_niveau3 === null) {
      alert("Au moins un seuil doit être renseigné !");
      return;
    }

    const payload: Partial<ConfigurationAlerte> = {
      ...this.form,
      canaux_notif: this.form.canaux_notif?.split(',').map((s: string) => s.trim() as CanalNotification) || [],
      roles_destinataires: this.form.roles_destinataires?.split(',').map((s: string) => s.trim()) || []
    } as any;

    if (this.isEdit() && this.configId) {
      this.http.put(`/api/configurations-alerte/${this.configId}`, payload).subscribe(() => {
        this.router.navigate(['/admin/alertes-config']);
      });
    } else {
      payload.config_id = crypto.randomUUID();
      this.http.post('/api/configurations-alerte', payload).subscribe(() => {
        this.router.navigate(['/admin/alertes-config']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/alertes-config']);
  }
}
