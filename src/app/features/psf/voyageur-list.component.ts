import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Patient, TracingVol } from '../../core/models';
import { exportToCsv, printPage } from '../../shared/export.utils';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridHeaderAction, GridRowAction } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-voyageur-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🛫 Criblage PSF — Voyageurs"
      subtitle="Enregistrement et criblage des voyageurs aux points d'entrée sanitaire"
      entityName="Voyageurs enregistrés"
      [data]="gridData()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucun voyageur enregistré"
    ></app-generic-grid>
  `,
})
export class VoyageurListComponent implements OnInit {
  private http = inject(HttpClient);

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  patients = signal<Patient[]>([]);
  tracings = signal<TracingVol[]>([]);

  // We combine the patients and tracings into a clean state for the grid
  gridData = computed(() => {
    const patients = this.patients();
    const tracings = this.tracings();
    return patients.map((p) => ({
      patient: p,
      tracing: tracings.find((t) => t.patient_id === p.patient_id),
    }));
  });

  columns: GridColumn[] = [
    {
      field: 'accreditation', header: 'Accréditation', type: 'link',
      valueGetter: (r) => r.patient.accreditation_id,
      routerLink: (r) => ['/psf', r.patient.patient_id]
    },
    {
      field: 'nomComplet', header: 'Nom Prénom',
      valueGetter: (r) => `${r.patient.nom} ${r.patient.prenom}`, cellClass: 'font-medium'
    },
    { field: 'nationalite', header: 'Nationalité', valueGetter: (r) => r.patient.nationalite },
    { field: 'type', header: 'Type', type: 'badge', valueGetter: (r) => r.patient.type_personne },
    { field: 'vol', header: 'Vol', valueGetter: (r) => r.tracing?.numero_vol ?? '—' },
    {
      field: 'temperature', header: 'Temp.', type: 'badge',
      valueGetter: (r) => r.tracing ? `${r.tracing.temperature_criblage}°C` : '—',
      badgeColor: (r) => {
        if (!r.tracing) return 'badge-neutral';
        return r.tracing.temperature_criblage >= 38 ? 'badge-danger' : 'badge-success';
      }
    },
    {
      field: 'decision', header: 'Décision', type: 'badge',
      valueGetter: (r) => r.tracing ? r.tracing.decision_frontiere : 'Non criblé',
      badgeColor: (r) => r.tracing ? this.getDecisionBadge(r.tracing.decision_frontiere) : 'badge-warning'
    }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouveau voyageur', route: ['/psf/nouveau'], class: 'btn-primary' },
    { label: 'CSV', icon: '📥', action: () => this.exportCsv(), class: 'btn-sm btn-outline', title: 'Exporter CSV' },
    { label: '', icon: '🖨️', action: () => this.print(), class: 'btn-sm btn-outline', title: 'Imprimer' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '✏️', title: 'Éditer', routeFn: (r) => ['/psf', r.patient.patient_id, 'editer'], class: 'btn-outline' },
    { icon: '🩺', title: 'Cribler', routeFn: (r) => ['/psf', r.patient.patient_id, 'criblage'], class: 'btn-secondary', hideFn: (r) => !!r.tracing }
  ];

  ngOnInit() {
    forkJoin({
      patients: this.http.get<Patient[]>('/api/patients'),
      tracings: this.http.get<TracingVol[]>('/api/tracing-vol'),
    }).subscribe(({ patients, tracings }) => {
      this.patients.set(patients);
      this.tracings.set(tracings);
    });
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
    // Si la grille est filtrée, on utilise filteredData(), sinon gridData()
    const dataToExport = this.grid?.filteredData() || this.gridData();
    const rows = dataToExport.map((r: any) => ({
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
