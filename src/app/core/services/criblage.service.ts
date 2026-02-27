import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CriblageService {
  getAll() {
    return httpResource<any[]>(() => '/api/tracing-vol', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/tracing-vol/${entityId}` : undefined;
    });
  }
}
