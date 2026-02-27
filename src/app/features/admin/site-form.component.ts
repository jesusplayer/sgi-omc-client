import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Site, TypeSite } from '../../core/models';

@Component({
  selector: 'app-site-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Modifier' : '➕ Nouveau' }} site</h1>
        <p>{{ isEdit() ? 'Modifier les informations du site' : 'Ajouter un nouveau site physique au référentiel' }}</p>
      </div>
    </div>

    <div class="card" style="max-width:800px">
      <form (ngSubmit)="onSubmit()">
        <div class="grid grid-2" style="gap:1rem;margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">Code Site *</label>
            <input class="form-control" [(ngModel)]="form.code_site" name="code_site" required placeholder="Ex: FOSA_01" />
          </div>
          <div class="form-group">
            <label class="form-label">Nom du site *</label>
            <input class="form-control" [(ngModel)]="form.nom" name="nom" required placeholder="Ex: Hôpital Central" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom:1rem">
          <label class="form-label">Type de site *</label>
          <select class="form-control" [(ngModel)]="form.type_site" name="type_site" required>
            <option value="PSF">Poste de Santé Frontière (PSF)</option>
            <option value="PMA_HOTEL">Poste Médical Avancé - Hôtel</option>
            <option value="PMA_PALAIS">Poste Médical Avancé - Palais SMC</option>
            <option value="PMA_HV">Poste Médical Avancé - Hôpital de Village</option>
            <option value="FOSA">Formation Sanitaire (FOSA)</option>
            <option value="REGULATION">Centre de Régulation</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:1rem">
          <label class="form-label">Adresse physique</label>
          <input class="form-control" [(ngModel)]="form.adresse" name="adresse" placeholder="Adresse complète" />
        </div>

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">Latitude</label>
            <input type="number" step="0.000001" class="form-control" [(ngModel)]="form.latitude" name="latitude" />
          </div>
          <div class="form-group">
            <label class="form-label">Longitude</label>
            <input type="number" step="0.000001" class="form-control" [(ngModel)]="form.longitude" name="longitude" />
          </div>
        </div>

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">Capacité en lits</label>
            <input type="number" class="form-control" [(ngModel)]="form.capacite_lits" name="capacite_lits" min="0" />
            <p class="text-xs text-muted" style="margin-top:0.25rem">Seulement pour les sites avec hébergement</p>
          </div>
          <div class="form-group">
            <label class="form-label">Seuil d'alerte lits (%)</label>
            <input type="number" class="form-control" [(ngModel)]="form.seuil_alerte_lits" name="seuil_alerte_lits" min="0" max="100" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom:1rem">
            <label class="form-label">Téléphone</label>
            <input type="tel" class="form-control" [(ngModel)]="form.telephone" name="telephone" placeholder="Numéro de contact" />
        </div>

        <div class="form-group" style="margin-top:1.5rem">
          <label class="form-label" style="display:flex;align-items:center;gap:0.75rem;cursor:pointer">
            <input type="checkbox" [(ngModel)]="form.actif" name="actif"
                   style="width:20px;height:20px;accent-color:var(--success)" />
            <span>Site actif dans le système</span>
          </label>
        </div>

        <div class="flex gap-2" style="margin-top:2rem">
          <button type="submit" class="btn btn-primary" [disabled]="!form.nom || !form.code_site || !form.type_site">
            {{ isEdit() ? '💾 Enregistrer' : '✅ Créer' }}
          </button>
          <button type="button" class="btn btn-outline" (click)="onCancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class SiteFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<Site | null>(null);

  isEdit = signal(false);
  siteId = '';
  form: Partial<Site> = {
    code_site: '',
    nom: '',
    type_site: 'FOSA',
    adresse: '',
    latitude: undefined,
    longitude: undefined,
    capacite_lits: 0,
    lits_occupes: 0,
    seuil_alerte_lits: 90,
    telephone: '',
    actif: true
  };

  ngOnInit() {
    const site = this.item();
    if (site) {
      this.isEdit.set(true);
      this.siteId = site.site_id;
      this.form = { ...site };
    }
  }

  onSubmit() {
    if (!this.form.nom || !this.form.code_site || !this.form.type_site) return;

    if (this.isEdit()) {
      this.http.put(`/api/sites/${this.siteId}`, this.form).subscribe(() => {
        this.router.navigate(['/admin/sites']);
      });
    } else {
      const newSite = { ...this.form, created_at: new Date().toISOString() };
      this.http.post('/api/sites', newSite).subscribe(() => {
        this.router.navigate(['/admin/sites']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/sites']);
  }
}
