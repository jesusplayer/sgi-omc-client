const fs = require('fs');

const path = 'src/app/app.routes.ts';
let content = fs.readFileSync(path, 'utf8');

const blocksToGroup = [
    { prefix: 'orientations', breadcrumb: 'Orientations' },
    { prefix: 'admissions', breadcrumb: 'Admissions' },
    { prefix: 'laboratoire', breadcrumb: 'Laboratoire' },
    { prefix: 'mouvements', breadcrumb: 'Mouvements' },
    { prefix: 'vaccinations', breadcrumb: 'Vaccinations' },
    { prefix: 'sites', breadcrumb: 'Sites' },
    { prefix: 'categories-lits', breadcrumb: 'Catégories de Lits' },
    { prefix: 'lits', breadcrumb: 'Lits' },
    { prefix: 'catalogue', breadcrumb: 'Catalogue Produits' },
    { prefix: 'alertes-config', breadcrumb: 'Règles d\\'alerte' },
];

blocksToGroup.forEach(group => {
    // We look for:
    //                    {
    //                        path: 'PREFIX',
    // ... until the next }, that aligns or we use a clever search.

    const lines = content.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    // Find the first line where path is exactly the prefix
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`path: '${group.prefix}',`)) {
            // Find the `{` before this
            let j = i;
            while (j >= 0 && !lines[j].includes('{')) j--;
            startIndex = j;
            break;
        }
    }

    if (startIndex === -1) {
        console.log(`Could not find start for ${group.prefix}`);
        return;
    }

    // Find the end index. It should gather all routes starting with prefix
    // Routes typically end with `                    },` at a specific indentation.
    // Let's just gather all routes that have `path: 'prefix...'`
    let gatheredRoutes = [];
    let currentRouteStart = -1;
    let insideRoute = false;
    let openBrackets = 0;

    for (let i = startIndex; i < lines.length; i++) {
        // Count brackets
        openBrackets += (lines[i].match(/\{/g) || []).length;
        openBrackets -= (lines[i].match(/\}/g) || []).length;

        if (openBrackets === 0 && lines[i].includes('}')) {
            // End of a route block in the array
            const routeContent = lines.slice(startIndex, i + 1).join('\n');
            if (routeContent.includes(`path: '${group.prefix}'`) || routeContent.includes(`path: '${group.prefix}/`)) {
                gatheredRoutes.push(routeContent);

                // Try to find the next route
                let j = i + 1;
                while (j < lines.length && !lines[j].includes('{')) j++;

                if (j < lines.length) {
                    const nextRouteIntro = lines.slice(i + 1, j + 5).join('\n');
                    if (nextRouteIntro.includes(`path: '${group.prefix}/`)) {
                        startIndex = j;
                        i = j - 1; // loop will increment
                        continue;
                    }
                }

                // If next route doesn't match prefix, we are done
                endIndex = i;
                break;
            }
        }
    }

    if (gatheredRoutes.length > 0) {
        // Reconstruct
        let newContent = `                    {
                        path: '${group.prefix}',
                        data: { breadcrumb: '${group.breadcrumb}' },
                        children: [`;

        gatheredRoutes.forEach(route => {
            // remove trailing comma if present except on last object property?
            // Actually just regex replace `path: 'prefix...'` -> `path: '...'`
            let modifiedRoute = route;
            // handle exact `'prefix'`
            modifiedRoute = modifiedRoute.replace(`path: '${group.prefix}',`, `path: '',`);
            // handle `'prefix/something'`
            modifiedRoute = modifiedRoute.replace(new RegExp(`path: '${group.prefix}/([^']+)',`), `path: '$1',`);
            newContent += '\n' + modifiedRoute + ',';

            // also remove from master content
            content = content.replace(route + ',', ''); // comma that follows the block
            content = content.replace(route, ''); // if no comma
        });

        newContent += `\n                        ]
                    }`;

        // Insert newContent where the original first route was
        // We will just do a string replace of the first gathered route
        content = content.replace('@@INSERT_HERE@@', newContent); // wait we already removed it
    }
});
