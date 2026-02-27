import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConsommationStock } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
    selector: 'app-mouvement-list',
    standalone: true,
    imports: [GenericGridComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <app-generic-grid
      title="🔄 Mouvements de Stock"
      subtitle="Historique des entrées, sorties et consommations (Journal audit)"
      entityName="Mouvements"
      [data]="filteredMouvements()"
      [columns]="columns"
      [headerActions]="headerActions"
      emptyMessage="Aucun mouvement trouvé"
    >
      <ng-container grid-filters>
        <div class="flex" style="gap:1rem; align-items:center">
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
        </div>
      </ng-container>
    </app-generic-grid>
  `,
})
export class MouvementListComponent implements OnInit {
    private http = inject(HttpClient);

    mouvements = signal<ConsommationStock[]>([]);

    selectedType = signal('');
    selectedSens = signal('');

    @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

    filteredMouvements = computed(() => {
        let result = this.mouvements();
        if (this.selectedType()) {
            result = result.filter(m => m.type_mouvement === this.selectedType());
        }
        if (this.selectedSens()) {
            result = result.filter(m => m.sens === this.selectedSens());
        }
        return result;
    });

    columns: GridColumn[] = [
        { field: 'date', header: 'Date & Heure', valueGetter: (m) => this.formatDate(m.datetime_mouvement), cellClass: 'text-sm text-muted' },
        { field: 'produit', header: 'Produit', type: 'link', valueGetter: (m) => this.getProduitName(m.stock_id), routerLink: (m) => ['/stocks', m.stock_id], cellClass: 'font-medium' },
        { field: 'type', header: 'Type', type: 'badge', valueGetter: (m) => m.type_mouvement, badgeColor: () => 'badge-neutral' },
        { field: 'sens', header: 'Sens', type: 'badge', valueGetter: (m) => m.sens === 'ENTREE' ? '↘️ ENTRÉE' : '↗️ SORTIE', badgeColor: (m) => m.sens === 'ENTREE' ? 'badge-success' : 'badge-danger' },
        { field: 'quantite', header: 'Quantité', valueGetter: (m) => (m.sens === 'ENTREE' ? '+' : '-') + m.quantite, cellClass: 'text-right font-medium', cellStyle: (m: any) => m.sens === 'ENTREE' ? 'color: var(--success)' : 'color: var(--danger)' },
        { field: 'commentaire', header: 'Commentaire', valueGetter: (m) => m.commentaire || '—', cellClass: 'text-sm text-muted' }
    ];

    headerActions: GridHeaderAction[] = [
        { label: '+ Nouveau mouvement', route: ['/stocks/mouvements/nouveau'], class: 'btn-primary' }
    ];

    ngOnInit() {
        this.http.get<ConsommationStock[]>('/api/mouvements').subscribe(res => {
            this.mouvements.set(res.sort((a, b) => new Date(b.datetime_mouvement).getTime() - new Date(a.datetime_mouvement).getTime()));
        });
    }

    onTypeChange(e: Event) {
        this.selectedType.set((e.target as HTMLSelectElement).value);
    }

    onSensChange(e: Event) {
        this.selectedSens.set((e.target as HTMLSelectElement).value);
    }

    formatDate(iso: string): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    getProduitName(stockId: string): string {
        return `Stock Ref: ${stockId.substring(0, 8)}`;
    }
}
