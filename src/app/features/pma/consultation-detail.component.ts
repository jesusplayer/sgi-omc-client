import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Consultation, Patient, Site } from '../../core/models';

@Component({
    selector: 'app-consultation-detail',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🩺 Détail consultation</h1>
        <p>Fiche complète de la consultation</p>
      </div>
      <div class="page-actions">
        @if (consultation()) {
          <a [routerLink]="['/pma', consultation()!.consultation_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
          <button class="btn btn-danger" (click)="onDelete()">🗑 Supprimer</button>
        }
        <a routerLink="/pma" class="btn btn-outline">← Retour</a>
      </div>
    </div>

    @if (consultation(); as c) {
      <div class="grid grid-2" style="gap:1.5rem">
        <div class="card">
          <h3 style="margin-bottom:1rem">📋 Informations</h3>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">Patient</span><span class="font-semibold">{{ getPatientName(c.patient_id) }}</span></div>
            <div class="detail-row"><span class="detail-label">Site</span><span>{{ getSiteName(c.site_id) }}</span></div>
            <div class="detail-row"><span class="detail-label">Motif</span><span>{{ c.motif }}</span></div>
            <div class="detail-row"><span class="detail-label">Diagnostic</span><span>{{ c.diagnostic_presomptif ?? '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Soins</span><span>{{ c.soins_prodigues ?? '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Décision</span>
              <span class="badge" [class]="getDecisionBadge(c.decision)">{{ c.decision }}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:1rem">❤️ Signes vitaux</h3>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">TA</span><span>{{ c.ta_systolique ?? '—' }}/{{ c.ta_diastolique ?? '—' }} mmHg</span></div>
            <div class="detail-row"><span class="detail-label">Pouls</span><span>{{ c.pouls ?? '—' }} bpm</span></div>
            <div class="detail-row"><span class="detail-label">Température</span>
              <span class="badge" [class]="(c.temperature ?? 0) >= 38 ? 'badge-danger' : 'badge-success'">{{ c.temperature ?? '—' }}°C</span>
            </div>
            <div class="detail-row"><span class="detail-label">SpO2</span>
              <span class="badge" [class]="(c.saturation_o2 ?? 100) < 95 ? 'badge-danger' : 'badge-success'">{{ c.saturation_o2 ?? '—' }}%</span>
            </div>
            <div class="detail-row"><span class="detail-label">Glasgow</span><span>{{ c.glasgow_score ?? '—' }} / 15</span></div>
          </div>
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
export class ConsultationDetailComponent implements OnInit {
    private http = inject(HttpClient);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    consultation = signal<Consultation | null>(null);
    patients = signal<Patient[]>([]);
    sites = signal<Site[]>([]);

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.http.get<Consultation>(`/api/consultations/${id}`).subscribe((c) => this.consultation.set(c));
        this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
        this.http.get<Site[]>('/api/sites').subscribe((s) => this.sites.set(s));
    }

    getPatientName(id: string): string { const p = this.patients().find((x) => x.patient_id === id); return p ? `${p.nom} ${p.prenom}` : id; }
    getSiteName(id: string): string { return this.sites().find((x) => x.site_id === id)?.nom ?? id; }
    getDecisionBadge(d: string): string {
        if (d === 'RETOUR_POSTE') return 'badge-success';
        if (d === 'EVACUATION_FOSA') return 'badge-danger';
        return 'badge-warning';
    }
    onDelete() {
        if (confirm('Supprimer cette consultation ?')) {
            this.http.delete(`/api/consultations/${this.consultation()!.consultation_id}`).subscribe(() => this.router.navigate(['/pma']));
        }
    }
}
