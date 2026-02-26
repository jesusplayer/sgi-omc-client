import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppelRegulation } from '../../core/models';

@Component({
    selector: 'app-appel-detail',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>📞 Détail appel</h1>
        <p>Fiche de l'appel de régulation</p>
      </div>
      <div class="page-actions">
        @if (appel()) {
          <a [routerLink]="['/regulation', appel()!.appel_id, 'editer']" class="btn btn-primary">✏️ Modifier</a>
          <button class="btn btn-danger" (click)="onDelete()">🗑 Supprimer</button>
        }
        <a routerLink="/regulation" class="btn btn-outline">← Retour</a>
      </div>
    </div>

    @if (appel(); as a) {
      <div class="card" style="max-width:700px">
        <div class="detail-grid">
          <div class="detail-row"><span class="detail-label">Date/heure</span><span>{{ formatDate(a.datetime_appel) }}</span></div>
          <div class="detail-row"><span class="detail-label">Type appelant</span><span class="badge badge-info">{{ a.type_appelant }}</span></div>
          <div class="detail-row"><span class="detail-label">Nom appelant</span><span>{{ a.nom_appelant ?? '—' }}</span></div>
          <div class="detail-row"><span class="detail-label">Téléphone</span><span>{{ a.telephone_appelant ?? '—' }}</span></div>
          <div class="detail-row"><span class="detail-label">Localisation</span><span>{{ a.localisation }}</span></div>
          <div class="detail-row"><span class="detail-label">Motif</span><span>{{ a.motif_appel }}</span></div>
          <div class="detail-row"><span class="detail-label">Gravité</span>
            <span class="badge" [class]="a.niveau_gravite >= 4 ? 'badge-danger' : a.niveau_gravite >= 3 ? 'badge-warning' : 'badge-info'">P{{ a.niveau_gravite }}</span>
          </div>
          <div class="detail-row"><span class="detail-label">Moyen engagé</span><span class="badge badge-info">{{ a.moyen_engage }}</span></div>
          <div class="detail-row"><span class="detail-label">Statut</span>
            <span class="badge" [class]="a.statut === 'RESOLU' ? 'badge-success' : a.statut === 'EN_COURS' ? 'badge-warning' : 'badge-info'">{{ a.statut }}</span>
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    .detail-grid { display: flex; flex-direction: column; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 500; color: var(--text-secondary); }
  `],
})
export class AppelDetailComponent implements OnInit {
    private http = inject(HttpClient);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    appel = signal<AppelRegulation | null>(null);

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.http.get<AppelRegulation>(`/api/appels-regulation/${id}`).subscribe((a) => this.appel.set(a));
    }

    formatDate(iso: string): string {
        return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    }

    onDelete() {
        if (confirm('Supprimer cet appel ?')) {
            this.http.delete(`/api/appels-regulation/${this.appel()!.appel_id}`).subscribe(() => this.router.navigate(['/regulation']));
        }
    }
}
