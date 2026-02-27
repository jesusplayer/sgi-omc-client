import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConsommationStock, Stock } from '../../core/models';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-mouvement-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-form
      title="➕ Saisir un MOUVEMENT"
      subtitle="Enregistrer une entrée ou sortie de stock"
      maxWidth="600px"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
      saveLabel="✅ Valider Mouvement"
      [saving]="saving()"
      [disableSave]="!form.stock_id || !form.quantite || form.quantite < 1"
    >
      <div form-footer class="alert alert-warning" style="margin-bottom:1.5rem">
        <p class="text-sm font-medium">Attention: Ce mouvement est définitif et modifiera le stock disponible de manière irréversible.</p>
      </div>
    </app-generic-form>
  `,
})
export class MouvementFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  stocks = signal<Stock[]>([]);
  saving = signal(false);

  form: Partial<ConsommationStock> = {
    stock_id: '',
    type_mouvement: 'CONSOMMATION',
    sens: 'SORTIE',
    quantite: 1,
    commentaire: ''
  };

  currentSchema = computed(() => {
    return [
      {
        fields: [
          {
            key: 'stock_id', label: 'Stock concerné', type: 'select', required: true,
            options: this.stocks().map(s => ({
              value: s.stock_id,
              label: `${s.stock_id} - Reste: ${s.quantite_disponible} ${s.unite}`
            }))
          }
        ]
      },
      {
        gridColumns: 2,
        fields: [
          {
            key: 'type_mouvement', label: 'Type Mouvement', type: 'select', required: true,
            options: [
              { value: 'CONSOMMATION', label: 'Consommation' },
              { value: 'REAPPRO', label: 'Réapprovisionnement' },
              { value: 'TRANSFERT', label: 'Transfert' },
              { value: 'PERTE', label: 'Perte / Casse' },
              { value: 'PEREMPTION', label: 'Péremption' },
              { value: 'INVENTAIRE', label: 'Inventaire' }
            ]
          },
          {
            key: 'sens', label: 'Sens', type: 'select', required: true,
            options: [
              { value: 'ENTREE', label: 'Entrée (+)' },
              { value: 'SORTIE', label: 'Sortie (-)' }
            ]
          }
        ]
      },
      {
        fields: [
          { key: 'quantite', label: 'Quantité', type: 'number', required: true, min: 1, placeholder: 'Valeur strictement positive' },
          { key: 'commentaire', label: 'Commentaire justificatif', type: 'textarea', placeholder: 'Raison de la perte, Réf de livraison...' }
        ]
      }
    ] as FormSection[];
  });

  ngOnInit() {
    this.http.get<Stock[]>('/api/stocks').subscribe(s => this.stocks.set(s));
  }

  onSubmit() {
    if (!this.form.stock_id || !this.form.quantite || this.form.quantite < 1) return;

    this.saving.set(true);

    // Defaulting fields not typed
    this.form.datetime_mouvement = new Date().toISOString();
    this.form.agent_id = 'user-uuid-123'; // Mock user

    this.http.post('/api/mouvements', this.form).subscribe({
      next: () => this.router.navigate(['/stocks/mouvements']),
      error: () => this.saving.set(false)
    });
  }

  onCancel() {
    this.router.navigate(['/stocks/mouvements']);
  }
}
