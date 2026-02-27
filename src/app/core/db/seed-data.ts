import { db } from './sgi-database';
import {
    Site, Patient, TracingVol, Consultation, Orientation,
    AppelRegulation, PriseEnCharge, CategorieLit, Lit, OccupationLit,
    CatalogueProduit, Stock, ConsommationStock,
    ConfigurationAlerte, Alerte, Role, Utilisateur, Vaccination,
} from '../models';

// Helper
const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const d = (offset: number) => {
    const dt = new Date();
    dt.setHours(dt.getHours() + offset);
    return dt.toISOString();
};

export async function seedDatabase(): Promise<void> {
    // Progressive Seeding: Only insert missing entities

    // ──── ROLES ────
    const roles: Role[] = [
        { role_id: 'role-admin', code_role: 'ADMIN', libelle: 'Administrateur', description: 'Accès total au système', niveau_acces: 5, permissions: { '*': { read: true, write: true, delete: true } }, actif: true },
        { role_id: 'role-data', code_role: 'DATA', libelle: 'Data Manager', description: 'Dashboards, SITREP, DHIS2', niveau_acces: 4, permissions: { dashboard: { read: true, write: true }, sitrep: { read: true, write: true }, alerte: { read: true, write: true } }, actif: true },
        { role_id: 'role-epi', code_role: 'EPI', libelle: 'Épidémiologiste', description: 'Analyses, tendances épidémiologiques', niveau_acces: 4, permissions: { dashboard: { read: true }, consultation: { read: true }, alerte: { read: true } }, actif: true },
        { role_id: 'role-reg', code_role: 'REG', libelle: 'Médecin Régulateur', description: 'Appels, orientations médicales', niveau_acces: 3, permissions: { regulation: { read: true, write: true }, orientation: { read: true, write: true }, lit: { read: true } }, actif: true },
        { role_id: 'role-oper', code_role: 'OPERATEUR', libelle: 'Opérateur PMA/PSF', description: 'Consultations, stocks, criblage', niveau_acces: 2, permissions: { consultation: { read: true, write: true }, stock: { read: true, write: true }, patient: { read: true, write: true } }, actif: true },
        { role_id: 'role-lect', code_role: 'LECTURE', libelle: 'Observateur', description: 'Lecture seule', niveau_acces: 1, permissions: { dashboard: { read: true } }, actif: true },
    ];

    // ──── SITES ────
    const sites: Site[] = [
        { site_id: 'site-psf-nsi', code_site: 'PSF-NSI', nom: 'PSF Aéroport Nsimalen', type_site: 'PSF', adresse: 'Aéroport International de Yaoundé-Nsimalen', latitude: 3.7226, longitude: 11.5533, capacite_lits: 0, lits_occupes: 0, seuil_alerte_lits: 75, telephone: '+237 222 23 45 67', actif: true, created_at: now() },
        { site_id: 'site-psf-aid', code_site: 'PSF-AID', nom: 'PSF Aéroport International de Douala', type_site: 'PSF', adresse: 'Aéroport International de Douala', latitude: 4.0061, longitude: 9.7195, capacite_lits: 0, lits_occupes: 0, seuil_alerte_lits: 75, telephone: '+237 233 42 14 56', actif: true, created_at: now() },
        { site_id: 'site-pma-hilton', code_site: 'PMA-HILTON', nom: 'PMA Hilton Yaoundé', type_site: 'PMA_HOTEL', adresse: 'Boulevard du 20 mai, Yaoundé', latitude: 3.8641, longitude: 11.5174, capacite_lits: 0, lits_occupes: 0, seuil_alerte_lits: 75, telephone: '+237 222 23 36 46', actif: true, created_at: now() },
        { site_id: 'site-pma-palais', code_site: 'PMA-PALAIS', nom: 'PMA Palais des Congrès', type_site: 'PMA_PALAIS', adresse: 'Palais des Congrès, Yaoundé', latitude: 3.8667, longitude: 11.5167, capacite_lits: 0, lits_occupes: 0, seuil_alerte_lits: 75, telephone: '+237 222 23 15 90', actif: true, created_at: now() },
        { site_id: 'site-fosa-chu', code_site: 'FOSA-CHU', nom: 'CHU de Yaoundé', type_site: 'FOSA', adresse: 'Messa, Yaoundé', latitude: 3.8746, longitude: 11.5007, capacite_lits: 24, lits_occupes: 8, seuil_alerte_lits: 75, dhis2_org_unit_id: 'DHIS2-CHU-YDE', telephone: '+237 222 31 24 56', actif: true, created_at: now() },
        { site_id: 'site-fosa-hc', code_site: 'FOSA-HC', nom: 'Hôpital Central de Yaoundé', type_site: 'FOSA', adresse: 'Centre-ville, Yaoundé', latitude: 3.8636, longitude: 11.5215, capacite_lits: 20, lits_occupes: 6, seuil_alerte_lits: 75, dhis2_org_unit_id: 'DHIS2-HC-YDE', telephone: '+237 222 23 10 20', actif: true, created_at: now() },
        { site_id: 'site-reg', code_site: 'REG-CENTRE', nom: 'Centre de Régulation Médicale', type_site: 'REGULATION', adresse: 'PC Coordination, Yaoundé', latitude: 3.8660, longitude: 11.5190, capacite_lits: 0, lits_occupes: 0, seuil_alerte_lits: 75, telephone: '+237 222 00 15 15', actif: true, created_at: now() },
    ];

    // ──── UTILISATEURS ────
    // Password: Admin@2026 (simple hash for demo)
    const pwdHash = '$2b$12$demo.hash.for.offline.app.only';
    const users: Utilisateur[] = [
        { user_id: 'user-admin', login: 'admin', password_hash: pwdHash, nom: 'NKOULOU', prenom: 'Jean-Pierre', email: 'admin@sgi-omc.cm', telephone: '+237 690 00 00 01', role_id: 'role-admin', site_principal_id: 'site-reg', actif: true, nb_echecs_connexion: 0, force_pwd_change: false, created_at: now() },
        { user_id: 'user-data', login: 'data.manager', password_hash: pwdHash, nom: 'MBARGA', prenom: 'Sandrine', email: 'data@sgi-omc.cm', telephone: '+237 690 00 00 02', role_id: 'role-data', site_principal_id: 'site-reg', actif: true, nb_echecs_connexion: 0, force_pwd_change: false, created_at: now() },
        { user_id: 'user-epi', login: 'epidemio', password_hash: pwdHash, nom: 'FOUDA', prenom: 'Alain', email: 'epi@sgi-omc.cm', telephone: '+237 690 00 00 03', role_id: 'role-epi', site_principal_id: 'site-reg', actif: true, nb_echecs_connexion: 0, force_pwd_change: false, created_at: now() },
        { user_id: 'user-reg', login: 'regulateur', password_hash: pwdHash, nom: 'ESSOMBA', prenom: 'Dr. Marie', email: 'reg@sgi-omc.cm', telephone: '+237 690 00 00 04', role_id: 'role-reg', site_principal_id: 'site-reg', actif: true, nb_echecs_connexion: 0, force_pwd_change: false, created_at: now() },
        { user_id: 'user-psf1', login: 'agent.psf', password_hash: pwdHash, nom: 'ATANGANA', prenom: 'Paul', email: 'psf@sgi-omc.cm', telephone: '+237 690 00 00 05', role_id: 'role-oper', site_principal_id: 'site-psf-nsi', actif: true, nb_echecs_connexion: 0, force_pwd_change: false, created_at: now() },
        { user_id: 'user-pma1', login: 'agent.pma', password_hash: pwdHash, nom: 'NDJOMO', prenom: 'Cécile', email: 'pma@sgi-omc.cm', telephone: '+237 690 00 00 06', role_id: 'role-oper', site_principal_id: 'site-pma-hilton', actif: true, nb_echecs_connexion: 0, force_pwd_change: false, created_at: now() },
        { user_id: 'user-fosa1', login: 'medecin.fosa', password_hash: pwdHash, nom: 'TCHINDA', prenom: 'Dr. Fabrice', email: 'fosa@sgi-omc.cm', telephone: '+237 690 00 00 07', role_id: 'role-oper', site_principal_id: 'site-fosa-chu', actif: true, nb_echecs_connexion: 0, force_pwd_change: false, created_at: now() },
        { user_id: 'user-obs', login: 'observateur', password_hash: pwdHash, nom: 'DUPONT', prenom: 'Pierre', email: 'obs@sgi-omc.cm', telephone: '+237 690 00 00 08', role_id: 'role-lect', actif: true, nb_echecs_connexion: 0, force_pwd_change: false, created_at: now() },
    ];

    // ──── CATEGORIES LIT ────
    const categories: CategorieLit[] = [
        { categorie_id: 'cat-vip', code: 'VIP', libelle: 'Chambre VIP individuelle', description: 'Chambre haut standing pour délégués', couleur_dashboard: '#8B5CF6', actif: true },
        { categorie_id: 'cat-std', code: 'STANDARD', libelle: 'Chambre standard', description: 'Chambre partagée standard', couleur_dashboard: '#3B82F6', actif: true },
        { categorie_id: 'cat-rea', code: 'REANIMATION', libelle: 'Unité de réanimation', description: 'Lits équipés pour soins intensifs', couleur_dashboard: '#EF4444', actif: true },
        { categorie_id: 'cat-iso', code: 'ISOLATION', libelle: 'Chambre d\'isolement', description: 'Chambre pression négative', couleur_dashboard: '#F59E0B', actif: true },
        { categorie_id: 'cat-urg', code: 'URGENCE', libelle: 'Lit d\'urgence / observation', description: 'Lit temporaire aux urgences', couleur_dashboard: '#10B981', actif: true },
    ];

    // ──── LITS (30 lits répartis dans les 2 FOSA) ────
    const lits: Lit[] = [];
    const litDefs = [
        { site: 'site-fosa-chu', cat: 'cat-vip', prefix: 'VIP', count: 4, occupied: [0, 1] },
        { site: 'site-fosa-chu', cat: 'cat-std', prefix: 'STD', count: 10, occupied: [0, 1, 2, 3] },
        { site: 'site-fosa-chu', cat: 'cat-rea', prefix: 'REA', count: 4, occupied: [0] },
        { site: 'site-fosa-chu', cat: 'cat-iso', prefix: 'ISO', count: 3, occupied: [0] },
        { site: 'site-fosa-chu', cat: 'cat-urg', prefix: 'URG', count: 3, occupied: [0, 1] },
        { site: 'site-fosa-hc', cat: 'cat-vip', prefix: 'VIP', count: 3, occupied: [0] },
        { site: 'site-fosa-hc', cat: 'cat-std', prefix: 'STD', count: 10, occupied: [0, 1, 2, 3] },
        { site: 'site-fosa-hc', cat: 'cat-rea', prefix: 'REA', count: 3, occupied: [] },
        { site: 'site-fosa-hc', cat: 'cat-iso', prefix: 'ISO', count: 2, occupied: [0] },
        { site: 'site-fosa-hc', cat: 'cat-urg', prefix: 'URG', count: 2, occupied: [] },
    ];
    litDefs.forEach(def => {
        for (let i = 0; i < def.count; i++) {
            lits.push({
                lit_id: `lit-${def.site.split('-').pop()}-${def.prefix.toLowerCase()}-${String(i + 1).padStart(2, '0')}`,
                site_id: def.site,
                categorie_id: def.cat,
                numero_lit: `${def.prefix}-${String(i + 1).padStart(2, '0')}`,
                statut: def.occupied.includes(i) ? 'OCCUPE' : 'LIBRE',
                updated_at: now(),
            });
        }
    });

    // ──── PATIENTS ────
    const patients: Patient[] = [
        { patient_id: 'pat-001', accreditation_id: 'OMC-2026-00142', nom: 'JOHNSON', prenom: 'Michael', date_naissance: '1975-03-15', sexe: 'M', nationalite: 'USA', pays_provenance: 'USA', type_personne: 'DELEGUE', contact_local: '+237 691 00 01 42', statut_vaccinal: { fievre_jaune: true, covid19: true, meningite: true }, created_at: now(), created_by: 'user-psf1' },
        { patient_id: 'pat-002', accreditation_id: 'OMC-2026-00287', nom: 'MÜLLER', prenom: 'Anna', date_naissance: '1988-07-22', sexe: 'F', nationalite: 'DEU', pays_provenance: 'DEU', type_personne: 'JOURNALISTE', contact_local: '+237 691 00 02 87', statut_vaccinal: { fievre_jaune: true, covid19: true, meningite: false }, created_at: now(), created_by: 'user-psf1' },
        { patient_id: 'pat-003', accreditation_id: 'OMC-2026-00531', nom: 'TANAKA', prenom: 'Yuki', date_naissance: '1992-11-03', sexe: 'F', nationalite: 'JPN', pays_provenance: 'JPN', type_personne: 'DELEGUE', contact_local: '+237 691 00 05 31', statut_vaccinal: { fievre_jaune: true, covid19: true, meningite: true }, created_at: now(), created_by: 'user-psf1' },
        { patient_id: 'pat-004', accreditation_id: 'OMC-2026-00098', nom: 'SILVA', prenom: 'Carlos', date_naissance: '1965-09-10', sexe: 'M', nationalite: 'BRA', pays_provenance: 'BRA', type_personne: 'EXPOSANT', contact_local: '+237 691 00 00 98', statut_vaccinal: { fievre_jaune: true, covid19: false, meningite: false }, created_at: now(), created_by: 'user-psf1' },
        { patient_id: 'pat-005', accreditation_id: 'OMC-2026-00612', nom: 'OKONKWO', prenom: 'Chiamaka', date_naissance: '1995-01-28', sexe: 'F', nationalite: 'NGA', pays_provenance: 'NGA', type_personne: 'DELEGUE', contact_local: '+237 691 00 06 12', statut_vaccinal: { fievre_jaune: true, covid19: true, meningite: true }, created_at: now(), created_by: 'user-psf1' },
        { patient_id: 'pat-006', accreditation_id: 'OMC-2026-00777', nom: 'PETIT', prenom: 'Claire', date_naissance: '1983-04-18', sexe: 'F', nationalite: 'FRA', pays_provenance: 'FRA', type_personne: 'JOURNALISTE', contact_local: '+237 691 00 07 77', statut_vaccinal: { fievre_jaune: true, covid19: true, meningite: true }, created_at: now(), created_by: 'user-psf1' },
        { patient_id: 'pat-007', accreditation_id: 'OMC-2026-00845', nom: 'WANG', prenom: 'Wei', date_naissance: '1978-06-05', sexe: 'M', nationalite: 'CHN', pays_provenance: 'CHN', type_personne: 'DELEGUE', contact_local: '+237 691 00 08 45', statut_vaccinal: { fievre_jaune: true, covid19: true, meningite: false }, created_at: now(), created_by: 'user-psf1' },
        { patient_id: 'pat-008', accreditation_id: 'OMC-2026-01001', nom: 'ABDI', prenom: 'Hassan', date_naissance: '1970-12-20', sexe: 'M', nationalite: 'KEN', pays_provenance: 'KEN', type_personne: 'DELEGUE', contact_local: '+237 691 00 10 01', statut_vaccinal: { fievre_jaune: true, covid19: true, meningite: true }, created_at: now(), created_by: 'user-psf1' },
    ];

    // ──── TRACING VOL ────
    const tracings: TracingVol[] = [
        { tracing_id: uuid(), patient_id: 'pat-001', psf_agent_id: 'user-psf1', site_psf_id: 'site-psf-nsi', numero_vol: 'AF0572', compagnie_aerienne: 'Air France', aeroport_origine: 'CDG', numero_siege: '12A', date_arrivee: d(-48), temperature_criblage: 36.5, symptomes_declares: false, decision_frontiere: 'AUTORISATION', created_at: d(-48) },
        { tracing_id: uuid(), patient_id: 'pat-002', psf_agent_id: 'user-psf1', site_psf_id: 'site-psf-nsi', numero_vol: 'LH4090', compagnie_aerienne: 'Lufthansa', aeroport_origine: 'FRA', numero_siege: '23C', date_arrivee: d(-36), temperature_criblage: 37.2, symptomes_declares: false, decision_frontiere: 'AUTORISATION', created_at: d(-36) },
        { tracing_id: uuid(), patient_id: 'pat-003', psf_agent_id: 'user-psf1', site_psf_id: 'site-psf-nsi', numero_vol: 'ET0846', compagnie_aerienne: 'Ethiopian Airlines', aeroport_origine: 'NRT', numero_siege: '8F', date_arrivee: d(-24), temperature_criblage: 38.4, symptomes_declares: true, detail_symptomes: 'Céphalées, fatigue', decision_frontiere: 'REFERENCE_TEST', motif_decision: 'Fièvre > 38°C + symptômes', created_at: d(-24) },
        { tracing_id: uuid(), patient_id: 'pat-004', psf_agent_id: 'user-psf1', site_psf_id: 'site-psf-nsi', numero_vol: 'AF0572', compagnie_aerienne: 'Air France', aeroport_origine: 'CDG', numero_siege: '15B', date_arrivee: d(-12), temperature_criblage: 36.8, symptomes_declares: false, decision_frontiere: 'AUTORISATION', created_at: d(-12) },
        { tracing_id: uuid(), patient_id: 'pat-005', psf_agent_id: 'user-psf1', site_psf_id: 'site-psf-nsi', numero_vol: 'W30106', compagnie_aerienne: 'Arik Air', aeroport_origine: 'LOS', numero_siege: '3A', date_arrivee: d(-6), temperature_criblage: 36.3, symptomes_declares: false, decision_frontiere: 'AUTORISATION', created_at: d(-6) },
    ];

    // ──── CONSULTATIONS ────
    const consultations: Consultation[] = [
        { consultation_id: 'cons-001', patient_id: 'pat-003', site_id: 'site-pma-hilton', agent_id: 'user-pma1', heure_arrivee: d(-23), heure_consultation: d(-22.8), heure_sortie: d(-22), motif: 'Fièvre persistante, céphalées intenses', symptomes: { fievre: true, cephalees: true, fatigue: true, nausees: false }, ta_systolique: 130, ta_diastolique: 85, pouls: 92, temperature: 38.7, saturation_o2: 96, diagnostic_presomptif: 'Syndrome grippal', soins_prodigues: 'Paracétamol 1g IV, hydratation', decision: 'EVACUATION_FOSA', orientation_id: 'orient-001', created_at: d(-23) },
        { consultation_id: 'cons-002', patient_id: 'pat-001', site_id: 'site-pma-hilton', agent_id: 'user-pma1', heure_arrivee: d(-20), heure_consultation: d(-19.5), heure_sortie: d(-18.5), motif: 'Douleur abdominale, nausées', symptomes: { douleur_abdominale: true, nausees: true, vomissement: false }, ta_systolique: 125, ta_diastolique: 80, pouls: 78, temperature: 37.0, saturation_o2: 98, diagnostic_presomptif: 'Gastrite aiguë', soins_prodigues: 'Oméprazole 40mg, Métoclopramide', decision: 'RETOUR_POSTE', created_at: d(-20) },
        { consultation_id: 'cons-003', patient_id: 'pat-006', site_id: 'site-pma-palais', agent_id: 'user-pma1', heure_arrivee: d(-8), heure_consultation: d(-7.8), motif: 'Malaise, vertiges lors de la conférence', symptomes: { vertiges: true, fatigue: true, cephalees: true }, ta_systolique: 100, ta_diastolique: 60, pouls: 110, temperature: 36.8, saturation_o2: 94, diagnostic_presomptif: 'Hypotension orthostatique', soins_prodigues: 'Repos, hydratation orale, surveillance', decision: 'OBSERVATION', created_at: d(-8) },
        { consultation_id: 'cons-004', patient_id: 'pat-007', site_id: 'site-pma-hilton', agent_id: 'user-pma1', heure_arrivee: d(-4), heure_consultation: d(-3.8), motif: 'Blessure au genou, chute dans escalier', symptomes: { douleur_articulaire: true }, ta_systolique: 135, ta_diastolique: 82, pouls: 75, temperature: 36.9, saturation_o2: 99, diagnostic_presomptif: 'Contusion genou droit', soins_prodigues: 'Glaçage, bandage compressif, Ibuprofène 400mg', decision: 'RETOUR_POSTE', created_at: d(-4) },
    ];

    // ──── ORIENTATIONS ────
    const orientations: Orientation[] = [
        { orientation_id: 'orient-001', consultation_id: 'cons-001', fosa_destination_id: 'site-fosa-chu', moyen_transport: 'AMBULANCE', motif_evacuation: 'Fièvre persistante > 38.5°C avec céphalées intenses', etat_patient_depart: 'GRAVE', heure_decision: d(-22), heure_depart: d(-21.8), heure_arrivee_fosa: d(-21.3), statut: 'ARRIVE', pec_id: 'pec-001', created_at: d(-22) },
    ];

    // ──── PRISES EN CHARGE ────
    const pecs: PriseEnCharge[] = [
        { pec_id: 'pec-001', orientation_id: 'orient-001', fosa_id: 'site-fosa-chu', medecin_id: 'user-fosa1', patient_id: 'pat-003', lit_id: 'lit-chu-std-01', admission_datetime: d(-21), etat_entree: 'GRAVE', diagnostic_entree: 'Syndrome grippal sévère', diagnostic_final: 'J11', libelle_diagnostic: 'Grippe, virus non identifié', traitements: [{ medicament: 'Oseltamivir', dose: '75mg', voie: 'Orale', duree: '5 jours' }, { medicament: 'Paracétamol', dose: '1g', voie: 'IV', duree: 'PRN' }], oxygene_requis: false, reanimation: false, transfusion: false, created_at: d(-21) },
    ];

    // ──── CATALOGUE PRODUITS ────
    const produits: CatalogueProduit[] = [
        { produit_id: 'prod-001', code_produit: 'MED-PARA-1G', designation: 'Paracétamol 1g comprimés', categorie: 'MEDICAMENT', dci: 'Paracétamol', forme: 'Comprimé', dosage: '1000mg', unite_base: 'comprimés', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-002', code_produit: 'MED-AMOX-500', designation: 'Amoxicilline 500mg gélules', categorie: 'MEDICAMENT', dci: 'Amoxicilline', forme: 'Gélule', dosage: '500mg', unite_base: 'gélules', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-003', code_produit: 'MED-IBUP-400', designation: 'Ibuprofène 400mg comprimés', categorie: 'MEDICAMENT', dci: 'Ibuprofène', forme: 'Comprimé', dosage: '400mg', unite_base: 'comprimés', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-004', code_produit: 'MED-OMEP-40', designation: 'Oméprazole 40mg injectable', categorie: 'MEDICAMENT', dci: 'Oméprazole', forme: 'Injectable', dosage: '40mg', unite_base: 'ampoules', actif: true, necessite_froid: true, created_at: now() },
        { produit_id: 'prod-005', code_produit: 'MED-ALUM-20', designation: 'Artéméther-Luméfantrine 20/120', categorie: 'MEDICAMENT', dci: 'AL', forme: 'Comprimé', dosage: '20/120mg', unite_base: 'plaquettes', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-006', code_produit: 'MED-CEFT-1G', designation: 'Ceftriaxone 1g injectable', categorie: 'MEDICAMENT', dci: 'Ceftriaxone', forme: 'Poudre pour inj.', dosage: '1g', unite_base: 'flacons', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-007', code_produit: 'MED-ADRE-1MG', designation: 'Adrénaline 1mg/ml', categorie: 'MEDICAMENT', dci: 'Adrénaline', forme: 'Injectable', dosage: '1mg', unite_base: 'ampoules', actif: true, necessite_froid: true, created_at: now() },
        { produit_id: 'prod-008', code_produit: 'SOL-SAL-500', designation: 'Sérum Salé 0.9% 500ml', categorie: 'CONSOMMABLE', dci: 'NaCl', forme: 'Poche', dosage: '0.9%', unite_base: 'unités', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-009', code_produit: 'SOL-GLU-500', designation: 'Sérum Glucosé 5% 500ml', categorie: 'CONSOMMABLE', dci: 'Glucose', forme: 'Poche', dosage: '5%', unite_base: 'unités', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-010', code_produit: 'EPI-GANT-L', designation: 'Gants latex taille L', categorie: 'EPI', forme: 'Boîte de 100', unite_base: 'boîtes', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-011', code_produit: 'EPI-MASQ-FFP2', designation: 'Masques FFP2', categorie: 'EPI', forme: 'Boîte de 50', unite_base: 'boîtes', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-012', code_produit: 'EPI-BLOU-JET', designation: 'Blouse jetable', categorie: 'EPI', forme: 'Unité', unite_base: 'unités', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-013', code_produit: 'CONS-COMP-10', designation: 'Compresses stériles 10×10', categorie: 'CONSOMMABLE', forme: 'Paquet de 25', unite_base: 'paquets', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-014', code_produit: 'CONS-SER-10', designation: 'Seringues 10ml', categorie: 'CONSOMMABLE', forme: 'Boîte de 100', unite_base: 'boîtes', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-015', code_produit: 'CONS-CAT-22', designation: 'Cathéter 22G', categorie: 'CONSOMMABLE', forme: 'Boîte de 50', unite_base: 'boîtes', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-016', code_produit: 'TES-RAP-PALO', designation: 'Test Rapide Paludisme', categorie: 'CONSOMMABLE', forme: 'Boîte de 25', unite_base: 'boîtes', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-017', code_produit: 'MAT-THERM-IR', designation: 'Thermomètre infrarouge', categorie: 'MATERIEL', forme: 'Unité', unite_base: 'unités', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-018', code_produit: 'MAT-OXY-POR', designation: 'Oxymètre de pouls portable', categorie: 'MATERIEL', forme: 'Unité', unite_base: 'unités', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-019', code_produit: 'MAT-TENS-BR', designation: 'Tensiomètre bras', categorie: 'MATERIEL', forme: 'Unité', unite_base: 'unités', actif: true, necessite_froid: false, created_at: now() },
        { produit_id: 'prod-020', code_produit: 'MAT-GLUC-CH', designation: 'Lecteur de glycémie', categorie: 'MATERIEL', forme: 'Unité', unite_base: 'unités', actif: true, necessite_froid: false, created_at: now() },
    ];

    // ──── STOCKS (par site PMA et FOSA) ────
    const stocks: Stock[] = [
        // PMA Hilton
        { stock_id: 'stk-h-001', site_id: 'site-pma-hilton', produit_id: 'prod-001', quantite_disponible: 200, quantite_initiale: 500, unite: 'comprimés', seuil_alerte: 100, seuil_critique: 30, derniere_maj: now(), statut: 'NORMAL' },
        { stock_id: 'stk-h-002', site_id: 'site-pma-hilton', produit_id: 'prod-003', quantite_disponible: 80, quantite_initiale: 200, unite: 'comprimés', seuil_alerte: 50, seuil_critique: 15, derniere_maj: now(), statut: 'NORMAL' },
        { stock_id: 'stk-h-003', site_id: 'site-pma-hilton', produit_id: 'prod-005', quantite_disponible: 8, quantite_initiale: 20, unite: 'boîtes', seuil_alerte: 5, seuil_critique: 2, derniere_maj: now(), statut: 'NORMAL' },
        { stock_id: 'stk-h-004', site_id: 'site-pma-hilton', produit_id: 'prod-006', quantite_disponible: 3, quantite_initiale: 15, unite: 'boîtes', seuil_alerte: 5, seuil_critique: 2, derniere_maj: now(), statut: 'ALERTE' },
        { stock_id: 'stk-h-005', site_id: 'site-pma-hilton', produit_id: 'prod-007', quantite_disponible: 12, quantite_initiale: 30, unite: 'paquets', seuil_alerte: 10, seuil_critique: 3, derniere_maj: now(), statut: 'NORMAL' },
        // FOSA CHU
        { stock_id: 'stk-c-001', site_id: 'site-fosa-chu', produit_id: 'prod-001', quantite_disponible: 450, quantite_initiale: 1000, unite: 'comprimés', seuil_alerte: 200, seuil_critique: 50, derniere_maj: now(), statut: 'NORMAL' },
        { stock_id: 'stk-c-002', site_id: 'site-fosa-chu', produit_id: 'prod-002', quantite_disponible: 25, quantite_initiale: 300, unite: 'gélules', seuil_alerte: 50, seuil_critique: 15, derniere_maj: now(), statut: 'CRITIQUE' },
        { stock_id: 'stk-c-003', site_id: 'site-fosa-chu', produit_id: 'prod-009', quantite_disponible: 60, quantite_initiale: 100, unite: 'gélules', seuil_alerte: 30, seuil_critique: 10, derniere_maj: now(), statut: 'NORMAL' },
        { stock_id: 'stk-c-004', site_id: 'site-fosa-chu', produit_id: 'prod-010', quantite_disponible: 0, quantite_initiale: 10, unite: 'boîtes', seuil_alerte: 3, seuil_critique: 1, derniere_maj: now(), statut: 'RUPTURE' },
    ];

    // ──── ALERTES ────
    const alertes: Alerte[] = [
        { alerte_id: 'alert-001', type_alerte: 'KPI', niveau: 1, site_id: 'site-pma-hilton', source_entite: 'TRACING_VOL', titre: 'Température ≥ 38°C détectée', message: 'Un voyageur (TANAKA Yuki) présente une température de 38.4°C à l\'arrivée PSF-NSI.', valeur_declenchante: '38.4°C', seuil_configure: '38.0°C', datetime_declenchement: d(-24), statut: 'RESOLUE', datetime_resolution: d(-20), commentaire_resolution: 'Patient orienté vers FOSA-CHU, pris en charge.' },
        { alerte_id: 'alert-002', type_alerte: 'STOCK', niveau: 1, site_id: 'site-pma-hilton', source_entite: 'STOCK', source_id: 'stk-h-004', titre: 'Stock masques FFP2 en alerte', message: 'Le stock de masques FFP2 au PMA Hilton est passé sous le seuil d\'alerte (3 boîtes restantes).', valeur_declenchante: '3', seuil_configure: '5', datetime_declenchement: d(-12), statut: 'ACTIVE' },
        { alerte_id: 'alert-003', type_alerte: 'STOCK', niveau: 2, site_id: 'site-fosa-chu', source_entite: 'STOCK', source_id: 'stk-c-002', titre: 'Stock Amoxicilline CRITIQUE', message: 'Le stock d\'Amoxicilline 500mg au CHU est en niveau critique (25 gélules restantes).', valeur_declenchante: '25', seuil_configure: '50', datetime_declenchement: d(-6), statut: 'ACTIVE' },
        { alerte_id: 'alert-004', type_alerte: 'STOCK', niveau: 3, site_id: 'site-fosa-chu', source_entite: 'STOCK', source_id: 'stk-c-004', titre: 'RUPTURE Seringues 10ml — CHU', message: 'Rupture totale de seringues 10ml au CHU de Yaoundé. Réapprovisionnement urgent requis.', valeur_declenchante: '0', seuil_configure: '1', datetime_declenchement: d(-2), statut: 'ACTIVE' },
    ];

    // ──── CONFIGURATIONS ALERTE ────
    const configs: ConfigurationAlerte[] = [
        { config_id: uuid(), code_regle: 'TEMP_CRIBLAGE', libelle: 'Température ≥ 38°C au criblage PSF', entite_source: 'TRACING_VOL', champ_surveille: 'temperature_criblage', operateur: 'GTE', seuil_niveau1: 38.0, canaux_notif: ['PUSH', 'IN_APP'], roles_destinataires: ['DATA', 'EPI'], active: true, cooldown_min: 15 },
        { config_id: uuid(), code_regle: 'STOCK_SEUIL', libelle: 'Stock sous le seuil d\'alerte', entite_source: 'STOCK', champ_surveille: 'quantite_disponible', operateur: 'LTE', seuil_niveau1: undefined, canaux_notif: ['PUSH', 'IN_APP', 'SMS'], roles_destinataires: ['DATA', 'ADMIN'], active: true, cooldown_min: 60 },
        { config_id: uuid(), code_regle: 'TAUX_EVACUATION', libelle: 'Taux d\'évacuation FOSA > seuil', entite_source: 'CONSULTATION', champ_surveille: 'taux_evacuation', operateur: 'GT', seuil_niveau1: 2.0, seuil_niveau2: 5.0, seuil_niveau3: 10.0, canaux_notif: ['PUSH', 'IN_APP', 'EMAIL'], roles_destinataires: ['DATA', 'EPI', 'ADMIN'], active: true, cooldown_min: 30 },
        { config_id: uuid(), code_regle: 'OCCUPATION_LITS', libelle: 'Taux d\'occupation lits FOSA', entite_source: 'SITE', champ_surveille: 'taux_occupation', operateur: 'GTE', seuil_niveau1: 75, seuil_niveau2: 90, seuil_niveau3: 100, canaux_notif: ['PUSH', 'IN_APP', 'SMS'], roles_destinataires: ['DATA', 'REG', 'ADMIN'], active: true, cooldown_min: 15 },
    ];

    // ──── VACCINATIONS ────
    const vaccinations: Vaccination[] = [
        { vaccination_id: 'vac-001', libelle: 'Fièvre jaune', obligatoire: true, actif: true, created_at: now() },
        { vaccination_id: 'vac-002', libelle: 'COVID-19', obligatoire: true, actif: true, created_at: now() },
        { vaccination_id: 'vac-003', libelle: 'Méningite', obligatoire: true, actif: true, created_at: now() },
        { vaccination_id: 'vac-004', libelle: 'Poliomyélite', obligatoire: false, actif: true, created_at: now() },
        { vaccination_id: 'vac-005', libelle: 'Hépatite B', obligatoire: false, actif: true, created_at: now() },
        { vaccination_id: 'vac-006', libelle: 'Typhoid', obligatoire: false, actif: true, created_at: now() },
    ];

    // ──── BULK INSERT ────
    await db.transaction('rw', [
        db.roles, db.sites, db.utilisateurs, db.categories_lit, db.lits,
        db.patients, db.tracing_vol, db.consultations, db.orientations,
        db.prises_en_charge, db.catalogue_produits, db.stocks, db.alertes,
        db.configurations_alerte, db.vaccinations,
    ], async () => {
        if (await db.roles.count() === 0) await db.roles.bulkAdd(roles);
        if (await db.sites.count() === 0) await db.sites.bulkAdd(sites);
        if (await db.utilisateurs.count() === 0) await db.utilisateurs.bulkAdd(users);
        if (await db.categories_lit.count() === 0) await db.categories_lit.bulkAdd(categories);
        if (await db.lits.count() === 0) await db.lits.bulkAdd(lits);
        if (await db.patients.count() === 0) await db.patients.bulkAdd(patients);
        if (await db.tracing_vol.count() === 0) await db.tracing_vol.bulkAdd(tracings);
        if (await db.consultations.count() === 0) await db.consultations.bulkAdd(consultations);
        if (await db.orientations.count() === 0) await db.orientations.bulkAdd(orientations);
        if (await db.prises_en_charge.count() === 0) await db.prises_en_charge.bulkAdd(pecs);
        if (await db.catalogue_produits.count() === 0) await db.catalogue_produits.bulkAdd(produits);
        if (await db.stocks.count() === 0) await db.stocks.bulkAdd(stocks);
        if (await db.alertes.count() === 0) await db.alertes.bulkAdd(alertes);
        if (await db.configurations_alerte.count() === 0) await db.configurations_alerte.bulkAdd(configs);
        if (await db.vaccinations.count() === 0) await db.vaccinations.bulkAdd(vaccinations);
    });

    console.log('✅ SGI OMC Database seeded successfully');
}
