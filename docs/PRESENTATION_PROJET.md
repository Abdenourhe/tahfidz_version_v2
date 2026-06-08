# Présentation du Projet Tahfidz Version 3

---

## 1. Vue d'ensemble du projet

**Tahfidz** est une plateforme SaaS multi-tenant dédiée à la gestion et au suivi de la mémorisation du Coran (Tahfidz). Elle centralise l'ensemble des processus éducatifs entre écoles, enseignants, élèves et parents dans une interface moderne et intuitive.

---

### 1.1 Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 15 + React + TypeScript + Tailwind CSS |
| **Backend** | API Routes Next.js + Prisma ORM |
| **Base de données** | PostgreSQL (Supabase en production) |
| **Authentification** | NextAuth.js v5 (JWT, 8h de session) |
| **Visioconférence** | BigBlueButton (Halaqa en ligne) |
| **PDF/Excel** | jsPDF + xlsx |
| **i18n** | Français / Anglais / Arabe |
| **Déploiement** | Vercel + Docker (PostgreSQL local) |

---

## 2. Architecture Multi-Tenant

L'application est conçue en **multi-tenant** : chaque école dispose de son propre espace isolé (via le champ `schoolId` sur toutes les entités). Les données sont automatiquement cloisonnées par école.

---

## 3. Les Profils Utilisateurs

### 3.1 Superadmin (Plateforme)
- Accès : `/admin/super`
- Gère toutes les écoles de la plateforme
- Valide/rejette les demandes d'inscription des écoles
- Visualise les logs d'audit globaux
- Envoie des broadcasts système
- Surveille la santé du système

### 3.2 Administrateur d'École
- Accès : `/admin/*`
- Gère les élèves, enseignants, parents et groupes
- Gère les présences, évaluations et annonces
- Configure les paramètres de l'école
- Génère des certificats et cartes d'inscription
- Crée des comptes administrateurs supplémentaires

### 3.3 Enseignant (Prof / Formateur)
- Accès : `/teacher/*`
- Gère ses propres élèves et groupes
- Suit la progression de mémorisation
- Effectue des évaluations (Tajwid, Makhraj, Waqf, Tarteel, Fluency)
- Prend les présences
- Crée des sessions Halaqa (visioconférence)
- Envoie des annonces et messages

