import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

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
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>📄 Rapports SITREP</h1>
        <p>Situation Epidemiologic Reports - Generation et validation</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" (click)="generateSitrep()">+ Générer SITREP</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Historique des rapports ({{ reports().length }})</h3>
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date Création</th>
              <th>Titre</th>
              <th>Période Couverte</th>
              <th>Statut</th>
              <th>Auteur</th>
              <th style="width:200px">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (rpt of reports(); track rpt.id) {
              <tr>
                <td>{{ rpt.dateCreation | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="font-medium"><a [routerLink]="['/coordination/sitrep', rpt.id]" class="cell-link">{{ rpt.titre }}</a></td>
                <td class="text-muted">Du {{ rpt.periodeDebut | date:'dd/MM' }} au {{ rpt.periodeFin | date:'dd/MM' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="rpt.statut === 'VALIDE'" [class.badge-neutral]="rpt.statut === 'BROUILLON'">
                    {{ rpt.statut }}
                  </span>
                </td>
                <td>{{ rpt.auteur }}</td>
                <td>
                  <a [routerLink]="['/coordination/sitrep', rpt.id]" class="btn btn-sm btn-outline">👁️ Consulter</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucun rapport SITREP généré.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .font-medium { font-weight: 500; }
  `]
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

  generateSitrep() {
    // In real app: call API to generate and navigate to detail.
    const newSr: SitRep = {
      id: 'sr-003', titre: 'Nouveau SITREP J-1', periodeDebut: '2026-06-14T00:00:00Z', periodeFin: '2026-06-14T23:59:59Z',
      statut: 'BROUILLON', auteur: 'DATA (MBARGA)', dateCreation: new Date().toISOString()
    };
    this.reports.update(r => [newSr, ...r]);
  }
}
