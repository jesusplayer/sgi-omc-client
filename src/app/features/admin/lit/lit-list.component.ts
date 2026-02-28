import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Lit, Site, CategorieLit } from '../../../core/models';
import { GenericGridComponent } from '../../../shared/components/generic-grid/generic-grid.component';
import { GridColumn, GridRowAction, GridHeaderAction } from '../../../shared/components/generic-grid/grid.models';

@Component({
  selector: 'app-lit-list',
  standalone: true,
  imports: [GenericGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-generic-grid
      title="🛏️ Gestion des Lits"
      subtitle="Inventaire et statut des lits physiques par site FOSA"
      entityName="Lits"
      [data]="filteredLits()"
      [columns]="columns"
      [headerActions]="headerActions"
      [rowActions]="rowActions"
      emptyMessage="Aucun lit trouvé"
    >
      <select grid-filters class="form-control" [value]="selectedSite()" (change)="onSiteChange($event)" style="max-width:300px">
        <option value="">Tous les sites FOSA</option>
        @for (s of sites(); track s.site_id) {
          <option [value]="s.site_id">{{ s.nom }}</option>
        }
      </select>
      
      <select grid-filters class="form-control" [value]="selectedStatus()" (change)="onStatusChange($event)" style="max-width:200px">
        <option value="">Tous les statuts</option>
        <option value="LIBRE">Libre</option>
        <option value="OCCUPE">Occupé</option>
        <option value="HORS_SERVICE">Hors service</option>
        <option value="RESERVE">Réservé</option>
      </select>
    </app-generic-grid>
  `
})
export class LitListComponent implements OnInit {
  private http = inject(HttpClient);

  lits = signal<Lit[]>([]);
  sites = signal<Site[]>([]);
  categories = signal<CategorieLit[]>([]);

  selectedSite = signal('');
  selectedStatus = signal('');

  @ViewChild(GenericGridComponent) grid!: GenericGridComponent;

  filteredLits = computed(() => {
    let result = this.lits();
    if (this.selectedSite()) {
      result = result.filter(l => l.site_id === this.selectedSite());
    }
    if (this.selectedStatus()) {
      result = result.filter(l => l.statut === this.selectedStatus());
    }
    return result;
  });

  columns: GridColumn[] = [
    { field: 'site', header: 'Site FOSA', valueGetter: (l) => this.getSiteName(l.site_id) },
    { field: 'numero', header: 'Numéro', type: 'link', valueGetter: (l) => l.numero_lit, routerLink: (l) => ['/admin/lits', l.lit_id], cellClass: 'font-medium' },
    { field: 'categorie', header: 'Catégorie', valueGetter: (l) => this.getCategoryName(l.categorie_id) },
    { field: 'statut', header: 'Statut', type: 'badge', valueGetter: (l) => l.statut, badgeColor: (l) => this.getStatusBadge(l.statut) },
    { field: 'updated_at', header: 'Dernière Maj.', type: 'date', valueGetter: (l) => l.updated_at, cellClass: 'text-sm text-muted' },
  ];

  headerActions: GridHeaderAction[] = [
    { label: '+ Nouveau lit', route: ['/admin/lits/nouveau'], class: 'btn-primary' }
  ];

  rowActions: GridRowAction[] = [
    { icon: '👁️', label: 'Détail', title: 'Détail', routeFn: (l) => ['/admin/lits', l.lit_id], class: 'btn-info' },
    { icon: '✏️', label: 'Éditer', title: 'Éditer', routeFn: (l) => ['/admin/lits', l.lit_id, 'editer'], class: 'btn-outline' }
  ];

  ngOnInit() {
    this.http.get<Lit[]>('/api/lits').subscribe(res => this.lits.set(res));
    // Load sites and filter FOSA/PMA
    this.http.get<Site[]>('/api/sites').subscribe(res => {
      this.sites.set(res.filter(s => ['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'].includes(s.type_site)));
    });
    this.http.get<CategorieLit[]>('/api/categories-lits').subscribe(res => this.categories.set(res));
  }

  onSiteChange(e: Event) {
    this.selectedSite.set((e.target as HTMLSelectElement).value);
  }

  onStatusChange(e: Event) {
    this.selectedStatus.set((e.target as HTMLSelectElement).value);
  }

  getSiteName(id: string): string {
    return this.sites().find(s => s.site_id === id)?.nom || 'Inconnu';
  }

  getCategoryName(id: string): string {
    return this.categories().find(c => c.categorie_id === id)?.libelle || 'Inconnu';
  }

  getStatusBadge(s: string): string {
    switch (s) {
      case 'LIBRE': return 'badge-success';
      case 'OCCUPE': return 'badge-danger';
      case 'RESERVE': return 'badge-warning';
      case 'HORS_SERVICE': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  }
}
