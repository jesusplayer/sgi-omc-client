const fs = require('fs');
const path = require('path');

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
        if (!content.includes(' input ') && !content.includes(', input,') && !content.includes('{ input') && !content.includes('input,')) {
            content = content.replace(/import \{([^}]+)\} from '@angular\/core';/, (match, p1) => {
                return "import { " + p1.trim() + ", input } from '@angular/core';";
            });
        }
    }

    // Type errors: this.id() assigned to something that expects string | null
    // We can just append ?? null, e.g. this.configId = this.id() ?? null;
    content = content.replace(/=\s*this\.id\(\);/g, '= this.id() ?? null;');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed imports/types in:', file);
        changedCount++;
    }
}
console.log('Total fixed:', changedCount);
