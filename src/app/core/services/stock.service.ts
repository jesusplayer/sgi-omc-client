import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  getAll() {
    return httpResource<any[]>(() => '/api/stocks', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? `/api/stocks/${entityId}` : undefined;
    });
  }
}
