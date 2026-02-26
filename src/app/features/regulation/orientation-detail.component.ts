import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Orientation } from '../../core/models';

@Component({
    selector: 'app-orientation-detail',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    @if (orientation()) {
      <div class="page-header">
        <div>
          <h1>🚑 Détail du transfert</h1>
          <p>Transfert de patient vers {{ orientation()?.fosa_destination_id }}</p>
        </div>
        <div class="page-actions">
          <a [routerLink]="['/regulation/orientations', orientation()?.orientation_id, 'editer']" class="btn btn-primary">✏️ Modifier le statut</a>
        </div>
      </div>

      <div class="grid grid-2" style="gap:1.5rem">
        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
            Informations d'orientation
          </h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Statut</span>
              <span class="detail-value text-lg">
                <span class="badge" [class]="getStatutBadge(orientation()!.statut)">{{ orientation()?.statut }}</span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">FOSA Destination</span>
              <span class="detail-value font-medium">{{ orientation()?.fosa_destination_id }}</span>
            </div>
            @if (orientation()?.fosa_alternative_id) {
              <div class="detail-item">
                <span class="detail-label">FOSA Alternative</span>
                <span class="detail-value">{{ orientation()?.fosa_alternative_id }}</span>
              </div>
            }
            <div class="detail-item">
              <span class="detail-label">Motif de l'évacuation</span>
              <span class="detail-value text-muted">{{ orientation()?.motif_evacuation }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">État du patient (Départ)</span>
              <span class="detail-value"><span class="badge" [class]="getEtatBadge(orientation()!.etat_patient_depart)">{{ orientation()?.etat_patient_depart }}</span></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Moyen de transport</span>
              <span class="detail-value"><span class="badge badge-info">{{ orientation()?.moyen_transport }}</span></span>
            </div>
            
            @if (orientation()?.statut === 'REFUSE') {
              <div class="detail-item mt-4 p-4 text-red bg-red-50 rounded" style="background:var(--danger-light);padding:1rem;border-radius:4px">
                <span class="detail-label text-danger">Motif du Refus FOSA</span>
                <span class="detail-value font-medium text-danger">{{ orientation()?.motif_refus }}</span>
              </div>
            }
          </div>
        </div>

        <div class="card">
          <h2 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
            Chronologie & Liens
          </h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Heure de la décision</span>
              <span class="detail-value">{{ formatDate(orientation()?.heure_decision) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Heure de départ (Effectif)</span>
              <span class="detail-value">{{ formatDate(orientation()?.heure_depart) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Heure d'arrivée (FOSA)</span>
              <span class="detail-value font-medium">{{ formatDate(orientation()?.heure_arrivee_fosa) }}</span>
            </div>
            
            <div style="margin-top:2rem;border-top:1px solid var(--border-color);padding-top:1rem" class="detail-grid">
              @if (orientation()?.appel_regulation_id) {
                <div class="detail-item">
                  <span class="detail-label">Appel de Régulation lié</span>
                  <a [routerLink]="['/regulation', orientation()?.appel_regulation_id]" class="detail-value cell-link">
                    Voir l'appel 📞
                  </a>
                </div>
              }
              @if (orientation()?.consultation_id) {
                <div class="detail-item">
                  <span class="detail-label">Consultation PMA liée</span>
                  <a [routerLink]="['/pma', orientation()?.consultation_id]" class="detail-value cell-link">
                    Voir la consultation 🩺
                  </a>
                </div>
              }
              @if (orientation()?.pec_id) {
                <div class="detail-item">
                  <span class="detail-label">Prise en charge FOSA (Admission) liée</span>
                  <a [routerLink]="['/fosa', orientation()?.pec_id]" class="detail-value cell-link">
                    Voir l'admission 🛏️
                  </a>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="card text-center" style="padding:4rem">
        <div class="spinner" style="margin:0 auto 1rem"></div>
        <p class="text-muted">Chargement du transfert...</p>
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
export class OrientationDetailComponent implements OnInit {
    private http = inject(HttpClient);
    private route = inject(ActivatedRoute);

    orientation = signal<Orientation | null>(null);

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.http.get<Orientation>(`/api/orientations/${id}`).subscribe((o) => this.orientation.set(o));
        }
    }

    formatDate(iso?: string): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    getEtatBadge(e: string): string {
        switch (e) {
            case 'STABLE': return 'badge-success';
            case 'GRAVE': return 'badge-warning';
            case 'CRITIQUE':
            case 'INCONSCIENT': return 'badge-danger';
            default: return 'badge-neutral';
        }
    }

    getStatutBadge(s: string): string {
        switch (s) {
            case 'ARRIVE': return 'badge-success';
            case 'EN_COURS': return 'badge-info';
            case 'EN_ATTENTE': return 'badge-warning';
            case 'REFUSE':
            case 'ANNULE':
            case 'DECES_TRANSIT': return 'badge-danger';
            default: return 'badge-neutral';
        }
    }
}
