import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-change-password',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🔒 Changer le mot de passe</h1>
        <p>Sécurisez votre compte en modifiant votre mot de passe</p>
      </div>
    </div>

    <div class="card" style="max-width:500px">
      <div class="card-header"><h3>Nouveau mot de passe</h3></div>
      <div style="padding:1.5rem">
        <div class="form-group">
          <label>Mot de passe actuel</label>
          <input type="password" class="form-control" placeholder="Entrez le mot de passe actuel"
                 (input)="currentPwd.set(asStr($event))" />
        </div>
        <div class="form-group">
          <label>Nouveau mot de passe</label>
          <input type="password" class="form-control" placeholder="Minimum 6 caractères"
                 (input)="newPwd.set(asStr($event))" />
        </div>
        <div class="form-group">
          <label>Confirmer le nouveau mot de passe</label>
          <input type="password" class="form-control" placeholder="Retapez le nouveau mot de passe"
                 (input)="confirmPwd.set(asStr($event))" />
        </div>

        @if (error()) {
          <div class="alert alert-danger" style="margin-bottom:1rem">{{ error() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success" style="margin-bottom:1rem">{{ success() }}</div>
        }

        <div class="flex gap-2" style="margin-top:1rem">
          <button class="btn btn-primary" (click)="onSubmit()" [disabled]="loading()">
            {{ loading() ? 'Modification…' : '✅ Modifier' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card" style="max-width:500px;margin-top:1.5rem">
      <div class="card-header"><h3>Règles de sécurité</h3></div>
      <div style="padding:1.5rem;font-size:0.85rem;color:var(--text-secondary)">
        <ul style="margin:0;padding-left:1.25rem;line-height:1.8">
          <li>Minimum <strong>6 caractères</strong></li>
          <li>Au moins <strong>1 lettre majuscule</strong></li>
          <li>Au moins <strong>1 chiffre</strong></li>
          <li>Évitez les mots de passe communs (admin, 123456, etc.)</li>
          <li>Le mot de passe est stocké sous forme de hash sécurisé</li>
        </ul>
      </div>
    </div>
  `,
    styles: [`
    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
    }
    .alert-danger {
      background: rgba(239,68,68,0.1);
      color: #ef4444;
      border: 1px solid rgba(239,68,68,0.2);
    }
    .alert-success {
      background: rgba(16,185,129,0.1);
      color: #10b981;
      border: 1px solid rgba(16,185,129,0.2);
    }
  `],
})
export class ChangePasswordComponent {
    private http = inject(HttpClient);
    private auth = inject(AuthService);

    currentPwd = signal('');
    newPwd = signal('');
    confirmPwd = signal('');
    error = signal('');
    success = signal('');
    loading = signal(false);

    asStr(e: Event): string { return (e.target as HTMLInputElement).value; }

    onSubmit() {
        this.error.set('');
        this.success.set('');

        if (!this.currentPwd() || !this.newPwd() || !this.confirmPwd()) {
            this.error.set('Veuillez remplir tous les champs');
            return;
        }
        if (this.newPwd().length < 6) {
            this.error.set('Le nouveau mot de passe doit contenir au moins 6 caractères');
            return;
        }
        if (this.newPwd() !== this.confirmPwd()) {
            this.error.set('Les mots de passe ne correspondent pas');
            return;
        }
        if (this.newPwd() === this.currentPwd()) {
            this.error.set('Le nouveau mot de passe doit être différent de l\'actuel');
            return;
        }

        this.loading.set(true);
        // Simulate API call (offline mode)
        this.http.post('/api/change-password', {
            userId: this.auth.user()?.user_id,
            currentPassword: this.currentPwd(),
            newPassword: this.newPwd(),
        }).subscribe({
            next: () => {
                this.success.set('Mot de passe modifié avec succès ✅');
                this.loading.set(false);
                this.currentPwd.set('');
                this.newPwd.set('');
                this.confirmPwd.set('');
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Mot de passe actuel incorrect');
                this.loading.set(false);
            },
        });
    }
}
