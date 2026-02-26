import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Alerte } from '../../core/models';

@Component({
    selector: 'app-alerte-detail',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🔔 Détail alerte</h1>
        <p>Informations complètes de l'alerte</p>
      </div>
      <div class="page-actions">
        @if (alerte()?.statut === 'ACTIVE') {
          <button class="btn btn-success" (click)="onResolve()">✅ Résoudre</button>
        }
        <button class="btn btn-danger" (click)="onDelete()">🗑 Supprimer</button>
        <a routerLink="/alertes" class="btn btn-outline">← Retour</a>
      </div>
    </div>

    @if (alerte(); as a) {
      <div class="card" style="max-width:700px">
        <div class="detail-grid">
          <div class="detail-row"><span class="detail-label">Titre</span><span class="font-semibold">{{ a.titre }}</span></div>
          <div class="detail-row"><span class="detail-label">Niveau</span>
            <span class="badge" [class]="a.niveau >= 3 ? 'badge-danger' : a.niveau >= 2 ? 'badge-warning' : 'badge-info'">Niveau {{ a.niveau }}</span>
          </div>
          <div class="detail-row"><span class="detail-label">Type</span><span class="badge badge-neutral">{{ a.type_alerte }}</span></div>
          <div class="detail-row"><span class="detail-label">Statut</span>
            <span class="badge" [class]="a.statut === 'ACTIVE' ? 'badge-danger' : 'badge-success'">{{ a.statut }}</span>
          </div>
          <div class="detail-row"><span class="detail-label">Message</span><span>{{ a.message }}</span></div>
          @if (a.valeur_declenchante) {
            <div class="detail-row"><span class="detail-label">Valeur / Seuil</span><span>{{ a.valeur_declenchante }} / {{ a.seuil_configure }}</span></div>
          }
          <div class="detail-row"><span class="detail-label">Déclenchement</span><span>{{ formatDate(a.datetime_declenchement) }}</span></div>
          @if (a.commentaire_resolution) {
            <div class="detail-row"><span class="detail-label">Résolution</span><span>{{ a.commentaire_resolution }}</span></div>
          }
        </div>
      </div>
    }
  `,
    styles: [`
    .detail-grid { display: flex; flex-direction: column; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 500; color: var(--text-secondary); min-width: 140px; }
  `],
})
export class AlerteDetailComponent implements OnInit {
    private http = inject(HttpClient);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    alerte = signal<Alerte | null>(null);

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.http.get<Alerte>(`/api/alertes/${id}`).subscribe((a) => this.alerte.set(a));
    }

    formatDate(iso: string): string { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }); }

    onResolve() {
        const a = this.alerte()!;
        const updated = { ...a, statut: 'RESOLUE' as const, datetime_resolution: new Date().toISOString(), commentaire_resolution: 'Résolu manuellement' };
        this.http.put(`/api/alertes/${a.alerte_id}`, updated).subscribe(() => this.alerte.set(updated));
    }

    onDelete() {
        if (confirm('Supprimer cette alerte ?')) {
            this.http.delete(`/api/alertes/${this.alerte()!.alerte_id}`).subscribe(() => this.router.navigate(['/alertes']));
        }
    }
}
