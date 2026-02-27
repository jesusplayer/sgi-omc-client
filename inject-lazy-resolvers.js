const fs = require('fs');

let content = fs.readFileSync('src/app/app.routes.ts', 'utf8');

// The user reverted the static imports, so we should clean them up at the top if any, but let's focus on adding the lazy-loaded resolvers.
// Routes to process: anything with `path: ':id'` or `path: '.../:id'`
// Wait, in my previous script smart-update-routes.js I split by `loadComponent:` to inject just before it. We can do the same.

const resolverMapping = {
    'VoyageurFormComponent': { file: 'voyageur.resolver', name: 'voyageurResolver' },
    'VoyageurDetailComponent': { file: 'voyageur.resolver', name: 'voyageurResolver' },
    'CriblageFormComponent': { file: 'criblage.resolver', name: 'criblageResolver' }, // wait, earlier we used voyageurResolver for criblage? No, there is a criblage.resolver.ts
    'ConsultationFormComponent': { file: 'consultation.resolver', name: 'consultationResolver' },
    'ConsultationDetailComponent': { file: 'consultation.resolver', name: 'consultationResolver' },
    'AdmissionFormComponent': { file: 'admission.resolver', name: 'admissionResolver' },
    'AdmissionDetailComponent': { file: 'admission.resolver', name: 'admissionResolver' },
    'LaboratoireFormComponent': { file: 'laboratoire.resolver', name: 'laboratoireResolver' },
    'LaboratoireDetailComponent': { file: 'laboratoire.resolver', name: 'laboratoireResolver' },
    'StockDetailComponent': { file: 'stock.resolver', name: 'stockResolver' },
    'OrientationFormComponent': { file: 'orientation.resolver', name: 'orientationResolver' },
    'OrientationDetailComponent': { file: 'orientation.resolver', name: 'orientationResolver' },
    'AppelFormComponent': { file: 'appel.resolver', name: 'appelResolver' },
    'AppelDetailComponent': { file: 'appel.resolver', name: 'appelResolver' },
    'VaccinationFormComponent': { file: 'vaccination.resolver', name: 'vaccinationResolver' },
    'VaccinationDetailComponent': { file: 'vaccination.resolver', name: 'vaccinationResolver' },
    'RoleFormComponent': { file: 'role.resolver', name: 'roleResolver' },
    'RoleDetailComponent': { file: 'role.resolver', name: 'roleResolver' },
    'AlerteDetailComponent': { file: 'alerte.resolver', name: 'alerteResolver' },
    'AlerteConfigFormComponent': { file: 'alerte-config.resolver', name: 'alerteConfigResolver' },
    'AlerteConfigDetailComponent': { file: 'alerte-config.resolver', name: 'alerteConfigResolver' },
    'CatalogueFormComponent': { file: 'catalogue.resolver', name: 'catalogueResolver' },
    'LitFormComponent': { file: 'lit.resolver', name: 'litResolver' },
    'CategorieLitFormComponent': { file: 'categorie-lit.resolver', name: 'categorieLitResolver' }
};

let sections = content.split('loadComponent: () =>');

for (let i = 1; i < sections.length; i++) {
    const prevSection = sections[i - 1];
    const pathMatch = prevSection.match(/path:\s*'([^']+)'/g);

    if (pathMatch && pathMatch.length > 0) {
        const lastPath = pathMatch[pathMatch.length - 1];
        if (lastPath.includes(':id') && !prevSection.includes('resolve: { item:')) {
            const componentMatch = sections[i].match(/m\.([A-Z][a-zA-Z0-9]+Component)/);
            if (componentMatch) {
                const component = componentMatch[1];
                if (resolverMapping[component]) {
                    const resolver = resolverMapping[component];
                    // Example output: resolve: { item: () => import('./core/resolvers/site.resolver').then(m => m.siteResolver) },
                    const resolveLine = `resolve: { item: () => import('./core/resolvers/${resolver.file}').then(m => m.${resolver.name}) },\n                        `;
                    sections[i - 1] = prevSection + resolveLine;
                }
            }
        }
    }
}

content = sections.join('loadComponent: () =>');

fs.writeFileSync('src/app/app.routes.ts', content, 'utf8');
console.log('Routes strictly updated with lazy loaded resolvers for :id paths!');
