# Modèle Logique de Données (MLD) — Système Intégral
## Application SGI — Couverture Sanitaire · OMC Yaoundé 2026

> **Version 4.0 · Février 2026**
>
> Modifications v4.0 :
> - `TRACING_VOL` : ajout `statut_suivi`, `zone_attente`, `datetime_entree_zone`, `datetime_sortie_zone`, `duree_attente_min`, `orientation_id` — suivi complet des zones tampon PSF
> - `ORIENTATION` : ajout `origine` ENUM — distingue PSF_REFERENCE_TEST | PSF_ISOLEMENT | PMA_EVACUATION | REGULATION
> - `CATALOGUE_PRODUIT` : ajout `necessite_lot` BOOLEAN — traçabilité de lot par produit
> - `CONFIGURATION_ALERTE` : ajout `type_comparaison` ENUM — moteur de règles enrichi
> - `SITREP` : ajout KPI zones tampon et orientations PSF
> - `AUDIT_LOG` : ajout valeur ENUM `STATUT_CHANGE`
> - `EXAMEN` ★ : nouvelle table référentiel des examens de laboratoire (25e table)
> - `RESULTAT_LABO` : refonte — lié à `EXAMEN`, suppression des champs portés par le référentiel
>
> Base cible : PostgreSQL 15+

---

## SOMMAIRE

