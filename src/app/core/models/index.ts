// ===== SGI OMC — All TypeScript Models & Enums =====
// Mapped from MLD v4 — 25 tables / 11 domains

// ─── Enums ──────────────────────────────────────────

export type TypeSite = 'PSF' | 'PMA_HOTEL' | 'PMA_PALAIS' | 'PMA_HV' | 'FOSA' | 'REGULATION' | 'AUTRE';
export type Sexe = 'M' | 'F' | 'A';
export type TypePersonne = 'DELEGUE' | 'JOURNALISTE' | 'VISITEUR' | 'EXPOSANT' | 'PERSONNEL' | 'AUTRE';
export type DecisionFrontiere = 'AUTORISATION' | 'REFERENCE_TEST' | 'ISOLEMENT' | 'REFOULEMENT';
export type DecisionConsultation = 'RETOUR_POSTE' | 'EVACUATION_FOSA' | 'HOSPITALISATION' | 'OBSERVATION' | 'DECES';
export type MoyenTransport = 'AMBULANCE' | 'SMUR' | 'TAXI' | 'VEHICULE_PERSO' | 'MARCHE';
export type EtatPatient = 'STABLE' | 'GRAVE' | 'CRITIQUE' | 'INCONSCIENT';
export type StatutOrientation = 'EN_ATTENTE' | 'EN_COURS' | 'ARRIVE' | 'REFUSE' | 'ANNULE' | 'DECES_TRANSIT';
export type TypeAppelant = 'PMA' | 'PSF' | 'HOTEL' | 'DELEGATION' | 'POLICE' | 'AUTRE';
export type MoyenEngage = 'CONSEIL_TEL' | 'MEDECIN_SITE' | 'AMBULANCE' | 'SMUR' | 'AUCUN';
export type StatutAppel = 'EN_COURS' | 'RESOLU' | 'TRANSMIS' | 'ANNULE';
export type Devenir = 'GUERISON' | 'EVACUATION_SANITAIRE' | 'RETOUR_DOMICILE' | 'HEBERGEMENT_POST_SOINS' | 'DECES';
export type TypeExamen = 'BIOLOGIE' | 'IMAGERIE' | 'PCR' | 'SEROLOGIE' | 'BACTERIOLOGIE' | 'ANATOMO_PATHO' | 'AUTRE';
export type Interpretation = 'NORMAL' | 'ANORMAL_BAS' | 'ANORMAL_HAUT' | 'POSITIF' | 'NEGATIF' | 'CRITIQUE' | 'EN_ATTENTE';
export type CodeCategorieLit = 'VIP' | 'STANDARD' | 'REANIMATION' | 'ISOLATION' | 'URGENCE';
export type StatutLit = 'LIBRE' | 'OCCUPE' | 'HORS_SERVICE' | 'RESERVE';
export type TypeEvenementLit = 'OCCUPATION' | 'LIBERATION' | 'RESERVATION' | 'ANNULATION';
export type MotifLiberation = 'GUERISON' | 'TRANSFERT' | 'DECES' | 'ANNULATION' | 'AUTRE';
export type CategorieProduit = 'MEDICAMENT' | 'EPI' | 'MATERIEL' | 'CONSOMMABLE' | 'AUTRE';
export type StatutStock = 'NORMAL' | 'ALERTE' | 'CRITIQUE' | 'RUPTURE' | 'PERIME';
export type TypeMouvement = 'CONSOMMATION' | 'REAPPRO' | 'PERTE' | 'PEREMPTION' | 'INVENTAIRE' | 'TRANSFERT';
export type SensMouvement = 'ENTREE' | 'SORTIE';
export type Operateur = 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ' | 'NEQ';
export type TypeAlerte = 'STOCK' | 'KPI' | 'EPIDEMIO' | 'URGENCE_MEDICALE' | 'LIT' | 'VACCIN' | 'TRANSMISSION' | 'SECURITE' | 'AUTRE';
export type StatutAlerte = 'ACTIVE' | 'PRISE_EN_CHARGE' | 'RESOLUE' | 'IGNOREE';
export type CanalNotification = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';
export type StatutNotification = 'EN_ATTENTE' | 'ENVOYE' | 'DELIVRE' | 'LU' | 'ECHEC';
export type CodeRole = 'ADMIN' | 'DATA' | 'EPI' | 'REG' | 'OPERATEUR' | 'LECTURE';
export type ActionAudit = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'PRINT' | 'FAILED_LOGIN' | 'ALERT_RESOLVE' | 'STATUT_CHANGE';
export type StatutSitrep = 'BROUILLON' | 'VALIDE' | 'DISTRIBUE';

