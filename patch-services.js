const fs = require('fs');
const path = require('path');
const dir = 'src/app/core/services';
let count = 0;
fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.service.ts')) {
        const fullPath = path.join(dir, file);
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes("('/api/")) {
            content = content.replace("('/api/", "(() => '/api/");
            fs.writeFileSync(fullPath, content);
            count++;
        }
    }
});
console.log('Fixed ' + count + ' files.');
