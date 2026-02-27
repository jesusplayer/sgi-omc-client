import { Component, inject, signal, OnInit, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Lit, Site, CategorieLit } from '../../core/models';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-lit-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    @if (lit()) {
      <div class="page-header">
        <div>
          <h1>🛏️ Détail du lit</h1>
          <p class="text-muted">Numéro: {{ lit()?.numero_lit }}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline text-danger" (click)="onDelete()">🗑️ Supprimer</button>
          <a [routerLink]="['/admin/lits', lit()?.lit_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
        </div>
      </div>

      <div class="grid grid-2" style="gap:1.5rem">
        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem">Informations du lit</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Numéro de lit</span>
              <span class="detail-value font-medium">{{ lit()?.numero_lit }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Statut actuel</span>
              <span class="detail-value">
                <span class="badge" [class]="getStatusBadgeClass()">
                  {{ lit()?.statut }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Catégorie</span>
              <span class="detail-value">{{ categoryName() }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Dernière mise à jour</span>
              <span class="detail-value text-muted">{{ lit()?.updated_at | date:'medium' }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem">Site & Emplacement</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Site FOSA / PMA</span>
              <span class="detail-value font-medium">{{ siteName() }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type de site</span>
              <span class="detail-value">{{ siteType() }}</span>
            </div>
            <div class="detail-item" style="margin-top:1rem">
              <a [routerLink]="['/admin/sites', lit()?.site_id]" class="btn btn-outline btn-sm">
                🏢 Voir les détails du site
              </a>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="card text-center" style="padding:4rem">
        <div class="spinner" style="margin:0 auto 1rem"></div>
        <p class="text-muted">Chargement du lit...</p>
      </div>
    }
  `,
    styles: [`
    .detail-grid { display: grid; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 0.95rem; color: var(--text-primary); }
    .font-medium { font-weight: 500; }
  `]
})
export class LitDetailComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);

    // Bound from route resolver
    lit = input<Lit | null>(null);

    sites = signal<Site[]>([]);
    categories = signal<CategorieLit[]>([]);

    siteName = computed(() => {
        const l = this.lit();
        if (!l) return '—';
        return this.sites().find(s => s.site_id === l.site_id)?.nom || 'Chargement...';
    });

    siteType = computed(() => {
        const l = this.lit();
        if (!l) return '—';
        return this.sites().find(s => s.site_id === l.site_id)?.type_site || '—';
    });

    categoryName = computed(() => {
        const l = this.lit();
        if (!l) return '—';
        return this.categories().find(c => c.categorie_id === l.categorie_id)?.libelle || 'Chargement...';
    });

    ngOnInit() {
        // Fetch dependencies
        this.http.get<Site[]>('/api/sites').subscribe(res => this.sites.set(res));
        this.http.get<CategorieLit[]>('/api/categories-lits').subscribe(res => this.categories.set(res));
    }

    getStatusBadgeClass(): string {
        const s = this.lit()?.statut;
        switch (s) {
            case 'LIBRE': return 'badge-success';
            case 'OCCUPE': return 'badge-danger';
            case 'RESERVE': return 'badge-warning';
            case 'HORS_SERVICE': return 'badge-neutral';
            default: return 'badge-neutral';
        }
    }

    onDelete() {
        const l = this.lit();
        if (l && confirm(`Voulez-vous vraiment supprimer le lit numéro ${l.numero_lit} ?`)) {
            this.http.delete(`/api/lits/${l.lit_id}`).subscribe(() => {
                this.router.navigate(['/admin/lits']);
            });
        }
    }
}
