import { computed, Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Patient, TracingVol, Vaccination } from '../../core/models';

@Component({
  selector: 'app-voyageur-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>👤 Détail voyageur</h1>
        <p>Fiche complète du voyageur</p>
      </div>
      <div class="page-actions">
        @if (item()) {
          <a [routerLink]="['/psf', item()!.patient_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
          <button class="btn btn-danger" (click)="onDelete()">🗑 Supprimer</button>
        }
        <a routerLink="/psf" class="btn btn-outline">← Retour</a>
      </div>
    </div>

    @if (item(); as p) {
      <div class="grid grid-2" style="gap:1.5rem">
        <div class="card">
          <h3 style="margin-bottom:1rem">🪪 Informations personnelles</h3>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">Accréditation</span><code>{{ p.accreditation_id }}</code></div>
            <div class="detail-row"><span class="detail-label">Nom</span><span class="font-semibold">{{ p.nom }} {{ p.prenom }}</span></div>
            <div class="detail-row"><span class="detail-label">Sexe</span><span>{{ p.sexe === 'M' ? 'Masculin' : p.sexe === 'F' ? 'Féminin' : 'Autre' }}</span></div>
            <div class="detail-row"><span class="detail-label">Nationalité</span><span>{{ p.nationalite }}</span></div>
            <div class="detail-row"><span class="detail-label">Pays provenance</span><span>{{ p.pays_provenance }}</span></div>
            <div class="detail-row"><span class="detail-label">Type</span><span class="badge badge-neutral">{{ p.type_personne }}</span></div>
            <div class="detail-row"><span class="detail-label">Contact</span><span>{{ p.contact_local ?? '—' }}</span></div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:1rem">💉 Statut vaccinal</h3>
          @if (vaccinations().length > 0) {
            <div class="detail-grid">
              @for (v of vaccinations(); track v.vaccination_id) {
                <div class="detail-row">
                  <span class="detail-label">
                    {{ v.libelle }}
                    @if (v.obligatoire) { <span class="badge badge-danger" style="font-size:0.6rem;margin-left:0.5rem">Obligatoire</span> }
                  </span>
                  <span class="badge" [class]="getVaccinStatus(v.libelle) ? 'badge-success' : 'badge-danger'">
                    {{ getVaccinStatus(v.libelle) ? '✅ Vacciné' : '❌ Non vacciné' }}
                  </span>
                </div>
              }
            </div>
          } @else {
            <p class="text-muted">Aucun vaccin renseigné</p>
          }
        </div>
      </div>

      @if (tracing(); as t) {
        <div class="card" style="margin-top:1.5rem">
          <h3 style="margin-bottom:1rem">✈️ Criblage PSF</h3>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">Vol</span><span>{{ t.compagnie_aerienne }} — {{ t.numero_vol }}</span></div>
            <div class="detail-row"><span class="detail-label">Origine</span><span>{{ t.aeroport_origine }}</span></div>
            <div class="detail-row"><span class="detail-label">Siège</span><span>{{ t.numero_siege ?? '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Température</span>
              <span class="badge" [class]="t.temperature_criblage >= 38 ? 'badge-danger' : 'badge-success'">{{ t.temperature_criblage }}°C</span>
            </div>
            <div class="detail-row"><span class="detail-label">Symptômes</span><span>{{ t.symptomes_declares ? t.detail_symptomes || 'Oui' : 'Non' }}</span></div>
            <div class="detail-row"><span class="detail-label">Décision</span>
              <span class="badge" [class]="t.decision_frontiere === 'AUTORISATION' ? 'badge-success' : 'badge-warning'">{{ t.decision_frontiere }}</span>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .detail-grid { display: flex; flex-direction: column; gap: 0; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 500; color: var(--text-secondary); }
  `],
})
export class VoyageurDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  item = input<Patient | null>(null);
  tracing = signal<TracingVol | null>(null);
  vaccinations = signal<Vaccination[]>([]);

  ngOnInit() {


    this.http.get<TracingVol[]>('/api/tracing-vol').subscribe((all) => {
      const id = this.item()?.patient_id;
      const t = all.find((x) => x.patient_id === id);
      if (t) this.tracing.set(t);
    });
    this.http.get<Vaccination[]>('/api/vaccinations').subscribe((v) =>
      this.vaccinations.set(v.filter((x) => x.actif))
    );
  }

  getVaccinStatus(libelle: string): boolean {
    const sv = this.item()?.statut_vaccinal;
    if (!sv) return false;
    const key = libelle.toLowerCase().replace(/[\s-]+/g, '_');
    for (const [k, v] of Object.entries(sv)) {
      if (k.toLowerCase().replace(/[\s-]+/g, '_').includes(key) || key.includes(k.toLowerCase().replace(/[\s-]+/g, '_'))) {
        return !!v;
      }
    }
    return false;
  }

  onDelete() {
    if (confirm('Supprimer ce voyageur ?')) {
      this.http.delete(`/api/patients/${this.item()!.patient_id}`).subscribe(() => this.router.navigate(['/psf']));
    }
  }
}
