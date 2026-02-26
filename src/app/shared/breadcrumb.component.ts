import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (breadcrumbs() && breadcrumbs()!.length > 1) {
      <nav class="breadcrumb-nav" aria-label="Fil d'Ariane">
        @for (bc of breadcrumbs(); track bc.url; let last = $last) {
          @if (last) {
            <span class="breadcrumb-current">{{ bc.label }}</span>
          } @else {
            <a [routerLink]="bc.url" class="breadcrumb-link">{{ bc.label }}</a>
            <span class="breadcrumb-sep">/</span>
          }
        }
      </nav>
    }
  `,
  styles: [`
    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0 0.5rem 0;
      font-size: 0.8rem;
      flex-wrap: wrap;
    }
    .breadcrumb-link {
      color: var(--accent);
      font-weight: 600;
      text-decoration: none;
      transition: color 0.15s;
    }
    .breadcrumb-link:hover {
      color: var(--accent);
      text-decoration: underline;
    }
    .breadcrumb-sep {
      color: var(--border-color);
      font-size: 0.75rem;
      user-select: none;
    }
    .breadcrumb-current {
      color: var(--text-secondary);
      font-weight: 500;
    }
  `],
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildBreadcrumbs(this.route.root))
    )
  );

  private buildBreadcrumbs(route: ActivatedRoute, url = '', crumbs: Breadcrumb[] = []): Breadcrumb[] {
    if (!route || !route.children || !route.children.length) {
      return crumbs;
    }

    for (const child of route.children) {
      if (!child.snapshot) continue;

      const segments = child.snapshot.url;
      if (segments && segments.length > 0) {
        url += '/' + segments.map((s) => s.path).join('/');
      }

      const label = child.snapshot.data?.['breadcrumb'];
      if (label) {
        // Avoid duplicates (e.g. parent "admin" + child "" both resolving to same URL)
        const lastUrl = crumbs.length > 0 ? crumbs[crumbs.length - 1].url : '';
        if (url !== lastUrl) {
          crumbs.push({ label, url });
        }
      }

      // Recurse into the first child
      this.buildBreadcrumbs(child, url, crumbs);
      break; // Only follow the primary outlet
    }

    return crumbs;
  }
}
