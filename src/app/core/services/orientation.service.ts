import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrientationService {
  getAll() {
    return httpResource<any[]>(() => '/api/orientations', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/orientations/${entityId}` : undefined;
    });
  }
}
