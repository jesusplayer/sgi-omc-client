import { Component, input, computed, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GridColumn, GridHeaderAction, GridRowAction } from './grid.models';

@Component({
    selector: 'app-generic-grid',
    standalone: true,
    imports: [CommonModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </div>
      <div class="page-actions flex gap-2">
        @for (action of headerActions(); track action.label) {
          @if (action.route) {
            <a [routerLink]="action.route" class="btn" [ngClass]="action.class || 'btn-outline'" [title]="action.title || ''">
              {{ action.icon ? action.icon + ' ' : '' }}{{ action.label }}
            </a>
          } @else if (action.action) {
            <button class="btn" [ngClass]="action.class || 'btn-outline'" [title]="action.title || ''" (click)="action.action()">
              {{ action.icon ? action.icon + ' ' : '' }}{{ action.label }}
            </button>
          }
        }
      </div>
    </div>

    <ng-content select="[grid-stats]"></ng-content>

    <div class="card">
      <div class="card-header">
        <h3>{{ entityName() }} ({{ filteredData().length }})</h3>
        <div class="flex gap-2">
          <input class="form-control" style="width:250px" placeholder="🔍 Rechercher…"
                 (input)="onSearch($event)" />
          <ng-content select="[grid-filters]"></ng-content>
        </div>
      </div>
      <div class="table-container" style="border:none">
        <table class="data-table">
          <thead>
            <tr>
              @for (col of columns(); track col.field) {
                <th [style]="col.cellStyle || ''">{{ col.header }}</th>
              }
              @if (rowActions().length) {
                <th>Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of filteredData(); track getRowTrackBy(row, $index)) {
              <tr class="animate-fadeIn">
                @for (col of columns(); track col.field) {
                  <td [class]="getCellClass(col, row)" [style]="getCellStyle(col, row)">
                    @switch (col.type) {
                      @case ('link') {
                        <a [routerLink]="getLink(col, row)" class="cell-link">
                          <code>{{ getCellValue(col, row) }}</code>
                        </a>
                      }
                      @case ('badge') {
                        <span class="badge" [ngClass]="getBadgeColor(col, row)">
                          {{ getCellValue(col, row) }}
                        </span>
                      }
                      @case ('date') {
                        {{ getCellValue(col, row) | date:'dd/MM/yyyy HH:mm' }}
                      }
                      @default {
                        <!-- Type 'text' ou fallback -->
                        {{ getCellValue(col, row) }}
                      }
                    }
                  </td>
                }
                @if (rowActions().length) {
                  <td>
                    <div class="flex gap-1">
                      @for (action of rowActions(); track $index) {
                        @if (!action.hideFn || !action.hideFn(row)) {
                          @if (action.routeFn) {
                            <a [routerLink]="action.routeFn(row)" class="btn btn-sm" [ngClass]="action.class || 'btn-outline'" [title]="action.title || action.label || ''">
                              {{ action.icon || action.label }}
                            </a>
                          } @else if (action.actionFn) {
                            <button class="btn btn-sm" [ngClass]="action.class || 'btn-outline'" [title]="action.title || action.label || ''" (click)="action.actionFn(row)">
                              {{ action.icon || action.label }}
                            </button>
                          }
                        }
                      }
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns().length + (rowActions().length ? 1 : 0)" class="text-center text-muted" style="padding:2rem">
                  {{ emptyMessage() }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
    styles: [`
    /* Same structure as current lists */
  `]
})
export class GenericGridComponent {
    title = input.required<string>();
    subtitle = input<string>('');
    entityName = input<string>('Éléments');
    data = input<any[]>([]);
    columns = input.required<GridColumn[]>();
    headerActions = input<GridHeaderAction[]>([]);
    rowActions = input<GridRowAction[]>([]);
    emptyMessage = input<string>('Aucune donnée disponible');

    searchTerm = signal('');

    filteredData = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const rows = this.data();
        if (!term) return rows;

        return rows.filter((row) => {
            // Pour la recherche générique, on concatène toutes les valeurs visibles
            const searchString = this.columns()
                .map(col => this.getCellValue(col, row)?.toString().toLowerCase() || '')
                .join(' ');
            return searchString.includes(term);
        });
    });

    onSearch(event: Event) {
        this.searchTerm.set((event.target as HTMLInputElement).value);
    }

    getCellValue(col: GridColumn, row: any): any {
        if (col.valueGetter) {
            return col.valueGetter(row);
        }
        return row[col.field];
    }

    getBadgeColor(col: GridColumn, row: any): string {
        if (col.badgeColor) {
            return col.badgeColor(row);
        }
        return 'badge-neutral';
    }

    getLink(col: GridColumn, row: any): any[] {
        if (col.routerLink) {
            return col.routerLink(row);
        }
        return [];
    }

    getCellClass(col: GridColumn, row: any): string {
        if (typeof col.cellClass === 'function') {
            return (col.cellClass as Function)(row);
        }
        return (col.cellClass as string) || '';
    }

    getCellStyle(col: GridColumn, row: any): string {
        if (typeof col.cellStyle === 'function') {
            return (col.cellStyle as Function)(row);
        }
        return (col.cellStyle as string) || '';
    }

    getRowTrackBy(row: any, index: number): any {
        // Si la donnée a un 'id' ou '*_id', on l'utilise
        const idField = Object.keys(row).find(k => k.endsWith('_id') || k === 'id');
        return idField ? row[idField] : index;
    }
}
