# 📖 Présentation Utilisateur — Plateforme Tahfidz V3

> **Tahfidz** est une plateforme SaaS multi-tenant dédiée à la gestion et au suivi de la mémorisation du Coran (Tahfidz). Elle centralise l'ensemble des processus éducatifs entre écoles, enseignants, élèves et parents dans une interface moderne, intuitive et sécurisée.

---

## 🎯 Vue d'ensemble

Tahfidz permet à chaque école coranique de disposer de son propre espace numérique isolé, avec :
- Un suivi précis de la mémorisation du Coran, verset par verset
- Un carnet quotidien pour chaque élève (Hifz, Muraja'a, Talqin, Cours)
- Un système d'évaluation sur 5 critères (Tajwid, Makhraj, Waqf, Tarteel, Fluency)
- Des sessions de visioconférence intégrées (Halaqa)
- Une gamification pour motiver les élèves (badges, étoiles, séries)
- Une messagerie interne et des annonces ciblées
- Des exports de documents (certificats, cartes d'inscription, présences)

**Langues supportées** : Français, Anglais, Arabe (RTL)

---

## 👤 Les 5 Profils Utilisateurs

Chaque utilisateur se connecte avec son rôle dédié et accède à un tableau de bord personnalisé.

---

### 1️⃣ Superadmin (Plateforme)

**Accès** : `/admin/super`  
**Description** : Administrateur de la plateforme Tahfidz. Gère l'ensemble des écoles inscrites.

#### Rôle & Responsabilités
- Valider ou rejeter les demandes d'inscription des nouvelles écoles
- Gérer toutes les écoles (activer, désactiver, modifier)
- Consulter les logs d'audit globaux (qui a fait quoi, quand)
- Envoyer des messages broadcast à tous les utilisateurs de la plateforme
- Surveiller la santé du système (API, base de données)
- Gérer les retours utilisateurs (bugs, suggestions)
- Impersonner temporairement un utilisateur pour du support

#### Tableau de Bord
- Statistiques cross-écoles (nombre total d'élèves, enseignants, groupes)
- Liste des écoles en attente de validation
- Graphiques d'utilisation de la plateforme
- Alertes système

---

### 2️⃣ Administrateur d'École

**Accès** : `/admin/*`  
**Description** : Directeur ou responsable d'une école coranique. Dispose d'un contrôle total sur son école.

#### Rôle & Responsabilités
- **Gestion des élèves** : Créer, modifier, transférer de groupe, activer/désactiver
- **Gestion des enseignants** : Créer des comptes enseignant, assigner des groupes
- **Gestion des parents** : Créer des comptes parent et les lier aux élèves
- **Gestion des groupes** : Créer des groupes avec niveaux, planning et capacité maximale
- **Présences** : Consulter les feuilles de présence, exporter en CSV
- **Évaluations** : Consulter toutes les évaluations de l'école
- **Annonces** : Créer, publier et cibler des annonces par rôle
- **Certificats** : Générer des certificats de mémorisation avec templates personnalisables
- **Cartes d'inscription** : Générer des cartes élèves avec QR code
- **Paramètres** : Configurer le nom, logo, adresse et plan d'abonnement de l'école
- **Statistiques** : Visualiser les performances de l'école via graphiques
- **Examens** : Créer et gérer des examens par groupe
- **Admins secondaires** : Créer d'autres comptes administrateurs pour l'école

#### Tableau de Bord
- Nombre d'élèves actifs, enseignants, groupes
- Annonces récentes
- Alertes (absences, demandes en attente)
- Graphiques de progression globale

---

### 3️⃣ Enseignant (Prof / Formateur)

**Accès** : `/teacher/*`  
**Description** : Enseignant chargé du suivi pédagogique d'un groupe d'élèves.

#### Rôle & Responsabilités
- **Groupes** : Créer et gérer ses propres groupes d'élèves (max 15 élèves par défaut)
- **Suivi de mémorisation** : Assigner des sourates aux élèves, suivre la progression verset par verset
- **Évaluations** : Évaluer les élèves sur 5 critères (Tajwid, Makhraj, Waqf, Tarteel, Fluency) avec décision : Approuvé / Besoin de révision / Rejeté
- **Présences** : Prendre les présences quotidiennes de ses groupes (Présent, Absent, Retard, Excusé)
- **Carnet quotidien** : Remplir le carnet de chaque élève (Hifz, Muraja'a, Talqin, Cours)
- **Halaqa (Visio)** : Créer des sessions de visioconférence (individuelles ou collectives, audio/vidéo/partage d'écran)
- **Messages** : Envoyer des messages directs aux élèves, parents ou admins
- **Annonces** : Publier des annonces pour ses groupes
- **Validation parentale** : Approuver ou rejeter les présences saisies par les parents
- **Évaluations post-Halaqa** : Noter les élèves après une session de visio

#### Tableau de Bord
- Ses élèves et leur progression
- Groupes du jour avec planning
- Prochaines sessions Halaqa programmées
- Alertes (élèves en difficulté, présences à valider)
- Notifications récentes

---

### 4️⃣ Parent (Tuteur)

**Accès** : `/parent/*`  
**Description** : Parent ou tuteur légal d'un ou plusieurs élèves inscrits.

#### Rôle & Responsabilités
- **Suivi des enfants** : Consulter la progression de mémorisation de chaque enfant lié
- **Présences** : Voir l'historique des présences et absences
- **Carnet quotidien** : Consulter le carnet de l'enfant (Hifz, Muraja'a, Talqin, Cours) avec commentaires
- **Marquer les présences** : Saisir une présence pour son enfant (avec motif) → en attente de validation par l'enseignant
- **Notifications** : Recevoir les alertes (absences, évaluations, messages)
- **Annonces** : Lire les annonces de l'école
- **Messagerie** : Envoyer des messages aux enseignants ou à l'administration
- **Inscription** : S'inscrire via un code d'invitation QR fourni par l'école

#### Tableau de Bord
- Progression de chaque enfant
- Résumé des absences récentes
- Messages non lus
- Prochaines sessions Halaqa

---

### 5️⃣ Élève (Étudiant)

**Accès** : `/student/*`  
**Description** : Élève inscrit dans une école coranique, membre d'un groupe.

#### Rôle & Responsabilités
- **Progression** : Consulter sa progression de mémorisation (sourates en cours, terminées, à réviser)
- **Carnet quotidien** : Voir son carnet (Hifz, Muraja'a, Talqin, Cours)
- **Badges & Récompenses** : Visualiser ses badges gagnés et ses étoiles
- **Séries (Streaks)** : Suivre ses jours consécutifs d'activité
- **Présences** : Consulter son historique de présences
- **Halaqa** : Rejoindre les sessions de visioconférence programmées
- **Demandes** : Envoyer une demande "Prêt à réciter" à son enseignant
- **Notifications** : Recevoir les évaluations, messages et annonces
- **Classements** : Voir son classement dans son groupe

#### Tableau de Bord
- Progression visuelle de la mémorisation
- Badges et étoiles récents
- Série en cours (jours consécutifs)
- Prochaines sessions Halaqa
- Notifications récentes

---

## 🔐 Matrice des Permissions (Récapitulatif)

| Fonctionnalité | Superadmin | Admin | Enseignant | Parent | Élève |
|---|---|:---:|:---:|:---:|:---:|
| Gestion des écoles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestion des élèves | ✅ | ✅ | ✅ (ses élèves) | ❌ | ❌ |
| Gestion des enseignants | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suivi progression | ✅ | ✅ | ✅ | ✅ (ses enfants) | ✅ (soi) |
| Évaluations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Présences | ✅ | ✅ | ✅ | ✅ (ses enfants) | ✅ (soi) |
| Halaqa (visio) | ✅ | ✅ | ✅ (modérateur) | 👁️ (observateur) | 👁️ (viewer) |
| Messagerie | ✅ | ✅ | ✅ | ✅ | ✅ |
| Annonces | ✅ | ✅ | ✅ | 👁️ (lecture) | 👁️ (lecture) |
| Certificats | ✅ | ✅ | ❌ | ❌ | ❌ |
| Statistiques | ✅ | ✅ | ✅ (ses groupes) | ✅ (ses enfants) | ✅ (soi) |
| Paramètres école | ✅ | ✅ | ❌ | ❌ | ❌ |

> ✅ = Accès complet · 👁️ = Lecture / Observation uniquement · ❌ = Pas d'accès

---

## ⚙️ Fonctionnalités Détaillées

### 📚 Suivi de Mémorisation du Coran

**Cycle de statut d'une sourate :**
```
NON COMMENCÉ → ASSIGNÉ → EN COURS → EN RÉVISION →
PRÊT POUR RÉCITATION → EN ATTENTE DE VALIDATION →
MÉMORISÉ / BESOIN DE RÉVISION
```

- L'enseignant assigne une sourate à l'élève
- L'élève voit sa progression verset par verset avec une barre visuelle
- L'élève peut signaler "Prêt à réciter"
- L'enseignant évalue et valide ou demande une révision
- Historique complet des changements de statut conservé
- Registre des sourates mémorisées avec scores finaux

### 📓 Carnet Quotidien (Daily Progress Log)

Chaque élève dispose d'un carnet journalier structuré :

| Section | Description |
|---------|-------------|
| **Hifz** | Nouvelle mémorisation du jour (versets début → fin) |
| **Muraja'a** | Révision de la mémorisation (versets début → fin) |
| **Talqin** | Dictée / répétition après l'enseignant |
| **Cours** | Classe scientifique (versets étudiés) |
| **Présence** | Statut journalier (Présent / Absent / Retard / Excusé) |
| **Observations** | Notes générales de l'enseignant ou du parent |

- Les enseignants et parents peuvent ajouter des commentaires
- Le carnet est consultable par l'élève et ses parents

### 📝 Évaluations Pédagogiques

L'enseignant évalue l'élève sur **5 critères** (note sur 10 ou 20 selon configuration) :

| Critère | Description |
|---------|-------------|
| **Tajwid** | Règles de récitation correcte |
| **Makhraj** | Prononciation exacte des lettres (points d'articulation) |
| **Waqf** | Arrêts et pauses de récitation |
| **Tarteel** | Modulation, mélodie et lenteur de récitation |
| **Fluency** | Fluidité générale et confiance |

**Décisions possibles après évaluation :**
- ✅ **Approuvé** — La sourate est validée
- 🔄 **Besoin de révision** — L'élève doit réviser et re-passer
- ❌ **Rejeté** — L'élève doit recommencer la sourate

Notification automatique envoyée à l'élève et au parent.

### 👥 Gestion des Groupes

- Création de groupes avec nom, niveau et planning horaire
- Capacité maximale configurable (15 élèves par défaut)
- Assignation d'un enseignant référent par groupe
- Niveaux de progression configurables par l'admin
- Export CSV de la liste des élèves d'un groupe
- Transfert d'élève d'un groupe à un autre

### 🎥 Halaqa — Visioconférence Intégrée

Sessions en ligne via **BigBlueButton** :

| Type | Description |
|------|-------------|
| **Individuel** | Session privée élève-enseignant |
| **Collectif** | Session de groupe entier |

| Mode | Description |
|------|-------------|
| **Audio seul** | Audio uniquement |
| **Vidéo** | Audio + Vidéo |
| **Partage d'écran** | Pour montrer le Mushaf ou des documents |

- Enregistrement automatique des sessions
- Évaluations pendant ou après la session
- URLs différenciées par rôle (modérateur pour l'enseignant, viewer pour l'élève, observateur pour le parent)
- Statut de la session : Programmée → En cours → Terminée

### 🏆 Gamification & Motivation

| Système | Description |
|---------|-------------|
| **Étoiles (Stars)** | Gagnées à chaque étape de mémorisation validée |
| **Séries (Streaks)** | Jours consécutifs de connexion ou d'activité |
| **Badges** | Récompenses avec raretés : Commun, Rare, Épique, Légendaire |
| **Classements** | Leaderboards par groupe pour stimuler l'émulation |

Exemples de badges : "Première sourate mémorisée", "30 jours de suite", "Excellence Tajwid", etc.

### 📋 Gestion des Présences

- **Enseignant** : Prend les présences de son groupe chaque jour
- **Parent** : Peut marquer la présence de son enfant avec un motif (ex: maladie, voyage) → validation enseignant requise
- **Alertes** : Système d'alertes pour absences répétées
- **Export** : Export CSV des feuilles de présence par groupe et par période
- **Statuts** : Présent, Absent, Retard, Excusé

### 💬 Messagerie & Communication

- **Messages directs** : Conversation privée entre deux utilisateurs
- **Notifications** : En temps réel avec suivi de lecture (lu / non lu)
- **Annonces** : Messages ciblés par rôle avec épinglage et date d'expiration
  - Types : Générale, Événement, Réussite, Urgente
- **Broadcasts** : Messages système envoyés par le Superadmin à tous

### 📄 Génération de Documents

| Document | Description |
|----------|-------------|
| **Certificats** | Certificat de mémorisation avec template personnalisable par l'école |
| **Cartes d'inscription** | Carte élève avec photo, infos et QR code |
| **Invitations parents** | QR code pour inscription directe du parent |
| **Exports CSV** | Élèves, présences, évaluations, groupes |

---

## 🔄 Processus Métiers Principaux

### 🏫 Inscription d'une École
```
1. Formulaire d'inscription sur la page publique
2. Superadmin reçoit la demande et la valide ou la rejette
3. Si APPROUVÉ → Création automatique de l'école, de l'admin et du plan d'abonnement
4. Email de bienvenue envoyé à l'administrateur
```

### 📖 Cycle de Mémorisation
```
1. Enseignant assigne une sourate (ASSIGNÉ)
2. Élève commence la mémorisation (EN COURS)
3. Élève signale "Prêt à réciter" (EN RÉVISION)
4. Enseignant évalue après test (EN ATTENTE DE VALIDATION)
5. Enseignant confirme → MÉMORISÉ
   ou demande révision → BESOIN DE RÉVISION → retour EN COURS
```

### ✅ Processus d'Évaluation
```
1. Enseignant lance une évaluation pour un élève
2. Score sur 5 critères (Tajwid, Makhraj, Waqf, Tarteel, Fluency)
3. Calcul du score final automatique
4. Décision : APPROUVÉ / RÉVISION / REJETÉ
5. Notification automatique à l'élève et au parent
```

### 👨‍👩‍👧 Gestion des Présences Parents
```
1. Parent marque la présence de son enfant avec motif
2. Système crée une entrée en attente de validation
3. Enseignant valide ou rejette la présence
4. Notification envoyée au parent
5. Intégration dans les statistiques de l'élève
```

### 🎥 Création d'une Session Halaqa
```
1. Enseignant crée la session (type + mode)
2. BigBlueButton génère les URLs par rôle
3. Session : Programmée → En cours → Terminée
4. Enregistrement disponible après la session
5. Évaluations post-session possibles
```

---

## 🔧 Options & Paramètres

### Paramètres d'École (Admin)
- Nom de l'école (français / arabe)
- Logo et identité visuelle
- Adresse, ville, pays
- Numéro de téléphone
- Plan d'abonnement (Free, Starter, Pro, Enterprise)
- Configuration générale avancée (JSON)

### Paramètres Enseignant
- Biographie et photo de profil
- Spécialisation (ex: "Hafs Asim", "Warsh")
- Nombre maximum d'élèves (par défaut : 20)
- Statut actif/inactif

### Paramètres Parent
- Informations personnelles
- Nationalité et langues parlées
- Lien avec les enfants (code d'accès)

### Paramètres Élève
- Photo de profil
- Code étudiant unique
- Groupe assigné
- Enseignant référent

---

## 📊 Tableaux de Bord par Profil

| Profil | Widgets Principaux |
|--------|-------------------|
| **Superadmin** | Stats cross-écoles, écoles à valider, santé système, retours utilisateurs |
| **Admin** | Élèves actifs, enseignants, groupes, annonces récentes, graphiques de progression |
| **Enseignant** | Ses élèves, groupes du jour, prochaines sessions, alertes, notifications |
| **Parent** | Progression des enfants, absences, messages non lus, annonces |
| **Élève** | Progression, badges, série en cours, prochaines sessions, notifications |

---

## 🔒 Sécurité & Authentification

### Deux Modes de Connexion

| Mode | Identification |
|------|---------------|
| **Connexion École** | Identifiant école (slug) + Email + Mot de passe |
| **Connexion Superadmin** | Email + Mot de passe (sans identifiant école) |

- Sessions JWT de 8 heures
- Mot de passe haché avec bcrypt
- Isolation des données par école (multi-tenant)
- Middleware de protection des routes par rôle

### Routes Publiques (sans connexion)
- Page d'accueil (`/`)
- Connexion (`/login`)
- Inscription école (`/register-school`)
- Mot de passe oublié (`/forgot-password`)
- Inscription parent avec code (`/parent/register`)

---

## 💻 Stack Technique (Résumé)

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 15 + React + TypeScript + Tailwind CSS |
| **Backend** | API Routes Next.js + Prisma ORM |
| **Base de données** | PostgreSQL (Supabase en production) |
| **Authentification** | NextAuth.js v5 (JWT, 8h de session) |
| **Visioconférence** | BigBlueButton |
| **PDF / Excel** | jsPDF + xlsx |
| **Emails** | SendGrid |
| **i18n** | Français / Anglais / Arabe |
| **Déploiement** | Vercel + Docker (PostgreSQL local) |

---

## 📱 Plans d'Abonnement

| Plan | Description |
|------|-------------|
| **FREE** | Fonctionnalités de base, limites restrictives |
| **STARTER** | Fonctionnalités étendues |
| **PRO** | Fonctionnalités avancées + limites augmentées |
| **ENTERPRISE** | Illimité + support dédié |

---

## ✅ Récapitulatif des Tâches par Profil

### Superadmin
- [ ] Valider/rejeter les demandes d'inscription d'écoles
- [ ] Gérer les écoles existantes (activer/désactiver)
- [ ] Consulter les logs d'audit globaux
- [ ] Envoyer des broadcasts système
- [ ] Gérer les retours utilisateurs (bugs/suggestions)
- [ ] Vérifier la santé du système
- [ ] Impersonner un utilisateur pour support

### Administrateur d'École
- [ ] Créer/modifier/supprimer des élèves
- [ ] Créer/modifier des enseignants
- [ ] Créer/modifier des parents et les lier aux élèves
- [ ] Créer/modifier des groupes
- [ ] Gérer les présences et exporter en CSV
- [ ] Gérer les annonces (créer, publier, cibler)
- [ ] Créer/gérer les templates de certificats
- [ ] Configurer les paramètres de l'école
- [ ] Créer des comptes administrateurs supplémentaires
- [ ] Consulter les statistiques globales
- [ ] Gérer les examens

### Enseignant
- [ ] Créer/modifier ses groupes
- [ ] Assigner des sourates aux élèves
- [ ] Suivre la progression de mémorisation
- [ ] Effectuer des évaluations (Tajwid, Makhraj, Waqf, Tarteel, Fluency)
- [ ] Prendre les présences quotidiennes
- [ ] Créer des sessions Halaqa
- [ ] Évaluer les élèves après visio
- [ ] Envoyer des annonces à ses groupes
- [ ] Envoyer des messages aux parents/élèves
- [ ] Valider les présences saisies par les parents
- [ ] Remplir le carnet quotidien des élèves

### Parent
- [ ] Consulter la progression de ses enfants
- [ ] Voir les présences et le carnet quotidien
- [ ] Marquer les présences de ses enfants (avec validation)
- [ ] Recevoir les notifications (évaluations, absences)
- [ ] Lire les annonces de l'école
- [ ] Envoyer des messages aux enseignants

### Élève
- [ ] Consulter sa progression de mémorisation
- [ ] Mettre à jour son statut "Prêt à réciter"
- [ ] Consulter son carnet quotidien
- [ ] Voir ses badges et étoiles
- [ ] Rejoindre les sessions Halaqa
- [ ] Consulter ses présences
- [ ] Demander des clarifications aux enseignants
- [ ] Recevoir les notifications

---

*Document généré pour Tahfidz Version 3 — Plateforme de gestion de la mémorisation du Coran*
