const fs = require('fs');
const files = [
    'd:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/features/admin/vaccination-form.component.ts',
    'd:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/features/fosa/laboratoire-form.component.ts',
    'd:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/features/psf/voyageur-form.component.ts',
    'd:/DD/FASSI/COUVERTURE SANITAIRE SGI/SGI/src/app/features/regulation/orientation-form.component.ts'
];
for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log('Not found:', file);
        continue;
    }
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Add import if missing
    if (!content.includes('ChangeDetectorRef')) {
        content = content.replace(
            /import \{ Component, inject, signal, OnInit, ChangeDetectionStrategy \} from '@angular\/core';/,
            "import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';"
        );
    }

    // Inject cdr if missing
    if (!content.includes('private cdr = inject(ChangeDetectorRef);')) {
        content = content.replace(
            /(isEdit\s*=\s*signal\(false\);)/,
            "$1\n    private cdr = inject(ChangeDetectorRef);"
        );
    }

    // Add markForCheck
    if (file.includes('vaccination-form') && !content.includes('cdr.markForCheck')) {
        content = content.replace(
            /(this\.form = \{ libelle:[^}]+\};)/,
            "$1\n                this.cdr.markForCheck();"
        );
    }
    if (file.includes('laboratoire-form') && !content.includes('cdr.markForCheck')) {
        content = content.replace(
            /(this\.form\.datetime_resultat = res\.datetime_resultat\.slice\(0,\s*16\);)/,
            "$1\n                this.cdr.markForCheck();"
        );
    }
    if (file.includes('voyageur-form') && !content.includes('cdr.markForCheck')) {
        content = content.replace(
            /(this\.form = \{[\s\S]*?\}\);)/,
            "$1\n            this.cdr.markForCheck();"
        );
    }
    if (file.includes('orientation-form') && !content.includes('cdr.markForCheck')) {
        content = content.replace(
            /(this\.form = \{ \.\.\.o \};)/,
            "$1\n                this.cdr.markForCheck();"
        );
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
    } else {
        console.log('No changes needed or matched for:', file);
    }
}
