import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Consultation, Patient, Site } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-consultation-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🩺 Consultations PMA"
      subtitle="Consultations médicales aux postes médicaux avancés"
      entityName="Consultations"
      [data]="consultations()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucune consultation"
    ></app-generic-grid>
  `
})
export class ConsultationListComponent implements OnInit {
  private http = inject(HttpClient);
  consultations = signal<Consultation[]>([]);
  patients = signal<Patient[]>([]);
  sites = signal<Site[]>([]);

  columns: GridColumn[] = [
    { field: 'date', header: 'Date', type: 'link', valueGetter: (c) => this.formatDate(c.heure_arrivee), routerLink: (c) => ['/pma', c.consultation_id], cellClass: 'text-sm' },
    { field: 'patient', header: 'Patient', valueGetter: (c) => this.getPatientName(c.patient_id), cellClass: 'font-medium' },
    { field: 'site', header: 'Site PMA', valueGetter: (c) => this.getSiteName(c.site_id) },
    { field: 'motif', header: 'Motif', valueGetter: (c) => c.motif, cellClass: 'truncate', cellStyle: 'max-width:200px' },
    {
      field: 'temperature', header: 'T°', type: 'badge',
      valueGetter: (c) => `${c.temperature ?? '—'}°C`,
      badgeColor: (c) => (c.temperature ?? 0) >= 38 ? 'badge-danger' : 'badge-success'
    },
    { field: 'spo2', header: 'SpO2', valueGetter: (c) => `${c.saturation_o2 ?? '—'}%` },
    {
      field: 'decision', header: 'Décision', type: 'badge',
      valueGetter: (c) => c.decision.replace('_', ' '),
      badgeColor: (c) => this.getDecisionBadge(c.decision)
    }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouvelle consultation', route: ['/pma/nouvelle'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (c) => ['/pma', c.consultation_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<Consultation[]>('/api/consultations').subscribe((c) => this.consultations.set(c));
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
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}
