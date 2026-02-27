const fs = require('fs');

let content = fs.readFileSync('src/app/app.routes.ts', 'utf16le');
if (content.includes('\0')) {
    // It is utf16le
} else {
    content = fs.readFileSync('src/app/app.routes.ts', 'utf8');
}

const mapping = [
    // regulation -> appel
    { search: "path: ':id/editer',\n                        data: { breadcrumb: 'Modifier appel' },", replace: "resolve: { item: () => import('./core/resolvers/appel.resolver').then(m => m.appelResolver) }," },
    { search: "path: ':id',\n                        data: { breadcrumb: 'Détail appel' },", replace: "resolve: { item: () => import('./core/resolvers/appel.resolver').then(m => m.appelResolver) }," },

    // orientations
    { search: "path: 'orientations/:id/editer',\n                        data: { breadcrumb: 'Modifier orientation' },", replace: "resolve: { item: () => import('./core/resolvers/orientation.resolver').then(m => m.orientationResolver) }," },
    { search: "path: 'orientations/:id',\n                        data: { breadcrumb: 'Détail orientation' },", replace: "resolve: { item: () => import('./core/resolvers/orientation.resolver').then(m => m.orientationResolver) }," },

    // fosa / admission
    { search: "path: ':id/editer',\n                        data: { breadcrumb: 'Modifier admission' },", replace: "resolve: { item: () => import('./core/resolvers/admission.resolver').then(m => m.admissionResolver) }," },
    { search: "path: ':id',\n                        data: { breadcrumb: 'Détail admission' },", replace: "resolve: { item: () => import('./core/resolvers/admission.resolver').then(m => m.admissionResolver) }," },

    // laboratoire
    { search: "path: 'laboratoire/:id/editer',\n                        data: { breadcrumb: 'Saisir résultats' },", replace: "resolve: { item: () => import('./core/resolvers/laboratoire.resolver').then(m => m.laboratoireResolver) }," },
    { search: "path: 'laboratoire/:id',\n                        data: { breadcrumb: 'Détail Demande' },", replace: "resolve: { item: () => import('./core/resolvers/laboratoire.resolver').then(m => m.laboratoireResolver) }," },

    // coordination / sitrep
    { search: "path: 'sitrep/:id',\n                        data: { breadcrumb: 'Détail SITREP' },", replace: "resolve: { item: () => import('./core/resolvers/sitrep.resolver').then(m => m.sitrepResolver) }," },

    // stocks
    { search: "path: ':id',\n                        data: { breadcrumb: 'Détail stock' },", replace: "resolve: { item: () => import('./core/resolvers/stock.resolver').then(m => m.stockResolver) }," },

    // alertes
    { search: "path: ':id',\n                        data: { breadcrumb: 'Détail alerte' },", replace: "resolve: { item: () => import('./core/resolvers/alerte.resolver').then(m => m.alerteResolver) }," },

    // vaccinations
    { search: "path: 'vaccinations/:id/editer',\n                        data: { breadcrumb: 'Modifier vaccination' },", replace: "resolve: { item: () => import('./core/resolvers/vaccination.resolver').then(m => m.vaccinationResolver) }," },
    { search: "path: 'vaccinations/:id',\n                        data: { breadcrumb: 'Détail vaccination' },", replace: "resolve: { item: () => import('./core/resolvers/vaccination.resolver').then(m => m.vaccinationResolver) }," },

    // categories-lits
    { search: "path: 'categories-lits/:id/editer',\n                        data: { breadcrumb: 'Modifier Catégorie' },", replace: "resolve: { item: () => import('./core/resolvers/categorie-lit.resolver').then(m => m.categorieLitResolver) }," },

    // lits
    { search: "path: 'lits/:id/editer',\n                        data: { breadcrumb: 'Modifier Lit' },", replace: "resolve: { item: () => import('./core/resolvers/lit.resolver').then(m => m.litResolver) }," },

    // catalogue
    { search: "path: 'catalogue/:id/editer',\n                        data: { breadcrumb: 'Modifier Produit' },", replace: "resolve: { item: () => import('./core/resolvers/catalogue.resolver').then(m => m.catalogueResolver) }," },

    // alertes-config
    { search: "path: 'alertes-config/:id/editer',\n                        data: { breadcrumb: 'Modifier Règle' },", replace: "resolve: { item: () => import('./core/resolvers/alerte-config.resolver').then(m => m.alerteConfigResolver) }," },
    { search: "path: 'alertes-config/:id',\n                        data: { breadcrumb: 'Détail Règle' },", replace: "resolve: { item: () => import('./core/resolvers/alerte-config.resolver').then(m => m.alerteConfigResolver) }," },

    // roles
    { search: "path: 'roles/:id',\n                        data: { breadcrumb: 'Détail Rôle' },", replace: "resolve: { item: () => import('./core/resolvers/role.resolver').then(m => m.roleResolver) }," },

    // voyageur
    { search: "path: 'voyageurs/:id/editer',\n                        data: { breadcrumb: 'Modifier Voyageur' },", replace: "resolve: { item: () => import('./core/resolvers/voyageur.resolver').then(m => m.voyageurResolver) }," },
    { search: "path: 'voyageurs/:id',\n                        data: { breadcrumb: 'Détail Voyageur' },", replace: "resolve: { item: () => import('./core/resolvers/voyageur.resolver').then(m => m.voyageurResolver) }," }
];

for (const map of mapping) {
    content = content.replace(map.search, map.search + '\n                        ' + map.replace);
}

fs.writeFileSync('src/app/app.routes.ts', content, 'utf8');
console.log('Routes updated!');
