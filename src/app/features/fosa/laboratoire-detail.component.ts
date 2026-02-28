import { computed, Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ResultatLabo } from '../../core/models';

@Component({
  selector: 'app-laboratoire-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (examen()) {
      <div class="page-header">
        <div>
          <h1>🔬 Détail Examen</h1>
          <p>{{ examen()?.libelle_examen }} ({{ examen()?.type_examen }})</p>
        </div>
        <div class="page-actions">
          <a [routerLink]="['/fosa/laboratoire', examen()?.resultat_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
        </div>
      </div>

      <div class="grid grid-2" style="gap:1.5rem">
        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
            Prescription
          </h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Admission liée (PEC)</span>
              <a [routerLink]="['/fosa', examen()?.pec_id]" class="detail-value cell-link font-medium">{{ examen()?.pec_id }}</a>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type d'examen</span>
              <span class="detail-value"><span class="badge badge-neutral">{{ examen()?.type_examen }}</span></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Libellé</span>
              <span class="detail-value">{{ examen()?.libelle_examen }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date de prélèvement</span>
              <span class="detail-value">{{ formatDate(examen()?.datetime_prelevement) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
            Résultats
          </h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Interprétation globale</span>
              <span class="detail-value">
                <span class="badge" [class]="getInterpretationBadge(examen()!.interpretation)">
                  {{ examen()?.interpretation }}
                </span>
              </span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Date du résultat</span>
              <span class="detail-value">{{ formatDate(examen()?.datetime_resultat) }}</span>
            </div>

            @if (examen()?.valeur) {
              <div class="detail-item">
                <span class="detail-label">Valeur textuelle</span>
                <span class="detail-value">{{ examen()?.valeur }}</span>
              </div>
            }

            @if (examen()?.valeur_numerique !== undefined && examen()?.valeur_numerique !== null) {
              <div class="detail-item">
                <span class="detail-label">Valeur numérique</span>
                <span class="detail-value font-medium" style="font-size:1.2rem; color:var(--text-primary)">
                  {{ examen()?.valeur_numerique }} {{ examen()?.unite }}
                </span>
              </div>
            }

            @if (examen()?.valeur_normale_min !== undefined || examen()?.valeur_normale_max !== undefined) {
              <div class="detail-item">
                <span class="detail-label">Plage de référence</span>
                <span class="detail-value text-muted">
                  [ {{ examen()?.valeur_normale_min ?? '-∞' }} à {{ examen()?.valeur_normale_max ?? '+∞' }} ] {{ examen()?.unite }}
                </span>
              </div>
            }

            @if (examen()?.commentaire) {
              <div class="detail-item" style="grid-column: 1 / -1; margin-top: 0.5rem">
                <span class="detail-label">Commentaire</span>
                <span class="detail-value" style="background:var(--bg-body);padding:0.75rem;border-radius:4px">
                  {{ examen()?.commentaire }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="card text-center" style="padding:4rem">
        <div class="spinner" style="margin:0 auto 1rem"></div>
        <p class="text-muted">Chargement de l'examen...</p>
      </div>
    }
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 0.95rem; color: var(--text-primary); }
  `]
})
export class LaboratoireDetailComponent implements OnInit {
  private http = inject(HttpClient);
  item = input<any | null>(null);

  examen = signal<ResultatLabo | null>(null);

  ngOnInit() {
    if (this.item()) {
      this.examen.set(this.item());
    }
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  getInterpretationBadge(interpretation: string): string {
    switch (interpretation) {
      case 'NORMAL':
      case 'NEGATIF': return 'badge-success';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'CRITIQUE': return 'badge-danger';
      case 'ANORMAL_BAS':
      case 'ANORMAL_HAUT':
      case 'POSITIF': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }
}