1. [Conventions](#1-conventions)
2. [Vue d'ensemble — 25 tables](#2-vue-densemble--25-tables)
3. [Domaine — Référentiel](#3-domaine--référentiel)
4. [Domaine — Référentiel Vaccinations](#4-domaine--référentiel-vaccinations)
5. [Domaine — Référentiel Examens ★](#5-domaine--référentiel-examens-)
6. [Domaine — Collecte & Criblage](#6-domaine--collecte--criblage)
7. [Domaine — Régulation & Urgences](#7-domaine--régulation--urgences)
8. [Domaine — Soins Hospitaliers](#8-domaine--soins-hospitaliers)
9. [Domaine — Gestion des Lits](#9-domaine--gestion-des-lits)
10. [Domaine — Ressources & Logistique](#10-domaine--ressources--logistique)
11. [Domaine — Alertes & Notifications](#11-domaine--alertes--notifications)
12. [Domaine — Sécurité & Auth](#12-domaine--sécurité--auth)
13. [Domaine — Intégration & Rapports](#13-domaine--intégration--rapports)
14. [Récapitulatif des relations](#14-récapitulatif-des-relations)
15. [Triggers & règles d'intégrité](#15-triggers--règles-dintégrité)
16. [Journal des modifications](#16-journal-des-modifications)

---

## 1. Conventions

| Symbole | Signification |
|---|---|
| `PK` | Clé primaire — `UUID` généré (v4) sauf mention contraire |
| `FK →` | Clé étrangère vers la table indiquée |
| `NOT NULL` | Champ obligatoire |
| `NULL` | Champ optionnel |
| `UNIQUE` | Valeur unique dans la table |
| `ENUM(…)` | Valeur parmi une liste fermée |
| `DEFAULT x` | Valeur par défaut |
| `[calculé]` | Champ mis à jour automatiquement par trigger |
| `[audit]` | Valeur capturée avant/après pour traçabilité |
| `[supprimé]` | Champ retiré dans cette version |
| `★` | Nouveau dans la version 4.0 |
| `✎` | Modifié dans la version 4.0 |

---

## 2. Vue d'ensemble — 25 tables

| # | Domaine | Tables | Nb | Δ v3→v4 |
|---|---|---|:---:|---|
| 1 | Référentiel | SITE | 1 | — |
| 2 | Référentiel Vaccinations | VACCIN, STATUT_VACCINAL_PATIENT | 2 | — |
| 3 | **Référentiel Examens ★** | **EXAMEN** | **1** | **+1 table** |
| 4 | Collecte & Criblage | PATIENT, TRACING_VOL ✎, CONSULTATION | 3 | TRACING_VOL enrichi |
| 5 | Régulation & Urgences | ORIENTATION ✎, APPEL_REGULATION | 2 | ORIENTATION enrichie |
| 6 | Soins Hospitaliers | PRISE_EN_CHARGE, RESULTAT_LABO ✎ | 2 | RESULTAT_LABO refondu |
| 7 | Gestion des Lits | CATEGORIE_LIT, LIT, OCCUPATION_LIT | 3 | — |
| 8 | Ressources & Logistique | CATALOGUE_PRODUIT ✎, STOCK, CONSOMMATION_STOCK | 3 | necessite_lot ajouté |
| 9 | Alertes & Notifications | CONFIGURATION_ALERTE ✎, ALERTE, NOTIFICATION | 3 | type_comparaison ajouté |
| 10 | Sécurité & Auth | ROLE, UTILISATEUR, AUDIT_LOG ✎ | 3 | STATUT_CHANGE ajouté |
| 11 | Intégration & Rapports | MASTER_FACILITY_LIST, SYNC_DHIS2, SITREP ✎ | 3 | KPI zones tampon |
| | **Total** | | **25** | **+1 table · 7 tables enrichies** |

---

### Schéma de navigation inter-domaines

```
[Référentiels]
  VACCIN ◄────────────────────────────────────────────┐
  EXAMEN ◄──────────────────────────────────┐         │
  CATEGORIE_LIT ◄──────────────┐            │         │
                               │            │         │
[PSF / Frontière]              │            │         │
  PATIENT ──── STATUT_VACCINAL_PATIENT ─────│─────────┘
     │                                      │
     ├──── TRACING_VOL ─────────────────────│─── orientation_id ──► ORIENTATION
     │       │ statut_suivi                 │
     │       ▼                              │
[PMA / Poste Médical]                       │
  CONSULTATION ──── CONSOMMATION_STOCK ─────│─── STOCK ──── CATALOGUE_PRODUIT
       │                                    │
       │ decision = EVACUATION_FOSA         │
       ▼                                    │
  ORIENTATION ◄──── APPEL_REGULATION        │
    (origine)                               │
       │                                    │
       ▼                                    │
[FOSA / Hôpital]                            │
  PRISE_EN_CHARGE ──── RESULTAT_LABO ───────┘
       │                  (examen_id FK → EXAMEN)
       ▼
  OCCUPATION_LIT ──── LIT ──── CATEGORIE_LIT
       │
       ▼
[Coordination]
  ALERTE ──── NOTIFICATION ──── UTILISATEUR ──── ROLE
       │
       ▼
  SITREP ──── SYNC_DHIS2 ──── MASTER_FACILITY_LIST
```

---

## 3. Domaine — Référentiel

---

### TABLE : `SITE`

> Tout lieu physique du dispositif sanitaire : PSF, PMA, FOSA, Centre de Régulation.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `site_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code_site` | `VARCHAR(20)` | `UNIQUE NOT NULL` | NON | Code court invariant (ex : PSF-NSI, PMA-HILTON, FOSA-CHU) |
| `nom` | `VARCHAR(200)` | `NOT NULL` | NON | Nom officiel du site |
| `type_site` | `ENUM` | `NOT NULL` | NON | `PSF` \| `PMA_HOTEL` \| `PMA_PALAIS` \| `PMA_HV` \| `FOSA` \| `REGULATION` \| `AUTRE` |
| `adresse` | `TEXT` | — | OUI | Adresse physique complète |
| `latitude` | `DECIMAL(9,6)` | — | OUI | Coordonnée GPS latitude (WGS84) |
| `longitude` | `DECIMAL(9,6)` | — | OUI | Coordonnée GPS longitude (WGS84) |
| `capacite_lits` | `SMALLINT` | `DEFAULT 0` `[calculé]` | NON | Total lits actifs — recalculé par trigger sur LIT |
| `lits_occupes` | `SMALLINT` | `DEFAULT 0` `[calculé]` | NON | Lits occupés — recalculé par trigger sur OCCUPATION_LIT |
| `seuil_alerte_lits` | `SMALLINT` | `DEFAULT 75` | NON | Seuil d'occupation (%) déclenchant une alerte |
| `dhis2_org_unit_id` | `VARCHAR(50)` | `UNIQUE` | OUI | ID DHIS2 — obligatoire si FOSA |
| `mfl_facility_id` | `VARCHAR(50)` | `FK → MASTER_FACILITY_LIST` | OUI | Code MFL national |
| `responsable_id` | `UUID` | `FK → UTILISATEUR` | OUI | Utilisateur responsable |
| `telephone` | `VARCHAR(20)` | — | OUI | Téléphone principal |
| `actif` | `BOOLEAN` | `DEFAULT true` | NON | Site actif pendant l'événement |
| `heure_ouverture` | `TIME` | — | OUI | Heure d'ouverture quotidienne |
| `heure_fermeture` | `TIME` | — | OUI | Heure de fermeture quotidienne |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |

**Contraintes & Index :**

```
- dhis2_org_unit_id NOT NULL si type_site = 'FOSA'
- lits_occupes >= 0                                     [CHECK]
- lits_occupes <= capacite_lits                         [CHECK]
- INDEX (type_site)
- INDEX (actif)
```

---

## 4. Domaine — Référentiel Vaccinations

---

### TABLE : `VACCIN`

> Référentiel des vaccinations gérées dans le système — administrable par l'Admin sans redéploiement.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `vaccin_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code` | `VARCHAR(50)` | `UNIQUE NOT NULL` | NON | Code technique invariant (ex : `FIEVRE_JAUNE`, `COVID19`) |
| `libelle` | `VARCHAR(200)` | `NOT NULL` | NON | Libellé affiché dans le formulaire de criblage |
| `libelle_court` | `VARCHAR(50)` | `NOT NULL` | NON | Abréviation pour les tableaux |
| `obligatoire` | `BOOLEAN` | `NOT NULL DEFAULT false` | NON | Vaccin obligatoire — bloque l'AUTORISATION si absent |
| `actif` | `BOOLEAN` | `NOT NULL DEFAULT true` | NON | Affiché dans le formulaire de criblage si true |
| `ordre_affichage` | `SMALLINT` | `DEFAULT 99` | NON | Ordre de tri dans le formulaire |
| `duree_validite_mois` | `SMALLINT` | — | OUI | Durée de validité du certificat en mois |
| `description` | `TEXT` | — | OUI | Notes cliniques ou réglementaires |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `created_by` | `UUID` | `FK → UTILISATEUR` | NON | Admin ayant créé l'entrée |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de dernière modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Admin ayant effectué la dernière modification |

**Données de référence initiales :**

| code | libelle | obligatoire | actif | duree_validite_mois |
|---|---|:---:|:---:|:---:|
| `FIEVRE_JAUNE` | Fièvre jaune | OUI | OUI | 120 |
| `MENINGITE` | Méningite à méningocoque | NON | OUI | 36 |
| `COVID19` | COVID-19 | NON | OUI | 12 |
| `POLIO` | Poliomyélite | NON | OUI | — |
| `HEPATITE_B` | Hépatite B | NON | OUI | — |
| `MPOX` | Mpox (variole du singe) | NON | OUI | 24 |

**Contraintes & Index :**

```
- INDEX (actif, ordre_affichage)
- INDEX (obligatoire)
```

---

### TABLE : `STATUT_VACCINAL_PATIENT`

> Table de jonction patient/vaccin — traçabilité complète de la vérification vaccinale au criblage PSF.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `statut_id` | `UUID` | `PK` | NON | Identifiant unique |
| `patient_id` | `UUID` | `FK → PATIENT NOT NULL` | NON | Patient concerné |
| `vaccin_id` | `UUID` | `FK → VACCIN NOT NULL` | NON | Vaccin concerné |
| `statut` | `ENUM` | `NOT NULL` | NON | `VALIDE` \| `ABSENT` \| `PERIME` \| `DOUTEUX` \| `NON_VERIFIE` |
| `date_vaccination` | `DATE` | — | OUI | Date de vaccination indiquée sur le certificat |
| `date_expiration` | `DATE` | `[calculé]` | OUI | Calculée si `duree_validite_mois` renseigné |
| `numero_certificat` | `VARCHAR(100)` | — | OUI | Numéro ou référence du certificat |
| `pays_vaccination` | `CHAR(3)` | — | OUI | Code ISO du pays d'administration |
| `commentaire` | `TEXT` | — | OUI | Observation de l'agent PSF |
| `agent_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Agent PSF ayant vérifié |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de vérification |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |

**Contraintes & Index :**

```
- UNIQUE (patient_id, vaccin_id)
- date_expiration >= date_vaccination                   [CHECK]
- Calcul auto date_expiration si date_vaccination IS NOT NULL et vaccin.duree_validite_mois IS NOT NULL  [trigger]
- Alerte VACCIN si statut IN (ABSENT, PERIME, DOUTEUX) et vaccin.obligatoire = true  [trigger]
- INDEX (patient_id)
- INDEX (vaccin_id, statut)
```

---

## 5. Domaine — Référentiel Examens ★

---

### TABLE : `EXAMEN` ★

> Référentiel des examens de laboratoire et d'imagerie — administrable sans redéploiement.
> Remplace le champ texte libre `libelle_examen` et l'ENUM `type_examen` dans `RESULTAT_LABO`.
> Porte les valeurs normales de référence et le délai de rendu attendu.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `examen_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code` | `VARCHAR(50)` | `UNIQUE NOT NULL` | NON | Code technique invariant (ex : `TDR_PALU`, `NFS`, `PCR_COVID`) |
| `libelle` | `VARCHAR(200)` | `NOT NULL` | NON | Libellé complet affiché à la prescription |
| `libelle_court` | `VARCHAR(50)` | `NOT NULL` | NON | Abréviation pour les tableaux et listes |
| `type_examen` | `ENUM` | `NOT NULL` | NON | `BIOLOGIE` \| `IMAGERIE` \| `PCR` \| `SEROLOGIE` \| `BACTERIOLOGIE` \| `ANATOMO_PATHO` \| `AUTRE` |
| `resultat_qualitatif` | `BOOLEAN` | `NOT NULL DEFAULT false` | NON | `true` = résultat POSITIF/NEGATIF · `false` = valeur numérique |
| `unite_resultat` | `VARCHAR(30)` | — | OUI | Unité de mesure (ex : g/dL, UI/L) — NULL si qualitatif |
| `valeur_normale_min` | `DECIMAL(12,4)` | — | OUI | Borne inférieure normale — NULL si qualitatif |
| `valeur_normale_max` | `DECIMAL(12,4)` | — | OUI | Borne supérieure normale — NULL si qualitatif |
| `delai_rendu_heures` | `SMALLINT` | — | OUI | Délai attendu pour le résultat en heures (ex : 2 pour TDR, 48 pour hémoculture) |
| `necessite_jeun` | `BOOLEAN` | `NOT NULL DEFAULT false` | NON | Prélèvement à jeun requis |
| `actif` | `BOOLEAN` | `NOT NULL DEFAULT true` | NON | Affiché dans le formulaire de prescription si true |
| `ordre_affichage` | `SMALLINT` | `DEFAULT 99` | NON | Ordre de tri dans le formulaire |
| `description` | `TEXT` | — | OUI | Notes cliniques, indications, précautions |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `created_by` | `UUID` | `FK → UTILISATEUR` | NON | Admin ayant créé l'entrée |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Admin ayant modifié |

**Données de référence initiales :**

| code | libelle | type | qualitatif | unite | min | max | delai_h |
|---|---|---|:---:|---|:---:|:---:|:---:|
| `TDR_PALU` | Test Rapide Paludisme | PCR | OUI | — | — | — | 1 |
| `PCR_COVID` | PCR COVID-19 | PCR | OUI | — | — | — | 6 |
| `MPOX_PCR` | PCR Mpox | PCR | OUI | — | — | — | 24 |
| `NFS` | Numération Formule Sanguine | BIOLOGIE | NON | — | — | — | 4 |
| `GLYCEMIE` | Glycémie à jeun | BIOLOGIE | NON | mmol/L | 3.9 | 5.5 | 2 |
| `CREATININE` | Créatinine sérique | BIOLOGIE | NON | µmol/L | 53 | 115 | 4 |
| `TRANSAMINASES` | ASAT/ALAT | BIOLOGIE | NON | UI/L | 0 | 40 | 4 |
| `SEROLOGIE_VIH` | Sérologie VIH | SEROLOGIE | OUI | — | — | — | 2 |
| `HEMO_CULTURE` | Hémoculture | BACTERIOLOGIE | OUI | — | — | — | 48 |
| `RX_THORAX` | Radiographie thoracique | IMAGERIE | OUI | — | — | — | 2 |
| `ECHO_ABDO` | Échographie abdominale | IMAGERIE | OUI | — | — | — | 4 |

**Contraintes & Index :**

```
- valeur_normale_min < valeur_normale_max si les deux sont renseignés  [CHECK]
- unite_resultat NOT NULL si resultat_qualitatif = false               [CHECK]
- valeur_normale_min IS NULL si resultat_qualitatif = true             [CHECK]
- delai_rendu_heures > 0 si renseigné                                  [CHECK]
- INDEX (actif, ordre_affichage)       -- chargement formulaire prescription
- INDEX (type_examen, actif)           -- filtres statistiques
```

---

## 6. Domaine — Collecte & Criblage

---

### TABLE : `PATIENT`

> Toute personne physique prise en charge durant l'événement OMC.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `patient_id` | `UUID` | `PK` | NON | Identifiant unique |
| `accreditation_id` | `VARCHAR(50)` | `UNIQUE NOT NULL` | NON | Numéro d'accréditation officielle OMC |
| `nom` | `VARCHAR(100)` | `NOT NULL` | NON | Nom de famille |
| `prenom` | `VARCHAR(100)` | `NOT NULL` | NON | Prénom(s) |
| `date_naissance` | `DATE` | — | OUI | Date de naissance |
| `sexe` | `ENUM` | `NOT NULL` | NON | `M` \| `F` \| `A` |
| `nationalite` | `CHAR(3)` | `NOT NULL` | NON | Code ISO 3166-1 alpha-3 |
| `pays_provenance` | `CHAR(3)` | `NOT NULL` | NON | Code ISO du pays d'origine du voyage |
| `type_personne` | `ENUM` | `NOT NULL` | NON | `DELEGUE` \| `JOURNALISTE` \| `VISITEUR` \| `EXPOSANT` \| `PERSONNEL` \| `AUTRE` |
| `contact_local` | `VARCHAR(20)` | — | OUI | Téléphone local pendant la conférence |
| `hotel_id` | `UUID` | `FK → SITE` | OUI | Hôtel d'hébergement |
| `commentaire_medical` | `TEXT` | — | OUI | Antécédents et allergies importants |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `created_by` | `UUID` | `FK → UTILISATEUR` | NON | Agent ayant créé la fiche |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de dernière modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié la fiche |
| `deleted_at` | `TIMESTAMP` | — | OUI | Soft delete — date de suppression logique |
| `deleted_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant archivé la fiche |

**Contraintes & Index :**

```
- INDEX (accreditation_id)
- INDEX (nom, prenom)
- Soft delete : deleted_at IS NOT NULL = fiche archivée
```

---

### TABLE : `TRACING_VOL` ✎

> Fiche de contact tracing collectée aux PSF aéroportuaires.
> **v4.0** : enrichie avec `statut_suivi` et les champs de suivi des zones tampon —
> permet de tracer le voyageur entre la décision frontière et sa prise en charge effective.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `tracing_id` | `UUID` | `PK` | NON | Identifiant unique |
| `patient_id` | `UUID` | `FK → PATIENT NOT NULL` | NON | Patient concerné |
| `psf_agent_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Agent PSF ayant collecté la fiche |
| `site_psf_id` | `UUID` | `FK → SITE NOT NULL` | NON | PSF de collecte |
| `numero_vol` | `VARCHAR(20)` | `NOT NULL` | NON | Numéro IATA du vol (ex : AF0572) |
| `compagnie_aerienne` | `VARCHAR(100)` | `NOT NULL` | NON | Nom de la compagnie |
| `aeroport_origine` | `CHAR(3)` | `NOT NULL` | NON | Code IATA aéroport de départ |
| `numero_siege` | `VARCHAR(10)` | — | OUI | Siège dans l'avion (ex : 23C) |
| `date_arrivee` | `TIMESTAMP` | `NOT NULL` | NON | Date et heure d'atterrissage |
| `temperature_criblage` | `DECIMAL(4,1)` | `NOT NULL` | NON | Température mesurée au criblage (°C) |
| `symptomes_declares` | `BOOLEAN` | `DEFAULT false` | NON | Déclaration de symptômes à l'arrivée |
| `detail_symptomes` | `TEXT` | — | OUI | Description des symptômes déclarés |
| `decision_frontiere` | `ENUM` | `NOT NULL` | NON | `AUTORISATION` \| `REFERENCE_TEST` \| `ISOLEMENT` \| `REFOULEMENT` |
| `motif_decision` | `TEXT` | — | OUI | Obligatoire si décision ≠ AUTORISATION |
| `statut_suivi` | `ENUM` | `NOT NULL DEFAULT 'AUTORISE'` `★` | NON | Voir table des valeurs ci-dessous |
| `zone_attente` | `VARCHAR(100)` | — `★` | OUI | Zone physique d'attente (ex : "Salle isolement NSI - Zone B") |
| `datetime_entree_zone` | `TIMESTAMP` | — `★` | OUI | Heure d'entrée dans la zone tampon |
| `datetime_sortie_zone` | `TIMESTAMP` | — `★` | OUI | Heure de sortie de la zone tampon — mise à jour à la prise en charge |
| `duree_attente_min` | `INTEGER` | `[calculé]` `★` | OUI | Durée en minutes dans la zone tampon |
| `orientation_id` | `UUID` | `FK → ORIENTATION` `★` | OUI | Orientation générée suite à REFERENCE_TEST ou ISOLEMENT |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de saisie |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |

**Valeurs de `statut_suivi` ★ :**

| Valeur | Signification | Décision associée |
|---|---|---|
| `AUTORISE` | Voyageur entré normalement dans le dispositif | AUTORISATION |
| `EN_ATTENTE_TEST` | Décision prise — en zone tampon, attend le PMA de test | REFERENCE_TEST |
| `EN_COURS_TEST` | Consultation PMA ouverte — test en cours | REFERENCE_TEST |
| `TEST_NEGATIF` | Résultat négatif — autorisé à rejoindre l'événement | REFERENCE_TEST |
| `TEST_POSITIF_FOSA` | Résultat positif — orientation vers FOSA déclenchée | REFERENCE_TEST |
| `EN_ISOLEMENT` | En zone tampon d'isolement — attend SMUR ou ambulance | ISOLEMENT |
| `TRANSFERE_FOSA` | Orientation vers FOSA créée — patient en transit | ISOLEMENT / REFERENCE_TEST |
| `HOSPITALISE` | Patient admis en FOSA — PRISE_EN_CHARGE ouverte | REFERENCE_TEST / ISOLEMENT |
| `REFOULE` | Voyageur refoulé à la frontière | REFOULEMENT |
| `CLOTURE` | Parcours terminé — sorti du dispositif de surveillance | Toutes |

**Cycle de vie du `statut_suivi` ★ :**

```
AUTORISATION ──► AUTORISE ──► CLOTURE

REFERENCE_TEST ──► EN_ATTENTE_TEST
                        │
                        ▼ (consultation PMA ouverte)
                   EN_COURS_TEST
                        │
               ┌────────┴────────┐
               ▼                 ▼
          TEST_NEGATIF    TEST_POSITIF_FOSA
               │                 │
               ▼                 ▼
           AUTORISE         TRANSFERE_FOSA
               │                 │
               ▼                 ▼
           CLOTURE          HOSPITALISE ──► CLOTURE

ISOLEMENT ──► EN_ISOLEMENT
                   │
                   ▼ (orientation créée)
              TRANSFERE_FOSA
                   │
                   ▼ (admission confirmée)
              HOSPITALISE ──► CLOTURE

REFOULEMENT ──► REFOULE ──► CLOTURE
```

**Contraintes & Index :**

```
- temperature_criblage BETWEEN 34.0 AND 45.0                              [CHECK]
- motif_decision NOT NULL si decision_frontiere != 'AUTORISATION'         [CHECK]
- statut_suivi = 'AUTORISE' si decision_frontiere = 'AUTORISATION'        [CHECK]
- datetime_sortie_zone >= datetime_entree_zone                            [CHECK]
- duree_attente_min calculé par trigger : datetime_sortie_zone - datetime_entree_zone
- orientation_id NOT NULL si decision_frontiere IN ('REFERENCE_TEST','ISOLEMENT')  [trigger]
- Alerte KPI niveau 1 si temperature_criblage >= 38.0°C                  [trigger]
- Alerte VACCIN niveau 1 si vaccin obligatoire non VALIDE                 [trigger]
- Alerte DUREE_ECOULEE si duree_attente_min > seuil (via CONFIGURATION_ALERTE)
- INDEX (numero_vol, date_arrivee)
- INDEX (patient_id)
- INDEX (statut_suivi)           -- dashboard zones tampon temps réel
- INDEX (site_psf_id, statut_suivi)
```

---

### TABLE : `CONSULTATION`

> Passage d'un patient dans un PMA ou PSF. Entité centrale de collecte médicale.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `consultation_id` | `UUID` | `PK` | NON | Identifiant unique |
| `patient_id` | `UUID` | `FK → PATIENT NOT NULL` | NON | Patient consulté |
| `site_id` | `UUID` | `FK → SITE NOT NULL` | NON | Site de la consultation |
| `agent_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Agent médical |
| `heure_arrivee` | `TIMESTAMP` | `NOT NULL` | NON | Heure d'arrivée du patient |
| `heure_consultation` | `TIMESTAMP` | — | OUI | Heure de début effectif |
| `heure_sortie` | `TIMESTAMP` | — | OUI | Heure de sortie |
| `motif` | `TEXT` | `NOT NULL` | NON | Motif déclaré par le patient |
| `symptomes` | `JSONB` | — | OUI | `{ "cephalees": true, "fievre": true, … }` |
| `ta_systolique` | `SMALLINT` | — | OUI | Tension artérielle systolique (mmHg) |
| `ta_diastolique` | `SMALLINT` | — | OUI | Tension artérielle diastolique (mmHg) |
| `pouls` | `SMALLINT` | — | OUI | Fréquence cardiaque (bpm) |
| `temperature` | `DECIMAL(4,1)` | — | OUI | Température corporelle (°C) |
| `saturation_o2` | `SMALLINT` | — | OUI | Saturation SpO2 (%) |
| `glasgow_score` | `SMALLINT` | — | OUI | Score de Glasgow (3–15) |
| `diagnostic_presomptif` | `VARCHAR(255)` | — | OUI | Diagnostic initial posé sur place |
| `soins_prodigues` | `TEXT` | — | OUI | Soins et traitements administrés |
| `decision` | `ENUM` | `NOT NULL` | NON | `RETOUR_POSTE` \| `EVACUATION_FOSA` \| `HOSPITALISATION` \| `OBSERVATION` \| `DECES` |
| `orientation_id` | `UUID` | `FK → ORIENTATION` | OUI | Orientation générée si évacuation |
| `statut_saisie` | `ENUM` | `NOT NULL DEFAULT 'OUVERTE'` | NON | `OUVERTE` \| `VALIDEE` \| `CORRIGEE` |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |

**Contraintes & Index :**

```
- heure_consultation >= heure_arrivee                   [CHECK]
- heure_sortie >= heure_consultation                    [CHECK]
- temperature BETWEEN 34.0 AND 45.0                     [CHECK]
- saturation_o2 BETWEEN 0 AND 100                       [CHECK]
- glasgow_score BETWEEN 3 AND 15                        [CHECK]
- ta_systolique > ta_diastolique                        [CHECK]
- INDEX (site_id, heure_arrivee DESC)
- INDEX (patient_id)
```

---

## 7. Domaine — Régulation & Urgences

---

### TABLE : `ORIENTATION` ✎

> Transfert d'un patient vers une FOSA de référence.
> **v4.0** : ajout du champ `origine` pour distinguer la source de l'orientation.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `orientation_id` | `UUID` | `PK` | NON | Identifiant unique |
| `origine` | `ENUM` | `NOT NULL` `★` | NON | `PSF_REFERENCE_TEST` \| `PSF_ISOLEMENT` \| `PMA_EVACUATION` \| `REGULATION` |
| `consultation_id` | `UUID` | `FK → CONSULTATION` | OUI | Consultation d'origine (si PMA_EVACUATION) |
| `tracing_id` | `UUID` | `FK → TRACING_VOL` `★` | OUI | Fiche de criblage d'origine (si PSF_*) |
| `appel_regulation_id` | `UUID` | `FK → APPEL_REGULATION` | OUI | Appel de régulation (si REGULATION) |
| `fosa_destination_id` | `UUID` | `FK → SITE NOT NULL` | NON | FOSA destinataire |
| `fosa_alternative_id` | `UUID` | `FK → SITE` | OUI | FOSA alternative si refus |
| `regulateur_id` | `UUID` | `FK → UTILISATEUR` | OUI | Médecin régulateur coordonnateur |
| `moyen_transport` | `ENUM` | `NOT NULL` | NON | `AMBULANCE` \| `SMUR` \| `TAXI` \| `VEHICULE_PERSO` \| `MARCHE` |
| `motif_evacuation` | `TEXT` | `NOT NULL` | NON | Justification clinique |
| `etat_patient_depart` | `ENUM` | `NOT NULL` | NON | `STABLE` \| `GRAVE` \| `CRITIQUE` |
| `heure_decision` | `TIMESTAMP` | `NOT NULL` | NON | Heure de décision |
| `heure_depart` | `TIMESTAMP` | — | OUI | Heure de départ |
| `heure_arrivee_fosa` | `TIMESTAMP` | — | OUI | Heure d'arrivée à la FOSA |
| `statut` | `ENUM` | `NOT NULL` | NON | `EN_ATTENTE` \| `EN_COURS` \| `ARRIVE` \| `REFUSE` \| `ANNULE` \| `DECES_TRANSIT` |
| `motif_refus` | `TEXT` | — | OUI | Obligatoire si statut = REFUSE |
| `pec_id` | `UUID` | `FK → PRISE_EN_CHARGE` | OUI | Hospitalisation résultante |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |

**Contraintes & Index :**

```
- Exactement une source :
  consultation_id IS NOT NULL     si origine = 'PMA_EVACUATION'
  tracing_id IS NOT NULL          si origine IN ('PSF_REFERENCE_TEST','PSF_ISOLEMENT')
  appel_regulation_id IS NOT NULL si origine = 'REGULATION'           [CHECK]
- heure_depart >= heure_decision                        [CHECK]
- heure_arrivee_fosa >= heure_depart                    [CHECK]
- motif_refus NOT NULL si statut = 'REFUSE'             [CHECK]
- KPI delai_pec = heure_arrivee_fosa - heure_decision
- INDEX (statut)
- INDEX (fosa_destination_id, statut)
- INDEX (origine, statut)          -- stats par type d'orientation
```

---

### TABLE : `APPEL_REGULATION`

> Appel reçu par le Centre de Régulation Médicale.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `appel_id` | `UUID` | `PK` | NON | Identifiant unique |
| `regulateur_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Médecin régulateur |
| `site_appelant_id` | `UUID` | `FK → SITE` | OUI | Site à l'origine de l'appel |
| `datetime_appel` | `TIMESTAMP` | `NOT NULL` | NON | Horodatage de réception |
| `type_appelant` | `ENUM` | `NOT NULL` | NON | `PMA` \| `PSF` \| `HOTEL` \| `DELEGATION` \| `POLICE` \| `AUTRE` |
| `nom_appelant` | `VARCHAR(200)` | — | OUI | Nom de l'appelant |
| `telephone_appelant` | `VARCHAR(20)` | — | OUI | Numéro d'appel |
| `motif_appel` | `TEXT` | `NOT NULL` | NON | Description de la situation |
| `localisation` | `VARCHAR(255)` | `NOT NULL` | NON | Localisation précise |
| `niveau_gravite` | `SMALLINT` | `NOT NULL` | NON | Échelle 1 (mineur) à 5 (critique) |
| `moyen_engage` | `ENUM` | `NOT NULL` | NON | `CONSEIL_TEL` \| `MEDECIN_SITE` \| `AMBULANCE` \| `SMUR` \| `AUCUN` |
| `conseil_telephone` | `TEXT` | — | OUI | Avis médical donné par téléphone |
| `heure_depart_moyen` | `TIMESTAMP` | — | OUI | Heure de départ du moyen |
| `heure_arrivee_moyen` | `TIMESTAMP` | — | OUI | Heure d'arrivée sur les lieux |
| `orientation_id` | `UUID` | `FK → ORIENTATION` | OUI | Orientation générée |
| `statut` | `ENUM` | `NOT NULL` | NON | `EN_COURS` \| `RESOLU` \| `TRANSMIS` \| `ANNULE` |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |

**Contraintes & Index :**

```
- niveau_gravite BETWEEN 1 AND 5                        [CHECK]
- heure_arrivee_moyen >= heure_depart_moyen             [CHECK]
- KPI délai_réponse = heure_depart_moyen - datetime_appel (cible < 10 min)
- Alerte niveau 2 si niveau_gravite >= 4                [trigger]
- INDEX (datetime_appel DESC)
- INDEX (statut)
```

---

## 8. Domaine — Soins Hospitaliers

---

### TABLE : `PRISE_EN_CHARGE`

> Hospitalisation et prise en charge médicale complète en FOSA.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `pec_id` | `UUID` | `PK` | NON | Identifiant unique |
| `orientation_id` | `UUID` | `FK → ORIENTATION` | OUI | Orientation entrante |
| `fosa_id` | `UUID` | `FK → SITE NOT NULL` | NON | FOSA d'hospitalisation |
| `medecin_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Médecin traitant |
| `patient_id` | `UUID` | `FK → PATIENT NOT NULL` | NON | Patient hospitalisé |
| `lit_id` | `UUID` | `FK → LIT` | OUI | Lit attribué |
| `admission_datetime` | `TIMESTAMP` | `NOT NULL` | NON | Date et heure d'admission |
| `etat_entree` | `ENUM` | `NOT NULL` | NON | `STABLE` \| `GRAVE` \| `CRITIQUE` \| `INCONSCIENT` |
| `diagnostic_entree` | `VARCHAR(255)` | — | OUI | Diagnostic présomptif à l'entrée |
| `diagnostic_final` | `VARCHAR(20)` | — | OUI | Code CIM-11 du diagnostic final |
| `libelle_diagnostic` | `TEXT` | — | OUI | Libellé complet |
| `traitements` | `JSONB` | — | OUI | `[{ medicament, dose, voie, duree }]` |
| `oxygene_requis` | `BOOLEAN` | `DEFAULT false` | NON | Patient sous oxygène |
| `reanimation` | `BOOLEAN` | `DEFAULT false` | NON | Passage en réanimation |
| `transfusion` | `BOOLEAN` | `DEFAULT false` | NON | Transfusion réalisée |
| `sortie_datetime` | `TIMESTAMP` | — | OUI | Date et heure de sortie |
| `devenir` | `ENUM` | — | OUI | `GUERISON` \| `EVACUATION_SANITAIRE` \| `RETOUR_DOMICILE` \| `HEBERGEMENT_POST_SOINS` \| `DECES` |
| `duree_sejour_heures` | `INTEGER` | `[calculé]` | OUI | Durée totale en heures |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Médecin ayant modifié |

**Contraintes & Index :**

```
- sortie_datetime >= admission_datetime                 [CHECK]
- devenir NOT NULL si sortie_datetime IS NOT NULL       [CHECK]
- diagnostic_final (code CIM-11) obligatoire à la sortie  [trigger]
- INDEX (fosa_id, admission_datetime DESC)
- INDEX (lit_id)
- INDEX (patient_id)
```

---

### TABLE : `RESULTAT_LABO` ✎

> Résultats des examens prescrits en FOSA.
> **v4.0** : refonte — lié à `EXAMEN` (référentiel). Suppression de `type_examen` ENUM,
> `libelle_examen` texte libre, `valeur_normale_min/max` et `unite` (portés par le référentiel).

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `resultat_id` | `UUID` | `PK` | NON | Identifiant unique |
| `pec_id` | `UUID` | `FK → PRISE_EN_CHARGE NOT NULL` | NON | Prise en charge associée |
| `examen_id` | `UUID` | `FK → EXAMEN NOT NULL` `★` | NON | Examen prescrit (remplace type_examen + libelle_examen) |
| `prescripteur_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Médecin prescripteur |
| `agent_labo_id` | `UUID` | `FK → UTILISATEUR` | OUI | Technicien de laboratoire |
| `valeur` | `TEXT` | — | OUI | Résultat brut (qualitatif ou numérique en texte) |
| `valeur_numerique` | `DECIMAL(12,4)` | — | OUI | Valeur numérique pour calculs statistiques |
| `interpretation` | `ENUM` | `NOT NULL DEFAULT 'EN_ATTENTE'` | NON | `NORMAL` \| `ANORMAL_BAS` \| `ANORMAL_HAUT` \| `POSITIF` \| `NEGATIF` \| `CRITIQUE` \| `EN_ATTENTE` |
| `datetime_prelevement` | `TIMESTAMP` | `NOT NULL` | NON | Date et heure du prélèvement |
| `datetime_resultat` | `TIMESTAMP` | — | OUI | Date de disponibilité du résultat |
| `commentaire` | `TEXT` | — | OUI | Commentaire clinique du biologiste ou médecin |
| `fichier_url` | `VARCHAR(500)` | — | OUI | URL vers le fichier résultat (PDF, image) |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de prescription |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |
| `deleted_at` | `TIMESTAMP` | — | OUI | Soft delete — annulation d'un résultat erroné |
| `deleted_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant annulé |

**Champs supprimés en v4 (portés par `EXAMEN`) :**

```
[supprimé] type_examen        → EXAMEN.type_examen
[supprimé] libelle_examen     → EXAMEN.libelle
[supprimé] valeur_normale_min → EXAMEN.valeur_normale_min
[supprimé] valeur_normale_max → EXAMEN.valeur_normale_max
[supprimé] unite              → EXAMEN.unite_resultat
```

**Contraintes & Index :**

```
- datetime_resultat >= datetime_prelevement             [CHECK]
- valeur NOT NULL si interpretation != 'EN_ATTENTE'     [CHECK]
- Soft delete uniquement — pas de suppression physique
- Si interpretation = 'CRITIQUE' → ALERTE niveau 2      [trigger]
- Si datetime_prelevement + INTERVAL examen.delai_rendu_heures < NOW()
  ET interpretation = 'EN_ATTENTE'
  → ALERTE type=KPI niveau=1 "Résultat en retard"       [trigger]
- INDEX (pec_id, datetime_prelevement DESC)
- INDEX (examen_id, interpretation)   -- statistiques épidémio
```

---

## 9. Domaine — Gestion des Lits

---

### TABLE : `CATEGORIE_LIT`

> Référentiel des types de lits.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `categorie_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code` | `ENUM` | `UNIQUE NOT NULL` | NON | `VIP` \| `STANDARD` \| `REANIMATION` \| `ISOLATION` \| `URGENCE` |
| `libelle` | `VARCHAR(100)` | `NOT NULL` | NON | Libellé descriptif |
| `description` | `TEXT` | — | OUI | Description des équipements |
| `couleur_dashboard` | `VARCHAR(7)` | — | OUI | Code couleur hexadécimal (ex : `#8B5CF6`) |
| `actif` | `BOOLEAN` | `DEFAULT true` | NON | Catégorie active |

---

### TABLE : `LIT`

> Identité individuelle de chaque lit physique.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `lit_id` | `UUID` | `PK` | NON | Identifiant unique |
| `site_id` | `UUID` | `FK → SITE NOT NULL` | NON | FOSA propriétaire |
| `categorie_id` | `UUID` | `FK → CATEGORIE_LIT NOT NULL` | NON | Catégorie du lit |
| `numero_lit` | `VARCHAR(20)` | `NOT NULL` | NON | Numéro unique dans le site (ex : VIP-01) |
| `statut` | `ENUM` | `NOT NULL DEFAULT 'LIBRE'` `[calculé]` | NON | `LIBRE` \| `OCCUPE` \| `HORS_SERVICE` \| `RESERVE` |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` `[calculé]` | NON | Dernière mise à jour du statut |

**Contraintes & Index :**

```
- UNIQUE (site_id, numero_lit)
- INDEX (site_id, statut)
- INDEX (categorie_id, statut)
```

---

### TABLE : `OCCUPATION_LIT`

> Journal des événements d'occupation/libération — pattern event sourcing identique à CONSOMMATION_STOCK.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `occupation_id` | `UUID` | `PK` | NON | Identifiant unique |
| `lit_id` | `UUID` | `FK → LIT NOT NULL` | NON | Lit concerné |
| `pec_id` | `UUID` | `FK → PRISE_EN_CHARGE NOT NULL` | NON | Hospitalisation associée |
| `agent_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Agent ayant enregistré |
| `type_evenement` | `ENUM` | `NOT NULL` | NON | `OCCUPATION` \| `LIBERATION` \| `RESERVATION` \| `ANNULATION` |
| `debut_occupation` | `TIMESTAMP` | `NOT NULL` | NON | Date et heure d'attribution |
| `fin_occupation` | `TIMESTAMP` | — | OUI | Date de libération — NULL = encore occupé |
| `motif_liberation` | `ENUM` | — | OUI | `GUERISON` \| `TRANSFERT` \| `DECES` \| `ANNULATION` \| `AUTRE` |
| `duree_heures` | `DECIMAL(6,1)` | `[calculé]` | OUI | Durée d'occupation en heures |
| `statut_lit_avant` | `ENUM` | `NOT NULL` `[audit]` | NON | État du lit avant l'événement |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage |

**Contraintes & Index :**

```
- fin_occupation >= debut_occupation                    [CHECK]
- motif_liberation NOT NULL si type_evenement = 'LIBERATION'  [CHECK]
- UNIQUE (lit_id) WHERE fin_occupation IS NULL          -- un seul patient par lit
- INDEX (lit_id, debut_occupation DESC)
- INDEX (pec_id)
- INDEX (fin_occupation) WHERE fin_occupation IS NULL
```

---

## 10. Domaine — Ressources & Logistique

---

### TABLE : `CATALOGUE_PRODUIT` ✎

> Référentiel des produits médicaux et EPI.
> **v4.0** : ajout `necessite_lot` — traçabilité de lot obligatoire par produit.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `produit_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code_produit` | `VARCHAR(50)` | `UNIQUE NOT NULL` | NON | Code interne unique |
| `designation` | `VARCHAR(300)` | `NOT NULL` | NON | Désignation complète |
| `categorie` | `ENUM` | `NOT NULL` | NON | `MEDICAMENT` \| `EPI` \| `MATERIEL` \| `CONSOMMABLE` \| `AUTRE` |
| `dci` | `VARCHAR(200)` | — | OUI | Dénomination Commune Internationale |
| `forme` | `VARCHAR(100)` | — | OUI | Forme galénique |
| `dosage` | `VARCHAR(50)` | — | OUI | Dosage |
| `unite_base` | `VARCHAR(30)` | `NOT NULL` | NON | Unité de gestion (comprimé, flacon, pièce…) |
| `code_atc` | `VARCHAR(10)` | — | OUI | Code ATC OMS |
| `necessite_froid` | `BOOLEAN` | `DEFAULT false` | NON | Chaîne du froid requise |
| `necessite_lot` | `BOOLEAN` | `NOT NULL DEFAULT false` `★` | NON | Suivi de numéro de lot obligatoire pour ce produit |
| `actif` | `BOOLEAN` | `DEFAULT true` | NON | Produit actif dans le catalogue |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |

**Règle activée par `necessite_lot` ★ :**

```
Si CATALOGUE_PRODUIT.necessite_lot = true
  → STOCK.numero_lot NOT NULL à l'insertion     [trigger]
  → CONSOMMATION_STOCK.commentaire doit référencer le lot utilisé
```

---

### TABLE : `STOCK`

> Niveau d'un produit dans un site — calculé par trigger depuis CONSOMMATION_STOCK.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `stock_id` | `UUID` | `PK` | NON | Identifiant unique |
| `site_id` | `UUID` | `FK → SITE NOT NULL` | NON | Site propriétaire |
| `produit_id` | `UUID` | `FK → CATALOGUE_PRODUIT NOT NULL` | NON | Produit concerné |
| `quantite_disponible` | `INTEGER` | `NOT NULL DEFAULT 0` `[calculé]` | NON | Quantité disponible |
| `quantite_initiale` | `INTEGER` | `NOT NULL` | NON | Quantité à J-0 |
| `unite` | `VARCHAR(30)` | `NOT NULL` | NON | Unité de mesure |
| `seuil_alerte` | `INTEGER` | `NOT NULL` | NON | Seuil alerte niveau 1 |
| `seuil_critique` | `INTEGER` | `NOT NULL` | NON | Seuil alerte niveau 2 |
| `date_peremption` | `DATE` | — | OUI | Date de péremption du lot |
| `numero_lot` | `VARCHAR(50)` | — | OUI | Numéro de lot (obligatoire si produit.necessite_lot = true) |
| `emplacement` | `VARCHAR(100)` | — | OUI | Localisation physique dans le site |
| `agent_resp_id` | `UUID` | `FK → UTILISATEUR` | OUI | Responsable du stock |
| `derniere_maj` | `TIMESTAMP` | `DEFAULT NOW()` `[calculé]` | NON | Dernière mise à jour |
| `statut` | `ENUM` | `NOT NULL` `[calculé]` | NON | `NORMAL` \| `ALERTE` \| `CRITIQUE` \| `RUPTURE` \| `PERIME` |

**Contraintes & Index :**

```
- UNIQUE (site_id, produit_id)
- quantite_disponible >= 0                              [CHECK]
- seuil_critique <= seuil_alerte                        [CHECK]
- numero_lot NOT NULL si produit.necessite_lot = true   [trigger]
- INDEX (site_id, statut)
```

---

### TABLE : `CONSOMMATION_STOCK`

> Journal des mouvements de stock — append-only, immuable.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `conso_id` | `UUID` | `PK` | NON | Identifiant unique |
| `stock_id` | `UUID` | `FK → STOCK NOT NULL` | NON | Stock concerné |
| `consultation_id` | `UUID` | `FK → CONSULTATION` | OUI | Consultation à l'origine |
| `agent_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Agent ayant enregistré |
| `type_mouvement` | `ENUM` | `NOT NULL` | NON | `CONSOMMATION` \| `REAPPRO` \| `PERTE` \| `PEREMPTION` \| `INVENTAIRE` \| `TRANSFERT` |
| `quantite` | `INTEGER` | `NOT NULL` | NON | Quantité mouvementée (toujours positive) |
| `sens` | `ENUM` | `NOT NULL` | NON | `ENTREE` \| `SORTIE` |
| `stock_avant` | `INTEGER` | `NOT NULL` `[audit]` | NON | Niveau avant le mouvement |
| `stock_apres` | `INTEGER` | `NOT NULL` `[audit]` | NON | Niveau après le mouvement |
| `commentaire` | `TEXT` | — | OUI | Remarque libre (référence lot si necessite_lot) |
| `datetime_mouvement` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Date et heure du mouvement |

**Contraintes & Index :**

```
- quantite > 0                                          [CHECK]
- stock_apres >= 0                                      [CHECK]
- Aucun UPDATE ni DELETE — journal append-only
- INDEX (stock_id, datetime_mouvement DESC)
```

---

## 11. Domaine — Alertes & Notifications

---

### TABLE : `CONFIGURATION_ALERTE` ✎

> Règles du moteur d'alertes.
> **v4.0** : ajout `type_comparaison` — enrichit le moteur pour supporter
> des comparaisons de dates, de pourcentages et de durées écoulées.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `config_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code_regle` | `VARCHAR(100)` | `UNIQUE NOT NULL` | NON | Code de la règle |
| `libelle` | `VARCHAR(300)` | `NOT NULL` | NON | Description lisible |
| `entite_source` | `VARCHAR(100)` | `NOT NULL` | NON | Table source surveillée |
| `champ_surveille` | `VARCHAR(100)` | `NOT NULL` | NON | Champ ou indicateur surveillé |
| `type_comparaison` | `ENUM` | `NOT NULL DEFAULT 'VALEUR_NUMERIQUE'` `★` | NON | Voir valeurs ci-dessous |
| `operateur` | `ENUM` | `NOT NULL` | NON | `GT` \| `GTE` \| `LT` \| `LTE` \| `EQ` \| `NEQ` |
| `seuil_niveau1` | `DECIMAL(12,4)` | — | OUI | Seuil alerte niveau 1 — Information |
| `seuil_niveau2` | `DECIMAL(12,4)` | — | OUI | Seuil alerte niveau 2 — Urgence |
| `seuil_niveau3` | `DECIMAL(12,4)` | — | OUI | Seuil alerte niveau 3 — Crise |
| `canaux_notif` | `TEXT[]` | `NOT NULL` | NON | `{PUSH, SMS, EMAIL}` |
| `roles_destinataires` | `TEXT[]` | `NOT NULL` | NON | Rôles RBAC destinataires |
| `active` | `BOOLEAN` | `DEFAULT true` | NON | Règle active |
| `cooldown_min` | `INTEGER` | `DEFAULT 15` | NON | Délai minimum entre alertes identiques (min 5) |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Admin ayant modifié |

**Valeurs de `type_comparaison` ★ :**

| Valeur | Description | Exemple de règle |
|---|---|---|
| `VALEUR_NUMERIQUE` | Comparaison directe sur un nombre | `quantite_disponible < seuil_alerte` |
| `JOURS_RESTANTS` | Nombre de jours entre NOW() et une date cible | `date_peremption` dans moins de 30 jours |
| `POURCENTAGE` | Ratio calculé entre deux champs | `lits_occupes / capacite_lits > 75%` |
| `PRESENCE_VALEUR` | Champ non renseigné après un délai | `heure_arrivee_fosa` absente après 30 min |
| `DUREE_ECOULEE` | Minutes écoulées depuis un horodatage | `duree_attente_min` en zone tampon > 30 min |

**Règles pré-configurées dans le système :**

| code_regle | type_comparaison | seuil_n1 | seuil_n2 | seuil_n3 |
|---|---|:---:|:---:|:---:|
| `ALERTE_STOCK_BAS` | `VALEUR_NUMERIQUE` | seuil_alerte | seuil_critique | 0 |
| `ALERTE_PEREMPTION_MEDICAMENT` | `JOURS_RESTANTS` | 30 | 7 | 2 |
| `ALERTE_PEREMPTION_SANG` | `JOURS_RESTANTS` | 7 | 2 | 1 |
| `ALERTE_OCCUPATION_LITS` | `POURCENTAGE` | 75 | 90 | 100 |
| `ALERTE_ATTENTE_ZONE_TAMPON` | `DUREE_ECOULEE` | 30 | 60 | 90 |
| `ALERTE_RESULTAT_EN_RETARD` | `DUREE_ECOULEE` | delai_rendu_h | delai×2 | — |
| `ALERTE_ORIENTATION_SANS_SUITE` | `PRESENCE_VALEUR` | 30 | 60 | — |
| `ALERTE_TEMPERATURE_CRIBLAGE` | `VALEUR_NUMERIQUE` | 38.0 | 39.0 | 40.0 |
| `ALERTE_TAUX_EVACUATION` | `POURCENTAGE` | 2 | 5 | 10 |

---

### TABLE : `ALERTE`

> Alerte sanitaire ou opérationnelle — immuable après création.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `alerte_id` | `UUID` | `PK` | NON | Identifiant unique |
| `type_alerte` | `ENUM` | `NOT NULL` | NON | `STOCK` \| `KPI` \| `EPIDEMIO` \| `URGENCE_MEDICALE` \| `LIT` \| `VACCIN` \| `TRANSMISSION` \| `SECURITE` \| `AUTRE` |
| `niveau` | `SMALLINT` | `NOT NULL` | NON | `1` = Information \| `2` = Urgence \| `3` = Crise |
| `site_id` | `UUID` | `FK → SITE` | OUI | Site concerné |
| `source_entite` | `VARCHAR(50)` | `NOT NULL` | NON | Table source |
| `source_id` | `UUID` | — | OUI | UUID de l'enregistrement source |
| `titre` | `VARCHAR(255)` | `NOT NULL` | NON | Titre court |
| `message` | `TEXT` | `NOT NULL` | NON | Description détaillée — immuable |
| `valeur_declenchante` | `TEXT` | — | OUI | Valeur ayant déclenché l'alerte |
| `seuil_configure` | `TEXT` | — | OUI | Seuil franchi |
| `datetime_declenchement` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Heure de création — immuable |
| `datetime_reception_pc` | `TIMESTAMP` | — | OUI | Accusé de réception PC de crise |
| `statut` | `ENUM` | `NOT NULL DEFAULT 'ACTIVE'` | NON | `ACTIVE` \| `PRISE_EN_CHARGE` \| `RESOLUE` \| `IGNOREE` |
| `prise_en_charge_par` | `UUID` | `FK → UTILISATEUR` | OUI | Utilisateur ayant pris en charge |
| `datetime_pec` | `TIMESTAMP` | — | OUI | Heure de prise en charge |
| `resolu_par` | `UUID` | `FK → UTILISATEUR` | OUI | Utilisateur ayant résolu |
| `datetime_resolution` | `TIMESTAMP` | — | OUI | Heure de résolution |
| `commentaire_resolution` | `TEXT` | — | OUI | Description de la résolution |

**Contraintes & Index :**

```
- niveau BETWEEN 1 AND 3                                [CHECK]
- message et datetime_declenchement immuables après INSERT
- INDEX (statut, niveau)
- INDEX (site_id, datetime_declenchement DESC)
- INDEX (type_alerte, statut)
```

---

### TABLE : `NOTIFICATION`

> Message multicanal envoyé à un utilisateur suite à une alerte.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `notif_id` | `UUID` | `PK` | NON | Identifiant unique |
| `alerte_id` | `UUID` | `FK → ALERTE NOT NULL` | NON | Alerte à l'origine |
| `utilisateur_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Destinataire |
| `canal` | `ENUM` | `NOT NULL` | NON | `PUSH` \| `SMS` \| `EMAIL` \| `IN_APP` |
| `sujet` | `VARCHAR(255)` | — | OUI | Sujet (EMAIL uniquement) |
| `corps` | `TEXT` | `NOT NULL` | NON | Contenu du message |
| `statut` | `ENUM` | `NOT NULL` | NON | `EN_ATTENTE` \| `ENVOYE` \| `DELIVRE` \| `LU` \| `ECHEC` |
| `tentatives` | `SMALLINT` | `DEFAULT 1` | NON | Tentatives d'envoi (max 3) |
| `erreur` | `TEXT` | — | OUI | Erreur technique |
| `datetime_envoi` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Heure d'envoi |
| `datetime_livraison` | `TIMESTAMP` | — | OUI | Heure de livraison confirmée |
| `datetime_lecture` | `TIMESTAMP` | — | OUI | Heure de première lecture |

---

## 12. Domaine — Sécurité & Auth

---

### TABLE : `ROLE`

> Rôles RBAC du système.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `role_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code_role` | `VARCHAR(50)` | `UNIQUE NOT NULL` | NON | `ADMIN` \| `DATA` \| `EPI` \| `REG` \| `OPERATEUR` \| `LECTURE` |
| `libelle` | `VARCHAR(200)` | `NOT NULL` | NON | Libellé descriptif |
| `description` | `TEXT` | — | OUI | Responsabilités du rôle |
| `niveau_acces` | `SMALLINT` | `NOT NULL` | NON | 1 (Lecture) à 5 (Admin) |
| `permissions` | `JSONB` | `NOT NULL` | NON | Permissions par module et action |
| `actif` | `BOOLEAN` | `DEFAULT true` | NON | Rôle actif |

**Structure des permissions JSONB :**

```json
{
  "vaccin":            { "read": true,  "write": false },
  "examen":            { "read": true,  "write": false },
  "statut_vaccinal":   { "read": true,  "write": true  },
  "catalogue_produit": { "read": true,  "write": false },
  "configuration":     { "read": false, "write": false }
}
```

> `write: true` sur `vaccin` et `examen` est réservé au rôle `ADMIN`.

---

### TABLE : `UTILISATEUR`

> Compte utilisateur avec session JWT et contrôle RBAC.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `user_id` | `UUID` | `PK` | NON | Identifiant unique |
| `login` | `VARCHAR(100)` | `UNIQUE NOT NULL` | NON | Identifiant de connexion |
| `password_hash` | `VARCHAR(256)` | `NOT NULL` | NON | Mot de passe haché bcrypt (cost 12) |
| `nom` | `VARCHAR(100)` | `NOT NULL` | NON | Nom de famille |
| `prenom` | `VARCHAR(100)` | `NOT NULL` | NON | Prénom |
| `email` | `VARCHAR(200)` | `UNIQUE` | OUI | Email pour notifications |
| `telephone` | `VARCHAR(20)` | — | OUI | Téléphone pour SMS |
| `role_id` | `UUID` | `FK → ROLE NOT NULL` | NON | Rôle RBAC |
| `site_principal_id` | `UUID` | `FK → SITE` | OUI | Site principal d'affectation |
| `sites_autorises` | `UUID[]` | — | OUI | Sites accessibles en plus du principal |
| `actif` | `BOOLEAN` | `DEFAULT true` | NON | Compte actif |
| `derniere_connexion` | `TIMESTAMP` | — | OUI | Dernière connexion réussie |
| `nb_echecs_connexion` | `SMALLINT` | `DEFAULT 0` | NON | Compteur d'échecs (blocage si > 5) |
| `bloque_jusqu_a` | `TIMESTAMP` | — | OUI | Fin de blocage temporaire (30 min) |
| `token_refresh` | `VARCHAR(512)` | — | OUI | JWT refresh token actif |
| `session_expiry` | `TIMESTAMP` | — | OUI | Expiration session courante |
| `force_pwd_change` | `BOOLEAN` | `DEFAULT false` | NON | Changement de mot de passe requis |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Date de création |
| `created_by` | `UUID` | `FK → UTILISATEUR` | OUI | Admin créateur |

---

### TABLE : `AUDIT_LOG` ✎

> Journal d'audit immuable — append-only absolu.
> **v4.0** : ajout de `STATUT_CHANGE` dans l'ENUM `action` pour tracer les transitions de statut.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `log_id` | `UUID` | `PK` | NON | Identifiant unique |
| `user_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Utilisateur auteur |
| `action` | `ENUM` | `NOT NULL` | NON | `CREATE` \| `UPDATE` \| `DELETE` \| `LOGIN` \| `LOGOUT` \| `EXPORT` \| `PRINT` \| `FAILED_LOGIN` \| `ALERT_RESOLVE` \| `STATUT_CHANGE` ★ |
| `entite` | `VARCHAR(100)` | `NOT NULL` | NON | Nom de la table concernée |
| `entite_id` | `UUID` | — | OUI | UUID de l'enregistrement |
| `ancienne_valeur` | `JSONB` | — | OUI | Valeur avant modification |
| `nouvelle_valeur` | `JSONB` | — | OUI | Valeur après modification |
| `ip_address` | `INET` | — | OUI | Adresse IP client |
| `user_agent` | `TEXT` | — | OUI | Navigateur client |
| `site_id` | `UUID` | `FK → SITE` | OUI | Site d'action |
| `datetime_action` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Horodatage |
| `duree_ms` | `INTEGER` | — | OUI | Durée d'exécution (ms) |

> `STATUT_CHANGE` ★ : utilisé spécifiquement pour tracer les transitions de `TRACING_VOL.statut_suivi`.
> `ancienne_valeur` et `nouvelle_valeur` contiennent les états avant/après.

**Contraintes :**

```
- Aucun UPDATE ni DELETE autorisé — ever
- Rétention minimum 12 mois
- INDEX (user_id, datetime_action DESC)
- INDEX (entite, entite_id)
- INDEX (action, datetime_action DESC)
```

---

## 13. Domaine — Intégration & Rapports

---

### TABLE : `MASTER_FACILITY_LIST`

> Référentiel national MFL — lecture seule, synchronisé depuis le système national.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `mfl_id` | `VARCHAR(50)` | `PK` | NON | Identifiant national MFL |
| `nom_officiel` | `VARCHAR(300)` | `NOT NULL` | NON | Nom officiel |
| `type_structure` | `VARCHAR(100)` | `NOT NULL` | NON | Type de structure sanitaire |
| `statut_juridique` | `VARCHAR(100)` | — | OUI | Public / Privé / Confessionnel |
| `region` | `VARCHAR(100)` | `NOT NULL` | NON | Région Cameroun |
| `departement` | `VARCHAR(100)` | — | OUI | Département |
| `district_sante` | `VARCHAR(100)` | `NOT NULL` | NON | District de santé |
| `latitude` | `DECIMAL(9,6)` | — | OUI | Latitude GPS |
| `longitude` | `DECIMAL(9,6)` | — | OUI | Longitude GPS |
| `telephone` | `VARCHAR(20)` | — | OUI | Téléphone |
| `dhis2_org_unit_id` | `VARCHAR(50)` | `UNIQUE` | OUI | ID DHIS2 |
| `niveau_soins` | `SMALLINT` | — | OUI | 1=CSI / 2=CMA / 3=HD / 4=HR / 5=CHU |
| `nb_lits_declares` | `INTEGER` | — | OUI | Lits déclarés au niveau national |
| `derniere_sync` | `TIMESTAMP` | `NOT NULL` | NON | Dernière synchronisation |
| `actif_mfl` | `BOOLEAN` | `DEFAULT true` | NON | Structure active |

---

### TABLE : `SYNC_DHIS2`

> Journal des synchronisations vers la plateforme nationale DHIS2.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `sync_id` | `UUID` | `PK` | NON | Identifiant unique |
| `datetime_debut` | `TIMESTAMP` | `NOT NULL` | NON | Début de synchronisation |
| `datetime_fin` | `TIMESTAMP` | — | OUI | Fin (NULL si en cours) |
| `periode` | `VARCHAR(20)` | `NOT NULL` | NON | Période DHIS2 (ex : 20260327) |
| `type_sync` | `ENUM` | `NOT NULL` | NON | `DAILY` \| `MANUAL` \| `RETRY` \| `INITIAL` |
| `nb_data_values` | `INTEGER` | `DEFAULT 0` | NON | Valeurs transmises |
| `nb_succes` | `INTEGER` | `DEFAULT 0` | NON | Valeurs acceptées |
| `nb_erreurs` | `INTEGER` | `DEFAULT 0` | NON | Valeurs rejetées |
| `statut` | `ENUM` | `NOT NULL` | NON | `EN_COURS` \| `SUCCES` \| `PARTIEL` \| `ECHEC` |
| `message_erreur` | `TEXT` | — | OUI | Détail des erreurs DHIS2 |
| `payload_json` | `JSONB` | — | OUI | Corps JSON envoyé |
| `reponse_dhis2` | `JSONB` | — | OUI | Réponse brute DHIS2 |
| `declencheur_id` | `UUID` | `FK → UTILISATEUR` | OUI | Déclencheur si sync manuelle |

---

### TABLE : `SITREP` ✎

> Rapport de Situation quotidien — 1 par jour, immuable après distribution.
> **v4.0** : ajout KPI zones tampon PSF et ventilation des orientations par origine.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `sitrep_id` | `UUID` | `PK` | NON | Identifiant unique |
| `date_rapport` | `DATE` | `UNIQUE NOT NULL` | NON | Date du rapport |
| `jour_evenement` | `SMALLINT` | `NOT NULL` | NON | Numéro du jour (J1 à J4) |
| `auteur_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Data Manager validateur |
| `total_consultations` | `INTEGER` | `DEFAULT 0` | NON | Consultations du jour |
| `total_evacuations` | `INTEGER` | `DEFAULT 0` | NON | Évacuations vers FOSA |
| `total_hospitalisations` | `INTEGER` | `DEFAULT 0` | NON | Admissions en FOSA |
| `total_deces` | `INTEGER` | `DEFAULT 0` | NON | Décès constatés |
| `taux_evacuation_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Évacuations / consultations × 100 |
| `delai_pec_moy_min` | `DECIMAL(6,2)` | `[calculé]` | OUI | Délai moyen PEC (min) |
| `occupation_lits_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Taux occupation global FOSA |
| `occupation_vip_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Taux occupation lits VIP |
| `occupation_standard_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Taux occupation lits Standard |
| `occupation_rea_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Taux occupation lits Réanimation |
| `nb_alertes_niveau1` | `INTEGER` | `DEFAULT 0` | NON | Alertes niveau 1 du jour |
| `nb_alertes_niveau2` | `INTEGER` | `DEFAULT 0` | NON | Alertes niveau 2 du jour |
| `nb_alertes_niveau3` | `INTEGER` | `DEFAULT 0` | NON | Alertes niveau 3 du jour |
| `nb_vaccins_non_conformes` | `INTEGER` | `DEFAULT 0` `[calculé]` | NON | Voyageurs avec vaccin obligatoire non conforme |
| `nb_orientations_psf_reference` | `INTEGER` | `DEFAULT 0` `[calculé]` `★` | NON | Orientations issues de REFERENCE_TEST |
| `nb_orientations_psf_isolement` | `INTEGER` | `DEFAULT 0` `[calculé]` `★` | NON | Orientations issues d'ISOLEMENT |
| `duree_moy_attente_zone_min` | `DECIMAL(6,1)` | `[calculé]` `★` | OUI | Durée moyenne d'attente en zone tampon (min) |
| `nb_voyageurs_zone_tampon_snapshot` | `INTEGER` | `DEFAULT 0` `[calculé]` `★` | NON | Voyageurs en zone tampon en fin de journée |
| `nb_examens_prescrits` | `INTEGER` | `DEFAULT 0` `[calculé]` `★` | NON | Examens prescrits dans la journée |
| `nb_resultats_en_retard` | `INTEGER` | `DEFAULT 0` `[calculé]` `★` | NON | Résultats non rendus dans le délai attendu |
| `donnees_par_site` | `JSONB` | `NOT NULL` | NON | Détail indicateurs par site |
| `top_diagnostics` | `JSONB` | — | OUI | Top 5 diagnostics (CIM-11) |
| `top_examens` | `JSONB` | — `★` | OUI | Top 5 examens prescrits avec taux positivité |
| `commentaire_epi` | `TEXT` | — | OUI | Section épidémiologique narrative |
| `recommandations` | `TEXT` | — | OUI | Recommandations pour J+1 |
| `statut` | `ENUM` | `NOT NULL DEFAULT 'BROUILLON'` | NON | `BROUILLON` \| `VALIDE` \| `DISTRIBUE` |
| `datetime_generation` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Horodatage de génération |
| `datetime_validation` | `TIMESTAMP` | — | OUI | Horodatage de validation |
| `destinataires` | `TEXT[]` | — | OUI | Emails notifiés lors de la distribution |

**Contraintes :**

```
- date_rapport UNIQUE — un seul SITREP par jour
- Aucun UPDATE si statut = 'DISTRIBUE'
```

---

## 14. Récapitulatif des relations

### Clés étrangères — 25 tables (68 relations)

| Table | Colonne FK | Référence |
|---|---|---|
| `VACCIN` | `created_by`, `updated_by` | `UTILISATEUR` |
| `STATUT_VACCINAL_PATIENT` | `patient_id` | `PATIENT` |
| `STATUT_VACCINAL_PATIENT` | `vaccin_id` | `VACCIN` |
| `STATUT_VACCINAL_PATIENT` | `agent_id`, `updated_by` | `UTILISATEUR` |
| `EXAMEN` | `created_by`, `updated_by` | `UTILISATEUR` |
| `PATIENT` | `hotel_id` | `SITE` |
| `PATIENT` | `created_by`, `updated_by`, `deleted_by` | `UTILISATEUR` |
| `TRACING_VOL` | `patient_id` | `PATIENT` |
| `TRACING_VOL` | `psf_agent_id`, `updated_by` | `UTILISATEUR` |
| `TRACING_VOL` | `site_psf_id` | `SITE` |
| `TRACING_VOL` | `orientation_id` ★ | `ORIENTATION` |
| `CONSULTATION` | `patient_id` | `PATIENT` |
| `CONSULTATION` | `site_id` | `SITE` |
| `CONSULTATION` | `agent_id`, `updated_by` | `UTILISATEUR` |
| `CONSULTATION` | `orientation_id` | `ORIENTATION` |
| `ORIENTATION` | `consultation_id` | `CONSULTATION` |
| `ORIENTATION` | `tracing_id` ★ | `TRACING_VOL` |
| `ORIENTATION` | `appel_regulation_id` | `APPEL_REGULATION` |
| `ORIENTATION` | `fosa_destination_id`, `fosa_alternative_id` | `SITE` |
| `ORIENTATION` | `regulateur_id`, `updated_by` | `UTILISATEUR` |
| `ORIENTATION` | `pec_id` | `PRISE_EN_CHARGE` |
| `APPEL_REGULATION` | `regulateur_id`, `updated_by` | `UTILISATEUR` |
| `APPEL_REGULATION` | `site_appelant_id` | `SITE` |
| `APPEL_REGULATION` | `orientation_id` | `ORIENTATION` |
| `PRISE_EN_CHARGE` | `orientation_id` | `ORIENTATION` |
| `PRISE_EN_CHARGE` | `fosa_id` | `SITE` |
| `PRISE_EN_CHARGE` | `medecin_id`, `updated_by` | `UTILISATEUR` |
| `PRISE_EN_CHARGE` | `patient_id` | `PATIENT` |
| `PRISE_EN_CHARGE` | `lit_id` | `LIT` |
| `RESULTAT_LABO` | `pec_id` | `PRISE_EN_CHARGE` |
| `RESULTAT_LABO` | `examen_id` ★ | `EXAMEN` |
| `RESULTAT_LABO` | `prescripteur_id`, `agent_labo_id`, `updated_by`, `deleted_by` | `UTILISATEUR` |
| `LIT` | `site_id` | `SITE` |
| `LIT` | `categorie_id` | `CATEGORIE_LIT` |
| `OCCUPATION_LIT` | `lit_id` | `LIT` |
| `OCCUPATION_LIT` | `pec_id` | `PRISE_EN_CHARGE` |
| `OCCUPATION_LIT` | `agent_id` | `UTILISATEUR` |
| `STOCK` | `site_id` | `SITE` |
| `STOCK` | `produit_id` | `CATALOGUE_PRODUIT` |
| `STOCK` | `agent_resp_id` | `UTILISATEUR` |
| `CONSOMMATION_STOCK` | `stock_id` | `STOCK` |
| `CONSOMMATION_STOCK` | `consultation_id` | `CONSULTATION` |
| `CONSOMMATION_STOCK` | `agent_id` | `UTILISATEUR` |
| `CATALOGUE_PRODUIT` | `updated_by` | `UTILISATEUR` |
| `CONFIGURATION_ALERTE` | `updated_by` | `UTILISATEUR` |
| `ALERTE` | `site_id` | `SITE` |
| `ALERTE` | `prise_en_charge_par`, `resolu_par` | `UTILISATEUR` |
| `NOTIFICATION` | `alerte_id` | `ALERTE` |
| `NOTIFICATION` | `utilisateur_id` | `UTILISATEUR` |
| `UTILISATEUR` | `role_id` | `ROLE` |
| `UTILISATEUR` | `site_principal_id` | `SITE` |
| `UTILISATEUR` | `created_by` | `UTILISATEUR` |
| `AUDIT_LOG` | `user_id` | `UTILISATEUR` |
| `AUDIT_LOG` | `site_id` | `SITE` |
| `SITE` | `mfl_facility_id` | `MASTER_FACILITY_LIST` |
| `SITE` | `responsable_id` | `UTILISATEUR` |
| `SYNC_DHIS2` | `declencheur_id` | `UTILISATEUR` |
| `SITREP` | `auteur_id` | `UTILISATEUR` |

---

## 15. Triggers & règles d'intégrité

### Triggers — Zones tampon PSF ★

```
UPDATE TRACING_VOL SET datetime_sortie_zone = NOW()
  → duree_attente_min = EXTRACT(EPOCH FROM (datetime_sortie_zone - datetime_entree_zone)) / 60

INSERT/UPDATE TRACING_VOL.statut_suivi
  → INSERT INTO AUDIT_LOG (action='STATUT_CHANGE', entite='TRACING_VOL',
     ancienne_valeur={old_statut}, nouvelle_valeur={new_statut})

Si duree_attente_min > seuil CONFIGURATION_ALERTE.ALERTE_ATTENTE_ZONE_TAMPON
  → INSERT INTO ALERTE (type='KPI', niveau=1|2|3)
```

### Triggers — Référentiel Examens ★

```
INSERT RESULTAT_LABO
  → Vérification : EXAMEN.resultat_qualitatif = true
    → interpretation doit être IN ('POSITIF','NEGATIF','EN_ATTENTE')
  → Vérification : EXAMEN.resultat_qualitatif = false
    → valeur_numerique doit être renseignée si interpretation != 'EN_ATTENTE'

Planificateur toutes les heures :
  SELECT r.* FROM RESULTAT_LABO r
  JOIN EXAMEN e ON r.examen_id = e.examen_id
  WHERE r.interpretation = 'EN_ATTENTE'
  AND r.datetime_prelevement + INTERVAL e.delai_rendu_heures HOURS < NOW()
  → INSERT INTO ALERTE (type='KPI', niveau=1, titre='Résultat en retard')
```

### Triggers — Référentiel Vaccinations

```
INSERT/UPDATE STATUT_VACCINAL_PATIENT
  → Si vaccin.obligatoire = true ET statut IN ('ABSENT','PERIME','DOUTEUX')
    → INSERT INTO ALERTE (type='VACCIN', niveau=1)
  → Calcul date_expiration :
    date_expiration = date_vaccination + INTERVAL vaccin.duree_validite_mois MONTHS

BEFORE INSERT TRACING_VOL
  → Si vaccin obligatoire non VALIDE pour ce patient
    → decision_frontiere = 'AUTORISATION' INTERDIT
```

### Triggers — Synchronisation des lits

```
INSERT OCCUPATION_LIT (type_evenement='OCCUPATION', fin_occupation=NULL)
  → UPDATE LIT SET statut='OCCUPE'
  → UPDATE SITE SET lits_occupes = lits_occupes + 1

UPDATE OCCUPATION_LIT SET fin_occupation = NOW()
  → duree_heures = EXTRACT(EPOCH FROM (fin_occupation - debut_occupation)) / 3600
  → UPDATE LIT SET statut='LIBRE'
  → UPDATE SITE SET lits_occupes = lits_occupes - 1

UPDATE LIT SET statut='HORS_SERVICE'
  → UPDATE SITE SET capacite_lits = capacite_lits - 1

UPDATE LIT SET statut='LIBRE' (depuis HORS_SERVICE)
  → UPDATE SITE SET capacite_lits = capacite_lits + 1
```

### Triggers — Synchronisation des stocks

```
INSERT CONSOMMATION_STOCK (sens='SORTIE')
  → UPDATE STOCK SET quantite_disponible = quantite_disponible - quantite

INSERT CONSOMMATION_STOCK (sens='ENTREE')
  → UPDATE STOCK SET quantite_disponible = quantite_disponible + quantite

UPDATE STOCK.quantite_disponible
  → Recalcul statut :
    quantite = 0           → RUPTURE
    quantite <= seuil_crit → CRITIQUE
    quantite <= seuil_ale  → ALERTE
    date_peremption < NOW()→ PERIME
    sinon                  → NORMAL
  → Si nouveau statut IN (ALERTE, CRITIQUE, RUPTURE, PERIME)
    → INSERT INTO ALERTE selon CONFIGURATION_ALERTE
```

### Triggers — Alertes automatiques complètes

```
TRACING_VOL.temperature_criblage >= 38.0°C          → ALERTE KPI niveau 1
TRACING_VOL vaccin obligatoire non VALIDE            → ALERTE VACCIN niveau 1
TRACING_VOL.duree_attente_min > 30 min              → ALERTE KPI niveau 1
TRACING_VOL.duree_attente_min > 60 min              → ALERTE KPI niveau 2
CONSULTATION.temperature >= 38.5°C                  → ALERTE KPI niveau 1
CONSULTATION.decision = EVACUATION_FOSA sans ORI +5min → ALERTE KPI niveau 1
RESULTAT_LABO.interpretation = 'CRITIQUE'           → ALERTE KPI niveau 2
RESULTAT_LABO en retard sur delai_rendu_heures      → ALERTE KPI niveau 1
APPEL_REGULATION.niveau_gravite >= 4                → ALERTE URGENCE niveau 2
SITE.lits_occupes / capacite_lits >= 0.75           → ALERTE LIT niveau 1
SITE.lits_occupes / capacite_lits = 1.0             → ALERTE LIT niveau 3
ORIENTATION EN_COURS > 30 min sans confirmation     → ALERTE KPI niveau 2
SYNC_DHIS2.statut = 'ECHEC' après 3 tentatives      → ALERTE TRANSMISSION niveau 1
STOCK.quantite <= seuil_alerte                      → ALERTE STOCK niveau 1
STOCK.quantite <= seuil_critique                    → ALERTE STOCK niveau 2
STOCK.date_peremption selon JOURS_RESTANTS          → ALERTE STOCK niveau 1/2
```

### Règles d'immuabilité

```
Table                       UPDATE              DELETE
──────────────────────────────────────────────────────────────────────
AUDIT_LOG                   jamais              jamais
CONSOMMATION_STOCK          jamais              jamais
OCCUPATION_LIT              fin_occupation seulement  jamais
ALERTE (message, datetime)  jamais              jamais
RESULTAT_LABO               jusqu'à CLOTURE     soft delete uniquement
CONSULTATION                si OUVERTE          jamais
PRISE_EN_CHARGE             si pas de sortie    jamais
ORIENTATION                 si EN_ATTENTE/COURS jamais
SITREP                      si pas DISTRIBUE    jamais
TRACING_VOL                 par PSF sous 24h    soft delete uniquement
PATIENT                     par OPERATEUR+      soft delete uniquement
VACCIN                      par ADMIN           désactivation (actif=false)
EXAMEN                      par ADMIN           désactivation (actif=false)
CATALOGUE_PRODUIT           par ADMIN           désactivation (actif=false)
```

---

## 16. Journal des modifications

| Version | Date | Tables | Modifications |
|---|---|:---:|---|
| **1.0** | Jan. 2026 | 20 | Version initiale |
| **2.0** | Fév. 2026 | 22 | +CATEGORIE_LIT, +LIT, +OCCUPATION_LIT — gestion des lits par event sourcing |
| **3.0** | Fév. 2026 | 24 | +VACCIN, +STATUT_VACCINAL_PATIENT — référentiel vaccinations dynamique — suppression PATIENT.statut_vaccinal JSONB |
| **4.0** | Fév. 2026 | 25 | +EXAMEN — référentiel examens · TRACING_VOL enrichi (statut_suivi, zones tampon) · ORIENTATION enrichie (origine) · CATALOGUE_PRODUIT (necessite_lot) · CONFIGURATION_ALERTE (type_comparaison) · SITREP (KPI zones tampon + examens) · AUDIT_LOG (STATUT_CHANGE) |

---

*— Fin du Modèle Logique de Données — SGI Couverture Sanitaire OMC — Version 4.0*
*25 tables · 11 domaines · ~260 attributs · 68 relations · 20 triggers documentés*
