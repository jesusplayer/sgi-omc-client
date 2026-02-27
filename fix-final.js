const fs = require('fs');

// 1. Alerte config detail
{
    const file = 'src/app/features/admin/alerte-config-detail.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/this\.http\.get[^;]+;\s*\}\);/, '');
    content = content.replace(/private loadConfig[^}]+\}/, '');
    content = content.replace(/this\.loadConfig\(id\);/, '// loaded by resolver');
    fs.writeFileSync(file, content);
}

// 2. Forms with missing }); in onSubmit
const formsToFix = [
    'src/app/features/admin/alerte-config-form.component.ts',
    'src/app/features/admin/catalogue-form.component.ts',
    'src/app/features/admin/vaccination-form.component.ts',
    'src/app/features/fosa/laboratoire-form.component.ts',
    'src/app/features/psf/voyageur-form.component.ts',
    'src/app/features/psf/criblage-form.component.ts'
];
for (const f of formsToFix) {
    let content = fs.readFileSync(f, 'utf8');
    // In `onSubmit()`, we had `this.http.post(...).subscribe(() => {\n this.router.navigate(...);\n }` instead of `});`
    // And same for `voyageur-form`, it ends with `error: ... \n } \n } \n }` instead of `}); \n } \n }`
    content = content.replace(/this\.router\.navigate\(\['[^']+']\);\s*\}\s*\}\s*\}/g, (match) => {
        return match.replace(/\}\s*\}\s*\}$/, '});\n    }\n  }');
    });
    // for voyageur form it has error block
    content = content.replace(/this\.error\.set\('Erreur lors de l\\'enregistrement'\);\s*\},?\s*\}\s*\}\s*\}/, "this.error.set('Erreur lors de l\\'enregistrement');\n      }\n    });\n  }\n}");
    // for criblage form
    content = content.replace(/error: \(\) => this\.saving\.set\(false\),?\s*\}\s*\}\s*\}/, "error: () => this.saving.set(false)\n    });\n  }\n}");

    fs.writeFileSync(f, content);
}

// 3. Alerte detail (computed mutation)
{
    const file = 'src/app/features/alertes/alerte-detail.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    // replace this.alerte.set(updated) with window.location.reload()
    content = content.replace(/this\.alerte\.set\(updated\)/g, 'window.location.reload()');
    fs.writeFileSync(file, content);
}

// 4. Criblage form (patient_id: this.id())
{
    const file = 'src/app/features/psf/criblage-form.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/patient_id: this\.id\(\),/g, "patient_id: this.item()?.patient_id || '',");
    fs.writeFileSync(file, content);
}

// 5. Voyageur detail (id not found)
{
    const file = 'src/app/features/psf/voyageur-detail.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const t = all\.find\(\(x\) => x\.patient_id === id\);/, "const id = this.item()?.patient_id;\n            const t = all.find((x) => x.patient_id === id);");
    fs.writeFileSync(file, content);
}

console.log('Final fixes applied!');
