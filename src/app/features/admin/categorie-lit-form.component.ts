import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CategorieLit } from '../../core/models';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-categorie-lit-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier catégorie' : '➕ Nouvelle catégorie'"
      subtitle="Personnalisation des types de lits et de leurs attributs"
      maxWidth="600px"
      [schema]="formSchema"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
    ></app-generic-form>
  `,
})
export class CategorieLitFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);
  private cdr = inject(ChangeDetectorRef);

  isEdit = signal(false);
  categorieId = '';

  formSchema: FormSection[] = [
    {
      fields: [
        {
          key: 'code',
          label: 'Code',
          type: 'select',
          required: true,
          options: [
            { value: 'VIP', label: 'VIP' },
            { value: 'STANDARD', label: 'Standard' },
            { value: 'REANIMATION', label: 'Réanimation' },
            { value: 'ISOLATION', label: 'Isolation' },
            { value: 'URGENCE', label: 'Urgence' }
          ]
        },
        {
          key: 'libelle',
          label: 'Libellé descriptif',
          type: 'text',
          required: true,
          placeholder: 'Ex: Isolement pression négative'
        },
        {
          key: 'description',
          label: 'Description des équipements',
          type: 'textarea',
          placeholder: 'Équipements spécifiques (scope, respirateur...)',
          rows: 3
        }
      ]
    },
    {
      gridColumns: 2,
      fields: [
        {
          key: 'couleur_dashboard',
          label: 'Couleur (Dashboard)',
          type: 'color'
        },
        {
          key: 'actif',
          label: 'Catégorie active',
          type: 'checkbox'
        }
      ]
    }
  ];

  form: Partial<CategorieLit> = {
    code: 'STANDARD',
    libelle: '',
    description: '',
    couleur_dashboard: '#3b82f6',
    actif: true
  };

  ngOnInit() {
    const id = this.item() ? (this.item()?.id || this.item()?.categorie_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.categorieId = id;

      // Update schema: 'code' field must be disabled on edit mode
      this.formSchema[0].fields[0].disabled = true;

      const c = this.item();
      if (c) {
        this.form = { ...c };
        this.cdr.markForCheck();
      }
    }
  }

  onSubmit() {
    if (!this.form.code || !this.form.libelle) return;
    if (this.isEdit()) {
      this.http.put(`/api/categories-lits/${this.categorieId}`, this.form).subscribe(() => {
        this.router.navigate(['/admin/categories-lits']);
      });
    } else {
      this.http.post('/api/categories-lits', this.form).subscribe(() => {
        this.router.navigate(['/admin/categories-lits']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/categories-lits']);
  }
}
