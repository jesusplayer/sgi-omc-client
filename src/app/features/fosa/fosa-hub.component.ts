import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FosaCard {
    icon: string;
    label: string;
    description: string;
    route: string;
    color: string;
    bgColor: string;
}

@Component({
    selector: 'app-fosa-hub',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>🏥 Soins FOSA</h1>
        <p>Gestion des admissions, du laboratoire et des lits de la formation sanitaire</p>
      </div>
    </div>

    <div class="fosa-grid">
      @for (card of cards; track card.route) {
        <a [routerLink]="card.route" class="fosa-card">
          <div class="fosa-card-icon" [style.background]="card.bgColor" [style.color]="card.color">
            {{ card.icon }}
          </div>
          <div class="fosa-card-body">
            <h3>{{ card.label }}</h3>
            <p>{{ card.description }}</p>
          </div>
          <div class="fosa-card-arrow">→</div>
        </a>
      }
    </div>
  `,
    styles: [`
    .fosa-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }
    .fosa-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }
    .fosa-card:hover {
      border-color: var(--accent);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .fosa-card-icon {
      width: 52px; height: 52px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .fosa-card-body {
      flex: 1; min-width: 0;
      h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.15rem; }
      p { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
    }
    .fosa-card-arrow {
      color: var(--text-muted);
      font-size: 1.2rem;
      transition: transform 0.2s;
    }
    .fosa-card:hover .fosa-card-arrow {
      transform: translateX(4px);
      color: var(--accent);
    }
  `],
})
export class FosaHubComponent {
    cards: FosaCard[] = [
        {
            icon: '📥', label: 'Admissions', description: 'Gestion des patients admis et de leur prise en charge',
            route: '/fosa/admissions', color: '#6366f1', bgColor: 'rgba(99,102,241,0.1)',
        },
        {
            icon: '🔬', label: 'Laboratoire', description: 'Prescriptions et résultats d\'analyses',
            route: '/fosa/laboratoire', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)',
        },
        {
            icon: '🛏️', label: 'Plan des lits', description: 'Vue d\'ensemble et occupation des lits',
            route: '/fosa/lits', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)',
        }
    ];
}
