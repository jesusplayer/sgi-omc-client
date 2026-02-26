import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Stock, CatalogueProduit, Site } from '../../core/models';

@Component({
    selector: 'app-stock-detail',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>📦 Détail stock</h1>
        <p>Informations sur le stock</p>
      </div>
      <div class="page-actions">
        <a routerLink="/stocks" class="btn btn-outline">← Retour</a>
      </div>
    </div>

    @if (stock(); as s) {
      <div class="card" style="max-width:600px">
        <div class="detail-grid">
          <div class="detail-row"><span class="detail-label">Produit</span><span class="font-semibold">{{ getProduit(s.produit_id) }}</span></div>
          <div class="detail-row"><span class="detail-label">Site</span><span>{{ getSite(s.site_id) }}</span></div>
          <div class="detail-row"><span class="detail-label">Quantité disponible</span><span class="font-semibold">{{ s.quantite_disponible }} {{ s.unite }}</span></div>
          <div class="detail-row"><span class="detail-label">Quantité initiale</span><span>{{ s.quantite_initiale }}</span></div>
          <div class="detail-row"><span class="detail-label">Seuil alerte</span><span>{{ s.seuil_alerte }}</span></div>
          <div class="detail-row"><span class="detail-label">Seuil critique</span><span>{{ s.seuil_critique }}</span></div>
          <div class="detail-row"><span class="detail-label">Statut</span>
            <span class="badge" [class]="getStatutBadge(s.statut)">{{ s.statut }}</span>
          </div>
          <div class="detail-row"><span class="detail-label">Dernière MAJ</span><span class="text-muted">{{ formatDate(s.derniere_maj) }}</span></div>
        </div>
      </div>
    }
  `,
    styles: [`
    .detail-grid { display: flex; flex-direction: column; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 500; color: var(--text-secondary); }
  `],
})
export class StockDetailComponent implements OnInit {
    private http = inject(HttpClient);
    private route = inject(ActivatedRoute);
    stock = signal<Stock | null>(null);
    produits = signal<CatalogueProduit[]>([]);
    sites = signal<Site[]>([]);

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.http.get<Stock>(`/api/stocks/${id}`).subscribe((s) => this.stock.set(s));
        this.http.get<CatalogueProduit[]>('/api/catalogue-produits').subscribe((p) => this.produits.set(p));
        this.http.get<Site[]>('/api/sites').subscribe((s) => this.sites.set(s));
    }

    getProduit(id: string): string { return this.produits().find((p) => p.produit_id === id)?.designation ?? id; }
    getSite(id: string): string { return this.sites().find((s) => s.site_id === id)?.nom ?? id; }
    getStatutBadge(s: string): string { return s === 'NORMAL' ? 'badge-success' : s === 'ALERTE' ? 'badge-warning' : 'badge-danger'; }
    formatDate(iso: string): string { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }); }
}
