import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VaccinationService {
  getAll() {
    return httpResource<any[]>(() => '/api/vaccinations', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/vaccinations/${entityId}` : undefined;
    });
  }
}
