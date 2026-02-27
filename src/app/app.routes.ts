import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { genericResolver } from './core/resolvers/generic.resolver';

















export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login.component').then((m) => m.LoginComponent),
    },
    {
        path: '',
        loadComponent: () =>
            import('./layout/shell.component').then((m) => m.ShellComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                data: { breadcrumb: 'Tableau de bord' },
                loadComponent: () =>
                    import('./features/dashboard/dashboard.component').then(
                        (m) => m.DashboardComponent
                    ),
            },
            {
                path: 'psf',
                data: { breadcrumb: 'Criblage PSF' },
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/psf/voyageur-list.component').then(
                                (m) => m.VoyageurListComponent
                            ),
                    },
                    {
                        path: 'nouveau',
                        data: { breadcrumb: 'Nouveau voyageur' },
                        loadComponent: () =>
                            import('./features/psf/voyageur-form.component').then(
                                (m) => m.VoyageurFormComponent
                            ),
                    },
                    {
                        path: ':id/editer',
                        data: { breadcrumb: 'Modifier voyageur' },
                        resolve: { item: genericResolver('/api/patients') },
                        loadComponent: () =>
                            import('./features/psf/voyageur-form.component').then(
                                (m) => m.VoyageurFormComponent
                            ),
                    },
                    {
                        path: ':id/criblage',
                        data: { breadcrumb: 'Criblage médical' },
                        resolve: { item: genericResolver('/api/tracing-vol') },
                        loadComponent: () =>
                            import('./features/psf/criblage-form.component').then(
                                (m) => m.CriblageFormComponent
                            ),
                    },
                    {
                        path: ':id',
                        data: { breadcrumb: 'Détail voyageur' },
                        resolve: { item: genericResolver('/api/patients') },
                        loadComponent: () =>
                            import('./features/psf/voyageur-detail.component').then(
                                (m) => m.VoyageurDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'pma',
                data: { breadcrumb: 'Consultations PMA' },
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/pma/consultation-list.component').then(
                                (m) => m.ConsultationListComponent
                            ),
                    },
                    {
                        path: 'nouvelle',
                        data: { breadcrumb: 'Nouvelle consultation' },
                        loadComponent: () =>
                            import('./features/pma/consultation-form.component').then(
                                (m) => m.ConsultationFormComponent
                            ),
                    },
                    {
                        path: ':id/editer',
                        data: { breadcrumb: 'Modifier consultation' },
                        resolve: { item: genericResolver('/api/consultations') },
                        loadComponent: () =>
                            import('./features/pma/consultation-form.component').then(
                                (m) => m.ConsultationFormComponent
                            ),
                    },
                    {
                        path: ':id',
                        data: { breadcrumb: 'Détail consultation' },
                        resolve: { item: genericResolver('/api/consultations') },
                        loadComponent: () =>
                            import('./features/pma/consultation-detail.component').then(
                                (m) => m.ConsultationDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'regulation',
                data: { breadcrumb: 'Régulation' },
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/regulation/appel-list.component').then(
                                (m) => m.AppelListComponent
                            ),
                    },
                    {
                        path: 'nouveau',
                        data: { breadcrumb: 'Nouvel appel' },
                        loadComponent: () =>
                            import('./features/regulation/appel-form.component').then(
                                (m) => m.AppelFormComponent
                            ),
                    },
                    {
                        path: ':id/editer',
                        data: { breadcrumb: 'Modifier appel' },
                        resolve: { item: genericResolver('/api/appels-regulation') },
                        loadComponent: () =>
                            import('./features/regulation/appel-form.component').then(
                                (m) => m.AppelFormComponent
                            ),
                    },
                    {
                        path: ':id',
                        data: { breadcrumb: 'Détail appel' },
                        resolve: { item: genericResolver('/api/appels-regulation') },
                        loadComponent: () =>
                            import('./features/regulation/appel-detail.component').then(
                                (m) => m.AppelDetailComponent
                            ),
                    },
                    {
                        path: 'orientations',
                        data: { breadcrumb: 'Orientations' },
                        loadComponent: () =>
                            import('./features/regulation/orientation-list.component').then(
                                (m) => m.OrientationListComponent
                            ),
                    },
                    {
                        path: 'orientations/nouvelle',
                        data: { breadcrumb: 'Nouvelle orientation' },
                        loadComponent: () =>
                            import('./features/regulation/orientation-form.component').then(
                                (m) => m.OrientationFormComponent
                            ),
                    },
                    {
                        path: 'orientations/:id/editer',
                        data: { breadcrumb: 'Modifier orientation' },
                        resolve: { item: genericResolver('/api/orientations') },
                        loadComponent: () =>
                            import('./features/regulation/orientation-form.component').then(
                                (m) => m.OrientationFormComponent
                            ),
                    },
                    {
                        path: 'orientations/:id',
                        data: { breadcrumb: 'Détail orientation' },
                        resolve: { item: genericResolver('/api/orientations') },
                        loadComponent: () =>
                            import('./features/regulation/orientation-detail.component').then(
                                (m) => m.OrientationDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'fosa',
                data: { breadcrumb: 'Soins FOSA' },
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/fosa/admission-list.component').then(
                                (m) => m.AdmissionListComponent
                            ),
                    },
                    {
                        path: 'admission',
                        data: { breadcrumb: 'Nouvelle admission' },
                        loadComponent: () =>
                            import('./features/fosa/admission-form.component').then(
                                (m) => m.AdmissionFormComponent
                            ),
                    },
                    {
                        path: ':id/editer',
                        data: { breadcrumb: 'Modifier admission' },
                        resolve: { item: genericResolver('/api/prises-en-charge') },
                        loadComponent: () =>
                            import('./features/fosa/admission-form.component').then(
                                (m) => m.AdmissionFormComponent
                            ),
                    },
                    {
                        path: 'lits',
                        data: { breadcrumb: 'Plan des lits' },
                        loadComponent: () =>
                            import('./features/fosa/lit-plan.component').then(
                                (m) => m.LitPlanComponent
                            ),
                    },
                    {
                        path: ':id',
                        data: { breadcrumb: 'Détail admission' },
                        resolve: { item: genericResolver('/api/prises-en-charge') },
                        loadComponent: () =>
                            import('./features/fosa/admission-detail.component').then(
                                (m) => m.AdmissionDetailComponent
                            ),
                    },
                    {
                        path: 'laboratoire',
                        data: { breadcrumb: 'Laboratoire' },
                        loadComponent: () =>
                            import('./features/fosa/laboratoire-list.component').then(
                                (m) => m.LaboratoireListComponent
                            ),
                    },
                    {
                        path: 'laboratoire/prescription',
                        data: { breadcrumb: 'Nouvelle prescription' },
                        loadComponent: () =>
                            import('./features/fosa/laboratoire-form.component').then(
                                (m) => m.LaboratoireFormComponent
                            ),
                    },
                    {
                        path: 'laboratoire/:id/editer',
                        data: { breadcrumb: 'Saisir résultats' },
                        resolve: { item: genericResolver('/api/resultats-labo') },
                        loadComponent: () =>
                            import('./features/fosa/laboratoire-form.component').then(
                                (m) => m.LaboratoireFormComponent
                            ),
                    },
                    {
                        path: 'laboratoire/:id',
                        data: { breadcrumb: 'Détail Demande' },
                        resolve: { item: genericResolver('/api/resultats-labo') },
                        loadComponent: () =>
                            import('./features/fosa/laboratoire-detail.component').then(
                                (m) => m.LaboratoireDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'coordination',
                data: { breadcrumb: 'Coordination & Rapports' },
                children: [
                    {
                        path: 'sitrep',
                        data: { breadcrumb: 'SITREP' },
                        loadComponent: () =>
                            import('./features/coordination/sitrep-list/sitrep-list.component').then(
                                (m) => m.SitrepListComponent
                            ),
                    },
                    {
                        path: 'sitrep/:id',
                        data: { breadcrumb: 'Détail SITREP' },
                        loadComponent: () =>
                            import('./features/coordination/sitrep-detail/sitrep-detail.component').then(
                                (m) => m.SitrepDetailComponent
                            ),
                    }
                ]
            },
            {
                path: 'integration',
                data: { breadcrumb: 'Intégration Externe' },
                children: [
                    {
                        path: 'dhis2',
                        data: { breadcrumb: 'Synchronisation DHIS2' },
                        loadComponent: () =>
                            import('./features/integration/dhis2-sync/dhis2-sync.component').then(
                                (m) => m.Dhis2SyncComponent
                            ),
                    }
                ]
            },
            {
                path: 'stocks',
                data: { breadcrumb: 'Stocks' },
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/stocks/stock-list.component').then(
                                (m) => m.StockListComponent
                            ),
                    },
                    {
                        path: 'mouvements',
                        data: { breadcrumb: 'Mouvements' },
                        loadComponent: () =>
                            import('./features/stocks/mouvement-list.component').then(
                                (m) => m.MouvementListComponent
                            ),
                    },
                    {
                        path: 'mouvements/nouveau',
                        data: { breadcrumb: 'Nouveau Mouvement' },
                        loadComponent: () =>
                            import('./features/stocks/mouvement-form.component').then(
                                (m) => m.MouvementFormComponent
                            ),
                    },
                    {
                        path: ':id',
                        data: { breadcrumb: 'Détail stock' },
                        resolve: { item: genericResolver('/api/stocks') },
                        loadComponent: () =>
                            import('./features/stocks/stock-detail.component').then(
                                (m) => m.StockDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'alertes',
                data: { breadcrumb: 'Alertes' },
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/alertes/alerte-list.component').then(
                                (m) => m.AlerteListComponent
                            ),
                    },
                    {
                        path: ':id',
                        data: { breadcrumb: 'Détail alerte' },
                        resolve: { item: genericResolver('/api/alertes') },
                        loadComponent: () =>
                            import('./features/alertes/alerte-detail.component').then(
                                (m) => m.AlerteDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'admin',
                data: { breadcrumb: 'Administration' },
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/admin/admin-hub.component').then(
                                (m) => m.AdminHubComponent
                            ),
                    },
                    {
                        path: 'utilisateurs',
                        data: { breadcrumb: 'Utilisateurs' },
                        loadComponent: () =>
                            import('./features/admin/utilisateur-list.component').then(
                                (m) => m.UtilisateurListComponent
                            ),
                    },
                    {
                        path: 'vaccinations',
                        data: { breadcrumb: 'Vaccinations' },
                        loadComponent: () =>
                            import('./features/admin/vaccination-list.component').then(
                                (m) => m.VaccinationListComponent
                            ),
                    },
                    {
                        path: 'vaccinations/nouveau',
                        data: { breadcrumb: 'Nouvelle vaccination' },
                        loadComponent: () =>
                            import('./features/admin/vaccination-form.component').then(
                                (m) => m.VaccinationFormComponent
                            ),
                    },
                    {
                        path: 'vaccinations/:id/editer',
                        data: { breadcrumb: 'Modifier vaccination' },
                        resolve: { item: genericResolver('/api/vaccinations') },
                        loadComponent: () =>
                            import('./features/admin/vaccination-form.component').then(
                                (m) => m.VaccinationFormComponent
                            ),
                    },
                    {
                        path: 'vaccinations/:id',
                        data: { breadcrumb: 'Détail vaccination' },
                        resolve: { item: genericResolver('/api/vaccinations') },
                        loadComponent: () =>
                            import('./features/admin/vaccination-detail.component').then(
                                (m) => m.VaccinationDetailComponent
                            ),
                    },
                    {
                        path: 'sites',
                        data: { breadcrumb: 'Sites' },
                        loadComponent: () =>
                            import('./features/admin/site-list.component').then(
                                (m) => m.SiteListComponent
                            ),
                    },
                    {
                        path: 'sites/nouveau',
                        data: { breadcrumb: 'Nouveau site' },
                        loadComponent: () =>
                            import('./features/admin/site-form.component').then(
                                (m) => m.SiteFormComponent
                            ),
                    },
                    {
                        path: 'sites/:id/editer',
                        data: { breadcrumb: 'Modifier site' },
                        resolve: { item: genericResolver('/api/sites') },
                        loadComponent: () =>
                            import('./features/admin/site-form.component').then(
                                (m) => m.SiteFormComponent
                            ),
                    },
                    {
                        path: 'sites/:id',
                        data: { breadcrumb: 'Détail site' },
                        resolve: { item: genericResolver('/api/sites') },
                        loadComponent: () =>
                            import('./features/admin/site-detail.component').then(
                                (m) => m.SiteDetailComponent
                            ),
                    },
                    {
                        path: 'categories-lits',
                        data: { breadcrumb: 'Catégories de Lits' },
                        loadComponent: () =>
                            import('./features/admin/categorie-lit-list.component').then(
                                (m) => m.CategorieLitListComponent
                            ),
                    },
                    {
                        path: 'categories-lits/nouvelle',
                        data: { breadcrumb: 'Nouvelle Catégorie' },
                        loadComponent: () =>
                            import('./features/admin/categorie-lit-form.component').then(
                                (m) => m.CategorieLitFormComponent
                            ),
                    },
                    {
                        path: 'categories-lits/:id/editer',
                        data: { breadcrumb: 'Modifier Catégorie' },
                        resolve: { item: genericResolver('/api/categories-lit') },
                        loadComponent: () =>
                            import('./features/admin/categorie-lit-form.component').then(
                                (m) => m.CategorieLitFormComponent
                            ),
                    },
                    {
                        path: 'lits',
                        data: { breadcrumb: 'Lits' },
                        loadComponent: () =>
                            import('./features/admin/lit-list.component').then(
                                (m) => m.LitListComponent
                            ),
                    },
                    {
                        path: 'lits/nouveau',
                        data: { breadcrumb: 'Nouveau Lit' },
                        loadComponent: () =>
                            import('./features/admin/lit-form.component').then(
                                (m) => m.LitFormComponent
                            ),
                    },
                    {
                        path: 'lits/:id/editer',
                        data: { breadcrumb: 'Modifier Lit' },
                        resolve: { item: genericResolver('/api/lits') },
                        loadComponent: () =>
                            import('./features/admin/lit-form.component').then(
                                (m) => m.LitFormComponent
                            ),
                    },
                    {
                        path: 'catalogue',
                        data: { breadcrumb: 'Catalogue Produits' },
                        loadComponent: () =>
                            import('./features/admin/catalogue-list.component').then(
                                (m) => m.CatalogueListComponent
                            ),
                    },
                    {
                        path: 'catalogue/nouveau',
                        data: { breadcrumb: 'Nouveau Produit' },
                        loadComponent: () =>
                            import('./features/admin/catalogue-form.component').then(
                                (m) => m.CatalogueFormComponent
                            ),
                    },
                    {
                        path: 'catalogue/:id/editer',
                        data: { breadcrumb: 'Modifier Produit' },
                        resolve: { item: genericResolver('/api/catalogue-produits') },
                        loadComponent: () =>
                            import('./features/admin/catalogue-form.component').then(
                                (m) => m.CatalogueFormComponent
                            ),
                    },
                    {
                        path: 'alertes-config',
                        data: { breadcrumb: 'Règles d\'alerte' },
                        loadComponent: () =>
                            import('./features/admin/alerte-config-list.component').then(
                                (m) => m.AlerteConfigListComponent
                            ),
                    },
                    {
                        path: 'alertes-config/nouvelle',
                        data: { breadcrumb: 'Nouvelle Règle' },
                        loadComponent: () =>
                            import('./features/admin/alerte-config-form.component').then(
                                (m) => m.AlerteConfigFormComponent
                            ),
                    },
                    {
                        path: 'alertes-config/:id/editer',
                        data: { breadcrumb: 'Modifier Règle' },
                        resolve: { item: genericResolver('/api/configurations-alerte') },
                        loadComponent: () =>
                            import('./features/admin/alerte-config-form.component').then(
                                (m) => m.AlerteConfigFormComponent
                            ),
                    },
                    {
                        path: 'alertes-config/:id',
                        data: { breadcrumb: 'Détail Règle' },
                        resolve: { item: genericResolver('/api/configurations-alerte') },
                        loadComponent: () =>
                            import('./features/admin/alerte-config-detail.component').then(
                                (m) => m.AlerteConfigDetailComponent
                            ),
                    },
                    {
                        path: 'roles',
                        data: { breadcrumb: 'Rôles' },
                        loadComponent: () =>
                            import('./features/admin/role-list.component').then(
                                (m) => m.RoleListComponent
                            ),
                    },
                    {
                        path: 'roles/:id',
                        data: { breadcrumb: 'Détail Rôle' },
                        resolve: { item: genericResolver('/api/roles') },
                        loadComponent: () =>
                            import('./features/admin/role-detail.component').then(
                                (m) => m.RoleDetailComponent
                            ),
                    },
                    {
                        path: 'audit',
                        data: { breadcrumb: 'Journal d\'Audit' },
                        loadComponent: () =>
                            import('./features/admin/audit-list.component').then(
                                (m) => m.AuditListComponent
                            ),
                    },
                ],
            },
            {
                path: 'mot-de-passe',
                data: { breadcrumb: 'Changer le mot de passe' },
                loadComponent: () =>
                    import('./features/auth/change-password.component').then(
                        (m) => m.ChangePasswordComponent
                    ),
            },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
    },
    { path: '**', redirectTo: 'login' },
];
