import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GenericGridComponent } from '../../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../../shared/components/generic-grid/grid.models';

interface SitRep {
  id: string;
  titre: string;
  periodeDebut: string;
  periodeFin: string;
  statut: 'BROUILLON' | 'VALIDE';
  auteur: string;
  dateCreation: string;
}
@Component({
  selector: 'app-sitrep-list',
  standalone: true,
  imports: [GenericGridComponent],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="📄 Rapports SITREP"
      subtitle="Situation Epidemiologic Reports - Generation et validation"
      entityName="Historique des rapports"
      [data]="reports()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucun rapport SITREP généré."
    ></app-generic-grid>
  `
})
export class SitrepListComponent {
  reports = signal<SitRep[]>([
    {
      id: 'sr-002', titre: 'SITREP Global J-2', periodeDebut: '2026-06-13T00:00:00Z', periodeFin: '2026-06-13T23:59:59Z',
      statut: 'VALIDE', auteur: 'EPI (FOUDA Alain)', dateCreation: '2026-06-14T08:00:00Z'
    },
    {
      id: 'sr-001', titre: 'SITREP Global J-3', periodeDebut: '2026-06-12T00:00:00Z', periodeFin: '2026-06-12T23:59:59Z',
      statut: 'VALIDE', auteur: 'EPI (FOUDA Alain)', dateCreation: '2026-06-13T08:00:00Z'
    }
  ]);

  constructor(private datePipe: DatePipe) { }

  columns: GridColumn[] = [
    { field: 'date', header: 'Date Création', type: 'date', valueGetter: (r: SitRep) => r.dateCreation },
    { field: 'titre', header: 'Titre', type: 'link', valueGetter: (r: SitRep) => r.titre, routerLink: (r: SitRep) => ['/coordination/sitrep', r.id], cellClass: 'font-medium' },
    {
      field: 'periode', header: 'Période Couverte',
      valueGetter: (r: SitRep) => `Du ${this.datePipe.transform(r.periodeDebut, 'dd/MM')} au ${this.datePipe.transform(r.periodeFin, 'dd/MM')}`,
      cellClass: 'text-muted'
    },
    {
      field: 'statut', header: 'Statut', type: 'badge',
      valueGetter: (r: SitRep) => r.statut,
      badgeColor: (r: SitRep) => r.statut === 'VALIDE' ? 'badge-success' : 'badge-neutral'
    },
    { field: 'auteur', header: 'Auteur', valueGetter: (r: SitRep) => r.auteur }
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Générer SITREP', action: () => this.generateSitrep(), class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '👁️', label: 'Consulter', title: 'Consulter', routeFn: (r: SitRep) => ['/coordination/sitrep', r.id], class: 'btn-outline' }
  ];

  generateSitrep() {
    // In real app: call API to generate and navigate to detail.
    const newSr: SitRep = {
      id: 'sr-003', titre: 'Nouveau SITREP J-1', periodeDebut: '2026-06-14T00:00:00Z', periodeFin: '2026-06-14T23:59:59Z',
      statut: 'BROUILLON', auteur: 'DATA (MBARGA)', dateCreation: new Date().toISOString()
    };
    this.reports.update(r => [newSr, ...r]);
  }
}
