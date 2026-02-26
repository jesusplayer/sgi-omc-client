import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategorieLit, CodeCategorieLit } from '../../core/models';

@Component({
    selector: 'app-categorie-lit-form',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Modifier' : '➕ Nouvelle' }} catégorie de lit</h1>
        <p>Personnalisation des types de lits et de leurs attributs</p>
      </div>
    </div>

    <div class="card" style="max-width:600px">
      <form (ngSubmit)="onSubmit()">
        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Code *</label>
          <select class="form-control" [(ngModel)]="form.code" name="code" required [disabled]="isEdit()">
            <option value="VIP">VIP</option>
            <option value="STANDARD">Standard</option>
            <option value="REANIMATION">Réanimation</option>
            <option value="ISOLATION">Isolation</option>
            <option value="URGENCE">Urgence</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Libellé descriptif *</label>
          <input class="form-control" [(ngModel)]="form.libelle" name="libelle" required placeholder="Ex: Isolement pression négative" />
        </div>

        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Description des équipements</label>
          <textarea class="form-control" [(ngModel)]="form.description" name="description" rows="3" placeholder="Équipements spécifiques (scope, respirateur...)"></textarea>
        </div>

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Couleur (Dashboard)</label>
            <div class="flex" style="align-items:center;gap:0.5rem">
              <input type="color" [(ngModel)]="form.couleur_dashboard" name="couleur_dashboard" style="width:50px;height:38px;padding:0;border:1px solid var(--border-color);border-radius:4px;cursor:pointer" />
              <input type="text" class="form-control" [(ngModel)]="form.couleur_dashboard" name="couleur_text" placeholder="#HEXCODE" style="flex:1" />
            </div>
          </div>
          <div class="form-group flex" style="align-items:flex-end">
            <label class="flex" style="align-items:center;gap:0.5rem;cursor:pointer;padding-bottom:10px">
              <input type="checkbox" [(ngModel)]="form.actif" name="actif" style="width:1.2rem;height:1.2rem;accent-color:var(--primary)" />
              <span class="font-medium">Catégorie active</span>
            </label>
          </div>
        </div>

        <div class="flex gap-2" style="margin-top:2rem">
          <button type="submit" class="btn btn-primary" [disabled]="!form.code || !form.libelle">
            {{ isEdit() ? '💾 Enregistrer' : '✅ Créer' }}
          </button>
          <button type="button" class="btn btn-outline" (click)="onCancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class CategorieLitFormComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    isEdit = signal(false);
    categorieId = '';

    form: Partial<CategorieLit> = {
        code: 'STANDARD',
        libelle: '',
        couleur_dashboard: '#3b82f6',
        actif: true
    };

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit.set(true);
            this.categorieId = id;
            this.http.get<CategorieLit>(`/api/categories-lits/${id}`).subscribe((c) => this.form = { ...c });
        }
    }

    onSubmit() {
        if (!this.form.code || !this.form.libelle) return;
        if (this.isEdit()) {
            this.http.put(`/api/categories-lits/${this.categorieId}`, this.form).subscribe(() => {
                this.router.navigate(['/admin/categories-lits']);
            });
        } else {
            this.http.post('/api/categories-lits', this.form).subscribe(() => {
                this.router.navigate(['/admin/categories-lits']);
            });
        }
    }

    onCancel() {
        this.router.navigate(['/admin/categories-lits']);
    }
}
