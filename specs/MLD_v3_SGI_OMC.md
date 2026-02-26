# Modèle Logique de Données (MLD) — Système Intégral
## Application SGI — Couverture Sanitaire · OMC Yaoundé 2026

> **Version 3.0 · Février 2026**  
> Modifications v3.0 :
> - Ajout table `VACCIN` — référentiel dynamique des vaccinations
> - Ajout table `STATUT_VACCINAL_PATIENT` — jonction patient/vaccin avec traçabilité
> - Suppression `PATIENT.statut_vaccinal` (JSONB statique remplacé)
> - Nouveaux UC CRUD référentiel vaccins (UC-41 à UC-44)
> Base cible : PostgreSQL 15+

---

## SOMMAIRE

1. [Conventions](#1-conventions)
2. [Vue d'ensemble — 24 tables](#2-vue-densemble--24-tables)
3. [Domaine — Référentiel](#3-domaine--référentiel)
4. [Domaine — Référentiel Vaccinations ★ nouveau](#4-domaine--référentiel-vaccinations-)
5. [Domaine — Collecte & Criblage](#5-domaine--collecte--criblage)
6. [Domaine — Régulation & Urgences](#6-domaine--régulation--urgences)
7. [Domaine — Soins Hospitaliers](#7-domaine--soins-hospitaliers)
8. [Domaine — Gestion des Lits](#8-domaine--gestion-des-lits)
9. [Domaine — Ressources & Logistique](#9-domaine--ressources--logistique)
10. [Domaine — Alertes & Notifications](#10-domaine--alertes--notifications)
11. [Domaine — Sécurité & Auth](#11-domaine--sécurité--auth)
12. [Domaine — Intégration & Rapports](#12-domaine--intégration--rapports)
13. [Récapitulatif des relations](#13-récapitulatif-des-relations)
14. [Triggers & règles d'intégrité](#14-triggers--règles-dintégrité)
15. [Cas d'utilisation — Référentiel Vaccinations](#15-cas-dutilisation--référentiel-vaccinations)
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
| ★ | Nouveau dans la version 3.0 |

---

## 2. Vue d'ensemble — 24 tables

| # | Domaine | Tables | Nb | Δ v2→v3 |
|---|---|---|:---:|---|
| 1 | Référentiel | SITE | 1 | — |
| 2 | **Référentiel Vaccinations ★** | **VACCIN, STATUT_VACCINAL_PATIENT** | **2** | **+2** |
| 3 | Collecte & Criblage | PATIENT, TRACING_VOL, CONSULTATION | 3 | PATIENT modifié |
| 4 | Régulation & Urgences | ORIENTATION, APPEL_REGULATION | 2 | — |
| 5 | Soins Hospitaliers | PRISE_EN_CHARGE, RESULTAT_LABO | 2 | — |
| 6 | Gestion des Lits | CATEGORIE_LIT, LIT, OCCUPATION_LIT | 3 | — |
| 7 | Ressources & Logistique | CATALOGUE_PRODUIT, STOCK, CONSOMMATION_STOCK | 3 | — |
| 8 | Alertes & Notifications | CONFIGURATION_ALERTE, ALERTE, NOTIFICATION | 3 | — |
| 9 | Sécurité & Auth | ROLE, UTILISATEUR, AUDIT_LOG | 3 | — |
| 10 | Intégration & Rapports | MASTER_FACILITY_LIST, SYNC_DHIS2, SITREP | 3 | — |
| | **Total** | | **24** | **+2 tables** |

---

### Schéma de navigation inter-domaines

```
[Référentiel Vaccinations]
  VACCIN ◄──────────────────────────────────────────┐
                                                     │
[PSF / Frontière]                                    │
  PATIENT ──── STATUT_VACCINAL_PATIENT ──────────────┘
     │
     ├──── TRACING_VOL
     │
     ▼
[PMA / Poste Médical]
  CONSULTATION ──── CONSOMMATION_STOCK ──── STOCK ──── CATALOGUE_PRODUIT
       │
       │ decision = EVACUATION_FOSA
       ▼
  ORIENTATION ◄──── APPEL_REGULATION
       │
       ▼
[FOSA / Hôpital]
  PRISE_EN_CHARGE ──── RESULTAT_LABO
       │
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

## 4. Domaine — Référentiel Vaccinations ★

> Nouveau domaine introduit en version 3.0.
>
> **Problème résolu :** dans la v2, `PATIENT.statut_vaccinal` était un champ JSONB
> avec des clés codées en dur (`fievre_jaune`, `covid19`, etc.). Ajouter un nouveau vaccin
> nécessitait une modification du code applicatif.
>
> **Solution v3 :** le référentiel `VACCIN` est une table administrable sans redéploiement.
> Le formulaire de criblage PSF charge dynamiquement `WHERE vaccin.actif = true`.
> La traçabilité complète (qui a vérifié, quand, numéro de certificat) est portée par
> `STATUT_VACCINAL_PATIENT`.

---

### TABLE : `VACCIN` ★

> Référentiel des vaccinations gérées dans le système — administrable par l'Admin sans redéploiement.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `vaccin_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code` | `VARCHAR(50)` | `UNIQUE NOT NULL` | NON | Code technique invariant (ex : `FIEVRE_JAUNE`, `COVID19`) |
| `libelle` | `VARCHAR(200)` | `NOT NULL` | NON | Libellé affiché dans le formulaire de criblage |
| `libelle_court` | `VARCHAR(50)` | `NOT NULL` | NON | Abréviation pour les tableaux (ex : Fièvre jaune → FJ) |
| `obligatoire` | `BOOLEAN` | `NOT NULL DEFAULT false` | NON | Vaccin obligatoire pour l'entrée au Cameroun — bloque l'autorisation si absent |
| `actif` | `BOOLEAN` | `NOT NULL DEFAULT true` | NON | Affiché dans le formulaire de criblage si true |
| `ordre_affichage` | `SMALLINT` | `DEFAULT 99` | NON | Ordre de tri dans le formulaire (les obligatoires en premier) |
| `duree_validite_mois` | `SMALLINT` | — | OUI | Durée de validité du certificat en mois (ex : 120 pour fièvre jaune) |
| `description` | `TEXT` | — | OUI | Notes cliniques ou réglementaires |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `created_by` | `UUID` | `FK → UTILISATEUR` | NON | Admin ayant créé l'entrée |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de dernière modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Admin ayant effectué la dernière modification |

**Données de référence initiales :**

| code | libelle | obligatoire | actif | duree_validite_mois | ordre |
|---|---|:---:|:---:|:---:|:---:|
| `FIEVRE_JAUNE` | Fièvre jaune | OUI | OUI | 120 | 1 |
| `MENINGITE` | Méningite à méningocoque | NON | OUI | 36 | 2 |
| `COVID19` | COVID-19 | NON | OUI | 12 | 3 |
| `POLIO` | Poliomyélite | NON | OUI | null | 4 |
| `HEPATITE_B` | Hépatite B | NON | OUI | null | 5 |
| `MPOX` | Mpox (variole du singe) | NON | OUI | 24 | 6 |

**Contraintes & Index :**

```
- code UNIQUE (insensible à la casse)
- ordre_affichage >= 1                                  [CHECK]
- duree_validite_mois > 0 si renseigné                  [CHECK]
- INDEX (actif, ordre_affichage)                        -- chargement formulaire criblage
- INDEX (obligatoire)                                   -- validation frontière
```

---

### TABLE : `STATUT_VACCINAL_PATIENT` ★

> Table de jonction entre un PATIENT et un VACCIN. Remplace le champ JSONB `PATIENT.statut_vaccinal`
> supprimé en v3. Porte la traçabilité complète de la vérification vaccinale réalisée lors du criblage PSF.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `statut_id` | `UUID` | `PK` | NON | Identifiant unique |
| `patient_id` | `UUID` | `FK → PATIENT NOT NULL` | NON | Patient concerné |
| `vaccin_id` | `UUID` | `FK → VACCIN NOT NULL` | NON | Vaccin concerné |
| `statut` | `ENUM` | `NOT NULL` | NON | `VALIDE` \| `ABSENT` \| `PERIME` \| `DOUTEUX` \| `NON_VERIFIE` |
| `date_vaccination` | `DATE` | — | OUI | Date de la vaccination indiquée sur le certificat |
| `date_expiration` | `DATE` | — | OUI | Date d'expiration du certificat — calculée si `duree_validite_mois` renseigné |
| `numero_certificat` | `VARCHAR(100)` | — | OUI | Numéro ou référence du certificat présenté |
| `pays_vaccination` | `CHAR(3)` | — | OUI | Code ISO du pays d'administration du vaccin |
| `commentaire` | `TEXT` | — | OUI | Observation de l'agent PSF (doute authenticité, etc.) |
| `agent_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Agent PSF ayant vérifié le certificat |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de la vérification |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de la dernière modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié l'entrée |

**Contraintes & Index :**

```
- UNIQUE (patient_id, vaccin_id)
  → un seul statut par vaccin par patient
  → si revérification nécessaire : UPDATE de l'entrée existante (tracé via updated_by/updated_at)
- date_expiration >= date_vaccination si les deux sont renseignées  [CHECK]
- Calcul automatique date_expiration :
    si date_vaccination IS NOT NULL ET vaccin.duree_validite_mois IS NOT NULL
    ALORS date_expiration = date_vaccination + INTERVAL duree_validite_mois MONTHS   [trigger]
- Alerte si statut = ABSENT et vaccin.obligatoire = true              [trigger]
- INDEX (patient_id)                                                  -- liste par patient
- INDEX (vaccin_id, statut)                                           -- statistiques épidémio
- INDEX (agent_id, created_at DESC)                                   -- audit agent PSF
```

**Règle de validation frontière :**

```
Si un vaccin obligatoire (vaccin.obligatoire = true) a statut IN (ABSENT, PERIME, DOUTEUX)
ALORS : TRACING_VOL.decision_frontiere ne peut pas être AUTORISATION
        → valeurs autorisées : REFERENCE_TEST | ISOLEMENT | REFOULEMENT
```

**Impact sur le formulaire de criblage PSF :**

```
Chargement dynamique :
  SELECT * FROM VACCIN WHERE actif = true ORDER BY obligatoire DESC, ordre_affichage ASC

Pour chaque vaccin retourné, l'agent PSF renseigne :
  - statut (VALIDE / ABSENT / PERIME / DOUTEUX / NON_VERIFIE)
  - date_vaccination (si certificat présenté)
  - numero_certificat (si certificat présenté)

Les vaccins obligatoires sont affichés en tête avec marquage visuel distinctif.
La décision AUTORISATION est grisée si l'un des vaccins obligatoires n'est pas VALIDE.
```

---

## 5. Domaine — Collecte & Criblage

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
| ~~`statut_vaccinal`~~ | ~~`JSONB`~~ | `[supprimé v3]` | — | **Remplacé par STATUT_VACCINAL_PATIENT** |
| `commentaire_medical` | `TEXT` | — | OUI | Antécédents et allergies importants |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `created_by` | `UUID` | `FK → UTILISATEUR` | NON | Agent ayant créé la fiche |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de dernière modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié la fiche |
| `deleted_at` | `TIMESTAMP` | — | OUI | Soft delete — date de suppression logique |
| `deleted_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant archivé la fiche |

> ★ **Changement v3.0** : `statut_vaccinal JSONB` supprimé.  
> Le statut vaccinal est désormais géré via `STATUT_VACCINAL_PATIENT` (table de jonction).  
> Ajout de `updated_at`, `updated_by`, `deleted_by` pour traçabilité CRUD complète.

**Contraintes & Index :**

```
- accreditation_id UNIQUE
- INDEX (nom, prenom, nationalite)
- INDEX (accreditation_id)
- Soft delete : deleted_at IS NOT NULL = fiche archivée (exclue des recherches par défaut)
```

---

### TABLE : `TRACING_VOL`

> Fiche de contact tracing collectée aux PSF aéroportuaires.

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
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de saisie |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié la fiche |

**Contraintes & Index :**

```
- temperature_criblage BETWEEN 34.0 AND 45.0            [CHECK]
- motif_decision NOT NULL si decision_frontiere != AUTORISATION
- decision_frontiere != AUTORISATION si au moins un vaccin obligatoire non VALIDE [trigger]
- Alerte auto si temperature_criblage >= 38.0°C
- INDEX (numero_vol, date_arrivee)
- INDEX (patient_id)
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
| `symptomes` | `JSONB` | — | OUI | `{ "cephalees": true, "fievre": false, … }` |
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
| `statut_saisie` | `ENUM` | `NOT NULL DEFAULT 'OUVERTE'` | NON | `OUVERTE` \| `VALIDEE` \| `CORRIGEE` — contrôle les droits d'édition |
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
- Edition autorisée uniquement si statut_saisie = OUVERTE ou rôle DATA/ADMIN
- INDEX (site_id, heure_arrivee DESC)
```

---

## 6. Domaine — Régulation & Urgences

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
- Edition autorisée uniquement si statut = EN_COURS ou rôle ADMIN
- KPI délai_réponse = heure_depart_moyen - datetime_appel (cible < 10 min)
- INDEX (datetime_appel DESC)
- INDEX (statut)
```

---

### TABLE : `ORIENTATION`

> Transfert d'un patient vers une FOSA de référence.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `orientation_id` | `UUID` | `PK` | NON | Identifiant unique |
| `consultation_id` | `UUID` | `FK → CONSULTATION` | OUI | Consultation d'origine |
| `appel_regulation_id` | `UUID` | `FK → APPEL_REGULATION` | OUI | Appel de régulation |
| `fosa_destination_id` | `UUID` | `FK → SITE NOT NULL` | NON | FOSA destinataire |
| `fosa_alternative_id` | `UUID` | `FK → SITE` | OUI | FOSA alternative |
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
- consultation_id IS NOT NULL OR appel_regulation_id IS NOT NULL
- heure_depart >= heure_decision                        [CHECK]
- heure_arrivee_fosa >= heure_depart                    [CHECK]
- motif_refus NOT NULL si statut = REFUSE
- Edition autorisée si statut IN (EN_ATTENTE, EN_COURS) ou rôle ADMIN
- INDEX (statut)
- INDEX (fosa_destination_id, statut)
```

---

## 7. Domaine — Soins Hospitaliers

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
| `duree_sejour_heures` | `INTEGER` | `[calculé]` | OUI | Durée en heures |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Médecin ayant modifié |

**Contraintes & Index :**

```
- sortie_datetime >= admission_datetime                 [CHECK]
- devenir NOT NULL si sortie_datetime IS NOT NULL
- Edition autorisée si sortie_datetime IS NULL ou rôle ADMIN
- INDEX (fosa_id, admission_datetime DESC)
- INDEX (lit_id)
```

---

### TABLE : `RESULTAT_LABO`

> Résultats des examens en FOSA.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `resultat_id` | `UUID` | `PK` | NON | Identifiant unique |
| `pec_id` | `UUID` | `FK → PRISE_EN_CHARGE NOT NULL` | NON | Prise en charge associée |
| `prescripteur_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Médecin prescripteur |
| `agent_labo_id` | `UUID` | `FK → UTILISATEUR` | OUI | Technicien de laboratoire |
| `type_examen` | `ENUM` | `NOT NULL` | NON | `BIOLOGIE` \| `IMAGERIE` \| `PCR` \| `SEROLOGIE` \| `ANATOMO_PATHO` \| `AUTRE` |
| `libelle_examen` | `VARCHAR(200)` | `NOT NULL` | NON | Intitulé précis |
| `valeur` | `TEXT` | — | OUI | Résultat brut |
| `valeur_numerique` | `DECIMAL(12,4)` | — | OUI | Valeur numérique pour statistiques |
| `unite` | `VARCHAR(30)` | — | OUI | Unité de mesure |
| `valeur_normale_min` | `DECIMAL(12,4)` | — | OUI | Borne inférieure normale |
| `valeur_normale_max` | `DECIMAL(12,4)` | — | OUI | Borne supérieure normale |
| `interpretation` | `ENUM` | `NOT NULL` | NON | `NORMAL` \| `ANORMAL_BAS` \| `ANORMAL_HAUT` \| `POSITIF` \| `NEGATIF` \| `CRITIQUE` \| `EN_ATTENTE` |
| `datetime_prelevement` | `TIMESTAMP` | `NOT NULL` | NON | Date et heure du prélèvement |
| `datetime_resultat` | `TIMESTAMP` | — | OUI | Date de disponibilité |
| `commentaire` | `TEXT` | — | OUI | Commentaire du biologiste |
| `fichier_url` | `VARCHAR(500)` | — | OUI | URL vers le fichier résultat |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de saisie |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |
| `deleted_at` | `TIMESTAMP` | — | OUI | Soft delete (annulation d'un résultat erroné) |
| `deleted_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant annulé |

**Contraintes & Index :**

```
- datetime_resultat >= datetime_prelevement             [CHECK]
- valeur NOT NULL si interpretation != EN_ATTENTE
- Soft delete : un résultat ne peut jamais être physiquement supprimé
- Si interpretation = CRITIQUE → créer ALERTE niveau 2               [trigger]
- INDEX (pec_id, datetime_prelevement DESC)
```

---

## 8. Domaine — Gestion des Lits

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

> Journal des événements d'occupation/libération — même pattern que CONSOMMATION_STOCK.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `occupation_id` | `UUID` | `PK` | NON | Identifiant unique |
| `lit_id` | `UUID` | `FK → LIT NOT NULL` | NON | Lit concerné |
| `pec_id` | `UUID` | `FK → PRISE_EN_CHARGE NOT NULL` | NON | Hospitalisation associée |
| `agent_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Agent ayant enregistré l'événement |
| `type_evenement` | `ENUM` | `NOT NULL` | NON | `OCCUPATION` \| `LIBERATION` \| `RESERVATION` \| `ANNULATION` |
| `debut_occupation` | `TIMESTAMP` | `NOT NULL` | NON | Date et heure d'attribution |
| `fin_occupation` | `TIMESTAMP` | — | OUI | Date de libération — NULL = encore occupé |
| `motif_liberation` | `ENUM` | — | OUI | `GUERISON` \| `TRANSFERT` \| `DECES` \| `ANNULATION` \| `AUTRE` |
| `duree_heures` | `DECIMAL(6,1)` | `[calculé]` | OUI | Durée d'occupation en heures |
| `statut_lit_avant` | `ENUM` | `NOT NULL` `[audit]` | NON | État du lit avant l'événement |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |

**Contraintes & Index :**

```
- fin_occupation >= debut_occupation                    [CHECK]
- motif_liberation NOT NULL si type_evenement = LIBERATION
- UNIQUE (lit_id) WHERE fin_occupation IS NULL          -- un seul patient par lit
- INDEX (lit_id, debut_occupation DESC)
- INDEX (pec_id)
- INDEX (fin_occupation) WHERE fin_occupation IS NULL
```

---

## 9. Domaine — Ressources & Logistique

---

### TABLE : `CATALOGUE_PRODUIT`

> Référentiel des produits médicaux et EPI.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `produit_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code_produit` | `VARCHAR(50)` | `UNIQUE NOT NULL` | NON | Code interne unique |
| `designation` | `VARCHAR(300)` | `NOT NULL` | NON | Désignation complète |
| `categorie` | `ENUM` | `NOT NULL` | NON | `MEDICAMENT` \| `EPI` \| `MATERIEL` \| `CONSOMMABLE` \| `AUTRE` |
| `dci` | `VARCHAR(200)` | — | OUI | Dénomination Commune Internationale |
| `forme` | `VARCHAR(100)` | — | OUI | Forme galénique |
| `dosage` | `VARCHAR(50)` | — | OUI | Dosage |
| `unite_base` | `VARCHAR(30)` | `NOT NULL` | NON | Unité de gestion |
| `code_atc` | `VARCHAR(10)` | — | OUI | Code ATC OMS |
| `necessite_froid` | `BOOLEAN` | `DEFAULT false` | NON | Chaîne du froid requise |
| `actif` | `BOOLEAN` | `DEFAULT true` | NON | Produit actif |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de création |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Agent ayant modifié |

---

### TABLE : `STOCK`

> Niveau d'un produit dans un site — calculé par trigger.

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
| `date_peremption` | `DATE` | — | OUI | Date de péremption |
| `numero_lot` | `VARCHAR(50)` | — | OUI | Numéro de lot |
| `emplacement` | `VARCHAR(100)` | — | OUI | Localisation physique |
| `agent_resp_id` | `UUID` | `FK → UTILISATEUR` | OUI | Responsable du stock |
| `derniere_maj` | `TIMESTAMP` | `DEFAULT NOW()` `[calculé]` | NON | Dernière mise à jour |
| `statut` | `ENUM` | `NOT NULL` `[calculé]` | NON | `NORMAL` \| `ALERTE` \| `CRITIQUE` \| `RUPTURE` \| `PERIME` |

**Contraintes & Index :**

```
- UNIQUE (site_id, produit_id)
- quantite_disponible >= 0                              [CHECK]
- seuil_critique <= seuil_alerte                        [CHECK]
- INDEX (site_id, statut)
```

---

### TABLE : `CONSOMMATION_STOCK`

> Journal des mouvements de stock.

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
| `commentaire` | `TEXT` | — | OUI | Remarque libre |
| `datetime_mouvement` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Date et heure du mouvement |

**Contraintes & Index :**

```
- quantite > 0                                          [CHECK]
- stock_apres >= 0                                      [CHECK]
- Aucun UPDATE ni DELETE (journal append-only)
- INDEX (stock_id, datetime_mouvement DESC)
```

---

## 10. Domaine — Alertes & Notifications

---

### TABLE : `CONFIGURATION_ALERTE`

> Règles du moteur d'alertes.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `config_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code_regle` | `VARCHAR(100)` | `UNIQUE NOT NULL` | NON | Code de la règle |
| `libelle` | `VARCHAR(300)` | `NOT NULL` | NON | Description lisible |
| `entite_source` | `VARCHAR(100)` | `NOT NULL` | NON | Table source surveillée |
| `champ_surveille` | `VARCHAR(100)` | `NOT NULL` | NON | Champ ou indicateur surveillé |
| `operateur` | `ENUM` | `NOT NULL` | NON | `GT` \| `GTE` \| `LT` \| `LTE` \| `EQ` \| `NEQ` |
| `seuil_niveau1` | `DECIMAL(12,4)` | — | OUI | Seuil alerte niveau 1 |
| `seuil_niveau2` | `DECIMAL(12,4)` | — | OUI | Seuil alerte niveau 2 |
| `seuil_niveau3` | `DECIMAL(12,4)` | — | OUI | Seuil alerte niveau 3 |
| `canaux_notif` | `TEXT[]` | `NOT NULL` | NON | `{PUSH, SMS, EMAIL}` |
| `roles_destinataires` | `TEXT[]` | `NOT NULL` | NON | Rôles RBAC destinataires |
| `active` | `BOOLEAN` | `DEFAULT true` | NON | Règle active |
| `cooldown_min` | `INTEGER` | `DEFAULT 15` | NON | Délai minimum entre alertes identiques (min 5) |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Horodatage de modification |
| `updated_by` | `UUID` | `FK → UTILISATEUR` | OUI | Admin ayant modifié |

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
| `valeur_declenchante` | `TEXT` | — | OUI | Valeur déclenchante |
| `seuil_configure` | `TEXT` | — | OUI | Seuil franchi |
| `datetime_declenchement` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Heure de création — immuable |
| `datetime_reception_pc` | `TIMESTAMP` | — | OUI | Accusé de réception PC de crise |
| `statut` | `ENUM` | `NOT NULL` | NON | `ACTIVE` \| `PRISE_EN_CHARGE` \| `RESOLUE` \| `IGNOREE` |
| `prise_en_charge_par` | `UUID` | `FK → UTILISATEUR` | OUI | Utilisateur ayant pris en charge |
| `datetime_pec` | `TIMESTAMP` | — | OUI | Heure de prise en charge |
| `resolu_par` | `UUID` | `FK → UTILISATEUR` | OUI | Utilisateur ayant résolu |
| `datetime_resolution` | `TIMESTAMP` | — | OUI | Heure de résolution |
| `commentaire_resolution` | `TEXT` | — | OUI | Description de la résolution |

> ★ `type_alerte` enrichi avec `VACCIN` pour alertes sur certificats obligatoires manquants.

**Contraintes & Index :**

```
- niveau BETWEEN 1 AND 3                                [CHECK]
- message et datetime_declenchement sont immuables après INSERT
- INDEX (statut, niveau)
- INDEX (site_id, datetime_declenchement DESC)
```

---

### TABLE : `NOTIFICATION`

> Message multicanal envoyé à un utilisateur.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `notif_id` | `UUID` | `PK` | NON | Identifiant unique |
| `alerte_id` | `UUID` | `FK → ALERTE NOT NULL` | NON | Alerte à l'origine |
| `utilisateur_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Destinataire |
| `canal` | `ENUM` | `NOT NULL` | NON | `PUSH` \| `SMS` \| `EMAIL` \| `IN_APP` |
| `sujet` | `VARCHAR(255)` | — | OUI | Sujet (EMAIL) |
| `corps` | `TEXT` | `NOT NULL` | NON | Contenu du message |
| `statut` | `ENUM` | `NOT NULL` | NON | `EN_ATTENTE` \| `ENVOYE` \| `DELIVRE` \| `LU` \| `ECHEC` |
| `tentatives` | `SMALLINT` | `DEFAULT 1` | NON | Tentatives d'envoi (max 3) |
| `erreur` | `TEXT` | — | OUI | Erreur technique |
| `datetime_envoi` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Heure d'envoi |
| `datetime_livraison` | `TIMESTAMP` | — | OUI | Heure de livraison confirmée |
| `datetime_lecture` | `TIMESTAMP` | — | OUI | Heure de première lecture |

---

## 11. Domaine — Sécurité & Auth

---

### TABLE : `ROLE`

> Rôles RBAC du système.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `role_id` | `UUID` | `PK` | NON | Identifiant unique |
| `code_role` | `VARCHAR(50)` | `UNIQUE NOT NULL` | NON | `ADMIN` \| `DATA` \| `EPI` \| `REG` \| `OPERATEUR` \| `LECTURE` |
| `libelle` | `VARCHAR(200)` | `NOT NULL` | NON | Libellé descriptif |
| `description` | `TEXT` | — | OUI | Responsabilités |
| `niveau_acces` | `SMALLINT` | `NOT NULL` | NON | 1 (Lecture) à 5 (Admin) |
| `permissions` | `JSONB` | `NOT NULL` | NON | Permissions par module incluant `vaccin: {read, write}` |
| `actif` | `BOOLEAN` | `DEFAULT true` | NON | Rôle actif |

**Permissions vaccin dans le JSONB :**

```json
{
  "vaccin": { "read": true, "write": false },
  "statut_vaccinal": { "read": true, "write": true }
}
```

> `write: true` sur `vaccin` est réservé au rôle `ADMIN`.  
> Tous les rôles actifs ont `read: true` sur `vaccin` (liste dynamique au criblage).

---

### TABLE : `UTILISATEUR`

> Compte utilisateur avec session JWT et contrôle d'accès RBAC.

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
| `sites_autorises` | `UUID[]` | — | OUI | Sites accessibles |
| `actif` | `BOOLEAN` | `DEFAULT true` | NON | Compte actif |
| `derniere_connexion` | `TIMESTAMP` | — | OUI | Dernière connexion réussie |
| `nb_echecs_connexion` | `SMALLINT` | `DEFAULT 0` | NON | Compteur d'échecs (blocage > 5) |
| `bloque_jusqu_a` | `TIMESTAMP` | — | OUI | Fin de blocage temporaire |
| `token_refresh` | `VARCHAR(512)` | — | OUI | JWT refresh token actif |
| `session_expiry` | `TIMESTAMP` | — | OUI | Expiration session (30 min) |
| `force_pwd_change` | `BOOLEAN` | `DEFAULT false` | NON | Changement de mot de passe requis |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | NON | Date de création |
| `created_by` | `UUID` | `FK → UTILISATEUR` | OUI | Admin créateur |

---

### TABLE : `AUDIT_LOG`

> Journal d'audit immuable — append-only.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `log_id` | `UUID` | `PK` | NON | Identifiant unique |
| `user_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Utilisateur auteur |
| `action` | `ENUM` | `NOT NULL` | NON | `CREATE` \| `UPDATE` \| `DELETE` \| `LOGIN` \| `LOGOUT` \| `EXPORT` \| `PRINT` \| `FAILED_LOGIN` \| `ALERT_RESOLVE` |
| `entite` | `VARCHAR(100)` | `NOT NULL` | NON | Nom de la table concernée |
| `entite_id` | `UUID` | — | OUI | UUID de l'enregistrement |
| `ancienne_valeur` | `JSONB` | — | OUI | Valeur avant modification |
| `nouvelle_valeur` | `JSONB` | — | OUI | Valeur après modification |
| `ip_address` | `INET` | — | OUI | Adresse IP client |
| `user_agent` | `TEXT` | — | OUI | Navigateur client |
| `site_id` | `UUID` | `FK → SITE` | OUI | Site d'action |
| `datetime_action` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Horodatage |
| `duree_ms` | `INTEGER` | — | OUI | Durée d'exécution (ms) |

**Contraintes :**

```
- Aucun UPDATE ni DELETE autorisé
- Rétention minimum 12 mois
- INDEX (user_id, datetime_action DESC)
- INDEX (entite, entite_id)
```

---

## 12. Domaine — Intégration & Rapports

---

### TABLE : `MASTER_FACILITY_LIST`

> Référentiel national MFL — lecture seule.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `mfl_id` | `VARCHAR(50)` | `PK` | NON | Identifiant national MFL |
| `nom_officiel` | `VARCHAR(300)` | `NOT NULL` | NON | Nom officiel |
| `type_structure` | `VARCHAR(100)` | `NOT NULL` | NON | Type de structure |
| `statut_juridique` | `VARCHAR(100)` | — | OUI | Public / Privé |
| `region` | `VARCHAR(100)` | `NOT NULL` | NON | Région Cameroun |
| `departement` | `VARCHAR(100)` | — | OUI | Département |
| `district_sante` | `VARCHAR(100)` | `NOT NULL` | NON | District de santé |
| `latitude` | `DECIMAL(9,6)` | — | OUI | Latitude GPS |
| `longitude` | `DECIMAL(9,6)` | — | OUI | Longitude GPS |
| `telephone` | `VARCHAR(20)` | — | OUI | Téléphone |
| `dhis2_org_unit_id` | `VARCHAR(50)` | `UNIQUE` | OUI | ID DHIS2 |
| `niveau_soins` | `SMALLINT` | — | OUI | 1=CSI / 2=CMA / 3=HD / 4=HR / 5=CHU |
| `nb_lits_declares` | `INTEGER` | — | OUI | Lits déclarés |
| `derniere_sync` | `TIMESTAMP` | `NOT NULL` | NON | Dernière synchronisation |
| `actif_mfl` | `BOOLEAN` | `DEFAULT true` | NON | Structure active |

---

### TABLE : `SYNC_DHIS2`

> Journal des synchronisations vers DHIS2.

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
| `message_erreur` | `TEXT` | — | OUI | Détail des erreurs |
| `payload_json` | `JSONB` | — | OUI | Corps JSON envoyé |
| `reponse_dhis2` | `JSONB` | — | OUI | Réponse brute DHIS2 |
| `declencheur_id` | `UUID` | `FK → UTILISATEUR` | OUI | Déclencheur manuel |

---

### TABLE : `SITREP`

> Rapport de Situation quotidien — 1 par jour.

| Colonne | Type | Contrainte | NULL | Description |
|---|---|---|:---:|---|
| `sitrep_id` | `UUID` | `PK` | NON | Identifiant unique |
| `date_rapport` | `DATE` | `UNIQUE NOT NULL` | NON | Date du rapport |
| `jour_evenement` | `SMALLINT` | `NOT NULL` | NON | Numéro du jour (J1 à J4) |
| `auteur_id` | `UUID` | `FK → UTILISATEUR NOT NULL` | NON | Data Manager validateur |
| `total_consultations` | `INTEGER` | `DEFAULT 0` | NON | Consultations du jour |
| `total_evacuations` | `INTEGER` | `DEFAULT 0` | NON | Évacuations vers FOSA |
| `total_hospitalisations` | `INTEGER` | `DEFAULT 0` | NON | Hospitalisations |
| `total_deces` | `INTEGER` | `DEFAULT 0` | NON | Décès |
| `taux_evacuation_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Évacuations / consultations × 100 |
| `delai_pec_moy_min` | `DECIMAL(6,2)` | `[calculé]` | OUI | Délai moyen PEC (min) |
| `occupation_lits_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Taux occupation global FOSA |
| `occupation_vip_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Taux occupation lits VIP |
| `occupation_standard_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Taux occupation lits standard |
| `occupation_rea_pct` | `DECIMAL(5,2)` | `[calculé]` | OUI | Taux occupation lits réanimation |
| `nb_alertes_niveau1` | `INTEGER` | `DEFAULT 0` | NON | Alertes niveau 1 du jour |
| `nb_alertes_niveau2` | `INTEGER` | `DEFAULT 0` | NON | Alertes niveau 2 du jour |
| `nb_alertes_niveau3` | `INTEGER` | `DEFAULT 0` | NON | Alertes niveau 3 du jour |
| `nb_vaccins_non_conformes` | `INTEGER` | `DEFAULT 0` `[calculé]` | NON | ★ Nombre de voyageurs avec vaccin obligatoire non conforme |
| `donnees_par_site` | `JSONB` | `NOT NULL` | NON | Détail indicateurs par site |
| `top_diagnostics` | `JSONB` | — | OUI | Top 5 diagnostics |
| `commentaire_epi` | `TEXT` | — | OUI | Section épidémiologique |
| `recommandations` | `TEXT` | — | OUI | Recommandations J+1 |
| `statut` | `ENUM` | `NOT NULL` | NON | `BROUILLON` \| `VALIDE` \| `DISTRIBUE` |
| `datetime_generation` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | NON | Horodatage de génération |
| `datetime_validation` | `TIMESTAMP` | — | OUI | Horodatage de validation |
| `destinataires` | `TEXT[]` | — | OUI | Emails notifiés |

> ★ `nb_vaccins_non_conformes` : nouveau KPI calculé depuis `STATUT_VACCINAL_PATIENT`
> pour les voyageurs dont un vaccin obligatoire est ABSENT, PERIME ou DOUTEUX ce jour.

---

## 13. Récapitulatif des relations

### Table des clés étrangères — 24 tables

| Table | Colonne FK | Référence | Cardinalité |
|---|---|---|---|
| `VACCIN` | `created_by` | `UTILISATEUR` | N:1 |
| `VACCIN` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `STATUT_VACCINAL_PATIENT` | `patient_id` | `PATIENT` | N:1 |
| `STATUT_VACCINAL_PATIENT` | `vaccin_id` | `VACCIN` | N:1 |
| `STATUT_VACCINAL_PATIENT` | `agent_id` | `UTILISATEUR` | N:1 |
| `STATUT_VACCINAL_PATIENT` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `PATIENT` | `hotel_id` | `SITE` | N:0..1 |
| `PATIENT` | `created_by` | `UTILISATEUR` | N:1 |
| `PATIENT` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `PATIENT` | `deleted_by` | `UTILISATEUR` | N:0..1 |
| `TRACING_VOL` | `patient_id` | `PATIENT` | N:1 |
| `TRACING_VOL` | `psf_agent_id` | `UTILISATEUR` | N:1 |
| `TRACING_VOL` | `site_psf_id` | `SITE` | N:1 |
| `TRACING_VOL` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `CONSULTATION` | `patient_id` | `PATIENT` | N:1 |
| `CONSULTATION` | `site_id` | `SITE` | N:1 |
| `CONSULTATION` | `agent_id` | `UTILISATEUR` | N:1 |
| `CONSULTATION` | `orientation_id` | `ORIENTATION` | 1:0..1 |
| `CONSULTATION` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `APPEL_REGULATION` | `regulateur_id` | `UTILISATEUR` | N:1 |
| `APPEL_REGULATION` | `site_appelant_id` | `SITE` | N:0..1 |
| `APPEL_REGULATION` | `orientation_id` | `ORIENTATION` | 1:0..1 |
| `APPEL_REGULATION` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `ORIENTATION` | `consultation_id` | `CONSULTATION` | N:0..1 |
| `ORIENTATION` | `appel_regulation_id` | `APPEL_REGULATION` | N:0..1 |
| `ORIENTATION` | `fosa_destination_id` | `SITE` | N:1 |
| `ORIENTATION` | `fosa_alternative_id` | `SITE` | N:0..1 |
| `ORIENTATION` | `regulateur_id` | `UTILISATEUR` | N:0..1 |
| `ORIENTATION` | `pec_id` | `PRISE_EN_CHARGE` | 1:0..1 |
| `ORIENTATION` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `PRISE_EN_CHARGE` | `orientation_id` | `ORIENTATION` | N:0..1 |
| `PRISE_EN_CHARGE` | `fosa_id` | `SITE` | N:1 |
| `PRISE_EN_CHARGE` | `medecin_id` | `UTILISATEUR` | N:1 |
| `PRISE_EN_CHARGE` | `patient_id` | `PATIENT` | N:1 |
| `PRISE_EN_CHARGE` | `lit_id` | `LIT` | N:0..1 |
| `PRISE_EN_CHARGE` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `RESULTAT_LABO` | `pec_id` | `PRISE_EN_CHARGE` | N:1 |
| `RESULTAT_LABO` | `prescripteur_id` | `UTILISATEUR` | N:1 |
| `RESULTAT_LABO` | `agent_labo_id` | `UTILISATEUR` | N:0..1 |
| `RESULTAT_LABO` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `RESULTAT_LABO` | `deleted_by` | `UTILISATEUR` | N:0..1 |
| `LIT` | `site_id` | `SITE` | N:1 |
| `LIT` | `categorie_id` | `CATEGORIE_LIT` | N:1 |
| `OCCUPATION_LIT` | `lit_id` | `LIT` | N:1 |
| `OCCUPATION_LIT` | `pec_id` | `PRISE_EN_CHARGE` | N:1 |
| `OCCUPATION_LIT` | `agent_id` | `UTILISATEUR` | N:1 |
| `STOCK` | `site_id` | `SITE` | N:1 |
| `STOCK` | `produit_id` | `CATALOGUE_PRODUIT` | N:1 |
| `STOCK` | `agent_resp_id` | `UTILISATEUR` | N:0..1 |
| `CONSOMMATION_STOCK` | `stock_id` | `STOCK` | N:1 |
| `CONSOMMATION_STOCK` | `consultation_id` | `CONSULTATION` | N:0..1 |
| `CONSOMMATION_STOCK` | `agent_id` | `UTILISATEUR` | N:1 |
| `CATALOGUE_PRODUIT` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `CONFIGURATION_ALERTE` | `updated_by` | `UTILISATEUR` | N:0..1 |
| `ALERTE` | `site_id` | `SITE` | N:0..1 |
| `ALERTE` | `prise_en_charge_par` | `UTILISATEUR` | N:0..1 |
| `ALERTE` | `resolu_par` | `UTILISATEUR` | N:0..1 |
| `NOTIFICATION` | `alerte_id` | `ALERTE` | N:1 |
| `NOTIFICATION` | `utilisateur_id` | `UTILISATEUR` | N:1 |
| `UTILISATEUR` | `role_id` | `ROLE` | N:1 |
| `UTILISATEUR` | `site_principal_id` | `SITE` | N:0..1 |
| `UTILISATEUR` | `created_by` | `UTILISATEUR` | N:0..1 |
| `AUDIT_LOG` | `user_id` | `UTILISATEUR` | N:1 |
| `AUDIT_LOG` | `site_id` | `SITE` | N:0..1 |
| `SITE` | `mfl_facility_id` | `MASTER_FACILITY_LIST` | N:0..1 |
| `SITE` | `responsable_id` | `UTILISATEUR` | N:0..1 |
| `SYNC_DHIS2` | `declencheur_id` | `UTILISATEUR` | N:0..1 |
| `SITREP` | `auteur_id` | `UTILISATEUR` | N:1 |

---

## 14. Triggers & règles d'intégrité

### Triggers — Référentiel vaccinations ★

```
INSERT/UPDATE sur STATUT_VACCINAL_PATIENT
  → Si vaccin.obligatoire = true ET statut IN (ABSENT, PERIME, DOUTEUX)
    → Créer ALERTE type=VACCIN niveau=1 pour l'agent PSF et le Data Manager
  → Calcul automatique date_expiration :
    date_expiration = date_vaccination + INTERVAL duree_validite_mois MONTHS
    si date_vaccination IS NOT NULL ET vaccin.duree_validite_mois IS NOT NULL

BEFORE INSERT sur TRACING_VOL
  → Vérifier : si au moins un STATUT_VACCINAL_PATIENT.statut IN (ABSENT, PERIME, DOUTEUX)
    pour un vaccin obligatoire lié à ce patient
    ALORS bloquer decision_frontiere = AUTORISATION
```

### Triggers — Synchronisation des lits

```
INSERT sur OCCUPATION_LIT (type_evenement = OCCUPATION, fin = NULL)
  → UPDATE LIT.statut = 'OCCUPE'
  → UPDATE SITE.lits_occupes = lits_occupes + 1

UPDATE sur OCCUPATION_LIT SET fin_occupation = NOW()
  → UPDATE LIT.statut = 'LIBRE'
  → UPDATE SITE.lits_occupes = lits_occupes - 1

INSERT sur LIT (statut != 'HORS_SERVICE')
  → UPDATE SITE.capacite_lits = capacite_lits + 1

UPDATE LIT SET statut = 'HORS_SERVICE'
  → UPDATE SITE.capacite_lits = capacite_lits - 1
```

### Triggers — Synchronisation des stocks

```
INSERT sur CONSOMMATION_STOCK (sens = SORTIE)
  → UPDATE STOCK.quantite_disponible = quantite_disponible - quantite

INSERT sur CONSOMMATION_STOCK (sens = ENTREE)
  → UPDATE STOCK.quantite_disponible = quantite_disponible + quantite

UPDATE STOCK.quantite_disponible
  → Recalcul STOCK.statut selon seuils
  → Si nouveau statut IN (ALERTE, CRITIQUE, RUPTURE) → INSERT INTO ALERTE
```

### Triggers — Alertes automatiques

```
TRACING_VOL.temperature_criblage >= 38.0°C           → ALERTE type=KPI niveau=1
STATUT_VACCINAL_PATIENT vaccin obligatoire non VALIDE → ALERTE type=VACCIN niveau=1
CONSULTATION.temperature >= 38.5°C                   → ALERTE type=KPI niveau=1
CONSULTATION.decision = EVACUATION_FOSA + 5min sans ORIENTATION → ALERTE type=KPI niveau=1
RESULTAT_LABO.interpretation = CRITIQUE              → ALERTE type=KPI niveau=2
APPEL_REGULATION.niveau_gravite >= 4                 → ALERTE type=URGENCE niveau=2
SITE.lits_occupes / SITE.capacite_lits >= 0.75       → ALERTE type=LIT niveau=1
SITE.lits_occupes / SITE.capacite_lits >= 1.0        → ALERTE type=LIT niveau=3
ORIENTATION EN_COURS depuis > 30 min                 → ALERTE type=KPI niveau=2
SYNC_DHIS2.statut = ECHEC après 3 tentatives         → ALERTE type=TRANSMISSION niveau=1
```

### Règles d'immuabilité et d'édition

```
Table                  | UPDATE autorisé             | DELETE autorisé
──────────────────────────────────────────────────────────────────────
AUDIT_LOG              | jamais                      | jamais
CONSOMMATION_STOCK     | jamais                      | jamais
ALERTE (message, datetime) | jamais                  | jamais
RESULTAT_LABO          | si statut != CLOTURE ou ADMIN | soft delete uniquement
CONSULTATION           | si statut_saisie = OUVERTE  | jamais (soft delete non applicable)
PRISE_EN_CHARGE        | si sortie_datetime IS NULL  | jamais
ORIENTATION            | si statut IN (EN_ATTENTE, EN_COURS) | jamais
SITREP                 | si statut != DISTRIBUE      | jamais
TRACING_VOL            | par agent PSF jusqu'à J+1   | jamais
PATIENT                | par agent ou DATA/ADMIN     | soft delete uniquement
VACCIN                 | par ADMIN uniquement        | désactivation uniquement (actif=false)
STATUT_VACCINAL_PATIENT| par agent PSF ou DATA/ADMIN | jamais (UPDATE uniquement)
```

---

## 15. Cas d'utilisation — Référentiel Vaccinations

> Ces 4 UC viennent compléter le document UC_SGI_OMC.md — ils couvrent la gestion CRUD  
> complète du référentiel vaccinations ainsi que l'impact sur le criblage PSF.

---

### UC-41 — Consulter la liste des vaccins

| Propriété | Valeur |
|---|---|
| **Identifiant** | UC-41 |
| **Nom** | Consulter la liste des vaccins du référentiel |
| **Acteurs** | Administrateur (A07) — lecture/écriture · Tous acteurs — lecture |
| **Priorité** | Haute |
| **Déclencheur** | Accès au module Référentiel > Vaccinations |
| **Pré-conditions** | Utilisateur authentifié |
| **Post-conditions** | Liste des vaccins affichée avec statut et indicateur obligatoire |

**Scénario nominal :**

1. L'utilisateur accède au menu « Référentiel > Vaccinations ».
2. Le système affiche la liste complète des vaccins triée par `ordre_affichage` : code, libellé, obligatoire, durée de validité, statut actif/inactif.
3. L'utilisateur peut filtrer par statut (actif / inactif) ou par type (obligatoire / recommandé).
4. L'Administrateur voit les boutons « Ajouter », « Modifier », « Désactiver » sur chaque ligne.
5. Les autres rôles voient la liste en lecture seule.

---

### UC-42 — Créer un vaccin

| Propriété | Valeur |
|---|---|
| **Identifiant** | UC-42 |
| **Nom** | Ajouter un nouveau vaccin dans le référentiel |
| **Acteur principal** | Administrateur (A07) |
| **Priorité** | Haute |
| **Déclencheur** | Nouveau vaccin à surveiller lors du criblage (ex : mise à jour réglementation OMS) |
| **Pré-conditions** | Administrateur authentifié |
| **Post-conditions** | Un VACCIN est créé avec `actif = true` · Il apparaît dans le formulaire de criblage PSF |

**Scénario nominal :**

1. L'administrateur clique « Ajouter un vaccin ».
2. Il renseigne : code technique (unique), libellé complet, libellé court, caractère obligatoire, durée de validité en mois, ordre d'affichage, description.
3. Il valide le formulaire.
4. Le système vérifie l'unicité du code.
5. Le système crée le VACCIN avec `actif = true` et `created_by = user connecté`.
6. La création est journalisée dans AUDIT_LOG.
7. Le vaccin apparaît immédiatement dans le formulaire de criblage PSF.

**Scénarios alternatifs :**

- **4a** — Code déjà existant : le système affiche une erreur et invite à corriger.

---

### UC-43 — Modifier un vaccin

| Propriété | Valeur |
|---|---|
| **Identifiant** | UC-43 |
| **Nom** | Modifier les propriétés d'un vaccin existant |
| **Acteur principal** | Administrateur (A07) |
| **Priorité** | Haute |
| **Déclencheur** | Changement réglementaire (nouvelle durée de validité, changement de statut obligatoire) |
| **Pré-conditions** | Administrateur authentifié · Le vaccin existe |
| **Post-conditions** | Le VACCIN est mis à jour · `updated_at` et `updated_by` sont renseignés · La modification est journalisée |

**Scénario nominal :**

1. L'administrateur sélectionne un vaccin dans la liste et clique « Modifier ».
2. Le formulaire s'ouvre en mode édition avec les valeurs actuelles pré-remplies.
3. L'administrateur modifie les champs souhaités (libellé, obligatoire, durée de validité, ordre).
4. Il valide.
5. Le système met à jour le VACCIN et renseigne `updated_at = NOW()` et `updated_by`.
6. La modification est journalisée dans AUDIT_LOG avec `ancienne_valeur` et `nouvelle_valeur`.

**Règle :** le champ `code` ne peut pas être modifié après création — il est invariant et peut être utilisé dans des intégrations externes.

**Impact :** si `duree_validite_mois` est modifié, les `date_expiration` des STATUT_VACCINAL_PATIENT existants **ne sont pas recalculées rétroactivement** — seules les nouvelles saisies utilisent la nouvelle valeur.

---

### UC-44 — Désactiver / Réactiver un vaccin

| Propriété | Valeur |
|---|---|
| **Identifiant** | UC-44 |
| **Nom** | Désactiver ou réactiver un vaccin dans le référentiel |
| **Acteur principal** | Administrateur (A07) |
| **Priorité** | Haute |
| **Déclencheur** | Vaccin retiré du protocole de criblage ou réintégré |
| **Pré-conditions** | Administrateur authentifié |
| **Post-conditions** | `VACCIN.actif` est mis à jour · Le vaccin disparaît ou réapparaît dans le formulaire de criblage |

**Scénario nominal — Désactivation :**

1. L'administrateur sélectionne un vaccin actif et clique « Désactiver ».
2. Le système affiche une confirmation : « Ce vaccin ne sera plus proposé dans le formulaire de criblage. Les données historiques sont conservées. Confirmer ? »
3. L'administrateur confirme.
4. Le système met `actif = false`.
5. Le vaccin disparaît du formulaire de criblage PSF dès la prochaine ouverture de formulaire.
6. Les STATUT_VACCINAL_PATIENT existants liés à ce vaccin sont **conservés intacts**.
7. La désactivation est journalisée dans AUDIT_LOG.

**Scénario nominal — Réactivation :**

1. L'administrateur filtre la liste sur « Inactifs ».
2. Il sélectionne le vaccin et clique « Réactiver ».
3. Le système met `actif = true`.
4. Le vaccin réapparaît dans le formulaire de criblage.

**Règle :** un vaccin ne peut jamais être supprimé physiquement — uniquement désactivé — pour préserver l'intégrité des données historiques de criblage.

---

## 16. Journal des modifications

| Version | Date | Modifications |
|---|---|---|
| **1.0** | Janv. 2026 | Version initiale — 20 tables |
| **2.0** | Fév. 2026 | +CATEGORIE_LIT, +LIT, +OCCUPATION_LIT — gestion des lits par event sourcing — 22 tables |
| **3.0** | Fév. 2026 | +VACCIN, +STATUT_VACCINAL_PATIENT — référentiel vaccinations dynamique — suppression PATIENT.statut_vaccinal JSONB — 24 tables |

---

*— Fin du Modèle Logique de Données — SGI Couverture Sanitaire OMC — Version 3.0*  
*24 tables · 10 domaines · ~240 attributs · 68 relations · 4 UC référentiel vaccinations*
