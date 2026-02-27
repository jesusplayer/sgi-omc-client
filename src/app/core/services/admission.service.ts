import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AdmissionService {
  getAll() {
    return httpResource<any[]>(() => '/api/prises-en-charge', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/prises-en-charge/${entityId}` : undefined;
    });
  }
}
