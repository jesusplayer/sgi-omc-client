const fs = require('fs');
const path = require('path');

const config = [
    { name: 'categorie-lit', api: 'categories-lit' },
    { name: 'lit', api: 'lits' },
    { name: 'catalogue', api: 'catalogue-produits' },
    { name: 'vaccination', api: 'vaccinations' },
    { name: 'orientation', api: 'orientations' },
    { name: 'appel', api: 'appels-regulation' },
    { name: 'consultation', api: 'consultations' },
    { name: 'laboratoire', api: 'laboratoire' },
    { name: 'admission', api: 'prises-en-charge' },
    { name: 'alerte-config', api: 'configurations-alerte' },
    { name: 'alerte', api: 'alertes' },
    { name: 'role', api: 'roles' },
    { name: 'voyageur', api: 'patients' },
    { name: 'stock', api: 'stocks' },
    { name: 'criblage', api: 'tracing-vol' }
];

const resolversDir = 'd:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/core/resolvers/';
const servicesDir = 'd:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/core/services/';

if (!fs.existsSync(resolversDir)) fs.mkdirSync(resolversDir, { recursive: true });
if (!fs.existsSync(servicesDir)) fs.mkdirSync(servicesDir, { recursive: true });

function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

for (const conf of config) {
    const camelName = toCamelCase(conf.name);
    const resolverName = camelName + 'Resolver';

    // 1. Create Resolver
    const resolverPath = path.join(resolversDir, `${conf.name}.resolver.ts`);
    if (!fs.existsSync(resolverPath)) {
        fs.writeFileSync(resolverPath, `import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export const ${resolverName}: ResolveFn<any> = (route) => {
  const http = inject(HttpClient);
  const id = route.paramMap.get('id');
  return http.get<any>(\`/api/${conf.api}/\${id}\`);
};
`);
    }

    // 2. Create Service
    const servicePath = path.join(servicesDir, `${conf.name}.service.ts`);
    const serviceName = camelName.charAt(0).toUpperCase() + camelName.slice(1) + 'Service';
    if (!fs.existsSync(servicePath)) {
        fs.writeFileSync(servicePath, `import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ${serviceName} {
  getAll() {
    return httpResource<any[]>('/api/${conf.api}', { defaultValue: [] });
  }

  getById(id: () => string | undefined) {
    return httpResource<any>(() => {
      const entityId = id();
      return entityId ? \`/api/${conf.api}/\${entityId}\` : undefined;
    });
  }
}
`);
    }
}
console.log('Resolvers and Services generated successfully.');
