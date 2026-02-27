const fs = require('fs');

const detailMapping = [
    { file: 'src/app/features/stocks/stock-detail.component.ts', sig: 'stock', load: 'loadStock' },
    { file: 'src/app/features/regulation/orientation-detail.component.ts', sig: 'orientation', load: 'loadOrientation' },
    { file: 'src/app/features/regulation/appel-detail.component.ts', sig: 'appel', load: 'loadAppel' },
    { file: 'src/app/features/psf/voyageur-detail.component.ts', sig: 'voyageur', load: 'loadPatient' }, // might be loadPatient or loadVoyageur, fallback below
    { file: 'src/app/features/pma/consultation-detail.component.ts', sig: 'consultation', load: 'loadConsultation' },
    { file: 'src/app/features/fosa/laboratoire-detail.component.ts', sig: 'demande', load: 'loadDemande' },
    { file: 'src/app/features/fosa/admission-detail.component.ts', sig: 'admission', load: 'loadAdmission' },
    { file: 'src/app/features/alertes/alerte-detail.component.ts', sig: 'alerte', load: 'loadAlerte' },
    { file: 'src/app/features/admin/vaccination-detail.component.ts', sig: 'vaccination', load: 'loadVaccination' },
    { file: 'src/app/features/admin/role-detail.component.ts', sig: 'role', load: 'loadRole' },
    { file: 'src/app/features/admin/alerte-config-detail.component.ts', sig: 'config', load: 'loadConfig' }
];

const formMapping = [
    'src/app/features/regulation/orientation-form.component.ts',
    'src/app/features/psf/voyageur-form.component.ts',
    'src/app/features/psf/criblage-form.component.ts',
    'src/app/features/fosa/laboratoire-form.component.ts',
    'src/app/features/admin/vaccination-form.component.ts',
    'src/app/features/admin/lit-form.component.ts',
    'src/app/features/admin/categorie-lit-form.component.ts',
    'src/app/features/admin/catalogue-form.component.ts',
    'src/app/features/admin/alerte-config-form.component.ts'
];

for (const map of detailMapping) {
    if (fs.existsSync(map.file)) {
        let content = fs.readFileSync(map.file, 'utf8');
        content = content.replace(/id = input<string>\(\);/, 'item = input<any | null>(null);');
        content = content.replace(/id = input<string \| undefined>\(\);/, 'item = input<any | null>(null);');

        const sigRegex = new RegExp(`${map.sig}\\s*=\\s*signal<([^>]+)>\\([^)]+\\);`);
        content = content.replace(sigRegex, `${map.sig} = computed(() => this.item() as $1);`);

        if (!content.includes('computed,')) {
            content = content.replace(/import {([^}]+)} from '@angular\/core';/, "import { computed,$1} from '@angular/core';");
        }

        content = content.replace(new RegExp(`this\.${map.load}\\(id\\);?`), '// loaded by resolver');
        // some might use different load name like loadVoyageur instead of loadPatient
        content = content.replace(/this\.load[A-Za-z]+\(id\);?/, '// loaded by resolver');

        content = content.replace(/const id = this\.id\(\) \?\? null;/, 'const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;');

        fs.writeFileSync(map.file, content);
        console.log('Migrated detail: ' + map.file);
    }
}

for (const file of formMapping) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/id = input<string>\(\);/, 'item = input<any | null>(null);');
        content = content.replace(/id = input<string \| undefined>\(\);/, 'item = input<any | null>(null);');

        // Replace http.get subscribe
        const httpRegex = /this\.http\.get<[^>]+>\(`[^`]+`\)\.subscribe\(([^ \)]+)[^>]*=>\s*\{/g;
        content = content.replace(httpRegex, (match, varName) => {
            // e.g. "this.http.get<ConfigurationAlerte>(.../id).subscribe((c) => {" -> "const c = this.item(); if (c) {"
            return `const ${varName.replace(/[\(\)]/g, '')} = this.item();\n      if (${varName.replace(/[\(\)]/g, '')}) {`;
        });

        const httpRegex2 = /this\.http\.get<[^>]+>\([^)]+\)\.subscribe\(([^ \)]+)[^>]*=>\s*\{/g;
        content = content.replace(httpRegex2, (match, varName) => {
            return `const ${varName.replace(/[\(\)]/g, '')} = this.item();\n      if (${varName.replace(/[\(\)]/g, '')}) {`;
        });

        // Replace this.xyzId = this.id() ?? null;
        content = content.replace(/this\.([a-zA-Z0-9_]+Id) = this\.id\(\) \?\? null;/, (match, varName) => {
            return `this.${varName} = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;`;
        });

        // Replace const id = ...
        content = content.replace(/const id = this\.id\(\) \?\? null;/, 'const id = this.item() ? (this.item()?.id || this.item()?.config_id || this.item()?.patient_id || this.item()?.orientation_id) : null;');

        fs.writeFileSync(file, content);
        console.log('Migrated form: ' + file);
    }
}

console.log('Migration complete!');
