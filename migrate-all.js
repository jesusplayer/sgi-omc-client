const fs = require('fs');
const path = require('path');

const config = [
    {
        name: 'categorie-lit', model: 'CategorieLit', api: 'categories-lit',
        detail: null, form: 'admin/categorie-lit-form.component.ts', varName: 'categorie'
    },
    {
        name: 'lit', model: 'Lit', api: 'lits',
        detail: null, form: 'admin/lit-form.component.ts', varName: 'lit'
    },
    {
        name: 'catalogue', model: 'CatalogueProduit', api: 'catalogue-produits',
        detail: null, form: 'admin/catalogue-form.component.ts', varName: 'produit'
    },
    {
        name: 'vaccination', model: 'Vaccination', api: 'vaccinations',
        detail: 'admin/vaccination-detail.component.ts', form: 'admin/vaccination-form.component.ts', varName: 'vax'
    },
    {
        name: 'orientation', model: 'Orientation', api: 'orientations',
        detail: 'regulation/orientation-detail.component.ts', form: 'regulation/orientation-form.component.ts', varName: 'orientation'
    },
    {
        name: 'appel', model: 'AppelRegulation', api: 'appels-regulation',
        detail: 'regulation/appel-detail.component.ts', form: null, varName: 'appel'
    },
    {
        name: 'consultation', model: 'Consultation', api: 'consultations',
        detail: 'pma/consultation-detail.component.ts', form: null, varName: 'consultation'
    },
    {
        name: 'laboratoire', model: 'ResultatLabo', api: 'laboratoire',
        detail: 'fosa/laboratoire-detail.component.ts', form: 'fosa/laboratoire-form.component.ts', varName: 'examen'
    },
    {
        name: 'admission', model: 'PriseEnCharge', api: 'prises-en-charge',
        detail: 'fosa/admission-detail.component.ts', form: null, varName: 'pec'
    },
    {
        name: 'alerte-config', model: 'ConfigurationAlerte', api: 'configurations-alerte',
        detail: 'admin/alerte-config-detail.component.ts', form: 'admin/alerte-config-form.component.ts', varName: 'config'
    },
    {
        name: 'alerte', model: 'Alerte', api: 'alertes',
        detail: 'alertes/alerte-detail.component.ts', form: null, varName: 'alerte'
    },
    {
        name: 'role', model: 'Role', api: 'roles',
        detail: 'admin/role-detail.component.ts', form: null, varName: 'role'
    },
    {
        name: 'voyageur', model: 'Patient', api: 'patients',
        detail: 'psf/voyageur-detail.component.ts', form: 'psf/voyageur-form.component.ts', varName: 'patient'
    },
    {
        name: 'stock', model: 'Stock', api: 'stocks',
        detail: 'stocks/stock-detail.component.ts', form: null, varName: 'stock'
    }
];

const featuresDir = 'd:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/features/';
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

    // 3. Update Detail Component
    if (conf.detail) {
        const detailPath = path.join(featuresDir, conf.detail);
        if (fs.existsSync(detailPath)) {
            let content = fs.readFileSync(detailPath, 'utf8');

            // template replace varName() to item()
            let regex = new RegExp(conf.varName + '\\(\\)', 'g');
            content = content.replace(regex, 'item()');

            // class string replacements
            content = content.replace(/(id = input<string>\(\);)/g, 'item = input<any | null>(null);');
            content = content.replace(/(id = input<string \| undefined>\(\);)/g, 'item = input<any | null>(null);');

            // Remove signal declaration (e.g. role = signal<Role | null>(null);)
            let sigRegex = new RegExp(`${conf.varName}\\s*=\\s*signal<[^>]+>\\(null\\);`, 'g');
            content = content.replace(sigRegex, '');

            // Remove ngOnInit http call: const id = this.id() ?? null; if(id) { ... }
            content = content.replace(/ngOnInit\(\)\s*{[^}]*const[^{]*this\.http\.get[^}]*}/, 'ngOnInit() {}');
            // Sometimes it's slightly different
            content = content.replace(/ngOnInit\(\)\s*{[\s\S]*?this\.http\.get[\s\S]*?}\s*\n\s*}/, 'ngOnInit() {}');

            // some methods might use `this.role()` -> `this.item()`
            regex = new RegExp(`this\\.${conf.varName}\\(\\)`, 'g');
            content = content.replace(regex, 'this.item()');

            fs.writeFileSync(detailPath, content);
        }
    }

    // 4. Update Form Component
    if (conf.form) {
        const formPath = path.join(featuresDir, conf.form);
        if (fs.existsSync(formPath)) {
            let content = fs.readFileSync(formPath, 'utf8');

            // class string replacements
            content = content.replace(/(id = input<string>\(\);)/g, 'item = input<any | null>(null);');
            content = content.replace(/(id = input<string \| undefined>\(\);)/g, 'item = input<any | null>(null);');

            // ngOnInit replacement to use item
            // We will look for ngOnInit() {...} and rewrite it.
            let initBody = `ngOnInit() {
    const data = this.item();
    if (data) {
      this.isEdit.set(true);
      // Try to guess the id field from the first key of the API endpoint or just merge
      if (data.id || data[\`${conf.varName}_id\`] || data[\`${conf.name}_id\`]) {
        this[\`${conf.varName}Id\`] = data.id || data[\`${conf.varName}_id\`] || data[\`${conf.name}_id\`] || data.config_id || data.patient_id;
      }
      // sometimes siteId is explicitly set, we'll try to guess it below if compilation fails
      this.form = { ...data };
    }
  }`;
            content = content.replace(/ngOnInit\(\)\s*{[\s\S]*?(?:this\.http\.get|edit|isEdit)[\s\S]*?}\s*\n\s*}/, initBody);
            content = content.replace(/ngOnInit\(\)\s*{[\s\S]*?const\s+id\s*=\s*(?:this\.)?id[\s\S]*?}\s*\n\s*}/, initBody);

            // Remove cdr.markForCheck
            content = content.replace(/this\.cdr\.markForCheck\(\);/g, '');
            content = content.replace(/private cdr = inject\(ChangeDetectorRef\);/g, '');
            content = content.replace(/import { ChangeDetectorRef } from '@angular\/core';/g, '');

            fs.writeFileSync(formPath, content);
        }
    }
}
console.log('Migration generated.');
