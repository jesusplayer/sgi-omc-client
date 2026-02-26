import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsommationStock, Stock } from '../../core/models';

@Component({
    selector: 'app-mouvement-form',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>➕ Saisir un MOUVEMENT</h1>
        <p>Enregistrer une entrée ou sortie de stock</p>
      </div>
    </div>

    <div class="card" style="max-width:600px">
      <form (ngSubmit)="onSubmit()">
        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Stock concerné *</label>
          <select class="form-control" [(ngModel)]="form.stock_id" name="stock_id" required>
            <option value="" disabled>Sélectionner un stock</option>
            @for (s of stocks(); track s.stock_id) {
              <option [value]="s.stock_id">{{ s.stock_id }} - Reste: {{ s.quantite_disponible }} {{ s.unite }}</option>
            }
          </select>
        </div>

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Type Mouvement *</label>
            <select class="form-control" [(ngModel)]="form.type_mouvement" name="type_mouvement" required>
              <option value="CONSOMMATION">Consommation</option>
              <option value="REAPPRO">Réapprovisionnement</option>
              <option value="TRANSFERT">Transfert</option>
              <option value="PERTE">Perte / Casse</option>
              <option value="PEREMPTION">Péremption</option>
              <option value="INVENTAIRE">Inventaire</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sens *</label>
            <select class="form-control" [(ngModel)]="form.sens" name="sens" required>
              <option value="ENTREE">Entrée (+)</option>
              <option value="SORTIE">Sortie (-)</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Quantité *</label>
          <input type="number" class="form-control" [(ngModel)]="form.quantite" name="quantite" required min="1" placeholder="Valeur strictement positive" />
        </div>

        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Commentaire justificatif</label>
          <textarea class="form-control" [(ngModel)]="form.commentaire" name="commentaire" rows="3" placeholder="Raison de la perte, Réf de livraison..."></textarea>
        </div>

        <div class="alert alert-warning" style="margin-bottom:1.5rem">
          <p class="text-sm font-medium">Attention: Ce mouvement est définitif et modifiera le stock disponible de manière irréversible.</p>
        </div>

        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary" [disabled]="!form.stock_id || !form.quantite || form.quantite < 1">
            ✅ Valider Mouvement
          </button>
          <button type="button" class="btn btn-outline" (click)="onCancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class MouvementFormComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);

    stocks = signal<Stock[]>([]);

    form: Partial<ConsommationStock> = {
        stock_id: '',
        type_mouvement: 'CONSOMMATION',
        sens: 'SORTIE',
        quantite: 1,
        commentaire: ''
    };

    ngOnInit() {
        this.http.get<Stock[]>('/api/stocks').subscribe(s => this.stocks.set(s));
    }

    onSubmit() {
        if (!this.form.stock_id || !this.form.quantite || this.form.quantite < 1) return;

        // Defaulting fields not typed
        this.form.datetime_mouvement = new Date().toISOString();
        this.form.agent_id = 'user-uuid-123'; // Mock user

        this.http.post('/api/mouvements', this.form).subscribe(() => {
            this.router.navigate(['/stocks/mouvements']);
        });
    }

    onCancel() {
        this.router.navigate(['/stocks/mouvements']);
    }
}
