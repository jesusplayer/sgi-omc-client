import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-sitrep-detail',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <a routerLink="/coordination/sitrep" class="text-muted" style="text-decoration:none">← Retour à la liste</a>
        </div>
        <h1>SITREP Global J-1</h1>
        <p class="text-muted">Période du 14 Juin au 14 Juin 2026</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" (click)="validate()">✅ Valider et Approuver</button>
        <button class="btn btn-outline" (click)="downloadPdf()">⬇️ Exporter PDF</button>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h3>Indicateurs Clés (Mock)</h3>
      </div>
      <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center;">
          <div style="padding: 1.5rem; background: var(--bg-body); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--accent)">142</div>
            <div class="text-muted">Criblages PSF</div>
          </div>
          <div style="padding: 1.5rem; background: var(--bg-body); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--warning)">28</div>
            <div class="text-muted">Consultations PMA</div>
          </div>
          <div style="padding: 1.5rem; background: var(--bg-body); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--danger)">5</div>
            <div class="text-muted">Évacuations (FOSA)</div>
          </div>
          <div style="padding: 1.5rem; background: var(--bg-body); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--success)">12</div>
            <div class="text-muted">Sorties (Guérison)</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3>Détails du Rapport</h3>
      </div>
      <div class="card-body">
        <p class="text-muted text-center" style="padding: 2rem;">Le contenu complet du document SITREP s'affichera ici pour relecture (Aperçu PDF ou riche).</p>
      </div>
    </div>
  `,
    styles: [`
    .flex { display: flex; } .items-center { align-items: center; } .gap-2 { gap: 0.5rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-4 { margin-bottom: 1.5rem; }
  `]
})
export class SitrepDetailComponent {

    validate() {
        alert("SITREP validé avec succès.");
    }

    downloadPdf() {
        alert("Téléchargement du PDF en cours...");
    }
}