// ★ New v4 Enums
export type StatutSuivi = 'AUTORISE' | 'EN_ATTENTE_TEST' | 'EN_COURS_TEST' | 'TEST_NEGATIF' | 'TEST_POSITIF_FOSA' | 'EN_ISOLEMENT' | 'TRANSFERE_FOSA' | 'HOSPITALISE' | 'REFOULE' | 'CLOTURE';
export type OrigineOrientation = 'PSF_REFERENCE_TEST' | 'PSF_ISOLEMENT' | 'PMA_EVACUATION' | 'REGULATION';
export type TypeComparaisonAlerte = 'VALEUR_NUMERIQUE' | 'JOURS_RESTANTS' | 'POURCENTAGE' | 'PRESENCE_VALEUR' | 'DUREE_ECOULEE';
export type StatutVaccin = 'VALIDE' | 'ABSENT' | 'PERIME' | 'DOUTEUX' | 'NON_VERIFIE';

// ─── Interfaces ─────────────────────────────────────

export interface Site {
    site_id: string;
    code_site: string;
    nom: string;
    type_site: TypeSite;
    adresse?: string;
    latitude?: number;
    longitude?: number;
    capacite_lits: number;
    lits_occupes: number;
    seuil_alerte_lits: number;
    dhis2_org_unit_id?: string;
    mfl_facility_id?: string;
    responsable_id?: string;
    telephone?: string;
    actif: boolean;
    heure_ouverture?: string;
    heure_fermeture?: string;
    created_at: string;
}

export interface CategorieLit {
    categorie_id: string;
    code: CodeCategorieLit;
    libelle: string;
    description?: string;
    couleur_dashboard?: string;
    actif: boolean;
}

export interface Lit {
    lit_id: string;
    site_id: string;
    categorie_id: string;
    numero_lit: string;
    statut: StatutLit;
    updated_at: string;
}

