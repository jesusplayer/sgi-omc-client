import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppelService {
  getAll() {
    return httpResource<any[]>(() => '/api/appels-regulation', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/appels-regulation/${entityId}` : undefined;
    });
  }
}
