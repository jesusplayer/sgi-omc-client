import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-inventaire',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <a routerLink="/stocks" class="text-muted" style="text-decoration:none">← Retour aux stocks</a>
        </div>
        <h1>📝 Inventaire Physique (Ajustement)</h1>
        <p class="text-muted">Enregistrement d'un comptage pour ajuster les quantités</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" (click)="validerInventaire()">💾 Valider l'inventaire</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Produits à compter</h3>
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Référence / Produit</th>
              <th>Quantité Théorique (SGI)</th>
              <th>Quantité Physique (Comptée)</th>
              <th>Écart</th>
              <th>Justification</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id; let idx = $index) {
              <tr>
                <td class="font-medium">{{ item.produit }}</td>
                <td>{{ item.theorique }} {{ item.unite }}</td>
                <td>
                  <input type="number" class="form-control" style="width:120px" 
                         [value]="item.physique" (input)="updatePhysique(idx, $event)" />
                </td>
                <td>
                  <span class="badge" 
                        [class.badge-danger]="item.physique !== null && item.physique < item.theorique"
                        [class.badge-success]="item.physique !== null && item.physique === item.theorique"
                        [class.badge-warning]="item.physique !== null && item.physique > item.theorique"
                        [class.badge-neutral]="item.physique === null">
                    {{ item.physique !== null ? (item.physique - item.theorique) : '---' }}
                  </span>
                </td>
                <td>
                  <input type="text" class="form-control" placeholder="Raison de l'écart..." 
                         [disabled]="item.physique === null || item.physique === item.theorique" />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
    styles: [`
    .font-medium { font-weight: 500; }
    .flex { display: flex; } .items-center { align-items: center; } .gap-2 { gap: 0.5rem; } .mb-2 { margin-bottom: 0.5rem; }
  `]
})
export class InventaireComponent {
    items = signal([
        { id: 1, produit: 'Paracétamol 500mg', theorique: 1250, physique: null as number | null, unite: 'Comprimés' },
        { id: 2, produit: 'Amoxicilline 1g', theorique: 300, physique: null as number | null, unite: 'Gélules' },
        { id: 3, produit: 'Gants latex non stériles (M)', theorique: 45, physique: null as number | null, unite: 'Boîtes' },
        { id: 4, produit: 'Seringues 5ml', theorique: 800, physique: null as number | null, unite: 'Unités' },
    ]);

    updatePhysique(index: number, event: Event) {
        const val = (event.target as HTMLInputElement).value;
        const num = val === '' ? null : Number(val);
        this.items.update(curr => {
            const copy = [...curr];
            copy[index] = { ...copy[index], physique: num };
            return copy;
        });
    }

    validerInventaire() {
        alert("Inventaire enregistré avec succès. Les stocks ont été ajustés.");
    }
}
