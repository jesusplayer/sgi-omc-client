import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PriseEnCharge, Patient } from '../../core/models';

@Component({
  selector: 'app-admission-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>🏥 Soins hospitaliers FOSA</h1>
        <p>Admissions et prises en charge</p>
      </div>
      <div class="page-actions">
        <a routerLink="/fosa/laboratoire" class="btn btn-outline">🧪 Laboratoire</a>
        <a routerLink="/fosa/lits" class="btn btn-secondary">🛏️ Plan des lits</a>
        <a routerLink="/fosa/admission" class="btn btn-primary">+ Nouvelle admission</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Prises en charge ({{ filtered().length }})</h3>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead><tr><th>Admission</th><th>Patient</th><th>État</th><th>Diagnostic</th><th>Lit</th><th>Devenir</th></tr></thead>
          <tbody>
            @for (p of filtered(); track p.pec_id) {
              <tr>
                <td class="text-sm">{{ formatDate(p.admission_datetime) }}</td>
                <td class="font-medium"><a [routerLink]="['/fosa', p.pec_id]" class="cell-link">{{ getPatientName(p.patient_id) }}</a></td>
                <td><span class="badge" [class]="getEtatBadge(p.etat_entree)">{{ p.etat_entree }}</span></td>
                <td class="truncate" style="max-width:200px">{{ p.diagnostic_entree ?? '—' }}</td>
                <td>{{ p.lit_id ?? '—' }}</td>
                <td>
                  @if (p.devenir) {
                    <span class="badge" [class]="getDevenirBadge(p.devenir)">{{ p.devenir }}</span>
                  } @else {
                    <span class="badge badge-info">En cours</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucune prise en charge</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdmissionListComponent implements OnInit {
  private http = inject(HttpClient);
  pecs = signal<PriseEnCharge[]>([]);
  patients = signal<Patient[]>([]);
  filtered = signal<PriseEnCharge[]>([]);
  searchTerm = signal('');

  ngOnInit() {
    this.http.get<PriseEnCharge[]>('/api/prises-en-charge').subscribe((p) => { this.pecs.set(p); this.filtered.set(p); });
    this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    const term = this.searchTerm().toLowerCase();
    if (!term) { this.filtered.set(this.pecs()); return; }
    this.filtered.set(this.pecs().filter((p) => {
      const patName = this.getPatientName(p.patient_id).toLowerCase();
      return patName.includes(term) || (p.diagnostic_entree?.toLowerCase().includes(term) ?? false) || (p.diagnostic_final?.toLowerCase().includes(term) ?? false);
    }));
  }

  getPatientName(id: string): string { const p = this.patients().find((x) => x.patient_id === id); return p ? `${p.nom} ${p.prenom}` : id; }
  getEtatBadge(e: string): string { switch (e) { case 'STABLE': return 'badge-success'; case 'GRAVE': return 'badge-warning'; case 'CRITIQUE': return 'badge-danger'; default: return 'badge-neutral'; } }
  getDevenirBadge(d: string): string { switch (d) { case 'GUERISON': return 'badge-success'; case 'DECES': return 'badge-danger'; default: return 'badge-info'; } }
  formatDate(iso: string): string { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
}
