import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ConfigurationAlerte } from '../../core/models';

@Component({
  selector: 'app-alerte-config-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>⚠️ Règles d'alerte</h1>
        <p>Configuration des seuils et paramètres de notification</p>
      </div>
      <div class="page-actions">
        <a routerLink="/admin/alertes-config/nouvelle" class="btn btn-primary">+ Nouvelle règle</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Règles d'alerte ({{ filtered().length }})</h3>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code Règle</th>
              <th>Libellé</th>
              <th>Entité / Champ</th>
              <th>Canaux Notif.</th>
              <th>Statut</th>
              <th style="width:200px">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (config of filtered(); track config.config_id) {
              <tr [class.opacity-50]="!config.active">
                <td class="font-medium"><a [routerLink]="['/admin/alertes-config', config.config_id]" class="cell-link">{{ config.code_regle }}</a></td>
                <td>{{ config.libelle }}</td>
                <td>{{ config.entite_source }} <br> <small class="text-muted">{{ config.champ_surveille }}</small></td>
                <td>
                  <div class="badges-list">
                    @for (canal of config.canaux_notif; track canal) {
                      <span class="badge badge-neutral" style="font-size: 0.7em">{{ canal }}</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="badge" [class]="config.active ? 'badge-success' : 'badge-neutral'">
                    {{ config.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <a [routerLink]="['/admin/alertes-config', config.config_id]" class="btn btn-sm btn-outline">👁️ Détail</a>
                  <a [routerLink]="['/admin/alertes-config', config.config_id, 'editer']" class="btn btn-sm btn-outline">✏️ Éditer</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Aucune règle d'alerte configurée</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .badges-list { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .opacity-50 { opacity: 0.6; }
  `]
})
export class AlerteConfigListComponent implements OnInit {
  private http = inject(HttpClient);
  configs = signal<ConfigurationAlerte[]>([]);
  filtered = signal<ConfigurationAlerte[]>([]);
  searchTerm = signal('');

  ngOnInit() {
    this.http.get<ConfigurationAlerte[]>('/api/configurations-alerte').subscribe((c) => {
      this.configs.set(c);
      this.filtered.set(c);
    });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    const term = this.searchTerm().toLowerCase();
    if (!term) { this.filtered.set(this.configs()); return; }
    this.filtered.set(this.configs().filter((c) =>
      c.code_regle.toLowerCase().includes(term) ||
      c.libelle.toLowerCase().includes(term) ||
      c.entite_source.toLowerCase().includes(term)
    ));
  }
}
