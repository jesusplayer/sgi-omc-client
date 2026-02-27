import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CatalogueService {
  getAll() {
    return httpResource<any[]>(() => '/api/catalogue-produits', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/catalogue-produits/${entityId}` : undefined;
    });
  }
}
