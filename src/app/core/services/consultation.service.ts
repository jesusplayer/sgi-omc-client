import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  getAll() {
    return httpResource<any[]>(() => '/api/consultations', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/consultations/${entityId}` : undefined;
    });
  }
}
