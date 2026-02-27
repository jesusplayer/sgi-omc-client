import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LaboratoireService {
  getAll() {
    return httpResource<any[]>(() => '/api/laboratoire', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/laboratoire/${entityId}` : undefined;
    });
  }
}
