import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Lit, Site, CategorieLit } from '../../core/models';

@Component({
    selector: 'app-lit-form',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Modifier' : '➕ Nouveau' }} lit</h1>
        <p>Gestion d'un lit physique dans un site sanitaire</p>
      </div>
    </div>

    <div class="card" style="max-width:600px">
      <form (ngSubmit)="onSubmit()">
        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Site FOSA / PMA *</label>
          <select class="form-control" [(ngModel)]="form.site_id" name="site_id" required [disabled]="isEdit()">
            <option value="" disabled>Sélectionner un site</option>
            @for (s of sites(); track s.site_id) {
              <option [value]="s.site_id">{{ s.nom }}</option>
            }
          </select>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Catégorie du lit *</label>
          <select class="form-control" [(ngModel)]="form.categorie_id" name="categorie_id" required>
            <option value="" disabled>Sélectionner une catégorie</option>
            @for (c of categories(); track c.categorie_id) {
              <option [value]="c.categorie_id">{{ c.libelle }}</option>
            }
          </select>
        </div>

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Numéro de lit *</label>
            <input class="form-control" [(ngModel)]="form.numero_lit" name="numero_lit" required placeholder="Ex: REA-01, CHB-214" />
          </div>
          <div class="form-group">
            <label class="form-label">Statut initial *</label>
            <select class="form-control" [(ngModel)]="form.statut" name="statut" required>
              <option value="LIBRE">Libre</option>
              <option value="OCCUPE">Occupé</option>
              <option value="HORS_SERVICE">Hors service</option>
              <option value="RESERVE">Réservé</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2" style="margin-top:2rem">
          <button type="submit" class="btn btn-primary" [disabled]="!form.site_id || !form.categorie_id || !form.numero_lit">
            {{ isEdit() ? '💾 Enregistrer' : '✅ Créer' }}
          </button>
          <button type="button" class="btn btn-outline" (click)="onCancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class LitFormComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    isEdit = signal(false);
    litId = '';

    sites = signal<Site[]>([]);
    categories = signal<CategorieLit[]>([]);

    form: Partial<Lit> = {
        site_id: '',
        categorie_id: '',
        numero_lit: '',
        statut: 'LIBRE'
    };

    ngOnInit() {
        this.http.get<Site[]>('/api/sites').subscribe(res => {
            this.sites.set(res.filter(s => ['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'].includes(s.type_site)));
        });
        this.http.get<CategorieLit[]>('/api/categories-lits').subscribe(c => this.categories.set(c));

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit.set(true);
            this.litId = id;
            this.http.get<Lit>(`/api/lits/${id}`).subscribe(l => this.form = { ...l });
        }
    }

    onSubmit() {
        if (!this.form.site_id || !this.form.categorie_id || !this.form.numero_lit) return;

        // Le updated_at est généré automatiquement côté backend (ou ici)
        this.form.updated_at = new Date().toISOString();

        if (this.isEdit()) {
            this.http.put(`/api/lits/${this.litId}`, this.form).subscribe(() => {
                this.router.navigate(['/admin/lits']);
            });
        } else {
            this.http.post('/api/lits', this.form).subscribe(() => {
                this.router.navigate(['/admin/lits']);
            });
        }
    }

    onCancel() {
        this.router.navigate(['/admin/lits']);
    }
}
