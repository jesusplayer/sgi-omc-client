import Dexie, { Table } from 'dexie';
import {
    Site, Patient, TracingVol, Consultation, Orientation,
    AppelRegulation, PriseEnCharge, ResultatLabo,
    CategorieLit, Lit, OccupationLit,
    CatalogueProduit, Stock, ConsommationStock,
    ConfigurationAlerte, Alerte, Notification as NotifModel,
    Role, Utilisateur, AuditLog, Vaccination,
} from '../models';

export class SgiDatabase extends Dexie {
    sites!: Table<Site, string>;
    patients!: Table<Patient, string>;
    tracing_vol!: Table<TracingVol, string>;
    consultations!: Table<Consultation, string>;
    orientations!: Table<Orientation, string>;
    appels_regulation!: Table<AppelRegulation, string>;
    prises_en_charge!: Table<PriseEnCharge, string>;
    resultats_labo!: Table<ResultatLabo, string>;
    categories_lit!: Table<CategorieLit, string>;
    lits!: Table<Lit, string>;
    occupations_lit!: Table<OccupationLit, string>;
    catalogue_produits!: Table<CatalogueProduit, string>;
    stocks!: Table<Stock, string>;
    consommations_stock!: Table<ConsommationStock, string>;
    configurations_alerte!: Table<ConfigurationAlerte, string>;
    alertes!: Table<Alerte, string>;
    notifications!: Table<NotifModel, string>;
    roles!: Table<Role, string>;
    utilisateurs!: Table<Utilisateur, string>;
    audit_logs!: Table<AuditLog, string>;
    vaccinations!: Table<Vaccination, string>;

    constructor() {
        super('SgiOmcDB');

        this.version(1).stores({
            sites: 'site_id, code_site, type_site, actif',
            patients: 'patient_id, accreditation_id, [nom+prenom+nationalite], created_by',
            tracing_vol: 'tracing_id, patient_id, [numero_vol+date_arrivee], site_psf_id',
            consultations: 'consultation_id, patient_id, site_id, agent_id, [site_id+heure_arrivee]',
            orientations: 'orientation_id, consultation_id, appel_regulation_id, fosa_destination_id, statut, [fosa_destination_id+statut]',
            appels_regulation: 'appel_id, regulateur_id, datetime_appel, statut',
            prises_en_charge: 'pec_id, orientation_id, fosa_id, patient_id, medecin_id, lit_id, [fosa_id+admission_datetime]',
            resultats_labo: 'resultat_id, pec_id, prescripteur_id, [pec_id+datetime_prelevement]',
            categories_lit: 'categorie_id, code',
            lits: 'lit_id, site_id, categorie_id, [site_id+numero_lit], [site_id+statut], [categorie_id+statut]',
            occupations_lit: 'occupation_id, lit_id, pec_id, agent_id, [lit_id+debut_occupation]',
            catalogue_produits: 'produit_id, code_produit, categorie, actif',
            stocks: 'stock_id, [site_id+produit_id], site_id, statut, [site_id+statut]',
            consommations_stock: 'conso_id, stock_id, consultation_id, agent_id, [stock_id+datetime_mouvement]',
            configurations_alerte: 'config_id, code_regle, active',
            alertes: 'alerte_id, type_alerte, niveau, site_id, statut, [statut+niveau], [site_id+datetime_declenchement]',
            notifications: 'notif_id, alerte_id, utilisateur_id, statut',
            roles: 'role_id, code_role',
            utilisateurs: 'user_id, login, role_id, site_principal_id, actif',
            audit_logs: 'log_id, user_id, [user_id+datetime_action], [entite+entite_id]',
            vaccinations: 'vaccination_id, libelle, actif',
        });
    }
}

export const db = new SgiDatabase();
