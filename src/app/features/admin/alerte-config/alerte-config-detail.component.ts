import { computed, Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { ConfigurationAlerte } from '../../../core/models';

@Component({
  selector: 'app-alerte-config-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (config()) {
      <div class="page-header">
        <div>
          <h1>{{ config()?.libelle }}</h1>
          <p class="text-muted">Code: {{ config()?.code_regle }}</p>
        </div>
        <div class="page-actions">
          <button class="btn" [class.btn-outline]="config()?.active" [class.btn-danger]="!config()?.active" (click)="toggleActive()">
            {{ config()?.active ? 'Désactiver' : 'Réactiver' }}
          </button>
          <a [routerLink]="['/admin/alertes-config', config()?.config_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 1.5rem">
        <div class="card">
          <div class="card-header">
            <h3>Paramètres de la règle</h3>
            <span class="badge" [class]="config()?.active ? 'badge-success' : 'badge-neutral'">
              {{ config()?.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="card-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Entité surveillée</span>
                <span class="detail-value font-medium">{{ config()?.entite_source }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Champ évalué</span>
                <span class="detail-value">{{ config()?.champ_surveille }}</span>
              </div>
              <div class="detail-item" style="grid-column: 1 / -1">
                <span class="detail-label">Condition de déclenchement</span>
                <span class="detail-value" style="font-family: monospace; background: var(--bg-body); padding: 0.5rem; border-radius: 4px;">
                  x {{ config()?.operateur }} [SEUIL_NIVEAU]
                </span>
                <div class="mt-2" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                  @if (config()?.seuil_niveau1 !== undefined) {
                    <span class="badge" style="background: #fef08a; color: #854d0e">Niv 1: {{ config()?.seuil_niveau1 }}</span>
                  }
                  @if (config()?.seuil_niveau2 !== undefined) {
                    <span class="badge" style="background: #fed7aa; color: #9a3412">Niv 2: {{ config()?.seuil_niveau2 }}</span>
                  }
                  @if (config()?.seuil_niveau3 !== undefined) {
                    <span class="badge" style="background: #fecaca; color: #991b1b">Niv 3: {{ config()?.seuil_niveau3 }}</span>
                  }
                </div>
              </div>
            </div>

            <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-color)">

            <h4 class="mb-3">Diffusion & Notification</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Canaux de notification</span>
                <span class="detail-value flex flex-wrap gap-1">
                  @for (canal of config()?.canaux_notif; track canal) {
                    <span class="badge badge-neutral">{{ canal }}</span>
                  }
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Rôles destinataires</span>
                <span class="detail-value flex flex-wrap gap-1">
                  @for (role of config()?.roles_destinataires; track role) {
                    <span class="badge badge-neutral">{{ role }}</span>
                  }
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Cooldown</span>
                <span class="detail-value">{{ config()?.cooldown_min }} minutes</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Statistiques</h3>
          </div>
          <div class="card-body">
            <div style="text-align: center; padding: 2rem 0">
              <div style="font-size: 3rem; font-weight: 700; color: var(--accent); line-height: 1">{{ alertCount() }}</div>
              <div class="text-muted mt-2">Alertes déclenchées</div>
            </div>
            <p class="text-muted" style="font-size: 0.85em; text-align: center;">Depuis le début de l'événement.</p>
          </div>
        </div>
      </div>
    } @else {
      <div class="loading">Chargement...</div>
    }
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-value { font-size: 1rem; color: var(--text-primary); }
    .font-medium { font-weight: 500;}
    .flex { display: flex; } .flex-wrap { flex-wrap: wrap; } .gap-1 { gap: 0.25rem; } .gap-2 { gap: 0.5rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 0.75rem; } .mt-2 { margin-top: 0.5rem; }
  `]
})
export class AlerteConfigDetailComponent implements OnInit {
  private http = inject(HttpClient);
  item = input<any | null>(null);
  private router = inject(Router);

  config = computed(() => this.item() as ConfigurationAlerte | null);
  alertCount = signal<number>(0);

  ngOnInit() {
    const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (id) {
      // loaded by resolver
      // loaded by resolver
    }
  }



  private loadStats(id: string) {
    // In a real app, this would be a specific endpoint. Here we just fetch alertes and filter by logic, or mock it.
    // For now we mock it to a random number for demonstration
    this.alertCount.set(Math.floor(Math.random() * 50));
  }

  toggleActive() {
    const c = this.config();
    if (!c) return;

    const confirmMsg = c.active
      ? "Cette règle sera désactivée et ne déclenchera plus d'alertes. Confirmer ?"
      : "Cette règle sera réactivée. Confirmer ?";

    if (confirm(confirmMsg)) {
      this.http.put(`/api/configurations-alerte/${c.config_id}`, { ...c, active: !c.active }).subscribe(() => {
        window.location.reload();
      });
    }
  }
}
