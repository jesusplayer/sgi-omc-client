import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Patient, TracingVol } from '../../core/models';
import { exportToCsv, printPage } from '../../shared/export.utils';

@Component({
  selector: 'app-voyageur-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🛫 Criblage PSF — Voyageurs</h1>
        <p>Enregistrement et criblage des voyageurs aux points d'entrée sanitaire</p>
      </div>
      <div class="page-actions">
        <a routerLink="/psf/nouveau" class="btn btn-primary">+ Nouveau voyageur</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Voyageurs enregistrés ({{ patients().length }})</h3>
        <div class="flex gap-2">
          <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…"
                 (input)="onSearch($event)" />
          <button class="btn btn-sm btn-outline" (click)="exportCsv()" title="Exporter CSV">📥 CSV</button>
          <button class="btn btn-sm btn-outline" (click)="print()" title="Imprimer">🖨️</button>
        </div>
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Accréditation</th>
              <th>Nom Prénom</th>
              <th>Nationalité</th>
              <th>Type</th>
              <th>Vol</th>
              <th>Temp.</th>
              <th>Décision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (row of filtered(); track row.patient.patient_id) {
              <tr class="animate-fadeIn">
                <td><a [routerLink]="['/psf', row.patient.patient_id]" class="cell-link"><code>{{ row.patient.accreditation_id }}</code></a></td>
                <td class="font-medium">{{ row.patient.nom }} {{ row.patient.prenom }}</td>
                <td>{{ row.patient.nationalite }}</td>
                <td><span class="badge badge-neutral">{{ row.patient.type_personne }}</span></td>
                <td>{{ row.tracing?.numero_vol ?? '—' }}</td>
                <td>
                  @if (row.tracing) {
                    <span class="badge" [class]="row.tracing.temperature_criblage >= 38 ? 'badge-danger' : 'badge-success'">
                      {{ row.tracing.temperature_criblage }}°C
                    </span>
                  } @else { — }
                </td>
                <td>
                  @if (row.tracing) {
                    <span class="badge" [class]="getDecisionBadge(row.tracing.decision_frontiere)">
                      {{ row.tracing.decision_frontiere }}
                    </span>
                  } @else {
                    <span class="badge badge-warning">Non criblé</span>
                  }
                </td>
                <td>
                  <div class="flex gap-1">
                    <a [routerLink]="['/psf', row.patient.patient_id, 'editer']" class="btn btn-sm btn-outline" title="Éditer">✏️</a>
                    @if (!row.tracing) {
                      <a [routerLink]="['/psf', row.patient.patient_id, 'criblage']" class="btn btn-sm btn-secondary" title="Cribler">🩺</a>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="text-center text-muted" style="padding:2rem">Aucun voyageur enregistré</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class VoyageurListComponent implements OnInit {
  private http = inject(HttpClient);

  patients = signal<Patient[]>([]);
  tracings = signal<TracingVol[]>([]);
  searchTerm = signal('');

  filtered = signal<{ patient: Patient; tracing?: TracingVol }[]>([]);

  ngOnInit() {
    forkJoin({
      patients: this.http.get<Patient[]>('/api/patients'),
      tracings: this.http.get<TracingVol[]>('/api/tracing-vol'),
    }).subscribe(({ patients, tracings }) => {
      this.patients.set(patients);
      this.tracings.set(tracings);
      this.updateFiltered();
    });
  }

  private updateFiltered() {
    const patients = this.patients();
    const tracings = this.tracings();
    const term = this.searchTerm().toLowerCase();
    const rows = patients.map((p) => ({
      patient: p,
      tracing: tracings.find((t) => t.patient_id === p.patient_id),
    }));
    this.filtered.set(
      term
        ? rows.filter(
          (r) =>
            r.patient.nom.toLowerCase().includes(term) ||
            r.patient.prenom.toLowerCase().includes(term) ||
            r.patient.accreditation_id.toLowerCase().includes(term) ||
            (r.tracing?.numero_vol?.toLowerCase().includes(term) ?? false)
        )
        : rows
    );
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.updateFiltered();
  }

  getDecisionBadge(decision: string): string {
    switch (decision) {
      case 'AUTORISATION': return 'badge-success';
      case 'REFERENCE_TEST': return 'badge-warning';
      case 'ISOLEMENT': return 'badge-danger';
      case 'REFOULEMENT': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }

  exportCsv() {
    const rows = this.filtered().map((r) => ({
      accreditation: r.patient.accreditation_id,
      nom: r.patient.nom,
      prenom: r.patient.prenom,
      nationalite: r.patient.nationalite,
      type: r.patient.type_personne,
      vol: r.tracing?.numero_vol ?? '',
      temperature: r.tracing?.temperature_criblage ?? '',
      decision: r.tracing?.decision_frontiere ?? 'Non criblé',
    }));
    exportToCsv('voyageurs', rows, [
      { key: 'accreditation', label: 'Accréditation' },
      { key: 'nom', label: 'Nom' },
      { key: 'prenom', label: 'Prénom' },
      { key: 'nationalite', label: 'Nationalité' },
      { key: 'type', label: 'Type' },
      { key: 'vol', label: 'Vol' },
      { key: 'temperature', label: 'Température' },
      { key: 'decision', label: 'Décision' },
    ]);
  }

  print() { printPage(); }
}
