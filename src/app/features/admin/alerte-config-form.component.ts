import { Component, inject, signal, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfigurationAlerte, Operateur, CanalNotification } from '@app/core/models';

@Component({
  selector: 'app-alerte-config-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/admin/alertes-config" class="text-muted" style="text-decoration:none">← Retour aux règles</a>
        <h1>{{ isEdit() ? 'Modifier la Règle' : 'Nouvelle Règle d\\'Alerte' }}</h1>
      </div>
    </div>

    <div class="card" style="max-width:800px">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          
          <div class="form-grid">
            <!-- Informations Générales -->
            <div class="form-group">
              <label>Code Règle <span class="required">*</span></label>
              <input type="text" class="form-control" formControlName="code_regle" [readonly]="isEdit()" placeholder="ex: TEMP_CRIBLAGE">
            </div>

            <div class="form-group" style="grid-column: 1 / -1">
              <label>Libellé <span class="required">*</span></label>
              <input type="text" class="form-control" formControlName="libelle" placeholder="Courte description de l'alerte">
            </div>

            <!-- Déclenchement -->
            <div class="form-group">
              <label>Entité Source <span class="required">*</span></label>
              <select class="form-control" formControlName="entite_source">
                <option value="TRACING_VOL">Tracing Vol</option>
                <option value="STOCK">Stock</option>
                <option value="SITE">Site (FOSA/PMA)</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="RESULTAT_LABO">Résultat Labo</option>
                <option value="PRISE_EN_CHARGE">Prise en Charge</option>
              </select>
            </div>

            <div class="form-group">
              <label>Champ Surveillé <span class="required">*</span></label>
              <input type="text" class="form-control" formControlName="champ_surveille" placeholder="ex: temperature_criblage">
            </div>

            <div class="form-group">
              <label>Opérateur <span class="required">*</span></label>
              <select class="form-control" formControlName="operateur">
                <option value="GT">Supérieur à (>)</option>
                <option value="GTE">Sup. ou égal (>=)</option>
                <option value="LT">Inférieur à (<)</option>
                <option value="LTE">Inf. ou égal (<=)</option>
                <option value="EQ">Égal à (=)</option>
                <option value="NEQ">Différent de (!=)</option>
              </select>
            </div>

            <!-- Seuils -->
            <div class="form-group" style="grid-column: 1 / -1">
              <div style="background: var(--bg-body); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color)">
                <label>Seuils de déclenchement (au moins un requis)</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 0.5rem">
                  <div>
                    <label style="font-size:0.8em">Seuil Niveau 1</label>
                    <input type="number" step="any" class="form-control" formControlName="seuil_niveau1">
                  </div>
                  <div>
                    <label style="font-size:0.8em">Seuil Niveau 2</label>
                    <input type="number" step="any" class="form-control" formControlName="seuil_niveau2">
                  </div>
                  <div>
                    <label style="font-size:0.8em">Seuil Niveau 3</label>
                    <input type="number" step="any" class="form-control" formControlName="seuil_niveau3">
                  </div>
                </div>
              </div>
            </div>

            <!-- Diffusion -->
            <div class="form-group">
              <label>Canaux de Notification (Sép. par virgule)</label>
              <input type="text" class="form-control" formControlName="canaux_notif" placeholder="PUSH, SMS, EMAIL, IN_APP">
            </div>

            <div class="form-group">
              <label>Rôles Destinataires (Sép. par virgule)</label>
              <input type="text" class="form-control" formControlName="roles_destinataires" placeholder="DATA, EPI, ADMIN, REG">
            </div>

            <div class="form-group">
              <label>Cooldown (minutes)</label>
              <input type="number" class="form-control" formControlName="cooldown_min" min="0">
            </div>

            <div class="form-group flex items-center gap-2" style="grid-column: 1 / -1; margin-top: 1rem">
              <input type="checkbox" id="active_regle" formControlName="active">
              <label for="active_regle" style="margin: 0">Règle active immédiatement</label>
            </div>
          </div>

          <div class="form-actions" style="margin-top: 2rem">
            <button type="button" class="btn btn-outline" routerLink="/admin/alertes-config">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .required { color: var(--danger); }
    .flex { display: flex; } .items-center { align-items: center; } .gap-2 { gap: 0.5rem; }
  `]
})
export class AlerteConfigFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  item = input<any | null>(null);
  private fb = inject(FormBuilder);

  isEdit = signal(false);
  configId: string | null = null;

  form = this.fb.group({
    code_regle: ['', Validators.required],
    libelle: ['', Validators.required],
    entite_source: ['', Validators.required],
    champ_surveille: ['', Validators.required],
    operateur: ['GTE' as Operateur, Validators.required],
    seuil_niveau1: [null as number | null],
    seuil_niveau2: [null as number | null],
    seuil_niveau3: [null as number | null],
    canaux_notif: ['PUSH, IN_APP', Validators.required],
    roles_destinataires: ['DATA, ADMIN', Validators.required],
    cooldown_min: [15, [Validators.required, Validators.min(0)]],
    active: [true]
  });

  ngOnInit() {
    this.configId = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;
    if (this.configId) {
      this.isEdit.set(true);
      const c = this.item();
      if (c) {
        this.form.patchValue({
          ...c,
          canaux_notif: c.canaux_notif.join(', '),
          roles_destinataires: c.roles_destinataires.join(', ')
        });
      }
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const v = this.form.value;
    const payload: Partial<ConfigurationAlerte> = {
      ...v,
      canaux_notif: v.canaux_notif?.split(',').map(s => s.trim() as CanalNotification) || [],
      roles_destinataires: v.roles_destinataires?.split(',').map(s => s.trim()) || []
    } as any;

    // validation
    if (payload.seuil_niveau1 === null && payload.seuil_niveau2 === null && payload.seuil_niveau3 === null) {
      alert("Au moins un seuil doit être renseigné !");
      return;
    }

    if (this.isEdit() && this.configId) {
      this.http.put(`/api/configurations-alerte/${this.configId}`, payload).subscribe(() => {
        this.router.navigate(['/admin/alertes-config']);
      });
    } else {
      payload.config_id = crypto.randomUUID();
      this.http.post('/api/configurations-alerte', payload).subscribe(() => {
        this.router.navigate(['/admin/alertes-config']);
      });
    }
  }
}