### 3.4 Parent (Tuteur)
- Accès : `/parent/*`
- Consulte la progression de ses enfants liés
- Voit les présences et carnets quotidiens
- Peut marquer les présences de ses enfants (avec validation par l'enseignant)
- Peut s'inscrire via un code d'invitation QR

### 3.5 Élève (Étudiant)
- Accès : `/student/*`
- Consulte sa progression de mémorisation
- Visualise ses badges et récompenses
- Accède à son carnet quotidien
- Rejoint les sessions Halaqa
- Peut envoyer des demandes aux enseignants ("Ready to Recite")

---

### 3.6 Matrice des Rôles

| Fonctionnalité | Superadmin | Admin | Enseignant | Parent | Élève |
|---------------|:----------:|:-----:|:----------:|:------:|:-----:|
| Gestion des écoles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestion des élèves | ✅ | ✅ | ✅ (ses élèves) | ❌ | ❌ |
| Gestion des enseignants | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suivi progression | ✅ | ✅ | ✅ | ✅ (ses enfants) | ✅ |
| Évaluations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Présences | ✅ | ✅ | ✅ | ✅ (ses enfants) | ✅ |
| Halaqa (visio) | ✅ | ✅ | ✅ (modérateur) | 👁️ (observateur) | 👁️ (viewer) |
| Messagerie | ✅ | ✅ | ✅ | ✅ | ✅ |
| Annonces | ✅ | ✅ | ✅ | ❌ | ❌ |

> ✅ = Accès complet · 👁️ = Accès en lecture/observation

---

## 4. Fonctionnalités Principales

### 4.1 Suivi de Mémorisation du Coran

**Cycles de statut :**
```
NOT_STARTED → ASSIGNED → IN_PROGRESS → UNDER_REVIEW → 
READY_FOR_RECITATION → PENDING_TEACHER_APPROVAL → 
MEMORIZED / NEEDS_REVISION
```

**Fonctionnalités associées :**
- Assignation de sourates par l'enseignant
- Suivi vers par vers avec progression visuelle
- Historique complet des changements de statut
- Registre des sourates mémorisées avec scores finaux
- Badges et récompenses (gamification)

---

### 4.2 Carnet Quotidien (Daily Progress Log)

Registre journalier de l'élève comprenant :

| Section | Description |
|---------|-------------|
| **Hifz** | Nouvelle mémorisation du jour (versets début/fin) |
| **Muraja'a** | Révision (versets début/fin) |
| **Talqin** | Dictation (versets début/fin) |
| **Cours** | Classe scientifique (versets début/fin) |
| **Présence** | Statut journalier (PRÉSENT/ABSENT/RETARD/EXCUSÉ) |
| **Observations** | Notes générales |

Chaque section peut recevoir des commentaires de l'enseignant et du parent.

---

### 4.3 Évaluations

L'enseignant évalue l'élève sur 5 critères :

| Critère | Description |
|---------|-------------|
| **Tajwid** | Règles de récitation correcte |
| **Makhraj** | Prononciation des lettres |
| **Waqf** | Arrêts de récitation |
| **Tarteel** | Modulation et mélodie |
| **Fluency** | Fluidité générale |

**Décisions possibles :**
- ✅ APPROUVÉ
- 🔄 BESOIN DE RÉVISION
- ❌ REJETÉ

---

### 4.4 Gestion des Groupes

- Création de groupes avec niveaux et planning
- Capacité maximale (15 élèves par défaut)
- Assignation d'un enseignant par groupe
- Niveaux de progression configurables
- Exports CSV des listes d'élèves

---

### 4.5 Halaqa (Visio-conférence)

Sessions en ligne via **BigBlueButton** :

| Type | Description |
|------|-------------|
| **INDIVIDUEL** | Session privée élève-enseignant |
| **COLLECTIVE** | Session de groupe |

| Mode | Description |
|------|-------------|
| **AUDIO SEUL** | Audio uniquement |
| **VIDÉO** | Audio + Vidéo |
| **PARTAGE D'ÉCRAN** | Pour explications de Mushaf |

**Fonctionnalités :**
- Enregistrement automatique des sessions
- Évaluations pendant/après la session
- URLs différenciées par rôle (modérateur/viewer/observateur)

---

### 4.6 Gamification & Motivation

| Système | Description |
|---------|-------------|
| **Étoiles (Stars)** | Gagnées à chaque étape de mémorisation |
| **Séries (Streaks)** | Jours consécutifs de connexion/activité |
| **Badges** | Critères variés avec raretés (COMMUN/RARE/ÉPIQUE/LÉGENDAIRE) |
| **Classements** | Leaderboards par groupe |

---

### 4.7 Gestion des Présences

- **Élèves** : Marquage quotidien (Présent/Absent/Retard/Excusé)
- **Parents** : Peuvent marquer présence pour leurs enfants avec motif → validée par l'enseignant
- **Alertes** : Système d'alertes pour les absences
- **Export** : Export CSV des feuilles de présence

---

### 4.8 Système de Messagerie

- **Messages directs** entre utilisateurs
- **Notifications** en temps réel avec suivi de lecture
- **Annonces** ciblées par rôle, avec épinglage et date d'expiration
- **Broadcasts** système (superadmin)

**Types d'annonces :**
- Générale / Événement / Réussite / Urgente

---

### 4.9 Gestion des Examen

- Création d'examens avec sélection de sourates par groupe
- Suivi des résultats par élève
- Intégration avec le système d'évaluation

---

### 4.10 Génération de Documents

- **Certificats** de mémorisation (templates personnalisables)
- **Cartes d'inscription** des élèves (avec QR code)
- **Invitations parents** (QR codes pour inscription directe)
- **Exports** CSV (élèves, présences, évaluations)

---

### 4.11 Tableau de Bord

| Portail | Widgets principaux |
|---------|-------------------|
| **Superadmin** | Stats cross-schools, écoles à valider, santé système |
| **Admin** | Élèves actifs, enseignants, groupes, annonces récentes |
| **Enseignant** | Ses élèves, groupes du jour, prochaines sessions, alertes |
| **Parent** | Progression des enfants, absences, messages |
| **Élève** | Progression, badges, série en cours, prochaines sessions |

---

## 5. Processus Métier Principaux

### 5.1 Inscription d'une École

```
1. Formulaire d'inscription → Création d'une SchoolRequest
2. Superadmin valide/rejette la demande
3. Si APPROUVÉ → Création automatique de l'école, de l'admin et du plan d'abonnement
4. Email de bienvenue envoyé à l'admin
```

### 5.2 Cycle de Mémorisation

```
1. Enseignant assigne une sourate (ASSIGNED)
2. Élève commence la mémorisation (IN_PROGRESS)
3. Élève demande récitation → Enseignant examine (UNDER_REVIEW → READY_FOR_RECITATION)
4. Enseignant valide après test → PENDING_TEACHER_APPROVAL
5. Enseignant confirme → MEMORIZED
   ou demande révision → NEEDS_REVISION → IN_PROGRESS (boucle)
```

### 5.3 Processus d'Évaluation

```
1. Enseignant lance une évaluation
2. Score sur 5 critères (Tajwid, Makhraj, Waqf, Tarteel, Fluency)
3. Calcul du score final
4. Décision : APPROUVÉ / RÉVISION / REJETÉ
5. Notification automatique à l'élève et au parent
```

### 5.4 Gestion des Présences Parents

```
1. Parent marque présence pour son enfant (saisie motif)
2. Système crée ParentAttendance (en attente)
3. Enseignant valide ou rejette
4. Notification envoyée au parent
5. Intégration dans les statistiques
```

### 5.5 Création d'une Session Halaqa

```
1. Enseignant crée session (individuelle/collective, mode audio/vidéo/écran)
2. BigBlueButton génère meetingID et URLs par rôle
3. Session SCHEDULED → LIVE → ENDED
4. Enregistrement automatique disponible après session
5. Évaluations post-session possibles
```

---

## 6. Authentification & Sécurité

### 6.1 Deux Modes de Connexion

| Mode | Identification |
|------|---------------|
| **Connexion École** | schoolSlug + email + mot de passe |
| **Connexion Superadmin** | email + mot de passe (sans schoolSlug) |

Bascule secrète : `Ctrl+Shift+S` pour passer en mode superadmin.

### 6.2 Routes Publiques (sans authentification)

```
/                          → Page d'accueil
/login                     → Connexion
/register-school           → Inscription d'école
/forgot-password           → Mot de passe oublié
/reset-password            → Réinitialisation
/parent/register           → Inscription parent (avec code)
/api/auth                  → NextAuth endpoint
/api/health                → Vérification API
```

### 6.3 Protection par Rôle (Middleware)

Les routes sont protégées automatiquement selon le rôle :

| Préfixe | Rôles autorisés |
|---------|----------------|
| `/admin/super` | SUPERADMIN uniquement |
| `/admin` | ADMIN, SUPERADMIN |
| `/teacher` | TEACHER, ADMIN, SUPERADMIN |
| `/parent` | PARENT, ADMIN, SUPERADMIN |
| `/student` | STUDENT, ADMIN, SUPERADMIN |

---

## 7. Modèles de Données (25 modèles Prisma)

### 7.1 Entités Organisation

| Modèle | Rôle |
|--------|------|
| `School` | École (nom, slug, plan, paramètres) |
| `SchoolRequest` | Demande d'inscription d'école |
| `Group` | Groupe d'élèves (niveau, planning, capacité) |
| `User` | Utilisateur de base (authentification) |
| `Admin` | Profil administrateur |
| `Teacher` | Profil enseignant (spécialisation Hafs Asim, etc.) |
| `Parent` | Profil parent (nationalité, langues) |
| `Student` | Profil élève (code étudiant, stats) |
| `ParentStudentLink` | Lien parent-élève (relation, code d'accès) |

### 7.2 Entités Pédagogiques

| Modèle | Rôle |
|--------|------|
| `Surah` | Les 114 sourates du Coran |
| `MemorizationProgress` | Progression de mémorisation par élève/sourate |
| `StatusHistory` | Historique des changements de statut |
| `MemorizedSurah` | Registre des sourates mémorisées |
| `Evaluation` | Évaluations de l'enseignant |
| `DailyProgressLog` | Carnet quotidien |
| `DailyLogComment` | Commentaires sur le carnet |
| `Exam` | Examens |
| `HalaqaSession` | Sessions visio BigBlueButton |
| `HalaqaEvaluation` | Évaluations post-Halaqa |

### 7.3 Entités Système

| Modèle | Rôle |
|--------|------|
| `Attendance` | Présences élèves |
| `ParentAttendance` | Présences saisies par les parents |
| `Badge` | Badges définis |
| `StudentBadge` | Badges obtenus |
| `StarsLog` | Historique des étoiles |
| `StudentStats` | Statistiques élève |
| `Announcement` | Annonces |
| `Notification` | Notifications |
| `DirectMessage` | Messages directs |
| `Broadcast` | Messages broadcast |
| `Feedback` | Retours utilisateurs (bugs, suggestions) |
| `AuditLog` | Logs d'audit système |
| `ErrorLog` | Logs d'erreur |
| `Session` | Sessions NextAuth |

---

## 8. Plans d'Abonnement

| Plan | Description |
|------|-------------|
| **FREE** | Fonctionnalités de base |
| **STARTER** | Fonctionnalités étendues |
| **PRO** | Fonctionnalités avancées + limites augmentées |
| **ENTERPRISE** | Illimité + support dédié |

Les plans sont configurables par école dans `school.plan`.

---

## 9. Options & Paramètres

### 9.1 Paramètres d'École (Admin)
- Nom de l'école (français / arabe)
- Logo et identité visuelle
- Adresse, ville, pays
- Téléphone
- Plan d'abonnement
- Configuration générale (JSON)

### 9.2 Paramètres Enseignant
- Biographie
- Spécialisation (ex: "Hafs Asim")
- Nombre maximum d'élèves (défaut: 20)
- Statut actif/inactif

### 9.3 Permissions Admin
- Gestion complète des utilisateurs de l'école
- Accès à tous les portails (admin/teacher/parent/student)

---

## 10. Tâches & Workflows par Profil

### 10.1 Superadmin
- [ ] Valider/rejeter les demandes d'inscription d'écoles
- [ ] Gérer les écoles existantes (activer/désactiver)
- [ ] Consulter les logs d'audit
- [ ] Envoyer des broadcasts système
- [ ] Gérer les retours utilisateurs (bugs/suggestions)
- [ ] Vérifier la santé du système

### 10.2 Administrateur
- [ ] Créer/modifier/supprimer des élèves
- [ ] Créer/modifier des enseignants
- [ ] Créer/modifier des parents (lier aux élèves)
- [ ] Créer/modifier des groupes
- [ ] Gérer les présences (export CSV)
- [ ] Gérer les annonces (créer, publier, cibler)
- [ ] Créer/gérer les templates de certificats
- [ ] Configurer les paramètres de l'école
- [ ] Créer des comptes administrateurs supplémentaires
- [ ] Consulter les statistiques
- [ ] Gérer les examens

### 10.3 Enseignant
- [ ] Créer/modifier ses groupes
- [ ] Assigner des sourates aux élèves
- [ ] Suivre la progression de mémorisation
- [ ] Effectuer des évaluations (Tajwid, etc.)
- [ ] Prendre les présences
- [ ] Créer des sessions Halaqa
- [ ] Évaluer les élèves après visio
- [ ] Envoyer des annonces
- [ ] Envoyer des messages
- [ ] Valider les présences parents
- [ ] Remplir le carnet quotidien

### 10.4 Parent
- [ ] Consulter la progression de ses enfants
- [ ] Voir les présences et le carnet quotidien
- [ ] Marquer les présences de ses enfants
- [ ] Recevoir les notifications
- [ ] Lire les annonces de l'école
- [ ] Envoyer des messages

### 10.5 Élève
- [ ] Consulter sa progression de mémorisation
- [ ] Mettre à jour son statut de récitation ("Ready to Recite")
- [ ] Consulter son carnet quotidien
- [ ] Voir ses badges et étoiles
- [ ] Rejoindre les sessions Halaqa
- [ ] Consulter ses présences
- [ ] Demander des clarifications aux enseignants
- [ ] Recevoir les notifications

---

## 11. Langues Supportées

L'application supporte **3 langues** avec basculement dynamique :

- **Français (FR)** — Langue par défaut
- **English (EN)**
- **العربية (AR)** — Arabe (RTL support)

---

## 12. Déploiement & Environnements

| Environnement | Base de Données | Frontend |
|--------------|----------------|----------|
| **Développement** | Docker (PostgreSQL local) | `npm run dev` (localhost:3000) |
| **Production** | Supabase (PostgreSQL) | Vercel |

---

## 13. Accès Démo (Développement)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Superadmin | `admin@tahfidz.com` | `Admin@123456` |
| Admin | `admin@tahfidz.com` | `Admin@123456` |
| Enseignant | `teacher1@tahfidz.com` | `Teacher@123456` |
| Parent | `parent@tahfidz.com` | `Parent@123456` |
| Élève | `yusuf@tahfidz.com` | `Student@123456` |

École démo : **tahfidz-demo**

---

*Document généré pour Tahfidz Version 3 — Plateforme de gestion de la mémorisation du Coran*
