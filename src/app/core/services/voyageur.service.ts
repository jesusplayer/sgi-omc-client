import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VoyageurService {
  getAll() {
    return httpResource<any[]>(() => '/api/patients', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/patients/${entityId}` : undefined;
    });
  }
}
