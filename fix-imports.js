const fs = require('fs');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + '/' + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
        } else {
            if (file.endsWith('.component.ts')) {
                arrayOfFiles.push(dirPath + '/' + file);
            }
        }
    });
    return arrayOfFiles;
}

const files = getAllFiles('d:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/features');
let changedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    if (content.match(/id = input/)) {
        // Only look at the import statement for @angular/core
        content = content.replace(/import \{([^}]+)\} from '@angular\/core';/, (match, p1) => {
            let imports = p1.split(',').map(s => s.trim());
            if (!imports.includes('input')) {
                imports.push('input');
            }
            return "import { " + imports.join(', ') + " } from '@angular/core';";
        });
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed imports in:', file);
        changedCount++;
    }
}
console.log('Total fixed:', changedCount);
