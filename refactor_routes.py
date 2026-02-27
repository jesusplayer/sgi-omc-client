import re

with open('src/app/app.routes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# I will just write a hard-coded set of replacements for the groups:
# 1. Regulation: orientations
# 2. Fosa: admissions
# 3. Fosa: laboratoire
# 4. Stocks: mouvements
# 5. Admin: utilisateurs
# 6. Admin: vaccinations
# 7. Admin: sites
# 8. Admin: categories-lits
# 9. Admin: lits
# 10. Admin: catalogue
# 11. Admin: alertes-config
# 12. Admin: roles
# 13. Admin: audit

groups = [
    {
        'parent_path': "path: 'orientations',",
        'parent_breadcrumb': "data: { breadcrumb: 'Orientations' },",
        'prefix': "orientations"
    },
    {
        'parent_path': "path: 'admissions',",
        'parent_breadcrumb': "data: { breadcrumb: 'Admissions' },",
        'prefix': "admissions"
    },
    {
        'parent_path': "path: 'laboratoire',",
        'parent_breadcrumb': "data: { breadcrumb: 'Laboratoire' },",
        'prefix': "laboratoire"
    },
    {
        'parent_path': "path: 'mouvements',",
        'parent_breadcrumb': "data: { breadcrumb: 'Mouvements' },",
        'prefix': "mouvements"
    },
    {
        'parent_path': "path: 'utilisateurs',",
        'parent_breadcrumb': "data: { breadcrumb: 'Utilisateurs' },",
        'prefix': "utilisateurs"
    },
    {
        'parent_path': "path: 'vaccinations',",
        'parent_breadcrumb': "data: { breadcrumb: 'Vaccinations' },",
        'prefix': "vaccinations"
    },
    {
        'parent_path': "path: 'sites',",
        'parent_breadcrumb': "data: { breadcrumb: 'Sites' },",
        'prefix': "sites"
    },
    {
        'parent_path': "path: 'categories-lits',",
        'parent_breadcrumb': "data: { breadcrumb: 'Catégories de Lits' },",
        'prefix': "categories-lits"
    },
    {
        'parent_path': "path: 'lits',",
        'parent_breadcrumb': "data: { breadcrumb: 'Lits' },",
        'prefix': "lits"
    },
    {
        'parent_path': "path: 'catalogue',",
        'parent_breadcrumb': "data: { breadcrumb: 'Catalogue Produits' },",
        'prefix': "catalogue"
    },
    {
        'parent_path': "path: 'alertes-config',",
        'parent_breadcrumb': "data: { breadcrumb: 'Règles d\\'alerte' },",
        'prefix': "alertes-config"
    },
    {
        'parent_path': "path: 'roles',",
        'parent_breadcrumb': "data: { breadcrumb: 'Rôles' },",
        'prefix': "roles"
    }
]

def refactor_groups(content, group):
    prefix = group['prefix']
    
    # Identify the parent block. It starts with { \n path: 'prefix', ... \n },
    pattern_parent = r"({\s*path: '" + prefix + r"',\s*data: { breadcrumb: '[^']+' },\s*loadComponent:[^}]+},\s*)"
    match = re.search(pattern_parent, content)
    if not match:
        return content
        
    parent_block = match.group(0)
    
    # Identify all children blocks. They start with { \n path: 'prefix/something' or 'prefix/:id', ... \n },
    pattern_children = r"({\s*path: '" + prefix + r"/([^']+)',[^}]+},?\s*)"
    children_matches = re.finditer(pattern_children, content)
    
    children_blocks = []
    for m in children_matches:
        child_block = m.group(1)
        # replace the path in child block
        child_path = m.group(2)
        new_child_block = re.sub(r"path: '" + prefix + r"/" + child_path + "'", f"path: '{child_path}'", child_block)
        children_blocks.append(new_child_block)
    
    if not children_blocks:
        return content

    # Transform parent block
    new_parent_content = re.sub(r"(path: '" + prefix + r"',\s*data: { breadcrumb: '[^']+' },)", r"\1\nchildren: [\n{path: '',\n" + re.search(r"(loadComponent:[\s\S]*?\)),", parent_block).group(1) + "\n},", parent_block)
    
    # Remove old children blocks
    for block in re.findall(pattern_children, content):
        content = content.replace(block[0], "")
        
    # Inject children blocks into the new parent block
    new_parent_content = new_parent_content.replace("},", "},\n" + "".join(children_blocks) + "\n]\n},")
    
    content = content.replace(parent_block, new_parent_content)
    
    return content

for g in groups:
    content = refactor_groups(content, g)

# Write back
with open('src/app/app.routes.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
