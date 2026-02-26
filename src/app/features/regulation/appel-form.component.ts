import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-appel-form',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <h1>📞 Nouvel appel de régulation</h1>
    </div>
    <form (ngSubmit)="onSubmit()" class="card">
      <div class="grid grid-2">
        <div class="form-group">
          <label>Type d'appelant *</label>
          <select class="form-control" [(ngModel)]="form.type_appelant" name="type_appelant" required>
            <option value="PMA">PMA</option><option value="PSF">PSF</option>
            <option value="HOTEL">Hôtel</option><option value="DELEGATION">Délégation</option>
            <option value="POLICE">Police</option><option value="AUTRE">Autre</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nom de l'appelant</label>
          <input class="form-control" [(ngModel)]="form.nom_appelant" name="nom_appelant" />
        </div>
        <div class="form-group">
          <label>Téléphone</label>
          <input class="form-control" [(ngModel)]="form.telephone_appelant" name="telephone_appelant" />
        </div>
        <div class="form-group">
          <label>Localisation *</label>
          <input class="form-control" [(ngModel)]="form.localisation" name="localisation" required placeholder="Site / Adresse" />
        </div>
      </div>
      <div class="form-group">
        <label>Motif de l'appel *</label>
        <textarea class="form-control" [(ngModel)]="form.motif_appel" name="motif_appel" required rows="2"></textarea>
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label>Niveau de gravité (1-5) *</label>
          <input class="form-control" type="number" min="1" max="5" [(ngModel)]="form.niveau_gravite" name="niveau_gravite" required />
        </div>
        <div class="form-group">
          <label>Moyen engagé *</label>
          <select class="form-control" [(ngModel)]="form.moyen_engage" name="moyen_engage" required>
            <option value="CONSEIL_TEL">Conseil téléphonique</option><option value="MEDECIN_SITE">Médecin sur site</option>
            <option value="AMBULANCE">Ambulance</option><option value="SMUR">SMUR</option>
            <option value="AUCUN">Aucun</option>
          </select>
        </div>
      </div>
      @if (form.moyen_engage === 'CONSEIL_TEL') {
        <div class="form-group">
          <label>Conseil donné</label>
          <textarea class="form-control" [(ngModel)]="form.conseil_telephone" name="conseil_telephone" rows="2"></textarea>
        </div>
      }
      <div class="flex gap-2 justify-between" style="margin-top:1.5rem">
        <button type="button" class="btn btn-secondary" (click)="router.navigate(['/regulation'])">← Retour</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? '⏳…' : '✅ Enregistrer' }}</button>
      </div>
    </form>
  `,
})
export class AppelFormComponent {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    router = inject(Router);
    saving = signal(false);
    form: any = { type_appelant: 'PMA', nom_appelant: '', telephone_appelant: '', localisation: '', motif_appel: '', niveau_gravite: 2, moyen_engage: 'CONSEIL_TEL', conseil_telephone: '' };

    onSubmit() {
        this.saving.set(true);
        const body = { ...this.form, regulateur_id: this.auth.user()?.user_id, datetime_appel: new Date().toISOString(), statut: 'EN_COURS' };
        this.http.post('/api/appels-regulation', body).subscribe({ next: () => this.router.navigate(['/regulation']), error: () => this.saving.set(false) });
    }
}
