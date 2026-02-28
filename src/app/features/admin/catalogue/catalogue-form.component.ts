import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CatalogueProduit } from '../../../core/models';
import { GenericFormComponent } from '../../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../../shared/models/form.models';

@Component({
  selector: 'app-catalogue-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      [title]="isEdit() ? '✏️ Modifier produit' : '➕ Nouveau produit'"
      subtitle="Gérer les propriétés d'un produit du catalogue"
      maxWidth="800px"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
    ></app-generic-form>
  `,
})
export class CatalogueFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);
  private cdr = inject(ChangeDetectorRef);

  isEdit = signal(false);
  produitId = '';

  baseSchema: FormSection[] = [
    {
      gridColumns: 2,
      fields: [
        { key: 'code_produit', label: 'Code Produit', type: 'text', required: true, placeholder: 'Ex: MED-PAR-500' },
        {
          key: 'categorie', label: 'Catégorie', type: 'select', required: true,
          options: [
            { value: 'MEDICAMENT', label: 'Médicament' },
            { value: 'EPI', label: 'Equipement Protection Indiv.' },
            { value: 'MATERIEL', label: 'Matériel Médical' },
            { value: 'CONSOMMABLE', label: 'Consommable' },
            { value: 'AUTRE', label: 'Autre' }
          ]
        }
      ]
    },
    {
      fields: [
        { key: 'designation', label: 'Désignation complète', type: 'text', required: true, placeholder: 'Ex: Paracétamol 500mg, Boîte de 10' }
      ]
    },
    {
      gridColumns: 2,
      fields: [
        { key: 'unite_base', label: 'Unité de base', type: 'text', required: true, placeholder: 'Ex: Boîte, Unité, Flacon' },
        { key: 'necessite_froid', label: 'Chaîne du froid (2-8°C)', type: 'checkbox' },
        { key: 'actif', label: 'Actif', type: 'checkbox' }
      ]
    }
  ];

  form: Partial<CatalogueProduit> = {
    code_produit: '',
    designation: '',
    categorie: 'MEDICAMENT',
    unite_base: '',
    necessite_froid: false,
    actif: true,
    dci: '', code_atc: '', forme: '', dosage: ''
  };

  // Create a computed schema to inject the medicine specific fields dynamically based on state
  // We track local copy of category to force re-evaluation of schema if needed
  localCategory = signal('MEDICAMENT');

  currentSchema = computed(() => {
    const schema = structuredClone(this.baseSchema);

    // Disable code_produit on edit
    if (this.isEdit()) {
      schema[0].fields[0].disabled = true;
    }

    if (this.localCategory() === 'MEDICAMENT') {
      schema.splice(2, 0, {
        title: 'Détails Médicament',
        gridColumns: 2,
        fields: [
          { key: 'dci', label: 'DCI', type: 'text', placeholder: 'Principe actif' },
          { key: 'code_atc', label: 'Code ATC', type: 'text', placeholder: 'Ex: N02BE01' },
          { key: 'forme', label: 'Forme', type: 'text', placeholder: 'Ex: Comprimé' },
          { key: 'dosage', label: 'Dosage', type: 'text', placeholder: 'Ex: 500 mg' }
        ]
      });
    }

    return schema;
  });

  ngOnInit() {
    const id = this.item() ? (this.item()?.id || this.item()?.produit_id || this.item()?.article_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.produitId = id;
      const p = this.item();
      if (p) {
        this.form = { ...p };
        this.localCategory.set(p.categorie || 'MEDICAMENT');
        this.cdr.markForCheck();
      }
    }

    // Watch for changes on categorie to update schema. Workaround due to how two-way binding writes mutably.
    // In a real reactive form, we could subscribe to value changes.
    setInterval(() => {
      if (this.form.categorie !== this.localCategory()) {
        this.localCategory.set(this.form.categorie!);
      }
    }, 100);
  }

  onSubmit() {
    if (!this.form.code_produit || !this.form.designation || !this.form.categorie || !this.form.unite_base) return;

    if (this.isEdit()) {
      this.http.put(`/api/catalogue-produits/${this.produitId}`, this.form).subscribe(() => {
        this.router.navigate(['/admin/catalogue']);
      });
    } else {
      this.http.post('/api/catalogue-produits', this.form).subscribe(() => {
        this.router.navigate(['/admin/catalogue']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/catalogue']);
  }
}
