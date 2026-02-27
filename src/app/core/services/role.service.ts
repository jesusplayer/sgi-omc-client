import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  getAll() {
    return httpResource<any[]>(() => '/api/roles', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/roles/${entityId}` : undefined;
    });
  }
}
