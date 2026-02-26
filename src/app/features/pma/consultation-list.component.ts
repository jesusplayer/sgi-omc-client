import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Consultation, Patient, Site } from '../../core/models';

@Component({
  selector: 'app-consultation-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🩺 Consultations PMA</h1>
        <p>Consultations médicales aux postes médicaux avancés</p>
      </div>
      <div class="page-actions">
        <a routerLink="/pma/nouvelle" class="btn btn-primary">+ Nouvelle consultation</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Consultations ({{ consultations().length }})</h3>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Site PMA</th>
              <th>Motif</th>
              <th>T°</th>
              <th>SpO2</th>
              <th>Décision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.consultation_id) {
              <tr>
                <td class="text-sm"><a [routerLink]="['/pma', c.consultation_id]" class="cell-link">{{ formatDate(c.heure_arrivee) }}</a></td>
                <td class="font-medium">{{ getPatientName(c.patient_id) }}</td>
                <td>{{ getSiteName(c.site_id) }}</td>
                <td class="truncate" style="max-width:200px" [title]="c.motif">{{ c.motif }}</td>
                <td>
                  <span class="badge" [class]="(c.temperature ?? 0) >= 38 ? 'badge-danger' : 'badge-success'">
                    {{ c.temperature ?? '—' }}°C
                  </span>
                </td>
                <td>{{ c.saturation_o2 ?? '—' }}%</td>
                <td>
                  <span class="badge" [class]="getDecisionBadge(c.decision)">{{ c.decision.replace('_', ' ') }}</span>
                </td>
                <td>
                  <a [routerLink]="['/pma', c.consultation_id, 'editer']" class="btn btn-sm btn-outline" title="Éditer">✏️</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="text-center text-muted" style="padding:2rem">Aucune consultation</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ConsultationListComponent implements OnInit {
  private http = inject(HttpClient);
  consultations = signal<Consultation[]>([]);
  patients = signal<Patient[]>([]);
  sites = signal<Site[]>([]);
  filtered = signal<Consultation[]>([]);

  ngOnInit() {
    this.http.get<Consultation[]>('/api/consultations').subscribe((c) => { this.consultations.set(c); this.filtered.set(c); });
    this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
    this.http.get<Site[]>('/api/sites').subscribe((s) => this.sites.set(s));
  }

  getPatientName(id: string): string {
    const p = this.patients().find((x) => x.patient_id === id);
    return p ? `${p.nom} ${p.prenom}` : id;
  }

  getSiteName(id: string): string {
    return this.sites().find((s) => s.site_id === id)?.nom ?? id;
  }

  getDecisionBadge(d: string): string {
    switch (d) { case 'RETOUR_POSTE': return 'badge-success'; case 'EVACUATION_FOSA': return 'badge-danger'; case 'HOSPITALISATION': return 'badge-warning'; case 'OBSERVATION': return 'badge-info'; default: return 'badge-neutral'; }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  onSearch(e: Event) {
    const t = (e.target as HTMLInputElement).value.toLowerCase();
    const all = this.consultations();
    this.filtered.set(t ? all.filter((c) => c.motif.toLowerCase().includes(t) || this.getPatientName(c.patient_id).toLowerCase().includes(t)) : all);
  }
}
