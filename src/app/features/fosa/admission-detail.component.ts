import { computed, Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { PriseEnCharge, Patient } from '../../core/models';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🏥 Détail admission</h1>
        <p>Prise en charge FOSA</p>
      </div>
      <div class="page-actions">
        @if (item()) {
          <a [routerLink]="['/fosa', item()!.pec_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
          <button class="btn btn-danger" (click)="onDelete()">🗑 Supprimer</button>
        }
        <a routerLink="/fosa" class="btn btn-outline">← Retour</a>
      </div>
    </div>

    @if (item(); as p) {
      <div class="card" style="max-width:700px">
        <div class="detail-grid">
          <div class="detail-row"><span class="detail-label">Patient</span><span class="font-semibold">{{ getPatientName(p.patient_id) }}</span></div>
          <div class="detail-row"><span class="detail-label">Admission</span><span>{{ formatDate(p.admission_datetime) }}</span></div>
          <div class="detail-row"><span class="detail-label">État entrée</span>
            <span class="badge" [class]="p.etat_entree === 'CRITIQUE' ? 'badge-danger' : p.etat_entree === 'GRAVE' ? 'badge-warning' : 'badge-info'">{{ p.etat_entree }}</span>
          </div>
          <div class="detail-row"><span class="detail-label">Diagnostic entrée</span><span>{{ p.diagnostic_entree ?? '—' }}</span></div>
          <div class="detail-row"><span class="detail-label">Diagnostic final</span><span>{{ p.diagnostic_final ?? '—' }} {{ p.libelle_diagnostic ?? '' }}</span></div>
          <div class="detail-row"><span class="detail-label">Lit</span><span>{{ p.lit_id ?? 'Non assigné' }}</span></div>
          <div class="detail-row"><span class="detail-label">Oxygène</span><span>{{ p.oxygene_requis ? 'Oui' : 'Non' }}</span></div>
          <div class="detail-row"><span class="detail-label">Réanimation</span><span>{{ p.reanimation ? 'Oui' : 'Non' }}</span></div>
          @if (p.devenir) {
            <div class="detail-row"><span class="detail-label">Devenir</span>
              <span class="badge badge-success">{{ p.devenir }}</span>
            </div>
          }
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
export class AdmissionDetailComponent implements OnInit {
  private http = inject(HttpClient);
  item = input<PriseEnCharge | null>(null);
  private router = inject(Router);
  patients = signal<Patient[]>([]);

  ngOnInit() {


    this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
  }

  getPatientName(id: string): string { const p = this.patients().find((x) => x.patient_id === id); return p ? `${p.nom} ${p.prenom}` : id; }
  formatDate(iso: string): string { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }); }

  onDelete() {
    if (confirm('Supprimer cette admission ?')) {
      this.http.delete(`/api/prises-en-charge/${this.item()!.pec_id}`).subscribe(() => this.router.navigate(['/fosa']));
    }
  }
}
