import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuditLog } from '../../core/models';
import { DatePipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [DatePipe, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>📋 Journal d'Audit</h1>
        <p>Traçabilité des actions utilisateurs dans le système</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Historique des événements ({{ filtered().length }})</h3>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher (entité, action)…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date/Heure</th>
              <th>Utilisateur</th>
              <th>Action / Type</th>
              <th>Entité (ID)</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            @for (log of filtered(); track log.log_id) {
              <tr>
                <td style="white-space:nowrap">{{ log.datetime_action | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                <td><span class="badge badge-neutral">{{ log.user_id || 'SYSTEM' }}</span></td>
                <td>
                  <span class="badge" 
                        [class.badge-primary]="log.action === 'CREATE'"
                        [class.badge-success]="log.action === 'UPDATE'"
                        [class.badge-danger]="log.action === 'DELETE'"
                        [class.badge-neutral]="log.action !== 'CREATE' && log.action !== 'UPDATE' && log.action !== 'DELETE'">
                    {{ log.action }}
                  </span>
                </td>
                <td>
                  <span class="font-medium">{{ log.entite }}</span>
                  @if (log.entite_id) {
                    <br><small class="text-muted">{{ log.entite_id }}</small>
                  }
                </td>
                <td style="max-width:300px">
                  <div style="max-height: 4rem; overflow: auto; font-size: 0.8em; background: var(--bg-body); padding: 0.25rem;">
                    @if (log.nouvelle_valeur || log.ancienne_valeur) {
                      <pre style="margin:0; font-family: monospace">{{ (log.nouvelle_valeur || log.ancienne_valeur) | json }}</pre>
                    } @else {
                      <span class="text-muted italic">Aucun détail</span>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="text-center text-muted" style="padding:2rem">Aucun événement d'audit trouvé.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .font-medium { font-weight: 500; }
    .italic { font-style: italic; }
  `]
})
export class AuditListComponent implements OnInit {
  private http = inject(HttpClient);
  logs = signal<AuditLog[]>([]);
  filtered = signal<AuditLog[]>([]);
  searchTerm = signal('');

  ngOnInit() {
    this.http.get<AuditLog[]>('/api/audit-logs').subscribe((a) => {
      const sorted = a.sort((x, y) => new Date(y.datetime_action).getTime() - new Date(x.datetime_action).getTime());
      this.logs.set(sorted);
      this.filtered.set(sorted);
    });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    const term = this.searchTerm().toLowerCase();
    if (!term) { this.filtered.set(this.logs()); return; }
    this.filtered.set(this.logs().filter((l) =>
      l.action.toLowerCase().includes(term) ||
      l.entite.toLowerCase().includes(term) ||
      (l.user_id && l.user_id.toLowerCase().includes(term))
    ));
  }
}
