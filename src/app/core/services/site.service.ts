import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Site } from '../models';

@Injectable({
    providedIn: 'root'
})
export class SiteService {

    getAll() {
        return httpResource<Site[]>(() => '/api/sites', { defaultValue: [] });
    }

    getById(id: () => string | undefined) {
        return httpResource<Site>(() => {
            const siteId = id();
            return siteId ? `/api/sites/${siteId}` : undefined;
        });
    }
}
