import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuditLog } from '../../core/models';
import { GenericGridComponent } from '../../shared/components/generic-grid/generic-grid.component';
import { GridColumn } from '../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="📋 Journal d'Audit"
      subtitle="Traçabilité des actions utilisateurs dans le système"
      entityName="Historique des événements"
      [data]="logs()"
      [columns]="columns"
      emptyMessage="Aucun événement d'audit trouvé"
    ></app-generic-grid>
  `
})
export class AuditListComponent implements OnInit {
  private http = inject(HttpClient);

  logs = signal<AuditLog[]>([]);

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  columns: GridColumn[] = [
    { field: 'datetime', header: 'Date/Heure', type: 'date', valueGetter: (l) => l.datetime_action, cellStyle: 'white-space:nowrap' },
    { field: 'user', header: 'Utilisateur', type: 'badge', valueGetter: (l) => l.user_id || 'SYSTEM', badgeColor: () => 'badge-neutral' },
    {
      field: 'action', header: 'Action', type: 'badge',
      valueGetter: (l) => l.action,
      badgeColor: (l) => {
        if (l.action === 'CREATE') return 'badge-primary';
        if (l.action === 'UPDATE') return 'badge-success';
        if (l.action === 'DELETE') return 'badge-danger';
        return 'badge-neutral';
      }
    },
    {
      field: 'entite', header: 'Entité (ID)',
      valueGetter: (l) => `${l.entite} ${l.entite_id ? '(' + l.entite_id + ')' : ''}`,
      cellClass: 'font-medium'
    },
    {
      field: 'details', header: 'Détails',
      valueGetter: (l) => {
        const val = l.nouvelle_valeur || l.ancienne_valeur;
        return val ? JSON.stringify(val, null, 2) : 'Aucun détail';
      },
      cellStyle: 'max-width:300px; max-height:4rem; overflow:auto; font-size:0.8em; font-family:monospace; background:var(--bg-body); padding:0.25rem; white-space:pre-wrap',
      cellClass: (l: AuditLog): string => !(l.nouvelle_valeur || l.ancienne_valeur) ? 'text-muted italic' : ''
    }
  ];

  ngOnInit() {
    this.http.get<AuditLog[]>('/api/audit-logs').subscribe((a) => {
      const sorted = a.sort((x, y) => new Date(y.datetime_action).getTime() - new Date(x.datetime_action).getTime());
      this.logs.set(sorted);
    });
  }
}
