import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ConsommationStock, CatalogueProduit, Site } from '../../core/models';

@Component({
    selector: 'app-mouvement-list',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🔄 Mouvements de Stock</h1>
        <p>Historique des entrées, sorties et consommations (Journal audit)</p>
      </div>
      <div class="page-actions">
        <a routerLink="/stocks/mouvements/nouveau" class="btn btn-primary">+ Nouveau mouvement</a>
      </div>
    </div>

    <div class="card">
      <div class="flex" style="gap:1rem;margin-bottom:1.5rem">
        <select class="form-control" [value]="selectedType()" (change)="onTypeChange($event)" style="max-width:250px">
          <option value="">Tous les types</option>
          <option value="CONSOMMATION">Consommation</option>
          <option value="REAPPRO">Réapprovisionnement</option>
          <option value="TRANSFERT">Transfert</option>
          <option value="PERTE">Perte / Casse</option>
          <option value="PEREMPTION">Péremption</option>
          <option value="INVENTAIRE">Ajustement Inventaire</option>
        </select>
        
        <select class="form-control" [value]="selectedSens()" (change)="onSensChange($event)" style="max-width:150px">
          <option value="">Tous sens</option>
          <option value="ENTREE">Entrée ↘️</option>
          <option value="SORTIE">Sortie ↗️</option>
        </select>
        <input class="form-control" style="max-width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>

      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Produit</th>
              <th>Type</th>
              <th>Sens</th>
              <th class="text-right">Quantité</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            @for (m of filteredMouvements(); track m.conso_id) {
              <tr>
                <td class="text-sm text-muted">{{ formatDate(m.datetime_mouvement) }}</td>
                <td class="font-medium"><a [routerLink]="['/stocks', m.stock_id]" class="cell-link">{{ getProduitName(m.stock_id) }}</a></td>
                <td><span class="badge badge-neutral">{{ m.type_mouvement }}</span></td>
                <td>
                  <span class="badge" [class]="m.sens === 'ENTREE' ? 'badge-success' : 'badge-danger'">
                    {{ m.sens === 'ENTREE' ? '↘️ ENTRÉE' : '↗️ SORTIE' }}
                  </span>
                </td>
                <td class="text-right font-medium" [style.color]="m.sens === 'ENTREE' ? 'var(--success)' : 'var(--danger)'">
                  {{ m.sens === 'ENTREE' ? '+' : '-' }}{{ m.quantite }}
                </td>
                <td class="text-sm text-muted">{{ m.commentaire || '—' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucun mouvement trouvé</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class MouvementListComponent implements OnInit {
    private http = inject(HttpClient);

    mouvements = signal<ConsommationStock[]>([]);
    // We mock the mapping of stock_id -> produit_id -> designation
    // using a simplified string for now, in a real app would likely 
    // fetch stock details joined with catalogue.

    selectedType = signal('');
    selectedSens = signal('');
    searchTerm = signal('');

    filteredMouvements = computed(() => {
        let result = this.mouvements();
        if (this.selectedType()) {
            result = result.filter(m => m.type_mouvement === this.selectedType());
        }
        if (this.selectedSens()) {
            result = result.filter(m => m.sens === this.selectedSens());
        }
        const term = this.searchTerm().toLowerCase();
        if (term) {
            result = result.filter(m =>
                (m.commentaire?.toLowerCase().includes(term) ?? false) ||
                m.type_mouvement.toLowerCase().includes(term) ||
                this.getProduitName(m.stock_id).toLowerCase().includes(term)
            );
        }
        return result;
    });

    ngOnInit() {
        this.http.get<ConsommationStock[]>('/api/mouvements').subscribe(res => {
            // Sort DESC by date
            this.mouvements.set(res.sort((a, b) => new Date(b.datetime_mouvement).getTime() - new Date(a.datetime_mouvement).getTime()));
        });
    }

    onTypeChange(e: Event) {
        this.selectedType.set((e.target as HTMLSelectElement).value);
    }

    onSensChange(e: Event) {
        this.selectedSens.set((e.target as HTMLSelectElement).value);
    }

    onSearch(event: Event) {
        this.searchTerm.set((event.target as HTMLInputElement).value);
    }

    formatDate(iso: string): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    getProduitName(stockId: string): string {
        // Mock for display purposes - would be resolved via Stock -> CatalogueProduit
        return `Stock Ref: ${stockId.substring(0, 8)}`;
    }
}
