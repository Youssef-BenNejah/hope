# OpenEMR — Cartographie détaillée des fonctionnalités

*Document établi à partir de l'exploration directe de l'application (OpenEMR **v8.3.0**, interface en français, instance hébergée à `192.168.1.21:8080`). Chaque section ci-dessous correspond à un menu réel du logiciel et décrit ce que l'écran fait concrètement, pas seulement son intitulé.*

---

## Vue d'ensemble

OpenEMR est un **logiciel libre de dossier médical électronique (DME) et de gestion de cabinet médical** (Electronic Health Record + Practice Management). Il couvre l'intégralité du parcours d'un cabinet : prise de rendez-vous, dossier clinique du patient, facturation et assurance, laboratoires, reporting, et administration système. L'interface s'organise en une **barre de menu horizontale** (13 rubriques) et un **espace de travail à onglets** : chaque section ouverte (Agenda, Messagerie, Annuaire des patients, etc.) reste disponible dans un onglet que l'on peut fermer, recharger ou verrouiller.

---

## 1. Agenda — Planification des rendez-vous

Vue calendrier interactive avec bascule **Jour / Semaine / Mois**, mini-calendrier de navigation mensuelle, et grille horaire (créneaux de 15 minutes, ex. 8h00 à 18h00). Elle permet de filtrer par **ressource** (praticien, salle, équipement) ou par établissement, et affiche les rendez-vous de tous les utilisateurs ou d'un utilisateur sélectionné. C'est le point d'entrée pour créer, déplacer ou annuler un rendez-vous, gérer les listes d'attente et visualiser la charge de la journée.

## 2. Finder — Annuaire des patients

Répertoire de recherche rapide des patients : liste triable/filtrable (10, 25, 50 ou 100 entrées par page) avec les colonnes **Nom, Téléphone à domicile, N.S.S. (numéro de sécurité sociale), Date de naissance, ID externe**. Comporte un onglet « Patients récents », un bouton **« Ajouter un Nouveau Patient »**, une recherche « exact method », et la possibilité d'ouvrir les résultats dans un nouvel onglet de navigateur.

## 3. Débit — Enregistrement / check-in

Point d'accès pour l'enregistrement du patient à son arrivée (check-in), généralement lié au suivi de flux (patient tracker) et à l'ouverture de la rencontre clinique (encounter) du jour.

## 4. Rappels — Rappels cliniques et administratifs

Système d'alertes/rappels automatiques : rappels de rendez-vous, de vaccins, de suivis cliniques ou de tâches administratives à effectuer pour un patient ou pour le cabinet.

## 5. Messages — Messagerie interne

Boîte de messagerie interne du praticien : liste des messages **« De / Patient / Type / Date / Statut »**, avec filtres « Messages actifs / Montrer tout / Montrer les inactifs », création (« Add New ») et suppression de messages. Sert à la communication interne entre soignants (notes de suivi, résultats à transmettre, demandes de rappel patient).

## 6. Patient — Dossier et parcours du patient

- **Nouveau/Recherche** — création d'une nouvelle fiche patient (état civil, coordonnées, assurance) ou recherche dans la base existante.
- **Dashboard** — tableau de bord clinique du patient, organisé en onglets : **Dashboard, Antécédents, Assessments (évaluations), Rapport, Documents, Transferts, Diagnostics, Comptabilité, Données externes**. Il affiche des blocs de synthèse (Allergies, Problèmes médicaux, Prescriptions en cours) directement sur la page d'accueil du dossier.
- **Visites**
  - *Créer Visite* — ouverture d'une nouvelle rencontre clinique (encounter) associée au patient.
  - *Actuelle* — accès à la visite/rencontre en cours.
  - *Historique des Visites* — liste chronologique de toutes les rencontres passées du patient.
- **Enregistrements**
  - *Demande de dossier patient* — génération/traitement d'une demande officielle de transmission du dossier médical (portabilité, échange avec un autre établissement).

## 7. Tarification — Facturation et paiements

