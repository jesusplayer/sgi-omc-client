const fs = require('fs');

let content = fs.readFileSync('src/app/app.routes.ts', 'utf16le');
if (content.includes('\0')) {
    // It is utf16le
} else {
    content = fs.readFileSync('src/app/app.routes.ts', 'utf8');
}

// Ensure unique static imports
const importsToAdd = new Set();

content = content.replace(/resolve:\s*\{\s*item:\s*\(\)\s*=>\s*import\('([^']+)'\)\.then\([^\)]+\)\s*\}/g, (match, importPath) => {
    // importPath looks like './core/resolvers/appel.resolver'
    // Extract resolver name: 'appelResolver'
    const parts = importPath.split('/');
    const fileName = parts[parts.length - 1]; // e.g., 'appel.resolver'
    const entityNameParts = fileName.split('.')[0].split('-');
    const camelCaseEntity = entityNameParts.map((p, i) => i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)).join('');
    const resolverName = camelCaseEntity + 'Resolver';

    importsToAdd.add(`import { ${resolverName} } from '${importPath}';`);
    return `resolve: { item: ${resolverName} }`;
});

// Now add imports at the beginning of the file assuming it has other imports
const newImports = Array.from(importsToAdd).join('\n');
content = newImports + '\n' + content;

fs.writeFileSync('src/app/app.routes.ts', content, 'utf8');
console.log('Resolvers statically imported in routing config!');
