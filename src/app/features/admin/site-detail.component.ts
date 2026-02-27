import { Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Site } from '../../core/models';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-site-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (item()) {
      <div class="page-header">
        <div>
          <h1>🏨 Détail du site</h1>
          <p>{{ item()?.nom }} ({{ item()?.code_site }})</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline text-danger" (click)="onDelete()">🗑️ Supprimer</button>
          <a [routerLink]="['/admin/sites', item()?.site_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
        </div>
      </div>

      <div class="grid grid-2" style="gap:1.5rem">
        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
            Informations générales
          </h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Code Site</span>
              <span class="detail-value font-medium">{{ item()?.code_site }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Nom</span>
              <span class="detail-value">{{ item()?.nom }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type</span>
              <span class="detail-value"><span class="badge badge-info">{{ item()?.type_site }}</span></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Statut</span>
              <span class="detail-value">
                <span class="badge" [class]="item()?.actif ? 'badge-success' : 'badge-neutral'">
                  {{ item()?.actif ? 'Actif' : 'Inactif' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Téléphone</span>
              <span class="detail-value">{{ item()?.telephone || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
            Localisation & Intégration
          </h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Adresse</span>
              <span class="detail-value">{{ item()?.adresse || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Coordonnées (Lat, Lng)</span>
              <span class="detail-value">
                {{ item()?.latitude ? item()?.latitude + ', ' + item()?.longitude : '—' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ID DHIS2 Org Unit</span>
              <span class="detail-value text-muted">{{ item()?.dhis2_org_unit_id || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ID Master Facility List</span>
              <span class="detail-value text-muted">{{ item()?.mfl_facility_id || '—' }}</span>
            </div>
          </div>
        </div>

        @if (['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'].includes(item()!.type_site)) {
          <div class="card" style="grid-column: 1 / -1;">
            <h2 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
              Capacités d'hébergement
            </h2>
            <div class="flex" style="gap:2rem">
              <div class="stat-card" style="flex:1">
                <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:var(--primary)">🛏️</div>
                <div class="stat-content">
                  <div class="stat-value">{{ item()?.capacite_lits }}</div>
                  <div class="stat-label">Capacité totale</div>
                </div>
              </div>
              <div class="stat-card" style="flex:1">
                <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:var(--warning)">🛌</div>
                <div class="stat-content">
                  <div class="stat-value">{{ item()?.lits_occupes }}</div>
                  <div class="stat-label">Lits occupés</div>
                </div>
              </div>
              <div class="stat-card" style="flex:1">
                <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:var(--success)">✅</div>
                <div class="stat-content">
                  <div class="stat-value">{{ item()!.capacite_lits - item()!.lits_occupes }}</div>
                  <div class="stat-label">Lits disponibles</div>
                </div>
              </div>
            </div>
            
            <div style="margin-top:1.5rem">
              <div class="flex" style="justify-content:space-between;margin-bottom:0.5rem">
                <span class="text-sm font-medium">Taux d'occupation</span>
                <span class="text-sm font-medium">{{ getOccupationRate() }}%</span>
              </div>
              <div class="progress-bar-bg" style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
                <div class="progress-bar-fill" [style.width.%]="getOccupationRate()" 
                     [style.background]="getOccupationColor()" style="height:100%"></div>
              </div>
              <p class="text-xs text-muted" style="margin-top:0.5rem">Seuil d'alerte configuré à {{ item()?.seuil_alerte_lits }}%</p>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="card text-center" style="padding:4rem">
        <div class="spinner" style="margin:0 auto 1rem"></div>
        <p class="text-muted">Chargement du site...</p>
      </div>
    }
  `,
  styles: [`
    .detail-grid { display: grid; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 0.95rem; color: var(--text-primary); }
  `]
})
export class SiteDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<Site | null>(null);

  ngOnInit() {
    // Data is now fetched via route resolver and bound to \`item\` input
  }

  getOccupationRate(): number {
    const s = this.item();
    if (!s || s.capacite_lits === 0) return 0;
    return Math.round((s.lits_occupes / s.capacite_lits) * 100);
  }

  getOccupationColor(): string {
    const rate = this.getOccupationRate();
    const s = this.item();
    if (s && rate >= s.seuil_alerte_lits) return 'var(--danger)';
    if (rate >= 80) return 'var(--warning)';
    return 'var(--success)';
  }

  onDelete() {
    const s = this.item();
    if (s && confirm(`Voulez-vous vraiment désactiver le site "${s.nom}" ?`)) {
      this.http.patch(`/api/sites/${s.site_id}`, { actif: false }).subscribe(() => {
        this.router.navigate(['/admin/sites']);
      });
    }
  }
}
