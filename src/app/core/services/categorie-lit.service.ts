import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CategorieLitService {
  getAll() {
    return httpResource<any[]>(() => '/api/categories-lits', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/categories-lits/${entityId}` : undefined;
    });
  }
}
