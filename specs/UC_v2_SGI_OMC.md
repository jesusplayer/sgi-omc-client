# Cas d'Utilisation — Spécifications Complètes
## Application SGI — Couverture Sanitaire · OMC Yaoundé 2026

> **Version 2.0 · Février 2026**  
> Aligné sur MLD v3.0 — 24 tables  
> Pattern CRUD : Liste → Détail (+ Supprimer/Archiver) → Créer → Modifier  
> Périmètre : 72 cas d'utilisation · 8 acteurs · 12 modules

---

## SOMMAIRE

1. [Acteurs & conventions](#1-acteurs--conventions)
2. [Module — Patients](#2-module--patients)
3. [Module — Criblage PSF](#3-module--criblage-psf)
4. [Module — Référentiel Vaccinations](#4-module--référentiel-vaccinations)
5. [Module — Consultations PMA](#5-module--consultations-pma)
6. [Module — Régulation Médicale](#6-module--régulation-médicale)
7. [Module — Soins Hospitaliers](#7-module--soins-hospitaliers)
8. [Module — Gestion des Lits](#8-module--gestion-des-lits)
9. [Module — Stocks & Logistique](#9-module--stocks--logistique)
10. [Module — Alertes & Notifications](#10-module--alertes--notifications)
11. [Module — Coordination & Rapports](#11-module--coordination--rapports)
12. [Module — Intégration DHIS2](#12-module--intégration-dhis2)
13. [Module — Administration Système](#13-module--administration-système)
14. [Récapitulatif des 72 UC](#14-récapitulatif-des-72-uc)
15. [Relations entre cas d'utilisation](#15-relations-entre-cas-dutilisation)

---

## 1. Acteurs & conventions

### Acteurs

| ID | Acteur | Rôle RBAC | Niveau |
|---|---|---|:---:|
| **A01** | Agent PSF | `OPERATEUR` | 2 |
| **A02** | Agent PMA | `OPERATEUR` | 2 |
| **A03** | Médecin Régulateur | `REG` | 3 |
| **A04** | Médecin FOSA | `OPERATEUR` | 2 |
| **A05** | Data Manager | `DATA` | 4 |
| **A06** | Épidémiologiste | `EPI` | 4 |
| **A07** | Administrateur | `ADMIN` | 5 |
| **A08** | Observateur | `LECTURE` | 1 |
| **SYS** | Système | — | — |

### Convention de nommage des UC

```
UC-[MODULE]-[NUMERO]
  MODULE : PAT, PSF, VAC, CON, REG, SOI, LIT, STK, ALE, RAP, INT, ADM
  NUMERO : L=Liste, D=Détail, C=Créer, E=Éditer + numéro séquentiel

Exemples :
  UC-PAT-L  = Lister les patients
  UC-PAT-D  = Consulter le détail d'un patient
  UC-PAT-C  = Créer un patient
  UC-PAT-E  = Modifier un patient
```

### Pattern CRUD appliqué à tous les modules

```
┌─────────────────────────────────────────────────────────────┐
│  UC-XXX-L  LISTE                                            │
│  • Tableau paginé + filtres + recherche                     │
│  • Bouton [Voir] par ligne → UC-XXX-D                       │
│  • Bouton [Nouveau] → UC-XXX-C                              │
└─────────────────────────────────────────────────────────────┘
              │ [Voir]
              ▼
┌─────────────────────────────────────────────────────────────┐
│  UC-XXX-D  DÉTAIL                                           │
│  • Fiche complète de l'enregistrement                       │
│  • Entités liées (relations affichées en bas)               │
│  • Bouton [Modifier] → UC-XXX-E   (si droits + règles)      │
│  • Bouton [Archiver] ou [Désactiver] (si droits + règles)   │
│  • ← Retour liste                                           │
└─────────────────────────────────────────────────────────────┘
              │ [Modifier]
              ▼
┌─────────────────────────────────────────────────────────────┐
│  UC-XXX-E  ÉDITION                                          │
│  • Formulaire pré-rempli avec valeurs actuelles             │
│  • Champs en lecture seule si règle d'immuabilité           │
│  • [Enregistrer] [Annuler]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Règles de suppression par entité

| Entité | Type de suppression | Bouton affiché | Condition |
|---|---|---|---|
| `PATIENT` | Soft delete (`deleted_at`) | [Archiver] | Aucune PEC active |
| `TRACING_VOL` | Soft delete | [Archiver] | Rôle DATA/ADMIN uniquement |
| `CONSULTATION` | Interdit | — | Toujours verrouillée |
| `ORIENTATION` | Interdit | — | Toujours verrouillée |
| `PRISE_EN_CHARGE` | Interdit | — | Toujours verrouillée |
| `RESULTAT_LABO` | Soft delete (`deleted_at`) | [Annuler résultat] | Rôle DATA/ADMIN + motif obligatoire |
| `LIT` | Désactivation (`statut = HORS_SERVICE`) | [Mettre hors service] | Lit libre uniquement |
| `OCCUPATION_LIT` | Interdit | — | Journal immuable |
| `CATALOGUE_PRODUIT` | Désactivation (`actif = false`) | [Désactiver] | Aucun stock actif |
| `CONSOMMATION_STOCK` | Interdit | — | Journal immuable |
| `ALERTE` | Interdit | — | Immuable |
| `AUDIT_LOG` | Interdit | — | Immuable absolu |
| `VACCIN` | Désactivation (`actif = false`) | [Désactiver] | Toujours possible |
| `STATUT_VACCINAL_PATIENT` | Interdit | — | UPDATE uniquement |
| `UTILISATEUR` | Désactivation (`actif = false`) | [Désactiver] | Rôle ADMIN uniquement |
| `ROLE` | Désactivation (`actif = false`) | [Désactiver] | Aucun user actif lié |
| `SITREP` | Interdit | — | Immuable si DISTRIBUE |
| `CONFIGURATION_ALERTE` | Désactivation (`active = false`) | [Désactiver] | Rôle ADMIN uniquement |

---

## 2. Module — Patients

---

### UC-PAT-L — Lister les patients

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PSF (A01), Agent PMA (A02), Médecin FOSA (A04), Data Manager (A05) |
| **Déclencheur** | Accès au menu « Patients » |
| **Pré-conditions** | Utilisateur authentifié |
| **Post-conditions** | Liste des patients affichée selon les droits du rôle |

**Scénario nominal :**

1. L'utilisateur accède au menu « Patients ».
2. Le système affiche un tableau paginé (20 lignes par page) trié par date de création décroissante.
3. Colonnes affichées : Accréditation, Nom, Prénom, Nationalité, Type, Site d'hébergement, Date création.
4. L'utilisateur peut filtrer par : type de personne, nationalité, site, présence d'une consultation.
5. Un champ de recherche permet de trouver par nom, prénom ou numéro d'accréditation.
6. Chaque ligne affiche un bouton [Voir] menant au détail (UC-PAT-D).
7. Les utilisateurs avec rôle ≥ OPERATEUR voient un bouton [Nouveau patient] (UC-PAT-C).
8. Les patients archivés (`deleted_at IS NOT NULL`) sont masqués par défaut, visibles via filtre « Afficher les archivés » (rôle DATA/ADMIN uniquement).

---

### UC-PAT-D — Consulter le détail d'un patient

| Propriété | Valeur |
|---|---|
| **Acteurs** | Tous acteurs sauf Observateur (lecture seule) |
| **Déclencheur** | Clic sur [Voir] depuis UC-PAT-L |
| **Pré-conditions** | Le patient existe et n'est pas archivé (ou rôle DATA/ADMIN) |
| **Post-conditions** | Fiche complète affichée avec entités liées |

**Scénario nominal :**

1. Le système affiche la fiche complète du patient :
   - Identité : accréditation, nom, prénom, date naissance, sexe, nationalité, type, contact local, hôtel.
   - Commentaire médical.
   - Statuts vaccinaux : tableau dynamique avec tous les vaccins actifs, statut (VALIDE / ABSENT / PERIME / DOUTEUX), date vaccination, numéro certificat.
2. En bas de page, les entités liées sont affichées en onglets :
   - **Consultations** : liste des consultations du patient (date, site, décision).
   - **Orientations** : liste des orientations (statut, FOSA destination).
   - **Hospitalisations** : liste des prises en charge.
   - **Fiches de vol** : fiches TRACING_VOL associées.
3. Les boutons d'action sont affichés selon les règles :
   - [Modifier] → UC-PAT-E — visible si rôle ≥ OPERATEUR et patient non archivé.
   - [Archiver] → visible si rôle DATA/ADMIN, patient non archivé, et aucune PEC active.
4. Si le patient est archivé, une bannière orange « Patient archivé » est affichée et les boutons d'action sont masqués.

**Action [Archiver] — sous-scénario :**

1. L'utilisateur clique [Archiver].
2. Le système affiche un résumé des données liées : « Ce patient a 3 consultations, 1 orientation et 2 statuts vaccinaux. L'archivage masquera ce profil mais conservera l'historique complet. »
3. L'utilisateur saisit un motif d'archivage (obligatoire).
4. L'utilisateur confirme.
5. Le système met `deleted_at = NOW()` et `deleted_by = user_id`.
6. La modification est journalisée dans AUDIT_LOG.
7. L'utilisateur est redirigé vers la liste (UC-PAT-L).

---

### UC-PAT-C — Créer un patient

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PSF (A01), Agent PMA (A02), Data Manager (A05) |
| **Déclencheur** | Clic sur [Nouveau patient] depuis UC-PAT-L |
| **Pré-conditions** | Utilisateur authentifié avec rôle ≥ OPERATEUR |
| **Post-conditions** | Un PATIENT est créé · `created_by` est renseigné · La création est journalisée |

**Scénario nominal :**

1. Le système affiche le formulaire de création.
2. L'utilisateur saisit :
   - Numéro d'accréditation (obligatoire, vérifié unique en temps réel).
   - Nom, prénom (obligatoires).
   - Date de naissance, sexe, nationalité (ISO 3), pays de provenance, type de personne.
   - Contact local, hôtel d'hébergement (liste déroulante des sites de type PMA_HOTEL).
   - Commentaire médical.
3. L'utilisateur soumet le formulaire.
4. Le système vérifie : unicité de l'accréditation, champs obligatoires.
5. Le système crée le PATIENT avec `created_by = user connecté` et `created_at = NOW()`.
6. La création est journalisée dans AUDIT_LOG.
7. Le système redirige vers le détail du patient créé (UC-PAT-D).

**Scénarios alternatifs :**

- **4a** — Accréditation déjà existante : le système affiche une erreur et propose d'ouvrir la fiche existante.

---

### UC-PAT-E — Modifier un patient

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PSF (A01), Agent PMA (A02), Data Manager (A05), Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-PAT-D |
| **Pré-conditions** | Patient non archivé · Utilisateur avec rôle ≥ OPERATEUR |
| **Post-conditions** | Le PATIENT est mis à jour · `updated_at` et `updated_by` sont renseignés · Modification journalisée |

**Scénario nominal :**

1. Le système affiche le formulaire pré-rempli avec les valeurs actuelles.
2. Le champ `accreditation_id` est en lecture seule (invariant après création).
3. L'utilisateur modifie les champs souhaités.
4. L'utilisateur soumet.
5. Le système enregistre les modifications et met à jour `updated_at` et `updated_by`.
6. La modification est journalisée dans AUDIT_LOG avec `ancienne_valeur` et `nouvelle_valeur`.
7. Le système redirige vers le détail (UC-PAT-D).

---

## 3. Module — Criblage PSF

---

### UC-PSF-L — Lister les fiches de criblage

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PSF (A01), Data Manager (A05), Épidémiologiste (A06) |
| **Déclencheur** | Accès au menu « Criblage PSF » |
| **Pré-conditions** | Utilisateur authentifié |
| **Post-conditions** | Liste des fiches de criblage affichée |

**Scénario nominal :**

1. Le système affiche un tableau paginé trié par date d'arrivée décroissante.
2. Colonnes : Accréditation, Nom patient, Vol, Aéroport origine, Date arrivée, Température, Décision frontière.
3. Les lignes avec température ≥ 38°C sont colorées en orange.
4. Les lignes avec décision ≠ AUTORISATION sont colorées en rouge.
5. Filtres disponibles : site PSF, date, décision frontière, température anormale.
6. Chaque ligne affiche un bouton [Voir] → UC-PSF-D.
7. Bouton [Nouvelle fiche] → UC-PSF-C.

---

### UC-PSF-D — Consulter le détail d'une fiche de criblage

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PSF (A01), Data Manager (A05), Épidémiologiste (A06) |
| **Déclencheur** | Clic sur [Voir] depuis UC-PSF-L |
| **Pré-conditions** | La fiche TRACING_VOL existe |
| **Post-conditions** | Détail complet affiché avec statuts vaccinaux du patient |

**Scénario nominal :**

1. Le système affiche la fiche complète :
   - Données du vol : numéro, compagnie, aéroport, siège, date/heure arrivée.
   - Données de criblage : température, symptômes déclarés et détail.
   - Décision de frontière et motif.
   - Agent PSF et site de collecte.
2. Un encadré « Statuts vaccinaux » affiche pour ce patient le statut de chaque vaccin actif, avec mise en évidence des vaccins obligatoires non conformes.
3. Un lien vers la fiche patient complète (UC-PAT-D) est disponible.
4. Boutons d'action :
   - [Modifier] → UC-PSF-E — visible si rôle ≥ OPERATEUR et fiche créée dans les dernières 24h, ou rôle DATA/ADMIN sans limite de temps.
   - [Archiver] → visible si rôle DATA/ADMIN uniquement, avec motif obligatoire.
5. En bas, les orientations liées à ce patient depuis ce criblage sont affichées.

**Action [Archiver] :**

1. L'utilisateur clique [Archiver].
2. Le système affiche : « Cette fiche de criblage sera archivée. Le profil patient est conservé. »
3. Saisie du motif obligatoire.
4. Confirmation. Le système met `deleted_at = NOW()`.
5. Journalisation AUDIT_LOG.

---

### UC-PSF-C — Créer une fiche de criblage

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PSF (A01) |
| **Déclencheur** | Arrivée d'un voyageur au PSF |
| **Pré-conditions** | Agent PSF authentifié sur le site PSF actif |
| **Post-conditions** | TRACING_VOL créé · STATUT_VACCINAL_PATIENT créés pour chaque vaccin actif |

**Scénario nominal :**

1. L'agent sélectionne ou crée le profil PATIENT (recherche par accréditation).
2. Il saisit les données de vol : numéro, compagnie, aéroport d'origine, siège, date/heure d'arrivée.
3. Il saisit la température mesurée.
4. Il coche les symptômes observés.
5. **Vérification vaccinale (liste dynamique)** :
   - Le système charge `SELECT * FROM VACCIN WHERE actif = true ORDER BY obligatoire DESC, ordre_affichage`.
   - Pour chaque vaccin, l'agent sélectionne : statut (VALIDE / ABSENT / PERIME / DOUTEUX / NON_VERIFIE), date de vaccination, numéro de certificat.
   - Les vaccins obligatoires sont affichés en tête avec un badge rouge.
   - Si un vaccin obligatoire n'est pas VALIDE, le champ décision est limité à REFERENCE_TEST / ISOLEMENT / REFOULEMENT.
6. L'agent sélectionne la décision de frontière et le motif si nécessaire.
7. Le système crée TRACING_VOL et les enregistrements STATUT_VACCINAL_PATIENT correspondants.
8. Si température ≥ 38°C : ALERTE niveau 1 créée automatiquement.
9. Si vaccin obligatoire non conforme : ALERTE type VACCIN niveau 1 créée.
10. Redirection vers le détail UC-PSF-D.

---

### UC-PSF-E — Modifier une fiche de criblage

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PSF (A01 — sous 24h), Data Manager (A05), Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-PSF-D |
| **Pré-conditions** | Règle d'édition respectée (24h pour l'agent PSF, sans limite pour DATA/ADMIN) |
| **Post-conditions** | TRACING_VOL mis à jour · STATUT_VACCINAL_PATIENT mis à jour · Journalisé |

**Scénario nominal :**

1. Le formulaire s'ouvre avec les valeurs actuelles.
2. Toutes les données de vol et de criblage sont éditables.
3. La section vaccinale affiche les statuts existants et permet leur correction (UPDATE sur STATUT_VACCINAL_PATIENT existants + `updated_by`).
4. L'agent valide — le système met à jour `updated_at` et `updated_by` sur TRACING_VOL.
5. Journalisation AUDIT_LOG.

---

## 4. Module — Référentiel Vaccinations

---

### UC-VAC-L — Lister les vaccins

| Propriété | Valeur |
|---|---|
| **Acteurs** | Tous acteurs (lecture) · Administrateur (A07) — lecture + actions |
| **Déclencheur** | Accès au menu « Référentiel > Vaccinations » |
| **Pré-conditions** | Utilisateur authentifié |
| **Post-conditions** | Liste des vaccins affichée |

**Scénario nominal :**

1. Le système affiche le tableau des vaccins trié par `ordre_affichage`.
2. Colonnes : Code, Libellé, Obligatoire, Durée validité, Actif, Date création.
3. Les vaccins obligatoires ont un badge visuel distinctif.
4. Les vaccins inactifs sont grisés.
5. Filtre : actif / inactif / obligatoire.
6. Chaque ligne : bouton [Voir] → UC-VAC-D.
7. Administrateur : bouton [Nouveau vaccin] → UC-VAC-C.

---

### UC-VAC-D — Consulter le détail d'un vaccin

| Propriété | Valeur |
|---|---|
| **Acteurs** | Tous acteurs |
| **Déclencheur** | Clic sur [Voir] depuis UC-VAC-L |
| **Pré-conditions** | Le vaccin existe |
| **Post-conditions** | Détail complet affiché avec statistiques d'utilisation |

**Scénario nominal :**

1. Le système affiche la fiche complète : code, libellé, libellé court, obligatoire, durée de validité, ordre d'affichage, description, statut actif, créé par, modifié par.
2. Un encadré statistiques affiche :
   - Nombre de patients avec ce vaccin VALIDE.
   - Nombre de patients avec ce vaccin ABSENT ou PERIME.
   - Nombre d'alertes type VACCIN déclenchées pour ce vaccin.
3. Boutons d'action (Administrateur uniquement) :
   - [Modifier] → UC-VAC-E.
   - [Désactiver] → si `actif = true`.
   - [Réactiver] → si `actif = false`.
4. Le champ `code` est affiché mais signalé comme invariant.

**Action [Désactiver] :**

1. L'administrateur clique [Désactiver].
2. Le système affiche : « Ce vaccin ne sera plus proposé dans le formulaire de criblage PSF. Les [N] statuts vaccinaux existants sont conservés. Confirmer ? »
3. Confirmation. Le système met `actif = false` et `updated_by`.
4. Journalisation AUDIT_LOG.

**Action [Réactiver] :**

1. L'administrateur clique [Réactiver].
2. Confirmation simple.
3. Le système met `actif = true`.
4. Le vaccin réapparaît immédiatement dans le formulaire de criblage.
5. Journalisation AUDIT_LOG.

---

### UC-VAC-C — Créer un vaccin

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Nouveau vaccin] depuis UC-VAC-L |
| **Pré-conditions** | Administrateur authentifié |
| **Post-conditions** | VACCIN créé · Disponible dans le formulaire de criblage |

**Scénario nominal :**

1. Le formulaire s'affiche avec les champs : code (obligatoire, unique), libellé, libellé court, obligatoire (case à cocher), durée de validité en mois, ordre d'affichage, description.
2. Le champ code est validé en temps réel (unicité, format alphanumérique en majuscules avec underscore).
3. L'administrateur soumet.
4. Le système crée le VACCIN avec `actif = true`, `created_by`, `created_at`.
5. Journalisation AUDIT_LOG.
6. Redirection vers UC-VAC-D.

---

### UC-VAC-E — Modifier un vaccin

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-VAC-D |
| **Pré-conditions** | Administrateur authentifié |
| **Post-conditions** | VACCIN mis à jour · `updated_at`, `updated_by` renseignés · Journalisé |

**Scénario nominal :**

1. Le formulaire s'ouvre pré-rempli.
2. Le champ `code` est en lecture seule (invariant).
3. L'administrateur modifie les champs éditables.
4. Le système valide et enregistre avec `updated_at = NOW()` et `updated_by`.
5. Journalisation AUDIT_LOG avec `ancienne_valeur` / `nouvelle_valeur`.
6. Un avertissement est affiché si `duree_validite_mois` est modifié : « La nouvelle durée s'appliquera aux prochaines saisies uniquement. Les certificats déjà vérifiés ne sont pas recalculés. »

---

## 5. Module — Consultations PMA

---

### UC-CON-L — Lister les consultations

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PMA (A02), Médecin Régulateur (A03), Data Manager (A05), Épidémiologiste (A06) |
| **Déclencheur** | Accès au menu « Consultations » |
| **Pré-conditions** | Utilisateur authentifié |
| **Post-conditions** | Liste des consultations affichée selon le site de l'utilisateur |

**Scénario nominal :**

1. Le système affiche les consultations du site de l'utilisateur (filtre automatique par `site_principal_id`).
2. Colonnes : Heure arrivée, Patient, Motif (tronqué), Température, Décision, Statut saisie.
3. Consultations ouvertes en haut, clôturées ensuite.
4. Codes couleurs : orange si température ≥ 38.5°C, rouge si décision EVACUATION_FOSA.
5. Filtres : site, date, décision, statut saisie.
6. Bouton [Voir] → UC-CON-D.
7. Bouton [Nouvelle consultation] → UC-CON-C.

---

### UC-CON-D — Consulter le détail d'une consultation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Tous acteurs |
| **Déclencheur** | Clic sur [Voir] depuis UC-CON-L |
| **Pré-conditions** | La CONSULTATION existe |
| **Post-conditions** | Fiche complète affichée avec entités liées |

**Scénario nominal :**

1. Le système affiche la fiche complète :
   - Horodatages : arrivée, consultation, sortie. KPI délai affiché en minutes.
   - Patient avec lien vers UC-PAT-D.
   - Signes vitaux avec codes couleur (valeurs normales/anormales).
   - Motif, symptômes, diagnostic présomptif, soins prodigués.
   - Décision finale.
2. Onglets des entités liées :
   - **Consommations de stock** : liste des produits utilisés avec quantités.
   - **Orientation générée** : si décision = EVACUATION_FOSA, lien vers UC-REG-D.
3. Boutons d'action :
   - [Modifier] → UC-CON-E — visible uniquement si `statut_saisie = OUVERTE`, ou rôle DATA/ADMIN.
   - **Aucun bouton de suppression** — les consultations sont immuables structurellement.
4. Si `statut_saisie = VALIDEE`, une bannière bleue « Consultation validée — lecture seule » est affichée.

---

### UC-CON-C — Ouvrir une nouvelle consultation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PMA (A02) |
| **Déclencheur** | Arrivée d'un patient au PMA |
| **Pré-conditions** | Agent authentifié sur son site PMA |
| **Post-conditions** | CONSULTATION créée avec `heure_arrivee = NOW()` · `statut_saisie = OUVERTE` |

**Scénario nominal :**

1. L'agent recherche le patient par accréditation ou nom.
2. Le système vérifie l'absence de consultation ouverte pour ce patient sur ce site.
3. L'agent confirme l'identité.
4. Le système crée la CONSULTATION avec `heure_arrivee = NOW()`, `statut_saisie = OUVERTE`.
5. Le formulaire s'ouvre directement en mode saisie pour les signes vitaux.
6. L'agent saisit : signes vitaux, motif, symptômes, diagnostic présomptif, soins prodigués, produits utilisés.
7. L'agent sélectionne la décision finale.
8. L'agent clôture la consultation : `heure_sortie = NOW()`, `statut_saisie = VALIDEE`.
9. Si décision = EVACUATION_FOSA → le formulaire d'orientation s'ouvre (UC-REG-C).

---

### UC-CON-E — Modifier une consultation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PMA (A02 — si OUVERTE), Data Manager (A05 — si CORRIGEE autorisée), Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-CON-D |
| **Pré-conditions** | `statut_saisie = OUVERTE` ou rôle DATA/ADMIN |
| **Post-conditions** | CONSULTATION mise à jour · `updated_at`, `updated_by`, `statut_saisie = CORRIGEE` · Journalisé |

**Scénario nominal :**

1. Le formulaire s'ouvre avec les valeurs actuelles.
2. `heure_arrivee` est en lecture seule (immuable après création).
3. L'agent ou Data Manager modifie les champs nécessaires.
4. Si c'est une correction par DATA/ADMIN sur une consultation VALIDEE : le `statut_saisie` passe à `CORRIGEE` et un champ motif de correction est obligatoire.
5. Le système enregistre et journalise avec `ancienne_valeur` / `nouvelle_valeur`.

---

## 6. Module — Régulation Médicale

---

### UC-REG-L — Lister les appels de régulation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin Régulateur (A03), Data Manager (A05) |
| **Déclencheur** | Accès au menu « Régulation » |
| **Pré-conditions** | Utilisateur authentifié |
| **Post-conditions** | Liste des appels affichée |

**Scénario nominal :**

1. Le système affiche les appels triés par `datetime_appel` décroissant.
2. Colonnes : Date/heure, Type appelant, Localisation, Gravité (badge coloré), Moyen engagé, Statut.
3. Appels EN_COURS en premier avec chronomètre de délai visible.
4. Filtres : statut, niveau de gravité, date, type appelant.
5. Bouton [Voir] → UC-REG-D.
6. Bouton [Nouvel appel] → UC-REG-C.

---

### UC-REG-D — Consulter le détail d'un appel de régulation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin Régulateur (A03), Data Manager (A05) |
| **Déclencheur** | Clic sur [Voir] depuis UC-REG-L |
| **Pré-conditions** | L'APPEL_REGULATION existe |
| **Post-conditions** | Détail complet affiché |

**Scénario nominal :**

1. Le système affiche :
   - Horodatage appel, appelant, site, localisation.
   - Motif, niveau de gravité, moyen engagé.
   - Conseil téléphonique si applicable.
   - KPI délai de réponse (heure départ moyen − datetime appel).
   - Statut actuel.
2. Onglets entités liées :
   - **Orientation générée** : lien vers UC-ORI-D si applicable.
3. Boutons d'action :
   - [Modifier] → UC-REG-E — visible si `statut = EN_COURS` ou rôle ADMIN.
   - **Aucun bouton de suppression.**

---

### UC-REG-C — Créer un appel de régulation

| Propriété | Valeur |
|---|---|
| **Acteur** | Médecin Régulateur (A03) |
| **Déclencheur** | Réception d'un appel téléphonique |
| **Pré-conditions** | Médecin régulateur authentifié |
| **Post-conditions** | APPEL_REGULATION créé · Chronomètre délai démarré |

**Scénario nominal :**

1. Le médecin sélectionne « Nouvel appel ».
2. Il saisit : site appelant, type appelant, nom/téléphone appelant, localisation, motif.
3. Il évalue et saisit le niveau de gravité (1 à 5).
4. Il sélectionne le moyen engagé.
5. Si CONSEIL_TEL : il saisit le conseil donné.
6. Si moyen physique (AMBULANCE, SMUR) : il saisit l'heure de départ.
7. Il soumet. Le système crée l'APPEL_REGULATION avec `datetime_appel = NOW()`.
8. Si `niveau_gravite >= 4` : ALERTE niveau 2 créée automatiquement.
9. Si une orientation est nécessaire → UC-ORI-C s'ouvre.

---

### UC-REG-E — Modifier un appel de régulation

| Propriété | Valeur |
|---|---|
| **Acteur** | Médecin Régulateur (A03), Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-REG-D |
| **Pré-conditions** | `statut = EN_COURS` ou rôle ADMIN |
| **Post-conditions** | APPEL_REGULATION mis à jour · Journalisé |

**Scénario nominal :**

1. Le formulaire s'ouvre pré-rempli.
2. `datetime_appel` est en lecture seule.
3. Le médecin met à jour : heure d'arrivée du moyen, statut, conseil téléphonique.
4. Le système enregistre avec `updated_at` et `updated_by`.
5. Journalisation AUDIT_LOG.

---

### UC-ORI-L — Lister les orientations

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin Régulateur (A03), Médecin FOSA (A04), Data Manager (A05) |
| **Déclencheur** | Accès au menu « Orientations » |
| **Post-conditions** | Liste des orientations affichée |

**Scénario nominal :**

1. Tableau trié par `heure_decision` décroissant.
2. Colonnes : Patient, FOSA destination, Transport, État départ, Statut, Délai PEC.
3. Orientations EN_ATTENTE et EN_COURS colorées en orange avec chronomètre.
4. Filtres : statut, FOSA, date, moyen de transport.
5. Bouton [Voir] → UC-ORI-D.
6. Bouton [Nouvelle orientation] → UC-ORI-C.

---

### UC-ORI-D — Consulter le détail d'une orientation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin Régulateur (A03), Médecin FOSA (A04), Data Manager (A05) |
| **Déclencheur** | Clic sur [Voir] depuis UC-ORI-L |
| **Post-conditions** | Détail complet affiché |

**Scénario nominal :**

1. Le système affiche :
   - Consultation ou appel d'origine avec lien.
   - FOSA destination et alternative.
   - Moyen de transport, état patient au départ.
   - Horodatages : décision, départ, arrivée FOSA. KPI délai PEC.
   - Statut actuel avec historique des changements.
2. Onglets :
   - **Prise en charge liée** : lien vers UC-SOI-D si patient admis.
3. Boutons :
   - [Modifier] → UC-ORI-E — visible si `statut IN (EN_ATTENTE, EN_COURS)` ou rôle ADMIN.
   - **Aucun bouton de suppression.**

---

### UC-ORI-C — Créer une orientation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PMA (A02), Médecin Régulateur (A03) |
| **Déclencheur** | Décision d'évacuation (depuis UC-CON-C) ou appel de régulation (depuis UC-REG-C) |
| **Post-conditions** | ORIENTATION créée · Régulateur et FOSA notifiés |

**Scénario nominal :**

1. Le formulaire s'ouvre avec la consultation ou l'appel pré-lié.
2. Le système affiche les FOSA disponibles triées par lits libres (via taux d'occupation temps réel).
3. L'utilisateur sélectionne FOSA destination, moyen de transport, état patient.
4. Il saisit le motif d'évacuation.
5. Le système crée l'ORIENTATION avec `heure_decision = NOW()` et `statut = EN_ATTENTE`.
6. Notification automatique au régulateur (PUSH + SMS) et à la FOSA destination.

---

### UC-ORI-E — Modifier une orientation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin Régulateur (A03), Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-ORI-D |
| **Pré-conditions** | `statut IN (EN_ATTENTE, EN_COURS)` ou rôle ADMIN |
| **Post-conditions** | ORIENTATION mise à jour · Journalisée |

**Scénario nominal :**

1. Le formulaire s'ouvre pré-rempli.
2. `heure_decision` est en lecture seule.
3. Le régulateur peut modifier : FOSA destination, moyen, état patient, statut (EN_COURS → ARRIVE / REFUSE / ANNULE), heure arrivée FOSA.
4. Si statut → REFUSE : motif_refus devient obligatoire.
5. Le système enregistre, journalise.

---

## 7. Module — Soins Hospitaliers

---

### UC-SOI-L — Lister les prises en charge

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin FOSA (A04), Médecin Régulateur (A03), Data Manager (A05) |
| **Déclencheur** | Accès au menu « Hospitalisations » |
| **Post-conditions** | Liste des prises en charge affichée |

**Scénario nominal :**

1. Tableau trié par `admission_datetime` décroissant.
2. Colonnes : Patient, FOSA, Lit attribué (catégorie), État entrée, Diagnostic final, Durée séjour, Devenir.
3. PEC actives (sans `sortie_datetime`) en premier.
4. Filtres : FOSA, catégorie lit, état, date admission, devenir.
5. Bouton [Voir] → UC-SOI-D.
6. Bouton [Nouvelle admission] → UC-SOI-C.

---

### UC-SOI-D — Consulter le détail d'une prise en charge

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin FOSA (A04), Data Manager (A05) |
| **Déclencheur** | Clic sur [Voir] depuis UC-SOI-L |
| **Post-conditions** | Dossier complet affiché |

**Scénario nominal :**

1. Le système affiche :
   - Patient avec lien vers UC-PAT-D.
   - Orientation d'origine avec lien vers UC-ORI-D.
   - Lit attribué : numéro, catégorie, site.
   - Horodatages : admission, sortie. Durée de séjour calculée.
   - État d'entrée, diagnostic entrée, diagnostic final (code CIM-11).
   - Traitements (liste structurée).
   - Indicateurs : oxygène, réanimation, transfusion.
   - Devenir.
2. Onglets :
   - **Résultats de laboratoire** : liste des RESULTAT_LABO avec statut (EN_ATTENTE / disponible).
   - **Occupation du lit** : historique de l'OCCUPATION_LIT (début, fin, durée).
3. Boutons :
   - [Modifier] → UC-SOI-E — visible si `sortie_datetime IS NULL` ou rôle ADMIN.
   - [Enregistrer la sortie] → sous-formulaire de sortie si `sortie_datetime IS NULL`.
   - **Aucun bouton de suppression.**

**Action [Enregistrer la sortie] :**

1. Le médecin clique [Enregistrer la sortie].
2. Il saisit : `sortie_datetime`, diagnostic final (code CIM-11 obligatoire), devenir.
3. Il confirme.
4. Le système met à jour la PRISE_EN_CHARGE.
5. Le trigger ferme l'OCCUPATION_LIT : `fin_occupation = sortie_datetime`.
6. Le trigger libère le lit : `LIT.statut = LIBRE`.
7. `SITE.lits_occupes` est décrémenté.

---

### UC-SOI-C — Admettre un patient (nouvelle prise en charge)

| Propriété | Valeur |
|---|---|
| **Acteur** | Médecin FOSA (A04) |
| **Déclencheur** | Arrivée d'un patient transféré ou admission directe |
| **Post-conditions** | PRISE_EN_CHARGE créée · LIT attribué · OCCUPATION_LIT créée · Régulateur notifié |

**Scénario nominal :**

1. Le médecin sélectionne « Nouvelle admission ».
2. Il lie l'orientation entrante si existante.
3. Il confirme le patient.
4. Il sélectionne le lit (UC-LIT-D — attribution depuis le plan des lits).
5. Il saisit : état d'entrée, diagnostic d'entrée.
6. Il confirme l'admission.
7. Le système crée la PRISE_EN_CHARGE avec `admission_datetime = NOW()`.
8. Le système crée l'OCCUPATION_LIT avec `debut_occupation = NOW()`.
9. Le trigger met `LIT.statut = OCCUPE` et incrémente `SITE.lits_occupes`.
10. Notification au régulateur si orientation liée.

---

### UC-SOI-E — Modifier une prise en charge

| Propriété | Valeur |
|---|---|
| **Acteur** | Médecin FOSA (A04), Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-SOI-D |
| **Pré-conditions** | `sortie_datetime IS NULL` ou rôle ADMIN |
| **Post-conditions** | PRISE_EN_CHARGE mise à jour · Journalisée |

**Scénario nominal :**

1. Formulaire pré-rempli. `admission_datetime` en lecture seule.
2. Le médecin peut modifier : diagnostic, traitements, indicateurs (oxygène, réanimation, transfusion).
3. Pour changer de lit : il sélectionne un nouveau lit disponible → OCCUPATION_LIT courante est fermée, nouvelle ouverte.
4. Enregistrement avec `updated_at`, `updated_by`. Journalisation.

---

### UC-LAB-L — Lister les résultats de laboratoire

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin FOSA (A04), Épidémiologiste (A06), Data Manager (A05) |
| **Déclencheur** | Accès à l'onglet « Résultats labo » d'une PEC ou menu global |
| **Post-conditions** | Liste des résultats affichée |

**Scénario nominal :**

1. Si accès depuis UC-SOI-D : filtrés automatiquement sur la PEC en cours.
2. Colonnes : Type examen, Libellé, Interprétation (badge coloré), Date prélèvement, Date résultat, Statut.
3. Résultats CRITIQUE en rouge, EN_ATTENTE en gris.
4. Filtres : type, interprétation, date.
5. Bouton [Voir] → UC-LAB-D.
6. Bouton [Prescrire un examen] → UC-LAB-C.

---

### UC-LAB-D — Consulter le détail d'un résultat de laboratoire

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin FOSA (A04), Épidémiologiste (A06) |
| **Déclencheur** | Clic sur [Voir] depuis UC-LAB-L |
| **Post-conditions** | Résultat complet affiché |

**Scénario nominal :**

1. Le système affiche : type, libellé, valeur, unité, valeur normale min/max, interprétation, commentaire, fichier joint, prescripteur, technicien, dates.
2. Si `interpretation = CRITIQUE` : bannière rouge + lien vers l'alerte générée.
3. Boutons :
   - [Modifier] → UC-LAB-E — visible si `interpretation = EN_ATTENTE` ou rôle DATA/ADMIN.
   - [Annuler ce résultat] → visible si rôle DATA/ADMIN uniquement, avec soft delete + motif obligatoire.

**Action [Annuler ce résultat] :**

1. L'utilisateur clique [Annuler ce résultat].
2. Le système demande un motif obligatoire (erreur de saisie, mauvais patient, etc.).
3. Confirmation.
4. Le système met `deleted_at = NOW()` et `deleted_by`.
5. Le résultat est masqué par défaut dans la liste (visible via filtre « Annulés » pour DATA/ADMIN).
6. Journalisation AUDIT_LOG.

---

### UC-LAB-C — Prescrire un examen

| Propriété | Valeur |
|---|---|
| **Acteur** | Médecin FOSA (A04) |
| **Déclencheur** | Besoin d'examen complémentaire lors d'une hospitalisation |
| **Post-conditions** | RESULTAT_LABO créé avec `interpretation = EN_ATTENTE` |

**Scénario nominal :**

1. Le médecin sélectionne « Prescrire un examen » depuis UC-SOI-D.
2. Il choisit le type d'examen et saisit le libellé précis.
3. Il renseigne la date de prélèvement.
4. Il soumet. Création du RESULTAT_LABO avec `interpretation = EN_ATTENTE`.

---

### UC-LAB-E — Saisir / Modifier un résultat

| Propriété | Valeur |
|---|---|
| **Acteur** | Médecin FOSA (A04), Data Manager (A05) |
| **Déclencheur** | Réception du résultat ou correction d'une valeur erronée |
| **Post-conditions** | RESULTAT_LABO mis à jour · Si CRITIQUE → ALERTE créée |

**Scénario nominal :**

1. Le formulaire s'ouvre pré-rempli.
2. Le médecin saisit la valeur, l'unité, l'interprétation, la date de résultat, le commentaire.
3. Il peut joindre un fichier.
4. Le système enregistre. Si `interpretation = CRITIQUE` → ALERTE niveau 2 créée automatiquement.
5. Journalisation.

---

## 8. Module — Gestion des Lits

---

### UC-LIT-L — Consulter le plan des lits

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin FOSA (A04), Médecin Régulateur (A03), Data Manager (A05) |
| **Déclencheur** | Accès au menu « Lits » ou depuis UC-SOI-C |
| **Post-conditions** | Plan des lits affiché par catégorie et par statut |

**Scénario nominal :**

1. Le système affiche les lits de la FOSA de l'utilisateur groupés par catégorie (VIP, Standard, Réanimation, Isolation, Urgence).
2. Pour chaque catégorie : nombre total, occupés, libres, hors service. Taux d'occupation en pourcentage avec code couleur.
3. Chaque lit est représenté comme une carte : numéro, statut (couleur), patient actuel si OCCUPE.
4. Filtres : catégorie, statut.
5. Clic sur un lit → UC-LIT-D.
6. Bouton [Nouveau lit] → UC-LIT-C (rôle ADMIN uniquement).

---

### UC-LIT-D — Consulter le détail d'un lit

| Propriété | Valeur |
|---|---|
| **Acteurs** | Médecin FOSA (A04), Data Manager (A05) |
| **Déclencheur** | Clic sur un lit depuis UC-LIT-L |
| **Post-conditions** | Détail complet avec historique d'occupation |

**Scénario nominal :**

1. Le système affiche : numéro de lit, catégorie, site, statut actuel.
2. Si OCCUPE : nom du patient actuel, heure d'attribution, durée d'occupation en cours.
3. Onglet **Historique** : liste des OCCUPATION_LIT passées avec début, fin, durée, patient, motif de libération.
4. Statistiques : nombre d'occupations sur l'événement, durée moyenne de séjour.
5. Boutons :
   - [Mettre hors service] → visible si `statut = LIBRE`.
   - [Remettre en service] → visible si `statut = HORS_SERVICE`.
   - [Modifier] → UC-LIT-E (rôle ADMIN — pour changer catégorie ou numéro).
   - **Pas de suppression physique.**

**Action [Mettre hors service] :**

1. L'utilisateur clique [Mettre hors service].
2. Le système vérifie : `statut = LIBRE`. Si OCCUPE : bouton non disponible.
3. Saisie du motif (maintenance, décontamination, panne) et durée estimée.
4. Confirmation.
5. Le système met `LIT.statut = HORS_SERVICE`.
6. Le trigger décrémente `SITE.capacite_lits`.
7. Journalisation AUDIT_LOG.

**Action [Remettre en service] :**

1. Confirmation simple.
2. Le système met `LIT.statut = LIBRE`.
3. Le trigger incrémente `SITE.capacite_lits`.
4. Journalisation.

---

### UC-LIT-C — Créer un lit

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Ajout d'un lit dans une FOSA |
| **Post-conditions** | LIT créé avec `statut = LIBRE` · `SITE.capacite_lits` incrémenté |

**Scénario nominal :**

1. L'administrateur sélectionne la FOSA et la catégorie.
2. Il saisit le numéro de lit (vérifié unique dans le site).
3. Il confirme.
4. Le système crée le LIT avec `statut = LIBRE`.
5. Le trigger incrémente `SITE.capacite_lits`.
6. Journalisation.

---

### UC-LIT-E — Modifier un lit

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-LIT-D |
| **Pré-conditions** | `statut = LIBRE` ou `HORS_SERVICE` |
| **Post-conditions** | LIT mis à jour · Journalisé |

**Scénario nominal :**

1. Le formulaire s'ouvre : catégorie et numéro éditables.
2. Le statut n'est pas éditable directement (géré par triggers et UC dédiés).
3. Enregistrement avec journalisation.

---

## 9. Module — Stocks & Logistique

---

### UC-CAT-L — Lister le catalogue produits

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PMA (A02), Data Manager (A05), Administrateur (A07) |
| **Déclencheur** | Accès au menu « Catalogue produits » |
| **Post-conditions** | Liste du catalogue affichée |

**Scénario nominal :**

1. Tableau : Code, Désignation, Catégorie, DCI, Unité, Nécessite froid, Actif.
2. Produits inactifs grisés. Filtre actif/inactif.
3. Bouton [Voir] → UC-CAT-D.
4. Bouton [Nouveau produit] → UC-CAT-C (rôle ADMIN).

---

### UC-CAT-D — Consulter le détail d'un produit

| Propriété | Valeur |
|---|---|
| **Acteurs** | Tous acteurs |
| **Déclencheur** | Clic sur [Voir] depuis UC-CAT-L |
| **Post-conditions** | Détail complet du produit affiché |

**Scénario nominal :**

1. Affiche : code, désignation, catégorie, DCI, forme, dosage, unité, code ATC, chaîne du froid, statut actif.
2. Onglet **Stocks par site** : liste des STOCK de ce produit par site avec quantité disponible et statut.
3. Boutons (ADMIN uniquement) :
   - [Modifier] → UC-CAT-E.
   - [Désactiver] → visible si `actif = true` et aucun stock actif > 0.
   - [Réactiver] → visible si `actif = false`.

**Action [Désactiver] :**

1. Vérification : aucun stock actif > 0 pour ce produit.
2. Si stock > 0 sur un site : avertissement « Ce produit a encore du stock sur [N] site(s). Vous devez d'abord le consommer ou le transférer. »
3. Si stock = 0 partout : confirmation → `actif = false`. Journalisation.

---

### UC-CAT-C — Créer un produit

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Nouveau produit à gérer dans le système |
| **Post-conditions** | CATALOGUE_PRODUIT créé |

**Scénario nominal :**

1. Formulaire : code (unique), désignation, catégorie, DCI, forme, dosage, unité, code ATC, chaîne du froid.
2. Code vérifié en temps réel.
3. Création avec `actif = true`. Journalisation.

---

### UC-CAT-E — Modifier un produit

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-CAT-D |
| **Post-conditions** | CATALOGUE_PRODUIT mis à jour · Journalisé |

**Scénario nominal :**

1. Formulaire pré-rempli. Champ `code_produit` en lecture seule.
2. Modifications enregistrées avec `updated_at`, `updated_by`. Journalisation.

---

### UC-STK-L — Lister les stocks d'un site

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PMA (A02), Médecin FOSA (A04), Data Manager (A05) |
| **Déclencheur** | Accès au menu « Stocks » |
| **Post-conditions** | Inventaire du site affiché |

**Scénario nominal :**

1. Liste des stocks du site de l'utilisateur.
2. Colonnes : Produit, Quantité disponible, Unité, Seuil alerte, Statut (badge coloré), Péremption.
3. Statuts ALERTE et CRITIQUE en orange/rouge en haut.
4. Filtres : statut, catégorie produit, péremption proche.
5. Bouton [Voir] → UC-STK-D.
6. Bouton [Nouvelle entrée stock] → UC-STK-C.
7. Bouton [Inventaire] → UC-STK-INV.

---

### UC-STK-D — Consulter le détail d'un stock

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PMA (A02), Data Manager (A05) |
| **Déclencheur** | Clic sur [Voir] depuis UC-STK-L |
| **Post-conditions** | Détail stock affiché avec historique complet |

**Scénario nominal :**

1. Affiche : produit (lien UC-CAT-D), site, quantité, unité, seuils, lot, emplacement, péremption, responsable, statut.
2. Graphique d'évolution de la quantité sur la durée de l'événement.
3. Onglet **Mouvements** : liste chronologique des CONSOMMATION_STOCK (type, quantité, sens, stock avant/après, agent, date).
4. Boutons :
   - [Enregistrer une consommation] → UC-STK-C (sens SORTIE).
   - [Enregistrer un réapprovisionnement] → UC-STK-C (sens ENTREE).
   - [Modifier les seuils] → UC-STK-E.
   - **Aucun bouton de suppression** — journal immuable.

---

### UC-STK-C — Enregistrer un mouvement de stock

| Propriété | Valeur |
|---|---|
| **Acteur** | Agent PMA (A02) |
| **Déclencheur** | Consommation, réapprovisionnement, perte ou transfert |
| **Post-conditions** | CONSOMMATION_STOCK créée · STOCK mis à jour · Alerte si seuil franchi |

**Scénario nominal :**

1. L'agent sélectionne le type de mouvement : CONSOMMATION / REAPPRO / PERTE / PEREMPTION / TRANSFERT.
2. Il saisit la quantité (entier positif).
3. Le système calcule `stock_avant` et `stock_apres`.
4. Si REAPPRO : l'agent saisit numéro de lot et date de péremption.
5. Le système enregistre la CONSOMMATION_STOCK et met à jour STOCK.
6. Si nouveau statut = ALERTE ou CRITIQUE → ALERTE créée.

---

### UC-STK-E — Modifier les seuils d'un stock

| Propriété | Valeur |
|---|---|
| **Acteur** | Data Manager (A05), Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier les seuils] depuis UC-STK-D |
| **Post-conditions** | Seuils mis à jour · Journalisés |

**Scénario nominal :**

1. Formulaire simple : `seuil_alerte` et `seuil_critique`.
2. Validation : `seuil_critique <= seuil_alerte`.
3. Enregistrement. Le statut du stock est réévalué immédiatement selon les nouveaux seuils.
4. Journalisation.

---

### UC-STK-INV — Réaliser un inventaire

| Propriété | Valeur |
|---|---|
| **Acteur** | Agent PMA (A02) |
| **Déclencheur** | Contrôle quotidien ou demande coordination |
| **Post-conditions** | Écarts documentés · CONSOMMATION_STOCK de type INVENTAIRE créées |

**Scénario nominal :**

1. L'agent sélectionne « Inventaire ».
2. Liste de tous les produits avec la quantité théorique.
3. L'agent saisit les quantités physiquement comptées.
4. Le système calcule et affiche les écarts.
5. Pour chaque écart : l'agent saisit un motif (perte, consommation non enregistrée, erreur).
6. Le système crée les CONSOMMATION_STOCK de type INVENTAIRE pour corriger.

---

## 10. Module — Alertes & Notifications

---

### UC-ALE-L — Lister les alertes

| Propriété | Valeur |
|---|---|
| **Acteurs** | Data Manager (A05), Médecin Régulateur (A03), Épidémiologiste (A06) |
| **Déclencheur** | Accès au menu « Alertes » ou réception notification |
| **Post-conditions** | Liste des alertes affichée |

**Scénario nominal :**

1. Tableau trié par `datetime_declenchement` décroissant, alertes ACTIVE en premier.
2. Colonnes : Niveau (badge coloré), Type, Site, Titre, Valeur déclenchante, Statut, Délai acheminement.
3. Filtre : niveau, type, statut, site, date.
4. Compteurs en haut : Alertes ACTIVE niveau 1 / 2 / 3.
5. Bouton [Voir] → UC-ALE-D.
6. Bouton [Nouvelle alerte manuelle] → UC-ALE-C.

---

### UC-ALE-D — Consulter le détail d'une alerte

| Propriété | Valeur |
|---|---|
| **Acteurs** | Data Manager (A05), Médecin Régulateur (A03), Épidémiologiste (A06) |
| **Déclencheur** | Clic sur [Voir] depuis UC-ALE-L ou notification reçue |
| **Post-conditions** | Détail complet affiché · Accusé de réception possible |

**Scénario nominal :**

1. Le système affiche :
   - Niveau, type, site, source (entité + lien vers l'enregistrement source).
   - Titre et message (immuables — affichés en lecture seule avec mention explicite).
   - Valeur déclenchante vs seuil configuré.
   - Horodatage déclenchement, réception PC, PEC, résolution.
   - KPI délai d'acheminement.
   - Statut actuel.
2. Si `statut = ACTIVE` et `datetime_reception_pc IS NULL` : bouton [Accuser réception].
3. Si `statut = ACTIVE` : bouton [Prendre en charge].
4. Si `statut = PRISE_EN_CHARGE` : bouton [Résoudre].
5. Onglet **Notifications envoyées** : liste des NOTIFICATION avec canal, destinataire, statut livraison.
6. **Aucun bouton de suppression** — les alertes sont immuables.

**Action [Prendre en charge] :**

1. Un clic met `statut = PRISE_EN_CHARGE`, `prise_en_charge_par = user`, `datetime_pec = NOW()`.

**Action [Résoudre] :**

1. L'utilisateur saisit le commentaire de résolution (obligatoire).
2. Le système met `statut = RESOLUE`, `resolu_par`, `datetime_resolution = NOW()`.
3. Tous les destinataires sont notifiés de la résolution.

---

### UC-ALE-C — Créer une alerte manuelle

| Propriété | Valeur |
|---|---|
| **Acteurs** | Agent PMA (A02), Médecin Régulateur (A03), Médecin FOSA (A04), Data Manager (A05), Épidémiologiste (A06) |
| **Déclencheur** | Situation préoccupante non couverte par les règles automatiques |
| **Post-conditions** | ALERTE créée · Destinataires notifiés |

**Scénario nominal :**

1. L'utilisateur sélectionne : type, niveau, site concerné.
2. Il saisit : titre, message détaillé.
3. Il soumet. Le système crée l'ALERTE avec `datetime_declenchement = NOW()`.
4. Les notifications sont envoyées selon les règles du type d'alerte sélectionné.

> Note : les alertes n'ont pas de UC Modifier ni de UC Supprimer — elles sont immuables par conception.

---

## 11. Module — Coordination & Rapports

---

### UC-RAP-DB — Consulter le dashboard temps réel

| Propriété | Valeur |
|---|---|
| **Acteurs** | Data Manager (A05), Médecin Régulateur (A03), Épidémiologiste (A06), Observateur (A08) |
| **Déclencheur** | Accès au menu « Dashboard » |
| **Post-conditions** | KPI temps réel affichés |

**Scénario nominal :**

1. Le dashboard affiche en temps réel :
   - **Consultations** : total du jour, par site, par heure (graphique).
   - **Évacuations** : nombre et taux (%) vs seuil configuré.
   - **Délai moyen PEC** (minutes) vs cible 15 min.
   - **Occupation lits** : taux global FOSA, taux VIP, Standard, Réanimation, Isolation (jauges colorées).
   - **Alertes actives** : compteurs niveau 1 / 2 / 3 avec liste en temps réel.
   - **Carte des sites** : état coloré de chaque site (vert/orange/rouge).
2. Rafraîchissement automatique toutes les 30 secondes.
3. Filtre par site et par période (heure, jour).

---

### UC-RAP-L — Lister les SITREP

| Propriété | Valeur |
|---|---|
| **Acteurs** | Data Manager (A05), Épidémiologiste (A06), Observateur (A08) |
| **Déclencheur** | Accès au menu « Rapports » |
| **Post-conditions** | Liste des SITREP affichée |

**Scénario nominal :**

1. Tableau : Date, Jour événement, Consultations, Évacuations, Hospitalisations, Décès, Statut.
2. Bouton [Voir] → UC-RAP-D.
3. Bouton [Générer SITREP du jour] → UC-RAP-C (rôle DATA uniquement).

---

### UC-RAP-D — Consulter le détail d'un SITREP

| Propriété | Valeur |
|---|---|
| **Acteurs** | Data Manager (A05), Épidémiologiste (A06), Observateur (A08) |
| **Déclencheur** | Clic sur [Voir] depuis UC-RAP-L |
| **Post-conditions** | SITREP complet affiché |

**Scénario nominal :**

1. Le système affiche tous les indicateurs : consultations, évacuations, hospitalisations, décès, KPI, occupation lits par catégorie, alertes, vaccins non conformes.
2. Données par site (tableau).
3. Top diagnostics.
4. Sections narratives : commentaire épidémiologique, recommandations.
5. Boutons :
   - [Modifier] → UC-RAP-E — visible si `statut IN (BROUILLON, VALIDE)`.
   - [Valider] → si `statut = BROUILLON`.
   - [Distribuer] → si `statut = VALIDE`.
   - **Aucun bouton de suppression** — SITREP immuable une fois DISTRIBUE.
6. Si `statut = DISTRIBUE` : bannière verte + liste des destinataires.

---

### UC-RAP-C — Générer le SITREP quotidien

| Propriété | Valeur |
|---|---|
| **Acteur** | Data Manager (A05) |
| **Déclencheur** | Fin de journée ou déclenchement manuel |
| **Post-conditions** | SITREP créé avec `statut = BROUILLON` |

**Scénario nominal :**

1. Le Data Manager sélectionne « Générer SITREP du jour ».
2. Le système agrège toutes les données du jour et calcule les KPI.
3. Si taux de complétude < 95% : avertissement avec liste des sites incomplets.
4. Le SITREP est créé avec `statut = BROUILLON`.
5. Redirection vers UC-RAP-D pour révision.

---

### UC-RAP-E — Modifier un SITREP

| Propriété | Valeur |
|---|---|
| **Acteur** | Data Manager (A05), Épidémiologiste (A06) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-RAP-D |
| **Pré-conditions** | `statut IN (BROUILLON, VALIDE)` |
| **Post-conditions** | SITREP mis à jour |

**Scénario nominal :**

1. Les champs éditables sont : commentaire épidémiologique, recommandations, destinataires.
2. Les indicateurs calculés sont en lecture seule.
3. Enregistrement. Si `statut = VALIDE`, une correction repasse le statut à `BROUILLON` et nécessite une re-validation.

---

## 12. Module — Intégration DHIS2

---

### UC-INT-L — Lister les synchronisations DHIS2

| Propriété | Valeur |
|---|---|
| **Acteurs** | Data Manager (A05), Administrateur (A07) |
| **Déclencheur** | Accès au menu « Intégration > DHIS2 » |
| **Post-conditions** | Historique des synchronisations affiché |

**Scénario nominal :**

1. Tableau trié par `datetime_debut` décroissant.
2. Colonnes : Date, Type (DAILY / MANUAL / RETRY), Période, Nb valeurs, Nb succès, Nb erreurs, Statut (badge coloré).
3. Filtre : type, statut, date.
4. Bouton [Voir] → UC-INT-D.
5. Bouton [Lancer une synchronisation manuelle] → UC-INT-C (rôle DATA/ADMIN).

---

### UC-INT-D — Consulter le détail d'une synchronisation

| Propriété | Valeur |
|---|---|
| **Acteurs** | Data Manager (A05), Administrateur (A07) |
| **Déclencheur** | Clic sur [Voir] depuis UC-INT-L |
| **Post-conditions** | Détail technique affiché |

**Scénario nominal :**

1. Le système affiche : période, type, déclencheur (auto/manuel + agent), début/fin, durée, nb valeurs/succès/erreurs, message d'erreur si applicable.
2. Section technique (ADMIN uniquement) : payload JSON envoyé, réponse brute DHIS2.
3. Boutons :
   - [Relancer] → visible si `statut = ECHEC` (crée une nouvelle SYNC_DHIS2 de type RETRY).
   - **Aucun bouton de modification ni suppression.**

---

### UC-INT-C — Déclencher une synchronisation manuelle

| Propriété | Valeur |
|---|---|
| **Acteur** | Data Manager (A05) |
| **Déclencheur** | Clic sur [Lancer une synchronisation manuelle] |
| **Post-conditions** | SYNC_DHIS2 créée avec `statut = EN_COURS` |

**Scénario nominal :**

1. Le Data Manager sélectionne la période à synchroniser.
2. Il confirme.
3. Le système crée la SYNC_DHIS2 avec `type_sync = MANUAL`, `declencheur_id = user`.
4. La synchronisation s'exécute en arrière-plan.
5. Le statut est mis à jour (SUCCES / PARTIEL / ECHEC) à la fin.

---

## 13. Module — Administration Système

---

### UC-ADM-UL — Lister les utilisateurs

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Accès au menu « Administration > Utilisateurs » |
| **Post-conditions** | Liste des utilisateurs affichée |

**Scénario nominal :**

1. Tableau : Login, Nom complet, Rôle, Site principal, Dernière connexion, Actif.
2. Comptes inactifs grisés. Filtre actif/inactif, rôle, site.
3. Bouton [Voir] → UC-ADM-UD.
4. Bouton [Nouvel utilisateur] → UC-ADM-UC.

---

### UC-ADM-UD — Consulter le détail d'un utilisateur

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Voir] depuis UC-ADM-UL |
| **Post-conditions** | Profil complet affiché |

**Scénario nominal :**

1. Le système affiche : login, nom, prénom, email, téléphone, rôle, site principal, sites autorisés, statut actif, date création, dernière connexion, nombre d'échecs de connexion.
2. Onglet **Activité récente** : dernières entrées d'AUDIT_LOG pour cet utilisateur.
3. Boutons :
   - [Modifier] → UC-ADM-UE.
   - [Désactiver] → visible si `actif = true` et utilisateur ≠ soi-même.
   - [Réinitialiser le mot de passe] → génère un nouveau mot de passe temporaire et envoie par email.
   - [Débloquer] → visible si `bloque_jusqu_a IS NOT NULL` et date dans le futur.

**Action [Désactiver] :**

1. Confirmation : « Ce compte sera désactivé. L'utilisateur ne pourra plus se connecter. »
2. Le système met `actif = false` et invalide `token_refresh`.
3. Journalisation AUDIT_LOG.

---

### UC-ADM-UC — Créer un utilisateur

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Nouvel utilisateur] depuis UC-ADM-UL |
| **Post-conditions** | UTILISATEUR créé · Email de bienvenue envoyé |

**Scénario nominal :**

1. Formulaire : login (unique), nom, prénom, email, téléphone, rôle, site principal, sites autorisés.
2. Le système génère un mot de passe temporaire.
3. Création avec `actif = true`, `force_pwd_change = true`, `created_by`.
4. Email de bienvenue avec identifiants envoyé.
5. Journalisation AUDIT_LOG.

---

### UC-ADM-UE — Modifier un utilisateur

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-ADM-UD |
| **Post-conditions** | UTILISATEUR mis à jour · Journalisé |

**Scénario nominal :**

1. Formulaire pré-rempli. Champ `login` en lecture seule.
2. L'administrateur peut modifier : nom, prénom, email, téléphone, rôle, sites.
3. Enregistrement avec journalisation.

---

### UC-ADM-AL — Lister les règles d'alerte

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Accès au menu « Administration > Règles d'alerte » |
| **Post-conditions** | Liste des CONFIGURATION_ALERTE affichée |

**Scénario nominal :**

1. Tableau : Code règle, Libellé, Entité source, Seuils, Canaux, Actif.
2. Règles inactives grisées.
3. Bouton [Voir] → UC-ADM-AD.
4. Bouton [Nouvelle règle] → UC-ADM-AC.

---

### UC-ADM-AD — Consulter le détail d'une règle d'alerte

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Voir] depuis UC-ADM-AL |
| **Post-conditions** | Détail complet affiché |

**Scénario nominal :**

1. Affiche : code, libellé, entité source, champ surveillé, opérateur, seuils niveaux 1/2/3, canaux, rôles destinataires, cooldown, actif, dernière modification.
2. Statistiques : nombre d'alertes déclenchées par cette règle sur l'événement.
3. Boutons :
   - [Modifier] → UC-ADM-AE.
   - [Désactiver] → `active = false`.
   - [Réactiver] → `active = true`.

---

### UC-ADM-AC — Créer une règle d'alerte

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Nouveau besoin de surveillance |
| **Post-conditions** | CONFIGURATION_ALERTE créée · Active immédiatement |

**Scénario nominal :**

1. Formulaire : code (unique), libellé, entité source, champ, opérateur, seuils, canaux, rôles, cooldown.
2. Validation : au moins un seuil renseigné, au moins un canal, au moins un rôle.
3. Création avec `active = true`. Journalisation.

---

### UC-ADM-AE — Modifier une règle d'alerte

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Clic sur [Modifier] depuis UC-ADM-AD |
| **Post-conditions** | CONFIGURATION_ALERTE mise à jour · Active immédiatement |

**Scénario nominal :**

1. Formulaire pré-rempli. Champ `code_regle` en lecture seule.
2. Modifications enregistrées. La nouvelle règle est active pour les prochains déclenchements.
3. Journalisation avec `ancienne_valeur` / `nouvelle_valeur`.

---

### UC-ADM-AUD — Consulter l'audit trail

| Propriété | Valeur |
|---|---|
| **Acteur** | Administrateur (A07) |
| **Déclencheur** | Accès au menu « Administration > Audit » |
| **Post-conditions** | Journal d'audit affiché selon filtres |

**Scénario nominal :**

1. Tableau : Horodatage, Utilisateur, Action, Entité, IP, Durée.
2. Filtres : utilisateur, action, entité, plage de dates, site.
3. Clic sur une ligne → détail de l'entrée : ancienne valeur / nouvelle valeur en JSON colorisé.
4. Bouton [Exporter CSV] — l'export lui-même crée une entrée AUDIT_LOG de type EXPORT.
5. Aucune modification ni suppression possible.

---

## 14. Récapitulatif des 72 UC

| UC | Nom | Module | Acteur principal |
|---|---|---|---|
| UC-PAT-L | Lister les patients | Patients | Agent PSF/PMA |
| UC-PAT-D | Consulter le détail d'un patient | Patients | Tous |
| UC-PAT-C | Créer un patient | Patients | Agent PSF/PMA |
| UC-PAT-E | Modifier un patient | Patients | Agent PSF/PMA |
| UC-PSF-L | Lister les fiches de criblage | Criblage PSF | Agent PSF |
| UC-PSF-D | Consulter le détail d'une fiche | Criblage PSF | Agent PSF |
| UC-PSF-C | Créer une fiche de criblage | Criblage PSF | Agent PSF |
| UC-PSF-E | Modifier une fiche de criblage | Criblage PSF | Agent PSF |
| UC-VAC-L | Lister les vaccins | Vaccinations | Tous |
| UC-VAC-D | Consulter le détail d'un vaccin | Vaccinations | Tous |
| UC-VAC-C | Créer un vaccin | Vaccinations | Administrateur |
| UC-VAC-E | Modifier un vaccin | Vaccinations | Administrateur |
| UC-CON-L | Lister les consultations | Consultations | Agent PMA |
| UC-CON-D | Consulter le détail d'une consultation | Consultations | Tous |
| UC-CON-C | Ouvrir une consultation | Consultations | Agent PMA |
| UC-CON-E | Modifier une consultation | Consultations | Agent PMA / DATA |
| UC-REG-L | Lister les appels de régulation | Régulation | Médecin Régulateur |
| UC-REG-D | Consulter le détail d'un appel | Régulation | Médecin Régulateur |
| UC-REG-C | Créer un appel de régulation | Régulation | Médecin Régulateur |
| UC-REG-E | Modifier un appel de régulation | Régulation | Médecin Régulateur |
| UC-ORI-L | Lister les orientations | Régulation | Médecin Régulateur |
| UC-ORI-D | Consulter le détail d'une orientation | Régulation | Médecin Régulateur |
| UC-ORI-C | Créer une orientation | Régulation | Agent PMA / Régulateur |
| UC-ORI-E | Modifier une orientation | Régulation | Médecin Régulateur |
| UC-SOI-L | Lister les prises en charge | Soins Hospitaliers | Médecin FOSA |
| UC-SOI-D | Consulter le détail d'une PEC | Soins Hospitaliers | Médecin FOSA |
| UC-SOI-C | Admettre un patient | Soins Hospitaliers | Médecin FOSA |
| UC-SOI-E | Modifier une prise en charge | Soins Hospitaliers | Médecin FOSA |
| UC-LAB-L | Lister les résultats de laboratoire | Soins Hospitaliers | Médecin FOSA |
| UC-LAB-D | Consulter le détail d'un résultat | Soins Hospitaliers | Médecin FOSA |
| UC-LAB-C | Prescrire un examen | Soins Hospitaliers | Médecin FOSA |
| UC-LAB-E | Saisir / Modifier un résultat | Soins Hospitaliers | Médecin FOSA |
| UC-LIT-L | Consulter le plan des lits | Gestion des Lits | Médecin FOSA |
| UC-LIT-D | Consulter le détail d'un lit | Gestion des Lits | Médecin FOSA |
| UC-LIT-C | Créer un lit | Gestion des Lits | Administrateur |
| UC-LIT-E | Modifier un lit | Gestion des Lits | Administrateur |
| UC-CAT-L | Lister le catalogue produits | Stocks | Agent PMA |
| UC-CAT-D | Consulter le détail d'un produit | Stocks | Tous |
| UC-CAT-C | Créer un produit | Stocks | Administrateur |
| UC-CAT-E | Modifier un produit | Stocks | Administrateur |
| UC-STK-L | Lister les stocks d'un site | Stocks | Agent PMA |
| UC-STK-D | Consulter le détail d'un stock | Stocks | Agent PMA |
| UC-STK-C | Enregistrer un mouvement de stock | Stocks | Agent PMA |
| UC-STK-E | Modifier les seuils d'un stock | Stocks | Data Manager |
| UC-STK-INV | Réaliser un inventaire | Stocks | Agent PMA |
| UC-ALE-L | Lister les alertes | Alertes | Data Manager |
| UC-ALE-D | Consulter le détail d'une alerte | Alertes | Data Manager |
| UC-ALE-C | Créer une alerte manuelle | Alertes | Tous acteurs terrain |
| UC-RAP-DB | Consulter le dashboard temps réel | Coordination | Data Manager |
| UC-RAP-L | Lister les SITREP | Coordination | Data Manager |
| UC-RAP-D | Consulter le détail d'un SITREP | Coordination | Data Manager |
| UC-RAP-C | Générer le SITREP quotidien | Coordination | Data Manager |
| UC-RAP-E | Modifier un SITREP | Coordination | Data Manager |
| UC-INT-L | Lister les synchronisations DHIS2 | Intégration | Data Manager |
| UC-INT-D | Consulter le détail d'une sync | Intégration | Data Manager |
| UC-INT-C | Déclencher une sync manuelle | Intégration | Data Manager |
| UC-ADM-UL | Lister les utilisateurs | Administration | Administrateur |
| UC-ADM-UD | Consulter le détail d'un utilisateur | Administration | Administrateur |
| UC-ADM-UC | Créer un utilisateur | Administration | Administrateur |
| UC-ADM-UE | Modifier un utilisateur | Administration | Administrateur |
| UC-ADM-AL | Lister les règles d'alerte | Administration | Administrateur |
| UC-ADM-AD | Consulter le détail d'une règle | Administration | Administrateur |
| UC-ADM-AC | Créer une règle d'alerte | Administration | Administrateur |
| UC-ADM-AE | Modifier une règle d'alerte | Administration | Administrateur |
| UC-ADM-AUD | Consulter l'audit trail | Administration | Administrateur |

---

## 15. Relations entre cas d'utilisation

### Relations `<<include>>` — inclusions systématiques

```
UC-PSF-C (Créer fiche criblage)      <<include>>  UC-PAT-D  (si patient existant)
UC-SOI-C (Admettre patient)          <<include>>  UC-LIT-D  (attribution lit)
UC-CON-C (Ouvrir consultation)       <<include>>  UC-STK-C  (consommation produits)
UC-SOI-D (Détail PEC)                <<include>>  UC-LAB-L  (liste résultats liés)
```

### Relations `<<extend>>` — extensions conditionnelles

```
UC-PSF-C  <<extend>>  UC-ALE-C    [si température >= 38°C]
UC-PSF-C  <<extend>>  UC-ALE-C    [si vaccin obligatoire non conforme]
UC-CON-C  <<extend>>  UC-ORI-C    [si décision = EVACUATION_FOSA]
UC-REG-C  <<extend>>  UC-ORI-C    [si moyen physique engagé]
UC-STK-C  <<extend>>  UC-ALE-C    [si stock passe sous seuil]
UC-LAB-E  <<extend>>  UC-ALE-C    [si interprétation = CRITIQUE]
UC-SOI-D  <<extend>>  UC-LIT-D    [action libérer lit depuis sortie patient]
UC-RAP-D  <<extend>>  UC-INT-C    [distribution SITREP peut déclencher sync DHIS2]
```

### Suppressions / archivages accessibles depuis le Détail

```
UC-PAT-D   → [Archiver patient]              (soft delete si aucune PEC active)
UC-PSF-D   → [Archiver fiche criblage]       (soft delete, DATA/ADMIN)
UC-VAC-D   → [Désactiver vaccin]             (actif = false)
UC-VAC-D   → [Réactiver vaccin]              (actif = true)
UC-LAB-D   → [Annuler résultat]              (soft delete, DATA/ADMIN + motif)
UC-LIT-D   → [Mettre hors service]           (statut = HORS_SERVICE, si LIBRE)
UC-LIT-D   → [Remettre en service]           (statut = LIBRE, si HORS_SERVICE)
UC-CAT-D   → [Désactiver produit]            (actif = false, si stock = 0)
UC-ALE-D   → [Prendre en charge]             (statut = PRISE_EN_CHARGE)
UC-ALE-D   → [Résoudre]                      (statut = RESOLUE)
UC-ADM-UD  → [Désactiver utilisateur]        (actif = false)
UC-ADM-UD  → [Réinitialiser mot de passe]
UC-ADM-UD  → [Débloquer compte]
UC-ADM-AD  → [Désactiver règle alerte]       (active = false)
UC-SOI-D   → [Enregistrer la sortie]         (clôture PEC + libération lit)
UC-RAP-D   → [Valider SITREP]                (statut = VALIDE)
UC-RAP-D   → [Distribuer SITREP]             (statut = DISTRIBUE, verrouillage)
```

---

*— Fin des Cas d'Utilisation — SGI Couverture Sanitaire OMC — Version 2.0*  
*72 cas d'utilisation · 8 acteurs · 12 modules · pattern Liste/Détail/Créer/Modifier*
