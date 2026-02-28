import { Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Site } from '../../../core/models';
import { GenericFormComponent } from '../../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../../shared/models/form.models';

@Component({
  selector: 'app-site-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier site' : '➕ Nouveau site'"
      [subtitle]="isEdit() ? 'Modifier les informations du site' : 'Ajouter un nouveau site physique au référentiel'"
      maxWidth="800px"
      [schema]="formSchema"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
    ></app-generic-form>
  `,
})
export class SiteFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<Site | null>(null);

  isEdit = signal(false);
  siteId = '';

  formSchema: FormSection[] = [
    {
      gridColumns: 2,
      fields: [
        { key: 'code_site', label: 'Code Site', type: 'text', required: true, placeholder: 'Ex: FOSA_01' },
        { key: 'nom', label: 'Nom du site', type: 'text', required: true, placeholder: 'Ex: Hôpital Central' }
      ]
    },
    {
      fields: [
        {
          key: 'type_site', label: 'Type de site', type: 'select', required: true,
          options: [
            { value: 'PSF', label: 'Poste de Santé Frontière (PSF)' },
            { value: 'PMA_HOTEL', label: 'Poste Médical Avancé - Hôtel' },
            { value: 'PMA_PALAIS', label: 'Poste Médical Avancé - Palais SMC' },
            { value: 'PMA_HV', label: 'Poste Médical Avancé - Hôpital de Village' },
            { value: 'FOSA', label: 'Formation Sanitaire (FOSA)' },
            { value: 'REGULATION', label: 'Centre de Régulation' },
            { value: 'AUTRE', label: 'Autre' }
          ]
        },
        { key: 'adresse', label: 'Adresse physique', type: 'text', placeholder: 'Adresse complète' }
      ]
    },
    {
      gridColumns: 2,
      fields: [
        { key: 'latitude', label: 'Latitude', type: 'number', step: 0.000001 },
        { key: 'longitude', label: 'Longitude', type: 'number', step: 0.000001 }
      ]
    },
    {
      gridColumns: 2,
      fields: [
        { key: 'capacite_lits', label: 'Capacité en lits (Seulement pour les sites avec hébergement)', type: 'number', min: 0 },
        { key: 'seuil_alerte_lits', label: "Seuil d'alerte lits (%)", type: 'number', min: 0, max: 100 }
      ]
    },
    {
      fields: [
        { key: 'telephone', label: 'Téléphone', type: 'text', placeholder: 'Numéro de contact' },
        { key: 'actif', label: 'Site actif dans le système', type: 'checkbox' }
      ]
    }
  ];

  form: Partial<Site> = {
    code_site: '',
    nom: '',
    type_site: 'FOSA',
    adresse: '',
    latitude: undefined,
    longitude: undefined,
    capacite_lits: 0,
    lits_occupes: 0,
    seuil_alerte_lits: 90,
    telephone: '',
    actif: true
  };

  ngOnInit() {
    const site = this.item();
    if (site) {
      this.isEdit.set(true);
      this.siteId = site.site_id;
      this.form = { ...site };
    }
  }

  onSubmit() {
    if (!this.form.nom || !this.form.code_site || !this.form.type_site) return;

    if (this.isEdit()) {
      this.http.put(`/api/sites/${this.siteId}`, this.form).subscribe(() => {
        this.router.navigate(['/admin/sites']);
      });
    } else {
      const newSite = { ...this.form, created_at: new Date().toISOString() };
      this.http.post('/api/sites', newSite).subscribe(() => {
        this.router.navigate(['/admin/sites']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/sites']);
  }
}