- **Codification** — saisie et gestion des codes d'actes/diagnostics (CPT, ICD-10, etc.) rattachés à une rencontre.
- **Paiement** — enregistrement des paiements reçus (patient ou assurance).
- **Verification** — vérification des droits/couverture d'assurance.
- **Gestionnaire de facturation** — écran central de pilotage de la facturation : moteur de recherche par critères multiples (*Date du service, Date d'entrée, Date de facturation, Type de revendication, Nom du patient, ID Patient, Compagnie d'assurance, Rencontre, Si assuré, Frais encodé, Statut de facturation, État de l'autorisation, Last Level Billed, X12 Partenaire, Utilisateur*). Depuis les résultats on peut : mettre à jour la liste, générer un rapport imprimable, produire le rapport de fin de journée (totaux), consulter les logs, sélectionner/effacer les entrées, exporter au format **X12** (télétransmission), générer un formulaire **CMS-1500 (HCFA)**, marquer une facture comme réglée ou la rouvrir.
- **Paiement par lots** — saisie groupée de plusieurs paiements en une seule opération (ex. remises de banque, lots d'assurance).
- **Posting Payments** — affectation/ventilation des paiements sur les actes correspondants.
- **Historique EDI** — journal des échanges de données informatisés (transmissions électroniques aux assurances).

## 8. Modules — Extensions de l'application

- **Manage Modules** — gestionnaire d'installation/activation des modules complémentaires (extensions tierces ou officielles) qui étendent les fonctionnalités du cœur OpenEMR.
- **Carecoordination** — module de coordination des soins, généralement utilisé pour générer/échanger les documents de continuité de soins (CCD/C-CDA) entre établissements.

## 9. Procédures — Laboratoires et examens

- **Ressources** — configuration des ressources liées aux procédures (appareils, kits, praticiens habilités).
- **Configuration** — paramétrage des laboratoires partenaires, catalogues d'analyses, connecteurs.
- **Charger les collections** — import de lots de prélèvements/échantillons.
- **Pending Review** — file d'attente des résultats en attente de validation par un clinicien.
- **Résultats du patients** — consultation des résultats d'examens rattachés à un patient donné.
- **Lab Overview** — vue d'ensemble/synthèse de l'activité de laboratoire.
- **Résultats du lot (Batch)** — traitement des résultats reçus en lot.
- **Rapports électroniques** — réception/traitement des comptes-rendus électroniques (HL7 ou équivalent).
- **Lab Documents** — documents associés aux analyses (PDF de résultats, bons de commande).

## 10. Administrateur — Administration du système

- **Config** — paramètres généraux de l'application (thème, unités, comportements par défaut).
- **Clinique**
  - *Etablissements* — fiche de chaque site/cabinet (nom, adresse de facturation, adresse postale, téléphone, identifiant fiscal/NPI). Permet d'ajouter un nouvel établissement et d'inclure les sites inactifs dans la liste.
  - *Agenda* — paramétrage des règles du calendrier (créneaux, catégories de rendez-vous, ressources).
  - *Import Holidays* — import des jours fériés pour bloquer automatiquement l'agenda.
- **Patients**
  - *Rappels patients* — configuration des règles de rappel automatique.
  - *Fusion des patients* — outil de fusion de deux fiches patient identifiées comme doublons.
  - *Manage Duplicates* — détection assistée des doublons dans la base patients.
- **Entrainement** *(module de formation/coaching clinique)*
  - Paramètres par défaut, Règles, Alerts — configuration des protocoles de suivi et alertes associées.
- **Codage**
  - *Codes* — gestion des référentiels de codes médicaux (CPT/ICD/HCPCS…).
  - *Native Data Loads* / *Données externes chargées* — import de jeux de codes officiels ou de données tierces.
- **Formulaires**
  - *Formulaires d'administration*, *Layouts*, *Listes* — personnalisation des formulaires cliniques, de la mise en page des écrans et des listes déroulantes (listes de valeurs) utilisées dans toute l'application.
- **Documents**
  - *Document Templates* — modèles de documents réutilisables (courriers, consentements…).
- **Système**
  - *Fichiers, Langue, Logs, Audit Log Tamper, Diagnostics, Email Send Test, API Clients* — administration technique : gestion des fichiers systèmes, choix de la langue, consultation des journaux, contrôle d'intégrité des logs d'audit, outils de diagnostic serveur, test d'envoi d'e-mails, gestion des applications clientes autorisées à consommer l'**API**.
- **Utilisateurs** — gestion des comptes utilisateurs (praticiens, personnel administratif), rôles et habilitations.
- **Carnet d'adresses** — répertoire de contacts externes (confrères, laboratoires, fournisseurs).
- **ACL** *(Access Control List)* — gestion fine des droits d'accès par groupe/rôle utilisateur.

## 11. Rapports — Reporting

- **Patients** — Liste, Rx (prescriptions), Patient List Creation, Message List, Médical, Referrals (recommandations/adressages), Registre de vaccination.
- **Clinique** — Rapport des résultats, Mesures standard, Mesures Automatisées (AMC — *Automated Measure Calculation*, indicateurs qualité type Meaningful Use), 2026 Real World Testing Report, Log de l'alerte.
- **Visites** — Daily Report, Des Rendez-vous, Patient Flow Board (tableau de suivi du flux patient en temps réel), Rencontres, RDV-Visite, Superbill, Admissibilité et Réponse d'Admissibilité (vérification de droits d'assurance), Graphique d'Activité, Sortie des graphiques, Services, Syndromic Surveillance (surveillance syndromique / santé publique).
- **Financier** — Ventes, Reçu d'Espèce, Front Rec, Pmt Method, Collections and Aging (relances et ancienneté des créances), Pat Ledger (grand livre patient), Résumé financier via un code service, Payment Processing.
- **Procédures** — Pending Res (résultats en attente), Statistiques.
- **Assurance** — Distribution, Très pauvres (suivi des patients à faibles ressources / barème social), SP Unique.
- **Formulaires blancs** — modèles vierges imprimables : Données démographiques, Superbill/Fee Sheet.
- **Services** — Les services d'arrière-plan (tâches planifiées/CRON), Message de log direct, IP Tracker.

## 12. Divers/Autres

- **Dicom Viewer** — visionneuse d'images médicales au format DICOM (radiologie, imagerie).
- **Education du patient** — bibliothèque de documents d'information à remettre au patient.
- **Autorisations** — gestion des autorisations préalables (assurance, actes soumis à accord).
- **Suivi graphique** — représentation graphique de l'évolution de mesures cliniques (courbes de croissance, constantes, etc.).
- **Notes du bureau** — bloc-notes interne du cabinet, partagé entre utilisateurs.
- **Outil de communication du lot (batch)** — envoi groupé de communications (SMS/e-mail/courrier) à plusieurs patients.
- **Nouveaux Documents** — dépôt/réception rapide de nouveaux documents à classer.
- **Formulaires blancs** (Core) — Données démographiques, Superbill/Fee Sheet, Envoi vers un spécialiste (courrier de recommandation).

## 13. Popups — Impressions et échanges rapides

Fenêtres modales dédiées à la production de documents imprimables ou aux échanges de données : **Diagnostics, Exporter, Importer, Des Rendez-vous, Superbill, Paiement, Lettre, Chart Label (étiquette de dossier), Barcode Label (étiquette code-barres), Etiquette de l'adresse**.

---

## Autres éléments d'interface

- **Recherche patient globale** — barre de recherche en haut de l'écran (« Search by any demographics ») permettant de retrouver un patient à partir de n'importe quel champ démographique (nom, téléphone, date de naissance, etc.).
- **Menu du compte utilisateur** (icône en haut à droite) — *Réglages*, *Changer mot de passe*, *MFA Management* (authentification multifacteur), *À propos OpenEMR*, *Déconnexion*.
- **Espace de travail à onglets** — chaque section ouverte apparaît comme un onglet dans le bandeau sous le menu (Agenda, Messagerie, Annuaire des patients, Tableau Blanc, Gestionnaire de facturation, Etablissements, Notes du bureau…) ; chaque onglet peut être actualisé, verrouillé ou fermé indépendamment.
- **Tableau Blanc** (Patient Tracker) — tableau de suivi visuel du flux des patients dans le cabinet (salle d'attente → consultation → sortie).

---

## Synthèse fonctionnelle

| Domaine | Fonctions principales |
|---|---|
| Planification | Agenda, Rappels, Débit (check-in), Tableau Blanc |
| Dossier patient | Fiche patient, Dashboard clinique, Visites/Rencontres, Antécédents, Allergies, Prescriptions, Documents |
| Facturation & assurance | Codification, Paiement, Vérification d'admissibilité, Gestionnaire de facturation, EDI/X12, CMS-1500 |
| Laboratoires | Commande, réception et validation des résultats, comptes-rendus électroniques |
| Reporting | Rapports patients, cliniques, financiers, de visites, d'assurance |
| Administration | Établissements, utilisateurs, ACL, codes médicaux, formulaires, système/logs/API |
| Communication | Messagerie interne, communication par lots, éducation du patient |
| Imagerie & documents | Visionneuse DICOM, modèles de documents, dépôt de documents |
| Impression | Étiquettes, superbill, lettres, formulaires vierges |

*(Certaines entrées apparaissent grisées/désactivées dans le menu : cela reflète les droits d'accès du compte actuellement connecté, pas une absence de la fonctionnalité dans le logiciel.)*
