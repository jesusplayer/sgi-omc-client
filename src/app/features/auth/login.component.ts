import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
      </div>

      <div class="login-card animate-fadeIn">
        <div class="login-header">
          <span class="login-logo">🏥</span>
          <h1>SGI — Couverture Sanitaire</h1>
          <p>OMC Yaoundé 2026</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label for="login">Identifiant</label>
            <input
              id="login"
              class="form-control"
              type="text"
              [(ngModel)]="login"
              name="login"
              placeholder="ex: admin, agent.psf, medecin.fosa"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input
              id="password"
              class="form-control"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Saisir un mot de passe"
              required
              autocomplete="current-password"
            />
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <button
            class="btn btn-primary btn-lg w-full"
            type="submit"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="spinner"></span> Connexion…
            } @else {
              🔐 Se connecter
            }
          </button>
        </form>

        <div class="login-hint">
          <p><strong>Comptes de démonstration :</strong></p>
          <div class="hint-accounts">
            @for (acc of accounts; track acc.login) {
              <button class="hint-btn" (click)="fillAccount(acc.login)">
                <span class="hint-icon">{{ acc.icon }}</span>
                <span>{{ acc.label }}</span>
                <code>{{ acc.login }}</code>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      position: relative;
      overflow: hidden;
    }

    .login-bg {
      position: absolute; inset: 0;
      .bg-shape {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.3;
      }
      .shape-1 { width: 500px; height: 500px; background: #6366f1; top: -150px; right: -100px; }
      .shape-2 { width: 400px; height: 400px; background: #3b82f6; bottom: -100px; left: -100px; }
      .shape-3 { width: 300px; height: 300px; background: #10b981; top: 50%; left: 50%; transform: translate(-50%, -50%); }
    }

    .login-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      width: 440px;
      max-width: 95vw;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      position: relative;
      z-index: 1;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
      .login-logo { font-size: 3rem; display: block; margin-bottom: 0.75rem; }
      h1 { font-size: 1.35rem; font-weight: 700; color: var(--text-primary); }
      p { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
    }

    .login-form {
      margin-bottom: 1.5rem;
      .form-group { margin-bottom: 1.25rem; }
    }

    .error-msg {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      margin-bottom: 1rem;
      text-align: center;
    }

    .spinner {
      display: inline-block;
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .login-hint {
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      p { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; text-align: center; }
    }

    .hint-accounts { display: flex; flex-direction: column; gap: 0.35rem; }

    .hint-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.15s;
      &:hover { border-color: var(--accent); background: var(--accent-light); }
      .hint-icon { font-size: 1rem; }
      code { margin-left: auto; background: rgba(99,102,241,0.1); padding: 0.1rem 0.4rem; border-radius: 4px; color: var(--accent); font-size: 0.75rem; }
    }
  `],
})
export class LoginComponent {
    private auth = inject(AuthService);
    private router = inject(Router);

    login = '';
    password = '';
    loading = signal(false);
    error = signal('');

    accounts = [
        { login: 'admin', label: 'Administrateur', icon: '🔧' },
        { login: 'data.manager', label: 'Data Manager', icon: '📊' },
        { login: 'agent.psf', label: 'Agent PSF', icon: '🛫' },
        { login: 'agent.pma', label: 'Agent PMA', icon: '🩺' },
        { login: 'regulateur', label: 'Médecin Régulateur', icon: '📞' },
        { login: 'medecin.fosa', label: 'Médecin FOSA', icon: '🏥' },
    ];

    fillAccount(login: string) {
        this.login = login;
        this.password = 'demo2026';
        this.error.set('');
    }

    async onLogin() {
        this.error.set('');
        if (!this.login || !this.password) {
            this.error.set('Veuillez remplir tous les champs');
            return;
        }
        this.loading.set(true);
        const success = await this.auth.login(this.login, this.password);
        this.loading.set(false);
        if (success) {
            this.router.navigate(['/dashboard']);
        } else {
            this.error.set('Identifiant ou mot de passe incorrect');
        }
    }
}
