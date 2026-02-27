// TODO
[x] 0. Se rassurer que les éditions et les détails affichent les données
[ ] 1. Créer les services pour chaque module et Passer au httpresource
[ ] 2. Migrer les modules concerné(detail et edit) vers les ComponentInputBinding et prendre en compte les route resolve au niveau du routeur(nomme la variable item). par exemple dans le composant src\app\features\admin\site-detail.component.ts
remplacer site = signal<Site | null>(null);
par item = input<Site | null>(null);
[ ] 3. Revoir le breacumb
