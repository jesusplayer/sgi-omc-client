import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PriseEnCharge, Patient } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-admission-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🏥 Soins hospitaliers FOSA"
      subtitle="Admissions et prises en charge"
      entityName="Prises en charge"
      [data]="pecs()"
      [columns]="columns"
      [headerActions]="headerActions"
      emptyMessage="Aucune prise en charge"
    ></app-generic-grid>
  `
})
export class AdmissionListComponent implements OnInit {
  private http = inject(HttpClient);
  pecs = signal<PriseEnCharge[]>([]);
  patients = signal<Patient[]>([]);

  columns: GridColumn[] = [
    { field: 'admission', header: 'Admission', type: 'date', valueGetter: (p) => p.admission_datetime, cellClass: 'text-sm' },
    {
      field: 'patient', header: 'Patient', type: 'link',
      valueGetter: (p) => this.getPatientName(p.patient_id),
      routerLink: (p) => ['/fosa', p.pec_id],
      cellClass: 'font-medium'
    },
    {
      field: 'etat', header: 'État', type: 'badge',
      valueGetter: (p) => p.etat_entree,
      badgeColor: (p) => this.getEtatBadge(p.etat_entree)
    },
    { field: 'diagnostic', header: 'Diagnostic', valueGetter: (p) => p.diagnostic_entree ?? '—', cellClass: 'truncate', cellStyle: 'max-width:200px' },
    { field: 'lit', header: 'Lit', valueGetter: (p) => p.lit_id ?? '—' },
    {
      field: 'devenir', header: 'Devenir', type: 'badge',
      valueGetter: (p) => p.devenir ? p.devenir : 'En cours',
      badgeColor: (p) => p.devenir ? this.getDevenirBadge(p.devenir) : 'badge-info'
    }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '🧪 Laboratoire', route: ['/fosa/laboratoire'], class: 'btn-outline' },
    { label: '🛏️ Plan des lits', route: ['/fosa/lits'], class: 'btn-secondary' },
    { label: '+ Nouvelle admission', route: ['/fosa/admission'], class: 'btn-primary' }
  ];

  ngOnInit() {
    this.http.get<PriseEnCharge[]>('/api/prises-en-charge').subscribe((p) => this.pecs.set(p));
    this.http.get<Patient[]>('/api/patients').subscribe((p) => this.patients.set(p));
  }

  getPatientName(id: string): string { const p = this.patients().find((x) => x.patient_id === id); return p ? `${p.nom} ${p.prenom}` : id; }
  getEtatBadge(e: string): string { switch (e) { case 'STABLE': return 'badge-success'; case 'GRAVE': return 'badge-warning'; case 'CRITIQUE': return 'badge-danger'; default: return 'badge-neutral'; } }
  getDevenirBadge(d: string): string { switch (d) { case 'GUERISON': return 'badge-success'; case 'DECES': return 'badge-danger'; default: return 'badge-info'; } }
}
