const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.component.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const files = getAllFiles('d:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/features');
let changedFiles = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // If it uses ActivatedRoute, migrate to input binding
    if (content.match(/ActivatedRoute/)) {
        // Add input import if missing
        if (!content.includes(' input ') && !content.match(/,\s*input\s*[,}]/) && !content.match(/{\s*input\s*[,}]/)) {
            content = content.replace(/import \{.*?\} from '@angular\/core';/, (match) => {
                return match.replace('}', ', input }');
            });
        }

        // Replace: private route = inject(ActivatedRoute); -> id = input<string>();
        content = content.replace(/private route\s*=\s*inject\(ActivatedRoute\);/g, 'id = input<string>();');

        // Replace traditional constructor injection
        content = content.replace(/constructor\([^)]*private route: ActivatedRoute[^)]*\)\s*{[^}]*}/g, 'id = input<string>();');

        // Replace: const id = this.route.snapshot.paramMap.get('id'); -> const id = this.id();
        // Sometimes it's this.route.snapshot.paramMap.get('id')
        content = content.replace(/const\s+id\s*=\s*this\.route\.snapshot\.paramMap\.get\('id'\);/g, 'const id = this.id();');

        // Replace: this.route.snapshot.paramMap.get('id') -> this.id()
        content = content.replace(/this\.route\.snapshot\.paramMap\.get\('id'\)/g, 'this.id()');

        // If 'ActivatedRoute' is no longer used, remove its import
        if (!content.includes('route.') && !content.includes('route:')) {
            content = content.replace(/,\s*ActivatedRoute/, '');
            content = content.replace(/ActivatedRoute\s*,\s*/, '');
            content = content.replace(/import\s*\{\s*ActivatedRoute\s*\}\s*from\s*'@angular\/router';\s*/, '');
        }

        if (content !== original) {
            fs.writeFileSync(file, content);
            console.log('Migrated:', file);
            changedFiles++;
        }
    }
}
console.log('Total files migrated:', changedFiles);
