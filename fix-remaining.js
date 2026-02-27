const fs = require('fs');

// Details
const detailFiles = [
    { path: 'src/app/features/psf/voyageur-detail.component.ts', model: 'Patient', sig: 'voyageur' },
    { path: 'src/app/features/pma/consultation-detail.component.ts', model: 'Consultation', sig: 'consultation' },
    { path: 'src/app/features/fosa/laboratoire-detail.component.ts', model: 'ResultatLabo', sig: 'demande' },
    { path: 'src/app/features/alertes/alerte-detail.component.ts', model: 'Alerte', sig: 'alerte' },
    { path: 'src/app/features/admin/vaccination-detail.component.ts', model: 'Vaccination', sig: 'vaccination' },
    { path: 'src/app/features/admin/role-detail.component.ts', model: 'Role', sig: 'role' }
];

for (const d of detailFiles) {
    if (fs.existsSync(d.path)) {
        let content = fs.readFileSync(d.path, 'utf8');
        content = content.replace(/const id = this\.id\(\)!;/, '');
        content = content.replace(new RegExp(`this\\.http\\.get<${d.model}>[^)]+\\)\\.subscribe[^;]+;`), '');
        fs.writeFileSync(d.path, content);
    }
}

// Forms
const formFiles = [
    'src/app/features/psf/voyageur-form.component.ts',
    'src/app/features/psf/criblage-form.component.ts',
    'src/app/features/fosa/laboratoire-form.component.ts',
    'src/app/features/admin/vaccination-form.component.ts',
    'src/app/features/admin/catalogue-form.component.ts',
    'src/app/features/admin/alerte-config-form.component.ts'
];

for (const f of formFiles) {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');

        // Most forms just need the trailing }); removed at the end of ngOnInit
        content = content.replace(/if \([^)]+\) \{\s*this\.form\.(?:patchValue|value) = \{[^}]+\};\s*this\.cdr\.markForCheck\(\);\s*\}\);\s*\}\s*\}/, (match) => {
            return match.replace(/\}\);\s*\}\s*\}/, '} } }');
        });

        // Special fixes for voyageur-form (implicit any and two trailing });)
        if (f.includes('voyageur-form')) {
            content = content.replace('const actives = v.filter((x) => x.actif);', 'const actives = v.filter((x: any) => x.actif);');
            content = content.replace('actives.forEach((vax) => {', 'actives.forEach((vax: any) => {');
            content = content.replace(/\s*\}\);\s*\}\s*\}/g, '\n      }\n    }\n  }');
        }

        // Special fix for criblage-form
        if (f.includes('criblage-form')) {
            content = content.replace(/patient_id: this\.id\(\),/g, 'patient_id: this.item()?.patient_id || \'\',');
            content = content.replace(/\s*\}\);\s*\}\s*\}/g, '\n      }\n    }\n  }');
        }

        // Special fix for laboratoire-form
        if (f.includes('laboratoire-form')) {
            content = content.replace(/\s*\}\);\s*\}\s*\}/g, '\n      }\n    }\n  }');
        }

        // Special fix for vaccination-form
        if (f.includes('vaccination-form')) {
            content = content.replace(/\s*\}\);\s*\}\s*\}/g, '\n      }\n    }\n  }');
        }

        // Special fix for catalogue-form
        if (f.includes('catalogue-form')) {
            content = content.replace(/\s*\}\);\s*\}\s*\}/g, '\n      }\n    }\n  }');
        }

        // Special fix for alerte-config-form
        if (f.includes('alerte-config-form')) {
            content = content.replace(/\s*\}\);\s*\}\s*\}/g, '\n      }\n    }\n  }');
        }

        fs.writeFileSync(f, content);
    }
}
console.log('Fixed remaining forms and details!');
