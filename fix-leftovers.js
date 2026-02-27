const fs = require('fs');

// 1. Fix appel-detail
{
    const file = 'src/app/features/regulation/appel-detail.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const id = this\.id\(\)!;/, '');
    content = content.replace(/this\.http\.get<AppelRegulation>[^)]+\)\.subscribe[^;]+;/, '');
    fs.writeFileSync(file, content);
}

// 2. Fix orientation-detail
{
    const file = 'src/app/features/regulation/orientation-detail.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/this\.http\.get<Orientation>[^)]+\)\.subscribe[^;]+;/, '');
    fs.writeFileSync(file, content);
}

// 3. Fix stock-detail
{
    const file = 'src/app/features/stocks/stock-detail.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const id = this\.id\(\)!;/, '');
    content = content.replace(/this\.http\.get<Stock>[^)]+\)\.subscribe[^;]+;/, '');
    fs.writeFileSync(file, content);
}

// 4. Fix admission-detail
{
    const file = 'src/app/features/fosa/admission-detail.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const id = this\.id\(\)!;/, '');
    content = content.replace(/this\.http\.get<PriseEnCharge>[^)]+\)\.subscribe[^;]+;/, '');
    fs.writeFileSync(file, content);
}

// 5. Fix orientation-form
{
    const file = 'src/app/features/regulation/orientation-form.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/if \(o\) \{\s*this\.form = \{ \.\.\.o \};\s*this\.cdr\.markForCheck\(\);\s*if \(o\.heure_decision\) [^}]+\s*if \(o\.heure_depart\) [^}]+\s*if \(o\.heure_arrivee_fosa\) [^}]+\s*\}\);\s*\}\s*\}/,
        `if (o) {
                this.form = { ...o };
                this.cdr.markForCheck();
                if (o.heure_decision) this.form.heure_decision = o.heure_decision.slice(0, 16);
                if (o.heure_depart) this.form.heure_depart = o.heure_depart.slice(0, 16);
                if (o.heure_arrivee_fosa) this.form.heure_arrivee_fosa = o.heure_arrivee_fosa.slice(0, 16);
            }
        }
    }`);
    fs.writeFileSync(file, content);
}

// 6. Fix categorie-lit-form
{
    const file = 'src/app/features/admin/categorie-lit-form.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/if \(c\) \{\s*this\.form = \{ \.\.\.c \};\s*this\.cdr\.markForCheck\(\);\s*\}\);\s*\}\s*\}/,
        `if (c) {
        this.form = { ...c };
        this.cdr.markForCheck();
      }
    }
  }`);
    fs.writeFileSync(file, content);
}

// 7. Fix lit-form (where sites and categories dropdowns got broken)
{
    const file = 'src/app/features/admin/lit-form.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    // the script mangled lines: "const res = this.item();\n      if (res) {\n      this.sites.set(...);\n    });"
    content = content.replace(/const res = this\.item\(\);\s*if \(res\) \{\s*this\.sites\.set\(res\.filter\(s => \['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'\]\.includes\(s\.type_site\)\)\);\s*\}\);/,
        `this.http.get<Site[]>('/api/sites').subscribe(res => {
      this.sites.set(res.filter(s => ['FOSA', 'PMA_HOTEL', 'PMA_PALAIS', 'PMA_HV'].includes(s.type_site)));
    });`);

    // Also fixing the bottom closure
    content = content.replace(/if \(l\) \{\s*this\.form = \{ \.\.\.l \};\s*this\.cdr\.markForCheck\(\);\s*\}\);\s*\}\s*\}/,
        `if (l) {
        this.form = { ...l };
        this.cdr.markForCheck();
      }
    }
  }`);
    fs.writeFileSync(file, content);
}

console.log('Fixed leftovers!');
