import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
    selector: 'app-dhis2-sync',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🔄 Synchronisation DHIS2</h1>
        <p>Interface avec le système national d'information sanitaire (DHIS2)</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" (click)="syncNow()" [disabled]="isSyncing()">
          {{ isSyncing() ? 'Synchronisation...' : 'Lancer la Synchro Manuelle' }}
        </button>
      </div>
    </div>

    <div class="grid" style="grid-template-columns: 1fr 2fr; gap: 1.5rem">
      <div class="card">
        <div class="card-header">
          <h3>Statut de l'intégration</h3>
        </div>
        <div class="card-body">
          <div style="display:flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color)">
            <span class="text-muted">Statut Connexion</span>
            <span class="badge badge-success">Connecté</span>
          </div>
          <div style="display:flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color)">
            <span class="text-muted">URL d'instance</span>
            <span class="font-medium">https://dhis2.minsante.cm/</span>
          </div>
          <div style="display:flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color)">
            <span class="text-muted">Dernière Synchro (Auto)</span>
            <span class="font-medium">Aujourd'hui, 06:00</span>
          </div>
          <div style="display:flex; justify-content: space-between; padding: 0.75rem 0;">
            <span class="text-muted">Prochaine Synchro</span>
            <span class="font-medium">Aujourd'hui, 18:00</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Historique de synchronisation</h3>
        </div>
        <div class="table-container" style="border:none">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date / Heure</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Données Poussées</th>
                <th>Erreurs</th>
              </tr>
            </thead>
            <tbody>
              @for (log of mockLogs(); track log.id) {
                <tr>
                  <td>{{ log.date }}</td>
                  <td>{{ log.type }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="log.status === 'SUCCES'" [class.badge-danger]="log.status === 'ECHEC'">
                      {{ log.status }}
                    </span>
                  </td>
                  <td>{{ log.pushed }} orgUnits/events</td>
                  <td [class.text-danger]="log.errors > 0">{{ log.errors }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .font-medium { font-weight: 500; }
  `]
})
export class Dhis2SyncComponent {
    isSyncing = signal(false);

    mockLogs = signal([
        { id: 1, date: '14/06/2026 06:00', type: 'AUTOMATIQUE', status: 'SUCCES', pushed: 124, errors: 0 },
        { id: 2, date: '13/06/2026 18:00', type: 'AUTOMATIQUE', status: 'SUCCES', pushed: 89, errors: 0 },
        { id: 3, date: '13/06/2026 14:32', type: 'MANUELLE', status: 'ECHEC', pushed: 0, errors: 12 },
        { id: 4, date: '13/06/2026 06:00', type: 'AUTOMATIQUE', status: 'SUCCES', pushed: 110, errors: 0 },
    ]);

    syncNow() {
        this.isSyncing.set(true);
        setTimeout(() => {
            this.isSyncing.set(false);
            this.mockLogs.update(logs => [
                { id: Date.now(), date: new Date().toLocaleString(), type: 'MANUELLE', status: 'SUCCES', pushed: 42, errors: 0 },
                ...logs
            ]);
            alert("Synchronisation terminée avec succès.");
        }, 2000);
    }
}
