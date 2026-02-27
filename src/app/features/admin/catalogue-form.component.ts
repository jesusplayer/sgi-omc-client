import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogueProduit } from '../../core/models';

@Component({
  selector: 'app-catalogue-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Modifier' : '➕ Nouveau' }} produit</h1>
        <p>Gérer les propriétés d'un produit du catalogue</p>
      </div>
    </div>

    <div class="card" style="max-width:800px">
      <form (ngSubmit)="onSubmit()">
        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Code Produit *</label>
            <input class="form-control" [(ngModel)]="form.code_produit" name="code_produit" required placeholder="Ex: MED-PAR-500" [disabled]="isEdit()" />
          </div>
          <div class="form-group">
            <label class="form-label">Catégorie *</label>
            <select class="form-control" [(ngModel)]="form.categorie" name="categorie" required>
              <option value="MEDICAMENT">Médicament</option>
              <option value="EPI">Equipement Protection Indiv.</option>
              <option value="MATERIEL">Matériel Médical</option>
              <option value="CONSOMMABLE">Consommable</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Désignation complète *</label>
          <input class="form-control" [(ngModel)]="form.designation" name="designation" required placeholder="Ex: Paracétamol 500mg, Boîte de 10" />
        </div>

        @if (form.categorie === 'MEDICAMENT') {
          <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem;padding:1rem;background:var(--bg-secondary);border-radius:6px">
            <div class="form-group">
              <label class="form-label">DCI</label>
              <input class="form-control" [(ngModel)]="form.dci" name="dci" placeholder="Principe actif" />
            </div>
            <div class="form-group">
              <label class="form-label">Code ATC</label>
              <input class="form-control" [(ngModel)]="form.code_atc" name="code_atc" placeholder="Ex: N02BE01" />
            </div>
            <div class="form-group">
              <label class="form-label">Forme</label>
              <input class="form-control" [(ngModel)]="form.forme" name="forme" placeholder="Ex: Comprimé" />
            </div>
            <div class="form-group">
              <label class="form-label">Dosage</label>
              <input class="form-control" [(ngModel)]="form.dosage" name="dosage" placeholder="Ex: 500 mg" />
            </div>
          </div>
        }

        <div class="grid grid-2" style="gap:1rem;margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Unité de base *</label>
            <input class="form-control" [(ngModel)]="form.unite_base" name="unite_base" required placeholder="Ex: Boîte, Unité, Flacon" />
          </div>
          <div class="form-group flex gap-2" style="align-items:flex-end">
            <label class="flex" style="align-items:center;gap:0.5rem;cursor:pointer;padding-bottom:10px">
              <input type="checkbox" [(ngModel)]="form.necessite_froid" name="necessite_froid" style="width:1.2rem;height:1.2rem;accent-color:var(--primary)" />
              <span class="font-medium">Chaîne du froid (2-8°C)</span>
            </label>
            
            <label class="flex" style="align-items:center;gap:0.5rem;cursor:pointer;padding-bottom:10px;margin-left:1rem">
              <input type="checkbox" [(ngModel)]="form.actif" name="actif" style="width:1.2rem;height:1.2rem;accent-color:var(--primary)" />
              <span class="font-medium">Actif</span>
            </label>
          </div>
        </div>

        <div class="flex gap-2" style="margin-top:2rem">
          <button type="submit" class="btn btn-primary" [disabled]="!form.code_produit || !form.designation || !form.categorie || !form.unite_base">
            {{ isEdit() ? '💾 Enregistrer' : '✅ Créer' }}
          </button>
          <button type="button" class="btn btn-outline" (click)="onCancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class CatalogueFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);
  private cdr = inject(ChangeDetectorRef);

  isEdit = signal(false);
  produitId = '';

  form: Partial<CatalogueProduit> = {
    code_produit: '',
    designation: '',
    categorie: 'MEDICAMENT',
    unite_base: '',
    necessite_froid: false,
    actif: true
  };

  ngOnInit() {
    const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.produitId = id;
      const p = this.item();
      if (p) {
        this.form = { ...p };
        this.cdr.markForCheck();
      }
    }
  }

  onSubmit() {
    if (!this.form.code_produit || !this.form.designation || !this.form.categorie || !this.form.unite_base) return;

    if (this.isEdit()) {
      this.http.put(`/api/catalogue/${this.produitId}`, this.form).subscribe(() => {
        this.router.navigate(['/admin/catalogue']);
      });
    } else {
      this.http.post('/api/catalogue', this.form).subscribe(() => {
        this.router.navigate(['/admin/catalogue']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/catalogue']);
  }
}
