import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { from } from 'rxjs';
import { db } from '../db/sgi-database';
import { seedDatabase } from '../db/seed-data';

let seeded = false;

async function ensureSeeded() {
    if (!seeded) {
        await seedDatabase();
        seeded = true;
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

function ok(body: unknown) {
    return new HttpResponse({ status: 200, body });
}

function created(body: unknown) {
    return new HttpResponse({ status: 201, body });
}

function routeNotFound(msg = 'Not Found'): Promise<any> {
    return Promise.reject(new HttpErrorResponse({ status: 404, error: { error: msg }, statusText: msg }));
}
function notFound(msg = 'Not Found'): Promise<any> {
    return Promise.reject(new HttpErrorResponse({ status: 404, error: { error: msg }, statusText: msg }));
}

export const fakeBackendInterceptor: HttpInterceptorFn = (req, next) => {
    const url = req.url;
    const method = req.method;

    if (!url.startsWith('/api/')) {
        return next(req);
    }

    return from(handleRoute());

    async function handleRoute() {
        await ensureSeeded();
        await delay(100 + Math.random() * 150);

        // ── AUTH ──
        if (url === '/api/auth/login' && method === 'POST') return handleLogin();

        // ── SITES ──
        if (url === '/api/sites' && method === 'GET')
            return ok(await db.sites.filter((s) => s.actif).toArray());
        if (url.match(/^\/api\/sites\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.sites, extractId(url), 'site_id');

        // ── PATIENTS ──
        if (url === '/api/patients' && method === 'GET')
            return ok(await db.patients.filter((p) => !p.deleted_at).toArray());
        if (url === '/api/patients' && method === 'POST')
            return handleCreate(db.patients, req.body, 'patient_id');
        if (url.match(/^\/api\/patients\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.patients, extractId(url), 'patient_id');
        if (url.match(/^\/api\/patients\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.patients, extractId(url), req.body, 'patient_id');

        // ── TRACING VOL ──
        if (url === '/api/tracing-vol' && method === 'GET')
            return ok(await db.tracing_vol.toArray());
        if (url === '/api/tracing-vol' && method === 'POST')
            return handleCreate(db.tracing_vol, req.body, 'tracing_id');
        if (url.match(/^\/api\/tracing-vol\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.tracing_vol, extractId(url), 'tracing_id');
        if (url.match(/^\/api\/tracing-vol\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.tracing_vol, extractId(url), req.body, 'tracing_id');
        if (url.match(/^\/api\/tracing-vol\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.tracing_vol, extractId(url));

        // ── CONSULTATIONS ──
        if (url === '/api/consultations' && method === 'GET')
            return ok(await db.consultations.toArray());
        if (url === '/api/consultations' && method === 'POST')
            return handleCreate(db.consultations, req.body, 'consultation_id');
        if (url.match(/^\/api\/consultations\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.consultations, extractId(url), 'consultation_id');
        if (url.match(/^\/api\/consultations\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.consultations, extractId(url), req.body, 'consultation_id');
        if (url.match(/^\/api\/consultations\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.consultations, extractId(url));

        // ── ORIENTATIONS ──
        if (url === '/api/orientations' && method === 'GET')
            return ok(await db.orientations.toArray());
        if (url === '/api/orientations' && method === 'POST')
            return handleCreate(db.orientations, req.body, 'orientation_id');
        if (url.match(/^\/api\/orientations\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.orientations, extractId(url), req.body, 'orientation_id');

        // ── APPELS REGULATION ──
        if (url === '/api/appels-regulation' && method === 'GET')
            return ok(await db.appels_regulation.toArray());
        if (url === '/api/appels-regulation' && method === 'POST')
            return handleCreate(db.appels_regulation, req.body, 'appel_id');
        if (url.match(/^\/api\/appels-regulation\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.appels_regulation, extractId(url), req.body, 'appel_id');
        if (url.match(/^\/api\/appels-regulation\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.appels_regulation, extractId(url), 'appel_id');
        if (url.match(/^\/api\/appels-regulation\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.appels_regulation, extractId(url));

        // ── PRISES EN CHARGE ──
        if (url === '/api/prises-en-charge' && method === 'GET')
            return ok(await db.prises_en_charge.toArray());
        if (url === '/api/prises-en-charge' && method === 'POST')
            return handleCreate(db.prises_en_charge, req.body, 'pec_id');
        if (url.match(/^\/api\/prises-en-charge\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.prises_en_charge, extractId(url), 'pec_id');
        if (url.match(/^\/api\/prises-en-charge\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.prises_en_charge, extractId(url), req.body, 'pec_id');
        if (url.match(/^\/api\/prises-en-charge\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.prises_en_charge, extractId(url));

        // ── LITS ──
        if (url === '/api/categories-lit' && method === 'GET')
            return ok(await db.categories_lit.filter((c) => c.actif).toArray());
        if (url === '/api/lits' && method === 'GET')
            return ok(await db.lits.toArray());
        if (url.match(/^\/api\/lits\/site\/[\w-]+$/) && method === 'GET') {
            const siteId = extractId(url);
            return ok(await db.lits.where('site_id').equals(siteId).toArray());
        }
        if (url.match(/^\/api\/lits\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.lits, extractId(url), req.body, 'lit_id');

        // ── OCCUPATIONS LIT ──
        if (url === '/api/occupations-lit' && method === 'GET')
            return ok(await db.occupations_lit.toArray());
        if (url === '/api/occupations-lit' && method === 'POST')
            return handleCreate(db.occupations_lit, req.body, 'occupation_id');

        // ── STOCKS ──
        if (url === '/api/catalogue-produits' && method === 'GET')
            return ok(await db.catalogue_produits.filter((p) => p.actif).toArray());
        if (url === '/api/stocks' && method === 'GET')
            return ok(await db.stocks.toArray());
        if (url.match(/^\/api\/stocks\/site\/[\w-]+$/) && method === 'GET') {
            const siteId = extractId(url);
            return ok(await db.stocks.where('site_id').equals(siteId).toArray());
        }
        if (url.match(/^\/api\/stocks\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.stocks, extractId(url), req.body, 'stock_id');
        if (url.match(/^\/api\/stocks\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.stocks, extractId(url), 'stock_id');
        if (url.match(/^\/api\/stocks\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.stocks, extractId(url));

        // ── CONSOMMATIONS STOCK ──
        if (url === '/api/consommations-stock' && method === 'POST')
            return handleCreate(db.consommations_stock, req.body, 'conso_id');

        // ── ALERTES ──
        if (url === '/api/alertes' && method === 'GET')
            return ok(await db.alertes.toArray());
        if (url === '/api/alertes' && method === 'POST')
            return handleCreate(db.alertes, req.body, 'alerte_id');
        if (url.match(/^\/api\/alertes\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.alertes, extractId(url), req.body, 'alerte_id');
        if (url.match(/^\/api\/alertes\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.alertes, extractId(url), 'alerte_id');
        if (url.match(/^\/api\/alertes\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.alertes, extractId(url));

        // ── NOTIFICATIONS ──
        if (url === '/api/notifications' && method === 'GET')
            return ok(await db.notifications.toArray());

        // ── UTILISATEURS ──
        if (url === '/api/utilisateurs' && method === 'GET')
            return ok(await db.utilisateurs.toArray());
        if (url === '/api/utilisateurs' && method === 'POST')
            return handleCreate(db.utilisateurs, req.body, 'user_id');
        if (url.match(/^\/api\/utilisateurs\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.utilisateurs, extractId(url), req.body, 'user_id');
        if (url.match(/^\/api\/utilisateurs\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.utilisateurs, extractId(url), 'user_id');
        if (url.match(/^\/api\/utilisateurs\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.utilisateurs, extractId(url));

        // ── ROLES ──
        if (url === '/api/roles' && method === 'GET')
            return ok(await db.roles.filter((r) => r.actif).toArray());

        // ── VACCINATIONS ──
        if (url === '/api/vaccinations' && method === 'GET')
            return ok(await db.vaccinations.toArray());
        if (url === '/api/vaccinations' && method === 'POST')
            return handleCreate(db.vaccinations, req.body, 'vaccination_id');
        if (url.match(/^\/api\/vaccinations\/[\w-]+$/) && method === 'GET')
            return handleGetById(db.vaccinations, extractId(url), 'vaccination_id');
        if (url.match(/^\/api\/vaccinations\/[\w-]+$/) && method === 'PUT')
            return handleUpdate(db.vaccinations, extractId(url), req.body, 'vaccination_id');
        if (url.match(/^\/api\/vaccinations\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.vaccinations, extractId(url));

        // ── PATIENTS DELETE ──
        if (url.match(/^\/api\/patients\/[\w-]+$/) && method === 'DELETE')
            return handleDelete(db.patients, extractId(url));

        // ── DASHBOARD ──
        if (url === '/api/dashboard/stats' && method === 'GET')
            return handleDashboardStats();

        return routeNotFound(`Route not found: ${method} ${url}`);
    }

    function extractId(u: string): string {
        return u.split('/').pop()!;
    }

    async function handleLogin() {
        const { login, password } = req.body as { login: string; password: string };
        const user = await db.utilisateurs.where('login').equals(login).first();
        if (!user || !user.actif) {
            return new HttpResponse({ status: 401, body: { error: 'Identifiants invalides' } });
        }
        if (!password) {
            return new HttpResponse({ status: 401, body: { error: 'Mot de passe requis' } });
        }
        const role = await db.roles.get(user.role_id);
        const site = user.site_principal_id
            ? await db.sites.get(user.site_principal_id)
            : null;
        const token = btoa(
            JSON.stringify({
                user_id: user.user_id,
                role: role?.code_role,
                exp: Date.now() + 8 * 3600 * 1000,
            })
        );
        return ok({
            token,
            user: { ...user, password_hash: undefined },
            role,
            site,
        });
    }

    async function handleGetById(table: any, id: string, _key: string) {
        const item = await table.get(id);
        return item ? ok(item) : notFound(`Record "${id}" not found`);
    }

    async function handleCreate(table: any, body: any, key: string) {
        if (!body[key]) body[key] = crypto.randomUUID();
        if (!body.created_at) body.created_at = new Date().toISOString();
        await table.add(body);
        return created(body);
    }

    async function handleUpdate(table: any, id: string, body: any, _key: string) {
        const existing = await table.get(id);
        if (!existing) return notFound();
        const updated = { ...existing, ...body };
        await table.put(updated);
        return ok(updated);
    }

    async function handleDelete(table: any, id: string) {
        const existing = await table.get(id);
        if (!existing) return notFound();
        await table.delete(id);
        return ok({ deleted: true });
    }

    async function handleDashboardStats() {
        const [sites, consultations, alertes, lits, pecs] = await Promise.all([
            db.sites.filter((s) => s.actif).toArray(),
            db.consultations.toArray(),
            db.alertes.toArray(),
            db.lits.toArray(),
            db.prises_en_charge.toArray(),
        ]);
        const activeAlerts = alertes.filter((a) => a.statut === 'ACTIVE');
        const totalC = consultations.length;
        const totalE = consultations.filter((c) => c.decision === 'EVACUATION_FOSA').length;
        const totalLits = lits.filter((l) => l.statut !== 'HORS_SERVICE').length;
        const litsOcc = lits.filter((l) => l.statut === 'OCCUPE').length;
        const fosaSites = sites.filter((s) => s.type_site === 'FOSA');

        return ok({
            total_consultations: totalC,
            total_evacuations: totalE,
            total_hospitalisations: pecs.length,
            taux_evacuation: totalC > 0 ? ((totalE / totalC) * 100).toFixed(1) : '0',
            taux_occupation_lits: totalLits > 0 ? ((litsOcc / totalLits) * 100).toFixed(1) : '0',
            lits_total: totalLits,
            lits_occupes: litsOcc,
            lits_libres: totalLits - litsOcc,
            alertes_actives: activeAlerts.length,
            alertes_niveau1: activeAlerts.filter((a) => a.niveau === 1).length,
            alertes_niveau2: activeAlerts.filter((a) => a.niveau === 2).length,
            alertes_niveau3: activeAlerts.filter((a) => a.niveau === 3).length,
            sites_actifs: sites.length,
            fosa_sites: fosaSites.map((s) => ({
                site_id: s.site_id,
                nom: s.nom,
                capacite_lits: s.capacite_lits,
                lits_occupes: s.lits_occupes,
                taux: s.capacite_lits > 0 ? ((s.lits_occupes / s.capacite_lits) * 100).toFixed(1) : '0',
            })),
        });
    }
};