export interface CatalogueProduit {
    produit_id: string;
    code_produit: string;
    designation: string;
    categorie: CategorieProduit;
    dci?: string;
    forme?: string;
    dosage?: string;
    unite_base: string;
    code_atc?: string;
    necessite_froid: boolean;
    necessite_lot: boolean; // ★ added v4
    actif: boolean;
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export interface Stock {
    stock_id: string;
    site_id: string;
    produit_id: string;
    quantite_disponible: number;
    quantite_initiale: number;
    unite: string;
    seuil_alerte: number;
    seuil_critique: number;
    date_peremption?: string;
    numero_lot?: string;
    emplacement?: string;
    agent_resp_id?: string;
    derniere_maj: string;
    statut: StatutStock;
}

export interface ConsommationStock {
    conso_id: string;
    stock_id: string;
    consultation_id?: string;
    agent_id: string;
    type_mouvement: TypeMouvement;
    quantite: number;
    sens: SensMouvement;
    stock_avant: number;
    stock_apres: number;
    commentaire?: string;
    datetime_mouvement: string;
}

export interface Patient {
    patient_id: string;
    accreditation_id: string;
    nom: string;
    prenom: string;
    date_naissance?: string;
    sexe: Sexe;
    nationalite: string;
    pays_provenance: string;
    type_personne: TypePersonne;
    contact_local?: string;
    hotel_id?: string;
    commentaire_medical?: string;
    created_at: string;
    created_by: string;
    updated_at?: string; // ★ added v4
    updated_by?: string; // ★ added v4
    deleted_at?: string; // ★ added v4
    deleted_by?: string; // ★ added v4
}

export interface Vaccin {
    vaccin_id: string;
    code: string; // ★ added v3/v4
    libelle: string;
    libelle_court: string; // ★ added v3/v4
    obligatoire: boolean;
    actif: boolean;
    ordre_affichage: number; // ★ added v3/v4
    duree_validite_mois?: number; // ★ added v3/v4
    description?: string; // ★ added v3/v4
    created_at: string;
    created_by: string; // ★ added v3/v4
    updated_at?: string; // ★ added v3/v4
    updated_by?: string; // ★ added v3/v4
}

export interface StatutVaccinalPatient {
    statut_id: string;
    patient_id: string;
    vaccin_id: string;
    statut: StatutVaccin;
    date_vaccination?: string;
    date_expiration?: string;
    numero_certificat?: string;
    pays_vaccination?: string;
    commentaire?: string;
    agent_id: string;
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export interface Examen {
    examen_id: string;
    code: string;
    libelle: string;
    libelle_court: string;
    type_examen: TypeExamen;
    resultat_qualitatif: boolean;
    unite_resultat?: string;
    valeur_normale_min?: number;
    valeur_normale_max?: number;
    delai_rendu_heures?: number;
    necessite_jeun: boolean;
    actif: boolean;
    ordre_affichage: number;
    description?: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by?: string;
}

export interface TracingVol {
    tracing_id: string;
    patient_id: string;
    psf_agent_id: string;
    site_psf_id: string;
    numero_vol: string;
    compagnie_aerienne: string;
    aeroport_origine: string;
    numero_siege?: string;
    date_arrivee: string;
    temperature_criblage: number;
    symptomes_declares: boolean;
    detail_symptomes?: string;
    decision_frontiere: DecisionFrontiere;
    motif_decision?: string;
    statut_suivi: StatutSuivi; // ★ added v4
    zone_attente?: string; // ★ added v4
    datetime_entree_zone?: string; // ★ added v4
    datetime_sortie_zone?: string; // ★ added v4
    duree_attente_min?: number; // ★ added v4
    orientation_id?: string; // ★ added v4
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export interface Consultation {
    consultation_id: string;
    patient_id: string;
    site_id: string;
    agent_id: string;
    heure_arrivee: string;
    heure_consultation?: string;
    heure_sortie?: string;
    motif: string;
    symptomes?: Record<string, boolean>;
    ta_systolique?: number;
    ta_diastolique?: number;
    pouls?: number;
    temperature?: number;
    saturation_o2?: number;
    glasgow_score?: number;
    diagnostic_presomptif?: string;
    soins_prodigues?: string;
    decision: DecisionConsultation;
    orientation_id?: string;
    statut_saisie: 'OUVERTE' | 'VALIDEE' | 'CORRIGEE'; // ★ added v4
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export interface Orientation {
    orientation_id: string;
    origine: OrigineOrientation; // ★ added v4
    consultation_id?: string;
    tracing_id?: string; // ★ added v4
    appel_regulation_id?: string;
    fosa_destination_id: string;
    fosa_alternative_id?: string;
    regulateur_id?: string;
    moyen_transport: MoyenTransport;
    motif_evacuation: string;
    etat_patient_depart: EtatPatient;
    heure_decision: string;
    heure_depart?: string;
    heure_arrivee_fosa?: string;
    statut: StatutOrientation;
    motif_refus?: string;
    pec_id?: string;
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export interface AppelRegulation {
    appel_id: string;
    regulateur_id: string;
    site_appelant_id?: string;
    datetime_appel: string;
    type_appelant: TypeAppelant;
    nom_appelant?: string;
    telephone_appelant?: string;
    motif_appel: string;
    localisation: string;
    niveau_gravite: number;
    moyen_engage: MoyenEngage;
    conseil_telephone?: string;
    heure_depart_moyen?: string;
    heure_arrivee_moyen?: string;
    orientation_id?: string;
    statut: StatutAppel;
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export interface PriseEnCharge {
    pec_id: string;
    orientation_id?: string;
    fosa_id: string;
    medecin_id: string;
    patient_id: string;
    lit_id?: string;
    admission_datetime: string;
    etat_entree: EtatPatient;
    diagnostic_entree?: string;
    diagnostic_final?: string;
    libelle_diagnostic?: string;
    traitements?: { medicament: string; dose: string; voie: string; duree: string }[];
    oxygene_requis: boolean;
    reanimation: boolean;
    transfusion: boolean;
    sortie_datetime?: string;
    devenir?: Devenir;
    duree_sejour_heures?: number;
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export interface ResultatLabo {
    resultat_id: string;
    pec_id: string;
    examen_id: string; // ★ updated v4 (linked to Examen)
    prescripteur_id: string;
    agent_labo_id?: string;
    valeur?: string;
    valeur_numerique?: number;
    interpretation: Interpretation;
    datetime_prelevement: string;
    datetime_resultat?: string;
    commentaire?: string;
    fichier_url?: string;
    created_at: string;
    updated_at?: string;
    updated_by?: string;
    deleted_at?: string;
    deleted_by?: string;
}

export interface OccupationLit {
    occupation_id: string;
    lit_id: string;
    pec_id: string;
    agent_id: string;
    type_evenement: TypeEvenementLit;
    debut_occupation: string;
    fin_occupation?: string;
    motif_liberation?: MotifLiberation;
    duree_heures?: number;
    statut_lit_avant: StatutLit;
    created_at: string;
}

export interface ConfigurationAlerte {
    config_id: string;
    code_regle: string;
    libelle: string;
    entite_source: string;
    champ_surveille: string;
    type_comparaison: TypeComparaisonAlerte; // ★ added v4
    operateur: Operateur;
    seuil_niveau1?: number;
    seuil_niveau2?: number;
    seuil_niveau3?: number;
    canaux_notif: CanalNotification[];
    roles_destinataires: string[];
    active: boolean;
    cooldown_min: number;
    updated_at: string;
    updated_by?: string;
}

export interface Alerte {
    alerte_id: string;
    type_alerte: TypeAlerte;
    niveau: number;
    site_id?: string;
    source_entite: string;
    source_id?: string;
    titre: string;
    message: string;
    valeur_declenchante?: string;
    seuil_configure?: string;
    datetime_declenchement: string;
    datetime_reception_pc?: string;
    statut: StatutAlerte;
    prise_en_charge_par?: string;
    datetime_pec?: string;
    resolu_par?: string;
    datetime_resolution?: string;
    commentaire_resolution?: string;
}

export interface Notification {
    notif_id: string;
    alerte_id: string;
    utilisateur_id: string;
    canal: CanalNotification;
    sujet?: string;
    corps: string;
    statut: StatutNotification;
    tentatives: number;
    erreur?: string;
    datetime_envoi: string;
    datetime_livraison?: string;
    datetime_lecture?: string;
}

export interface Role {
    role_id: string;
    code_role: CodeRole;
    libelle: string;
    description?: string;
    niveau_acces: number;
    permissions: Record<string, Record<string, boolean>>;
    actif: boolean;
}

export interface Utilisateur {
    user_id: string;
    login: string;
    password_hash: string;
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string;
    role_id: string;
    site_principal_id?: string;
    sites_autorises?: string[];
    actif: boolean;
    derniere_connexion?: string;
    nb_echecs_connexion: number;
    bloque_jusqu_a?: string;
    token_refresh?: string;
    session_expiry?: string;
    force_pwd_change: boolean;
    created_at: string;
    created_by?: string;
}

export interface AuditLog {
    log_id: string;
    user_id: string;
    action: ActionAudit;
    entite: string;
    entite_id?: string;
    ancienne_valeur?: Record<string, unknown>;
    nouvelle_valeur?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    site_id?: string;
    datetime_action: string;
    duree_ms?: number;
}

export interface Sitrep {
    sitrep_id: string;
    date_rapport: string;
    jour_evenement: number;
    auteur_id: string;
    total_consultations: number;
    total_evacuations: number;
    total_hospitalisations: number;
    total_deces: number;
    taux_evacuation_pct?: number;
    delai_pec_moy_min?: number;
    occupation_lits_pct?: number;
    occupation_vip_pct?: number;
    occupation_standard_pct?: number;
    occupation_rea_pct?: number;
    nb_alertes_niveau1: number;
    nb_alertes_niveau2: number;
    nb_alertes_niveau3: number;
    nb_vaccins_non_conformes: number;
    nb_orientations_psf_reference: number; // ★ v4
    nb_orientations_psf_isolement: number; // ★ v4
    duree_moy_attente_zone_min: number; // ★ v4
    nb_voyageurs_zone_tampon_snapshot: number; // ★ v4
    nb_examens_prescrits: number; // ★ v4
    nb_resultats_en_retard: number; // ★ v4
    donnees_par_site: any;
    top_diagnostics: any;
    top_examens: any; // ★ v4
    commentaire_epi?: string;
    recommandations?: string;
    statut: StatutSitrep;
    datetime_generation: string;
    datetime_validation?: string;
    destinataires?: string[];
}
