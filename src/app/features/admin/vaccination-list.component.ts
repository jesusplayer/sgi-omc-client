import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Vaccination } from '../../core/models';

@Component({
  selector: 'app-vaccination-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>💉 Gestion des vaccinations</h1>
        <p>Référentiel des vaccinations pour le criblage PSF</p>
      </div>
      <div class="page-actions">
        <a routerLink="/admin/vaccinations/nouveau" class="btn btn-primary">+ Nouvelle vaccination</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Vaccinations ({{ filtered().length }})</h3>
        <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…" (input)="onSearch($event)" />
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              <th>Libellé</th>
              <th>Obligatoire</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th style="width:200px">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (v of filtered(); track v.vaccination_id) {
              <tr>
                <td class="font-medium"><a [routerLink]="['/admin/vaccinations', v.vaccination_id]" class="cell-link">{{ v.libelle }}</a></td>
                <td>
                  <span class="badge" [class]="v.obligatoire ? 'badge-danger' : 'badge-info'">
                    {{ v.obligatoire ? 'Obligatoire' : 'Optionnel' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class]="v.actif ? 'badge-success' : 'badge-neutral'">
                    {{ v.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="text-sm text-muted">{{ formatDate(v.created_at) }}</td>
                <td>
                  <a [routerLink]="['/admin/vaccinations', v.vaccination_id, 'editer']" class="btn btn-sm btn-outline">✏️ Éditer</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="text-center text-muted" style="padding:2rem">Aucune vaccination configurée</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class VaccinationListComponent implements OnInit {
  private http = inject(HttpClient);
  vaccinations = signal<Vaccination[]>([]);
  filtered = signal<Vaccination[]>([]);
  searchTerm = signal('');

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<Vaccination[]>('/api/vaccinations').subscribe((v) => { this.vaccinations.set(v); this.filtered.set(v); });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    const term = this.searchTerm().toLowerCase();
    if (!term) { this.filtered.set(this.vaccinations()); return; }
    this.filtered.set(this.vaccinations().filter((v) => v.libelle.toLowerCase().includes(term)));
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR');
  }

  onDelete(v: Vaccination) {
    if (confirm(`Supprimer la vaccination "${v.libelle}" ?`)) {
      this.http.delete(`/api/vaccinations/${v.vaccination_id}`).subscribe(() => {
        this.vaccinations.update((all) => all.filter((x) => x.vaccination_id !== v.vaccination_id));
      });
    }
  }
}
