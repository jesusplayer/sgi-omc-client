import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AlerteService {
  getAll() {
    return httpResource<any[]>(() => '/api/alertes', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/alertes/${entityId}` : undefined;
    });
  }
}
