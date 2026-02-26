import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { Utilisateur, Role, Site } from '../models';

interface AuthState {
    user: Utilisateur | null;
    role: Role | null;
    site: Site | null;
    token: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private _state = signal<AuthState>({
        user: null,
        role: null,
        site: null,
        token: null,
    });

    readonly user = computed(() => this._state().user);
    readonly role = computed(() => this._state().role);
    readonly site = computed(() => this._state().site);
    readonly token = computed(() => this._state().token);
    readonly isAuthenticated = computed(() => !!this._state().token);
    readonly userName = computed(() => {
        const u = this._state().user;
        return u ? `${u.prenom} ${u.nom}` : '';
    });
    readonly roleLabel = computed(() => this._state().role?.libelle ?? '');
    readonly roleCode = computed(() => this._state().role?.code_role ?? '');

    constructor() {
        // Restore session from localStorage
        const saved = localStorage.getItem('sgi_auth');
        if (saved) {
            try {
                const state = JSON.parse(saved) as AuthState;
                this._state.set(state);
            } catch {
                localStorage.removeItem('sgi_auth');
            }
        }
    }

    login(login: string, password: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.http
                .post<{ token: string; user: Utilisateur; role: Role; site: Site | null }>(
                    '/api/auth/login',
                    { login, password }
                )
                .subscribe({
                    next: (res) => {
                        const state: AuthState = {
                            user: res.user,
                            role: res.role,
                            site: res.site,
                            token: res.token,
                        };
                        this._state.set(state);
                        localStorage.setItem('sgi_auth', JSON.stringify(state));
                        resolve(true);
                    },
                    error: () => resolve(false),
                });
        });
    }

    logout(): void {
        this._state.set({ user: null, role: null, site: null, token: null });
        localStorage.removeItem('sgi_auth');
        this.router.navigate(['/login']);
    }

    hasRole(...roles: string[]): boolean {
        const code = this._state().role?.code_role;
        return code ? roles.includes(code) : false;
    }

    hasMinLevel(level: number): boolean {
        return (this._state().role?.niveau_acces ?? 0) >= level;
    }
}
