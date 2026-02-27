import { computed, Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Vaccination } from '../../core/models';

@Component({
    selector: 'app-vaccination-detail',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>💉 Détail vaccination</h1>
        <p>Informations sur la vaccination</p>
      </div>
      <div class="page-actions">
        @if (vaccination()) {
          <a [routerLink]="['/admin/vaccinations', vaccination()!.vaccination_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
        }
        <a routerLink="/admin/vaccinations" class="btn btn-outline">← Retour</a>
      </div>
    </div>

    @if (vaccination(); as v) {
      <div class="card" style="max-width:600px">
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Libellé</span>
            <span class="detail-value font-semibold">{{ v.libelle }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Obligatoire</span>
            <span class="detail-value">
              <span class="badge" [class]="v.obligatoire ? 'badge-danger' : 'badge-info'">
                {{ v.obligatoire ? 'Oui — Obligatoire' : 'Non — Optionnel' }}
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Statut</span>
            <span class="detail-value">
              <span class="badge" [class]="v.actif ? 'badge-success' : 'badge-neutral'">
                {{ v.actif ? 'Actif' : 'Inactif' }}
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Créé le</span>
            <span class="detail-value text-muted">{{ formatDate(v.created_at) }}</span>
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    .detail-grid { display: flex; flex-direction: column; gap: 1rem; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 500; color: var(--text-secondary); }
    .detail-value { text-align: right; }
  `],
})
export class VaccinationDetailComponent implements OnInit {
    private http = inject(HttpClient);
    item = input<any | null>(null);
    vaccination = computed(() => this.item() as Vaccination | null);

    ngOnInit() {
        const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
        if (id) {
            
        }
    }

    formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString('fr-FR');
    }
}
