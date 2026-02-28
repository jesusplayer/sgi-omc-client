import { Component, inject, signal, OnInit, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CategorieLit, Lit, Site } from '../../../../core/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categorie-lit-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (item()) {
      <div class="page-header">
        <div>
          <h1>🗂️ Détail de la catégorie</h1>
          <p class="text-muted">{{ item()?.libelle }} ({{ item()?.code }})</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline text-danger" (click)="onDelete()">🗑️ Supprimer</button>
          <a [routerLink]="['/admin/categories-lits', item()?.categorie_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
        </div>
      </div>

      <div class="grid grid-2" style="gap:1.5rem">
        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem">Informations générales</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Code</span>
              <span class="detail-value font-medium">{{ item()?.code }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Libellé</span>
              <span class="detail-value">{{ item()?.libelle }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Description</span>
              <span class="detail-value">{{ item()?.description || 'Aucune description' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Couleur Dashboard</span>
              <div class="flex items-center gap-2">
                <div [style.background]="item()?.couleur_dashboard" style="width:24px;height:24px;border-radius:4px;border:1px solid var(--border-color)"></div>
                <span class="detail-value">{{ item()?.couleur_dashboard || '#ccc' }}</span>
              </div>
            </div>
             <div class="detail-item">
              <span class="detail-label">Statut</span>
              <span class="detail-value">
                <span class="badge" [class]="item()?.actif ? 'badge-success' : 'badge-neutral'">
                  {{ item()?.actif ? 'Actif' : 'Inactif' }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem">Statistiques & Lits associés</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Nombre total de lits</span>
              <span class="detail-value font-medium">{{ lits().length }} lits répertoriés</span>
            </div>
            
            <div class="flex" style="gap:1rem;margin-top:1rem">
                <div class="stat-pill">
                    <span class="stat-label">Libres</span>
                    <span class="badge badge-success">{{ stats().libre }}</span>
                </div>
                <div class="stat-pill">
                    <span class="stat-label">Occupés</span>
                    <span class="badge badge-danger">{{ stats().occupe }}</span>
                </div>
            </div>

            <div style="margin-top:1.5rem">
                <h3 style="font-size:0.9rem;margin-bottom:0.5rem">Répartition par site TOP 5</h3>
                <ul class="list-unstyled">
                    @for (s of sitesWithCount(); track s.id) {
                        <li class="flex items-center justify-between py-1 border-b" style="font-size:0.85rem">
                            <span>{{ s.nom }}</span>
                            <span class="font-medium">{{ s.count }}</span>
                        </li>
                    } @empty {
                        <li class="text-muted text-sm italic">Aucun lit associé</li>
                    }
                </ul>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="card text-center" style="padding:4rem">
        <div class="spinner" style="margin:0 auto 1rem"></div>
        <p class="text-muted">Chargement de la catégorie...</p>
      </div>
    }
  `,
  styles: [`
    .detail-grid { display: grid; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 0.95rem; color: var(--text-primary); }
    .font-medium { font-weight: 500; }
    .stat-pill { background: var(--bg-card-hover); padding: 0.5rem 1rem; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; gap: 0.25rem; flex: 1; }
    .stat-label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); }
    .list-unstyled { list-style: none; padding: 0; margin: 0; }
  `]
})
export class CategorieLitDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  item = input<CategorieLit | null>(null);
  lits = signal<Lit[]>([]);
  allSites = signal<Site[]>([]);

  stats = computed(() => {
    const list = this.lits();
    return {
      total: list.length,
      libre: list.filter(l => l.statut === 'LIBRE').length,
      occupe: list.filter(l => l.statut === 'OCCUPE').length
    };
  });

  sitesWithCount = computed(() => {
    const list = this.lits();
    const sites = this.allSites();
    const counts: Record<string, number> = {};

    list.forEach(l => {
      counts[l.site_id] = (counts[l.site_id] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([id, count]) => ({
        id,
        count,
        nom: sites.find(s => s.site_id === id)?.nom || id
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  ngOnInit() {
    this.http.get<Site[]>('/api/sites').subscribe(res => this.allSites.set(res));

    // Once item is available, fetch associated lits
    const catId = this.item()?.categorie_id;
    if (catId) {
      this.fetchLits(catId);
    }
  }

  private fetchLits(id: string) {
    this.http.get<Lit[]>(`/api/lits/categorie/${id}`).subscribe(res => this.lits.set(res));
  }

  onDelete() {
    const c = this.item();
    if (c && confirm(`Voulez-vous vraiment supprimer la catégorie "${c.libelle}" ?`)) {
      this.http.delete(`/api/categories-lits/${c.categorie_id}`).subscribe(() => {
        this.router.navigate(['/admin/categories-lits']);
      });
    }
  }
}
