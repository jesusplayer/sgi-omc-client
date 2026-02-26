import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble en temps réel — {{ auth.site()?.nom ?? 'Tous sites' }}</p>
      </div>
    </div>

    @if (loading()) {
      <div class="grid grid-4">
        @for (i of [1,2,3,4]; track i) {
          <div class="stat-card animate-pulse" style="height:88px"></div>
        }
      </div>
    } @else {
      <!-- KPI Cards -->
      <div class="grid grid-4">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">🩺</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.total_consultations ?? 0 }}</div>
            <div class="stat-label">Consultations</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">🚑</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.total_evacuations ?? 0 }}</div>
            <div class="stat-label">Évacuations ({{ stats()?.taux_evacuation ?? 0 }}%)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.1);color:#10b981">🛏️</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.lits_occupes ?? 0 }} / {{ stats()?.lits_total ?? 0 }}</div>
            <div class="stat-label">Lits occupés ({{ stats()?.taux_occupation_lits ?? 0 }}%)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">🔔</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.alertes_actives ?? 0 }}</div>
            <div class="stat-label">Alertes actives</div>
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:1.5rem">
        <!-- FOSA Sites -->
        <div class="card">
          <div class="card-header">
            <h3>🏥 Occupation FOSA</h3>
          </div>
          @if (stats()?.fosa_sites?.length) {
            <div class="table-container" style="border:none">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>FOSA</th>
                    <th>Capacité</th>
                    <th>Occupés</th>
                    <th>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  @for (fosa of stats()!.fosa_sites; track fosa.site_id) {
                    <tr>
                      <td class="font-medium">{{ fosa.nom }}</td>
                      <td>{{ fosa.capacite_lits }}</td>
                      <td>{{ fosa.lits_occupes }}</td>
                      <td>
                        <span class="badge" [class]="getOccBadge(+fosa.taux)">
                          {{ fosa.taux }}%
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="text-muted text-center">Aucune FOSA configurée</p>
          }
        </div>

        <!-- Alertes actives -->
        <div class="card">
          <div class="card-header">
            <h3>🔔 Alertes actives</h3>
            <a routerLink="/alertes" class="btn btn-sm btn-outline">Voir tout</a>
          </div>
          @if (alertes().length) {
            <div class="alert-list">
              @for (alerte of alertes(); track alerte.alerte_id) {
                <div class="alert-item" [class]="'alert-level-' + alerte.niveau">
                  <span class="alert-level">N{{ alerte.niveau }}</span>
                  <div class="alert-info">
                    <span class="alert-title">{{ alerte.titre }}</span>
                    <span class="alert-meta text-xs text-muted">{{ alerte.type_alerte }} · {{ formatDate(alerte.datetime_declenchement) }}</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-muted text-center" style="padding:2rem">Aucune alerte active ✅</p>
          }
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card" style="margin-top:1.5rem">
        <div class="card-header">
          <h3>⚡ Actions rapides</h3>
        </div>
        <div class="quick-actions">
          <a routerLink="/psf/nouveau" class="quick-btn">
            <span>🛫</span>
            <span>Nouveau voyageur</span>
          </a>
          <a routerLink="/pma/nouvelle" class="quick-btn">
            <span>🩺</span>
            <span>Nouvelle consultation</span>
          </a>
          <a routerLink="/regulation/nouveau" class="quick-btn">
            <span>📞</span>
            <span>Nouvel appel</span>
          </a>
          <a routerLink="/fosa/admission" class="quick-btn">
            <span>🏥</span>
            <span>Admettre patient</span>
          </a>
          <a routerLink="/fosa/lits" class="quick-btn">
            <span>🛏️</span>
            <span>Plan des lits</span>
          </a>
          <a routerLink="/stocks" class="quick-btn">
            <span>📦</span>
            <span>Stocks</span>
          </a>
        </div>
      </div>
    }
  `,
    styles: [`
    .alert-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .alert-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      border-left: 3px solid;
      background: var(--bg-secondary);
      transition: background 0.15s;
      &:hover { background: var(--border-color); }
    }
    .alert-level-1 { border-color: var(--alert-1); }
    .alert-level-2 { border-color: var(--alert-2); }
    .alert-level-3 { border-color: var(--alert-3); }
    .alert-level {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .alert-level-1 .alert-level { background: rgba(59,130,246,0.12); color: #3b82f6; }
    .alert-level-2 .alert-level { background: rgba(245,158,11,0.12); color: #d97706; }
    .alert-level-3 .alert-level { background: rgba(239,68,68,0.12); color: #dc2626; }
    .alert-info { display: flex; flex-direction: column; min-width: 0; }
    .alert-title { font-size: 0.85rem; font-weight: 500; }
    .alert-meta { margin-top: 0.15rem; }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.75rem;
    }
    .quick-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
      color: var(--text-primary);
      text-decoration: none;
      transition: all 0.2s;
      font-size: 0.85rem;
      text-align: center;
      &:hover { border-color: var(--accent); background: var(--accent-light); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
      span:first-child { font-size: 1.5rem; }
    }
  `],
})
export class DashboardComponent implements OnInit {
    auth = inject(AuthService);
    private http = inject(HttpClient);

    stats = signal<any>(null);
    alertes = signal<any[]>([]);
    loading = signal(true);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.http.get<any>('/api/dashboard/stats').subscribe((data) => {
            this.stats.set(data);
            this.loading.set(false);
        });
        this.http.get<any[]>('/api/alertes').subscribe((all) => {
            this.alertes.set(all.filter((a) => a.statut === 'ACTIVE').slice(0, 5));
        });
    }

    getOccBadge(taux: number): string {
        if (taux >= 100) return 'badge-danger';
        if (taux >= 75) return 'badge-warning';
        if (taux >= 50) return 'badge-info';
        return 'badge-success';
    }

    formatDate(iso: string): string {
        return new Date(iso).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    }
}
