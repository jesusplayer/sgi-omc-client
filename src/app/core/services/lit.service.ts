import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LitService {
  getAll() {
    return httpResource<any[]>(() => '/api/lits', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/lits/${entityId}` : undefined;
    });
  }
}
