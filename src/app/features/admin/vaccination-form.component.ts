import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vaccination-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Modifier' : '➕ Nouvelle' }} vaccination</h1>
        <p>{{ isEdit() ? 'Modifier les informations de la vaccination' : 'Ajouter une nouvelle vaccination au référentiel' }}</p>
      </div>
    </div>

    <div class="card" style="max-width:600px">
      <form (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label">Libellé *</label>
          <input class="form-control" [(ngModel)]="form.libelle" name="libelle" required placeholder="Ex: Fièvre jaune" />
        </div>

        <div class="form-group" style="margin-top:1rem">
          <label class="form-label" style="display:flex;align-items:center;gap:0.75rem;cursor:pointer">
            <input type="checkbox" [(ngModel)]="form.obligatoire" name="obligatoire"
                   style="width:20px;height:20px;accent-color:var(--primary)" />
            <span>Vaccination obligatoire</span>
          </label>
          <p class="text-xs text-muted" style="margin-top:0.25rem">Si cochée, cette vaccination sera marquée comme requise lors du criblage PSF</p>
        </div>

        <div class="form-group" style="margin-top:1rem">
          <label class="form-label" style="display:flex;align-items:center;gap:0.75rem;cursor:pointer">
            <input type="checkbox" [(ngModel)]="form.actif" name="actif"
                   style="width:20px;height:20px;accent-color:var(--success)" />
            <span>Actif</span>
          </label>
        </div>

        <div class="flex gap-2" style="margin-top:1.5rem">
          <button type="submit" class="btn btn-primary" [disabled]="!form.libelle">
            {{ isEdit() ? '💾 Enregistrer' : '✅ Créer' }}
          </button>
          <button type="button" class="btn btn-outline" (click)="onCancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class VaccinationFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);

  isEdit = signal(false);
    private cdr = inject(ChangeDetectorRef);
  vaccinationId = '';
  form = { libelle: '', obligatoire: false, actif: true };

  ngOnInit() {
    const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (id) {
      this.isEdit.set(true);
      this.vaccinationId = id;
      const v = this.item();
      if (v) {
        this.form = { libelle: v.libelle, obligatoire: v.obligatoire, actif: v.actif };
                this.cdr.markForCheck();
      }
    }
  }

  onSubmit() {
    if (!this.form.libelle) return;
    if (this.isEdit()) {
      this.http.put(`/api/vaccinations/${this.vaccinationId}`, this.form).subscribe(() => {
        this.router.navigate(['/admin/vaccinations']);
      });
    } else {
      this.http.post('/api/vaccinations', { ...this.form, created_at: new Date().toISOString() }).subscribe(() => {
        this.router.navigate(['/admin/vaccinations']);
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/vaccinations']);
  }
}
