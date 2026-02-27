import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AlerteConfigService {
  getAll() {
    return httpResource<any[]>(() => '/api/configurations-alerte', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/configurations-alerte/${entityId}` : undefined;
    });
  }
}
