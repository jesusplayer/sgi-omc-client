const fs = require('fs');

// 1. Alerte config detail
{
    const file = 'src/app/features/admin/alerte-config-detail.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/this\.loadConfig\(c\.config_id\);/, 'window.location.reload();');
    fs.writeFileSync(file, content);
}

// 2. Criblage form
{
    const file = 'src/app/features/psf/criblage-form.component.ts';
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const patientId = this\.id\(\) \?\? null;/, 'const patientId = this.item()?.patient_id ?? null;');
    fs.writeFileSync(file, content);
}

// 3. Voyageur form
{
    const file = 'src/app/features/psf/voyageur-form.component.ts';
    let content = fs.readFileSync(file, 'utf8');

    // Restore the correct http get for vaccinations that got mangled by the previous replace script
    content = content.replace(/const v = this\.item\(\);\s*if \(v\) \{\s*const actives = v\.filter\(\(x: any\) => x\.actif\);\s*this\.vaccinations\.set\(actives\);\s*actives\.forEach\(\(vax: any\) => \{\s*if \(!\(vax\.libelle in this\.vaccinsState\)\) \{\s*this\.vaccinsState\[vax\.libelle\] = false;\s*\}\s*\}\);\s*\}\);/,
        `this.http.get<Vaccination[]>('/api/vaccinations').subscribe((v) => {
      const actives = v.filter((x: any) => x.actif);
      this.vaccinations.set(actives);
      actives.forEach((vax: any) => {
        if (!(vax.libelle in this.vaccinsState)) {
          this.vaccinsState[vax.libelle] = false;
        }
      });
    });`);

    fs.writeFileSync(file, content);
}

console.log('Fixed the last 3 files!');
