import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Lit, Site, CategorieLit } from '../../../core/models';
import { GenericFormComponent } from '../../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../../shared/models/form.models';

@Component({
  selector: 'app-lit-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier lit' : '➕ Nouveau lit'"
      subtitle="Gestion d'un lit physique dans un site sanitaire"
      maxWidth="600px"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
    ></app-generic-form>
  `,
})
export class LitFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);
  private cdr = inject(ChangeDetectorRef);

  isEdit = signal(false);
  litId = '';

  sites = signal<Site[]>([]);
  categories = signal<CategorieLit[]>([]);

  form: Partial<Lit> = {
    site_id: '',
    categorie_id: '',
    numero_lit: '',
    statut: 'LIBRE'
  };

  currentSchema = computed(() => {
    return [
      {
        fields: [
          {
            key: 'site_id',
            label: 'Site FOSA / PMA',
            type: 'select',
            required: true,
            disabled: this.isEdit(),
            options: this.sites().map(s => ({ value: s.site_id, label: s.nom }))
          },
          {
            key: 'categorie_id',
            label: 'Catégorie du lit',
            type: 'select',
            required: true,
            options: this.categories().map(c => ({ value: c.categorie_id!, label: c.libelle }))
          }
        ]
      },
      {
        gridColumns: 2,
        fields: [
          { key: 'numero_lit', label: 'Numéro de lit', type: 'text', required: true, placeholder: 'Ex: REA-01, CHB-214' },
          {
            key: 'statut', label: 'Statut initial', type: 'select', required: true,
            options: [
              { value: 'LIBRE', label: 'Libre' },
              { value: 'OCCUPE', label: 'Occupé' },
              { value: 'HORS_SERVICE', label: 'Hors service' },
              { value: 'RESERVE', label: 'Réservé' }
            ]
          }
        ]
      }
    ] as FormSection[];
  });

  ngOnInit() {
    this.http.get<Site[]>('/api/sites').subscribe(res => {
      this.sites.set(res.filter(s => ['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'].includes(s.type_site)));
    });
    this.http.get<CategorieLit[]>('/api/categories-lits').subscribe(c => this.categories.set(c));

    const id = this.item() ? (this.item()?.id || this.item()?.lit_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.litId = id;
      const l = this.item();
      if (l) {
        this.form = { ...l };
        this.cdr.markForCheck();
      }
    }
  }

  onSubmit() {
    if (!this.form.site_id || !this.form.categorie_id || !this.form.numero_lit) return;

    this.form.updated_at = new Date().toISOString();

    if (this.isEdit()) {
      this.http.put(`/api/lits/${this.litId}`, this.form).subscribe(() => {
        this.router.navigate(['/admin/lits']);
      });
    } else {
      this.http.post('/api/lits', this.form).subscribe(() => {
        this.router.navigate(['/admin/lits']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/lits']);
  }
}
