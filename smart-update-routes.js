const fs = require('fs');

let content = fs.readFileSync('src/app/app.routes.ts', 'utf8');

const resolverMapping = {
    'VoyageurFormComponent': 'voyageurResolver',
    'VoyageurDetailComponent': 'voyageurResolver',
    'CriblageFormComponent': 'voyageurResolver',
    'ConsultationFormComponent': 'consultationResolver',
    'ConsultationDetailComponent': 'consultationResolver',
    'AdmissionFormComponent': 'admissionResolver',
    'AdmissionDetailComponent': 'admissionResolver',
    'LaboratoireFormComponent': 'laboratoireResolver',
    'LaboratoireDetailComponent': 'laboratoireResolver',
    'StockDetailComponent': 'stockResolver',
    'OrientationFormComponent': 'orientationResolver',
    'OrientationDetailComponent': 'orientationResolver',
    'AppelFormComponent': 'appelResolver',
    'AppelDetailComponent': 'appelResolver',
    'VaccinationFormComponent': 'vaccinationResolver',
    'VaccinationDetailComponent': 'vaccinationResolver',
    'RoleFormComponent': 'roleResolver',
    'RoleDetailComponent': 'roleResolver',
    'AlerteDetailComponent': 'alerteResolver',
    'AlerteConfigFormComponent': 'alerteConfigResolver',
    'AlerteConfigDetailComponent': 'alerteConfigResolver',
    'CatalogueFormComponent': 'catalogueResolver',
    'LitFormComponent': 'litResolver',
    'CategorieLitFormComponent': 'categorieLitResolver'
};

const importPaths = {
    'voyageurResolver': './core/resolvers/voyageur.resolver',
    'consultationResolver': './core/resolvers/consultation.resolver',
    'admissionResolver': './core/resolvers/admission.resolver',
    'laboratoireResolver': './core/resolvers/laboratoire.resolver',
    'stockResolver': './core/resolvers/stock.resolver',
    'orientationResolver': './core/resolvers/orientation.resolver',
    'appelResolver': './core/resolvers/appel.resolver',
    'vaccinationResolver': './core/resolvers/vaccination.resolver',
    'roleResolver': './core/resolvers/role.resolver',
    'alerteResolver': './core/resolvers/alerte.resolver',
    'alerteConfigResolver': './core/resolvers/alerte-config.resolver',
    'catalogueResolver': './core/resolvers/catalogue.resolver',
    'litResolver': './core/resolvers/lit.resolver',
    'categorieLitResolver': './core/resolvers/categorie-lit.resolver'
};

const importsToAdd = new Set();

for (const [component, resolver] of Object.entries(resolverMapping)) {
    // Regex matches the route block that contains this component and ensures it matches :id
    // It looks for `data: { ... },` followed by `loadComponent:` but we'll try to find the `loadComponent` part and inject `resolve` before it, only if `:id` is in the path.
    // Let's use a simpler approach: Regex to find component name in app.routes.ts, then look backwards for the route object.

    // Replace:
    // data: { breadcrumb: 'XYZ' },
    // loadComponent: () => import(...).then((m) => m.ComponentName)

    // We want to insert `resolve: { item: resolver },` before `loadComponent`
    // but only if it's not already there.

    const componentRegex = new RegExp(`([^\\n]*loadComponent:[\\s\\S]*?m\\.${component})`, 'g');

    content = content.replace(componentRegex, (match) => {
        // If it already has a resolve block nearby, skip
        // Since we are matching from `loadComponent`, let's check the wider block? No, regex matches from `loadComponent` to `m.Component`. So we can't look back here.

        return match;
    });
}

// Better approach using a global regex for route blocks:
// Matches `{ ... loadComponent: ... m.ComponentName }`
// Actually, let's just do: regex to replace `loadComponent: () => import('...').then(m => m.ComponentName)`
// with `resolve: { item: resolverName },\n                        loadComponent: ...`
// if it's an `:id` route. Some components like CategorieLitFormComponent might be used for 'nouvelle' (no id).
// Wait, for 'nouveau' / 'nouvelle', resolver will receive null id, which might cause it to fail!
// Let's check `resolver` implementations. Do they handle `null` ID safely?
// `const id = route.paramMap.get('id'); return http.get(id)`
// If id is null, `http.get('/.../null')` will fail!
// We only want to add the resolver for `path: ':id/...` and `path: ':id'`.

// Let's iterate block by block.
// A block starts with `{` and ends with `},`
// We can use a simpler split by `loadComponent:`
let sections = content.split('loadComponent: () =>');

for (let i = 1; i < sections.length; i++) {
    // Look at previous section to see if path has ':id'
    const prevSection = sections[i - 1];
    const pathMatch = prevSection.match(/path:\s*'([^']+)'/g);
    // get the last path match in the previous section
    if (pathMatch && pathMatch.length > 0) {
        const lastPath = pathMatch[pathMatch.length - 1];
        if (lastPath.includes(':id') && !prevSection.includes('resolve: { item:')) {
            // Find which component this loads by looking at the start of sections[i]
            const componentMatch = sections[i].match(/m\.([A-Z][a-zA-Z0-9]+Component)/);
            if (componentMatch) {
                const component = componentMatch[1];
                if (resolverMapping[component]) {
                    const resolver = resolverMapping[component];
                    importsToAdd.add(resolver);
                    // insert resolve before the last closing brace/comma in prevSection, or simply append to prevSection 
                    // Actually, replace the trailing spaces
                    sections[i - 1] = prevSection + `resolve: { item: ${resolver} },\n                        `;
                }
            }
        }
    }
}

content = sections.join('loadComponent: () =>');

// Add imports
let importBlock = '';
for (const resolver of importsToAdd) {
    const importPath = importPaths[resolver];
    if (importPath && !content.includes(`import { ${resolver} }`)) {
        importBlock += `import { ${resolver} } from '${importPath}';\n`;
    }
}

content = importBlock + content;

fs.writeFileSync('src/app/app.routes.ts', content, 'utf8');
console.log('Routes strictly updated with resolvers for :id paths!');
