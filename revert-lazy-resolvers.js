const fs = require('fs');

let content = fs.readFileSync('src/app/app.routes.ts', 'utf8');

// First, find all lazy loaded resolvers and extract their names and file paths
const regex = /resolve:\s*\{\s*item:\s*\(\)\s*=>\s*import\('\.\/core\/resolvers\/([^']+)'\)\.then\(m\s*=>\s*m\.([a-zA-Z0-9_]+)\)\s*\}/g;

const importsNeeded = new Map();

let match;
while ((match = regex.exec(content)) !== null) {
    const file = match[1];
    const name = match[2];
    importsNeeded.set(name, file);
}

// Generate the static import statements
let newImports = '';
for (const [name, file] of importsNeeded.entries()) {
    newImports += `import { ${name} } from './core/resolvers/${file}';\n`;
}

// Insert the new imports after the existing imports
const lastImportIndex = content.lastIndexOf("import {");
const nextNewLine = content.indexOf('\n', lastImportIndex);
content = content.slice(0, nextNewLine + 1) + newImports + content.slice(nextNewLine + 1);

// Replace the lazy loaded resolvers with static references
content = content.replace(regex, (match, file, name) => {
    return `resolve: { item: ${name} }`;
});

fs.writeFileSync('src/app/app.routes.ts', content, 'utf8');
console.log('Successfully reverted to static resolver imports.');
