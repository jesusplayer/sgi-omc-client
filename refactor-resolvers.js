const fs = require('fs');

let content = fs.readFileSync('src/app/app.routes.ts', 'utf8');

const resolverToEndpoint = {
    'siteResolver': '/api/sites',
    'voyageurResolver': '/api/patients', // assuming voyageurs are fetched from patients api
    'criblageResolver': '/api/tracing-vol',
    'consultationResolver': '/api/consultations',
    'admissionResolver': '/api/prises-en-charge',
    'laboratoireResolver': '/api/resultats-labo',
    'stockResolver': '/api/stocks',
    'orientationResolver': '/api/orientations',
    'appelResolver': '/api/appels-regulation',
    'vaccinationResolver': '/api/vaccinations',
    'roleResolver': '/api/roles',
    'alerteResolver': '/api/alertes',
    'alerteConfigResolver': '/api/configurations-alerte',
    'catalogueResolver': '/api/catalogue-produits',
    'litResolver': '/api/lits',
    'categorieLitResolver': '/api/categories-lit'
};

// Remove old imports
for (const resolver of Object.keys(resolverToEndpoint)) {
    const regex = new RegExp(`import\\s+\\{\\s*${resolver}\\s*\\}\\s+from\\s+'\\./core/resolvers/[^']+';\\n*`, 'g');
    content = content.replace(regex, '');
}

// Ensure genericResolver is imported
if (!content.includes('genericResolver')) {
    const lastImportIndex = content.lastIndexOf("import {");
    const nextNewLine = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, nextNewLine + 1) + "import { genericResolver } from './core/resolvers/generic.resolver';\n" + content.slice(nextNewLine + 1);
}

// Replace route configuration resolves
// Matches `resolve: { item: siteResolver }`
const resolveRegex = /resolve:\s*\{\s*item:\s*([a-zA-Z]+Resolver)\s*\}/g;

content = content.replace(resolveRegex, (match, resolverName) => {
    const endpoint = resolverToEndpoint[resolverName];
    if (endpoint) {
        return `resolve: { item: genericResolver('${endpoint}') }`;
    }
    return match;
});

fs.writeFileSync('src/app/app.routes.ts', content, 'utf8');
console.log('app.routes.ts successfully updated with genericResolver.');
