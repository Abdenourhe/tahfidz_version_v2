# 📊 ANALYSE EXHAUSTIVE — PROJET TAHFIDZ SaaS
> Next.js 15 · Multi-tenant · Gestion d'écoles coraniques  
> Généré le : 2026-05-22 | Statut : **Pré-réorganisation**

---

## 1. STRUCTURE DES DOSSIERS

### 1.1 `src/app/` — Routes & API

#### Portail Admin (`/admin/*`)
| Route | Type | Description |
|---|---|---|
| `/admin/layout.tsx` | Server | Layout avec AdminSidebar + TopBar |
| `/admin/dashboard/page.tsx` | Server | Dashboard principal |
| `/admin/students/page.tsx` | Server | Liste élèves (fetch Prisma direct) |
| `/admin/students/new/page.tsx` | **Client** ⚠️ | Formulaire création élève (504 lignes) |
| `/admin/students/[id]/page.tsx` | Server | Détail élève |
| `/admin/students/[id]/edit/page.tsx` | **Client** ⚠️ | Formulaire édition (542 lignes, "use client" en page) |
| `/admin/students/[id]/certificate/page.tsx` | Server | Génération certificat |
| `/admin/teachers/page.tsx` | Server | Liste enseignants |
| `/admin/teachers/new/page.tsx` | Server | Formulaire création |
| `/admin/teachers/[id]/page.tsx` | Server | Détail enseignant |
| `/admin/parents/page.tsx` | Server | Liste parents |
| `/admin/parents/new/page.tsx` | Client | Formulaire création parent |
| `/admin/parents/[id]/page.tsx` | Server | Détail parent |
| `/admin/parents/[id]/message/page.tsx` | Server | Messagerie parent |
| `/admin/groups/page.tsx` | Server | Liste groupes |
| `/admin/groups/new/page.tsx` | Client | Formulaire création groupe |
| `/admin/groups/[id]/page.tsx` | Server | Détail groupe |
| `/admin/attendance/page.tsx` | **Client** ⚠️ | Export présences (357 lignes, fetch côté client) |
| `/admin/evaluations/page.tsx` | Server | Liste évaluations |
| `/admin/announcements/page.tsx` | Client | Liste annonces |
| `/admin/announcements/new/page.tsx` | Client | Nouvelle annonce |
| `/admin/announcements/[id]/edit/page.tsx` | Client | Édition annonce |
| `/admin/certificate-templates/page.tsx` | Server | Templates certificats |
| `/admin/settings/page.tsx` | Server | Paramètres école |
| `/admin/stats/page.tsx` | Server | Statistiques |
| `/admin/notifications/page.tsx` | Client | Notifications |
| `/admin/admins/page.tsx` | Client | Gestion admins (261 lignes) |
| `/admin/super/page.tsx` | **Client** 🔴 | SuperAdmin panel (**1425 lignes** — monstre) |

#### Portail Teacher (`/teacher/*`)
| Route | Type | Description |
|---|---|---|
| `/teacher/layout.tsx` | Server | Layout avec TeacherSidebar |
| `/teacher/dashboard/page.tsx` | Server | Dashboard enseignant |
| `/teacher/students/page.tsx` | Server | Liste élèves du prof |
| `/teacher/students/[id]/page.tsx` | Server | Détail élève |
| `/teacher/groups/page.tsx` | Server | Groupes du prof |
| `/teacher/groups/[id]/page.tsx` | Server | Détail groupe |
| `/teacher/attendance/page.tsx` | **Client** ⚠️ | Prise de présences (301 lignes) |
| `/teacher/progress/page.tsx` | Client | Suivi mémorisation |
| `/teacher/evaluations/page.tsx` | **Client** ⚠️ | Évaluations (**519 lignes**, "FIXED" dans commentaire) |
| `/teacher/evaluation/new/page.tsx` | Client | Nouvelle évaluation |
| `/teacher/announcements/page.tsx` | Client | Annonces |
| `/teacher/announcements/new/page.tsx` | Client | Nouvelle annonce |
| `/teacher/notifications/page.tsx` | Client | Notifications |
| `/teacher/profile/page.tsx` | Server | Profil enseignant |
| `/teacher/new/page.tsx` | Client | ?Création prof (297 lignes) |

#### Portail Parent (`/parent/*`)
| Route | Type | Description |
|---|---|---|
| `/parent/layout.tsx` | Server | Layout avec ParentNav |
| `/parent/dashboard/page.tsx` | Server | Dashboard parent |
| `/parent/child/[id]/page.tsx` | Server | Profil enfant |
| `/parent/link/page.tsx` | Client | Liaison parent-enfant |
| `/parent/notifications/page.tsx` | Server | Notifications |
| `/parent/profile/page.tsx` | Server | Profil parent |

#### Portail Student (`/student/*`)
| Route | Type | Description |
|---|---|---|
| `/student/layout.tsx` | Server | Layout avec StudentSidebar |
| `/student/dashboard/page.tsx` | Server | Dashboard étudiant |
| `/student/attendance/page.tsx` | Server | Présences perso |
| `/student/progress/page.tsx` | Server | Progression mémorisation |
| `/student/badges/page.tsx` | Server | Badges et récompenses |
| `/student/notifications/page.tsx` | Client | Notifications |

#### Autres routes
| Route | Type | Description |
|---|---|---|
| `/page.tsx` | Server | Landing page |
| `/login/page.tsx` | Client | Connexion (332 lignes, multi-rôle + slug) |
| `/register-school/page.tsx` | Client | Inscription école |
| `/display/page.tsx` | Client | Écran d'affichage public |
| `/superadmin/audit/page.tsx` | Server | Audit logs superadmin |

---

### 1.2 `src/app/api/` — Routes API

#### Entités principales
| Route | Méthodes | Description |
|---|---|---|
| `/api/students/route.ts` | GET, POST | Liste + création élève (126 lignes) |
| `/api/students/[id]/route.ts` | GET, PATCH, DELETE | CRUD élève (222 lignes) |
| `/api/students/[id]/toggle/route.ts` | PATCH | Activer/désactiver (67 lignes) |
| `/api/students/[id]/status/route.ts` | PATCH | **DOUBLON** toggle (46 lignes) ⚠️ |
| `/api/students/[id]/transfer/route.ts` | POST | Transfert de groupe (114 lignes) |
| `/api/students/export/route.ts` | GET | Export CSV/Excel (114 lignes) |
| `/api/teachers/route.ts` | GET, POST | CRUD enseignants (125 lignes) |
| `/api/parents/route.ts` | GET, POST | CRUD parents (128 lignes) |
| `/api/parents/[id]/route.ts` | GET, DELETE | Détail parent (20 lignes) |
| `/api/groups/route.ts` | GET, POST | CRUD groupes (118 lignes) |
| `/api/groups/[id]/route.ts` | GET, PATCH, DELETE | Détail groupe (116 lignes) |

#### Présences
| Route | Méthodes | Description |
|---|---|---|
| `/api/attendance/route.ts` | GET, POST | Présences (308 lignes, multi-rôle) |
| `/api/attendance/export/route.ts` | GET | Export CSV (113 lignes) |

#### Mémorisation & Évaluations
| Route | Méthodes | Description |
|---|---|---|
| `/api/progress/route.ts` | GET, POST | Progression mémorisation (195 lignes) |
| `/api/progress/[id]/route.ts` | GET, PATCH | Détail progression (194 lignes) |
| `/api/evaluations/route.ts` | GET, POST | Évaluations (204 lignes) |
| `/api/evaluations/[id]/route.ts` | GET, PATCH | Détail évaluation (126 lignes) |
| `/api/surahs/route.ts` | GET | Liste sourates (29 lignes) |
| `/api/exams/route.ts` | GET, POST | Examens (162 lignes) |

#### Communication
| Route | Méthodes | Description |
|---|---|---|
| `/api/announcements/route.ts` | GET, POST | Annonces (129 lignes) |
| `/api/announcements/[id]/route.ts` | GET, PATCH, DELETE | Détail annonce (70 lignes) |
| `/api/notifications/route.ts` | GET, POST | Notifications (61 lignes) |
| `/api/notifications/[id]/route.ts` | PATCH | Marquer lu (18 lignes) |
| `/api/messages/route.ts` | GET, POST | Messagerie directe (68 lignes) |
| `/api/feedback/route.ts` | POST, PATCH | Feedbacks/bugs (198 lignes) |

#### Admin / Système
| Route | Méthodes | Description |
|---|---|---|
| `/api/admin/audit/route.ts` | GET | Audit logs (201 lignes) |
| `/api/admin/broadcast/route.ts` | POST | Broadcast (88 lignes) |
| `/api/admin/health/route.ts` | GET | Santé système (143 lignes) |
| `/api/admin/impersonate/route.ts` | POST | Impersonnification (97 lignes) |
| `/api/admin/school/logo/route.ts` | POST, DELETE | Logo (ADMIN) (93 lignes) |
| `/api/admin/schools/logo/route.ts` | POST, DELETE | Logo (SUPERADMIN) (72 lignes) — quasi-doublon |
| `/api/admin/schools/route.ts` | GET, POST, PATCH | Gestion écoles superadmin (257 lignes) |
| `/api/admin/certificate-templates/route.ts` | GET, POST | Templates (54 lignes) |
| `/api/admins/route.ts` | GET, POST | Gestion admins (84 lignes) |
| `/api/admins/[id]/route.ts` | DELETE | Suppression admin (40 lignes) |
| `/api/auth/[...nextauth]/route.ts` | — | NextAuth handler (3 lignes) |
| `/api/display/route.ts` | GET | Données écran public (43 lignes) |
| `/api/parent/link/route.ts` | POST | Liaison parent-enfant (113 lignes) |
| `/api/profile/route.ts` | GET, PATCH | Profil utilisateur (34 lignes) |
| `/api/profile/password/route.ts` | PATCH | Changement mot de passe (48 lignes) |
| `/api/register-school/route.ts` | POST | Demande inscription école (86 lignes) |

---

### 1.3 `src/components/` — Composants

#### `/admin/` (22 composants)
| Fichier | Lignes | Rôle |
|---|---|---|
| `AdminDashboardClient.tsx` | 233 | Dashboard admin (client) |
| `AdminSettingsClient.tsx` | 491 | Paramètres école (client) |
| `AttendanceFilters.tsx` | ~50 | Filtres présences |
| `CertificatePrint.tsx` | 467 | Impression certificat |
| `CertificateTemplateEditor.tsx` | 570 | Éditeur templates certificats |
| `CertificateTemplateEditorI18n.tsx` | 28 | **Wrapper i18n inutile** ⚠️ (juste titre + wrapping) |
| `EvaluationsListClient.tsx` | 172 | Liste évaluations |
| `GroupDetailClient.tsx` | 306 | Détail groupe |
| `GroupRename.tsx` | ~60 | Renommage groupe inline |
| `GroupStudentList.tsx` | ~80 | Liste élèves d'un groupe |
| `GroupsListClient.tsx` | 507 | Liste groupes avec filtres |
| `ImpersonateBanner.tsx` | ~40 | Bannière mode impersonation |
| `ParentDetailClient.tsx` | 228 | Détail parent |
| `ParentsListClient.tsx` | 172 | Liste parents |
| `StatsCharts.tsx` | 203 | Graphiques statistiques |
| `StatsChartsI18n.tsx` | 28 | **Wrapper i18n inutile** ⚠️ (juste titre + wrapping) |
| `StudentActions.tsx` | 148 | Actions sur un élève (activer, transférer…) |
| `StudentDetailClient.tsx` | 340 | Détail élève |
| `StudentGroupTransfer.tsx` | 164 | Transfert groupe |
| `StudentTableClient.tsx` | 432 | Tableau élèves (admin/teachers) |
| `StudentsListClient.tsx` | 522 | Liste élèves (UI alternative) ⚠️ doublon partiel avec StudentTableClient |
| `TeacherDetailClient.tsx` | 224 | Détail enseignant |
| `TeachersListClient.tsx` | 122 | Liste enseignants (actuel) |
| `TeachersListI18n.tsx` | 122 | **Fichier MORT** 🔴 (commentaire "DEPRECATED", jamais importé) |
| `TransferStudentModal.tsx` | 135 | Modal transfert élève |

#### `/layout/` (6 composants)
| Fichier | Lignes | Rôle |
|---|---|---|
| `AdminSidebar.tsx` | 201 | Sidebar admin |
| `NotificationNavItem.tsx` | ~50 | Badge notifications nav |
| `ParentNav.tsx` | ~80 | Navigation parent |
| `StudentSidebar.tsx` | ~100 | Sidebar étudiant |
| `TeacherSidebar.tsx` | 124 | Sidebar enseignant |
| `TopBar.tsx` | ~60 | Barre du haut (server) |
| `TopBarControls.tsx` | ~80 | Contrôles topbar (client) |

#### `/teacher/` (8 composants)
| Fichier | Lignes | Rôle |
|---|---|---|
| `TeacherDashboardClient.tsx` | 193 | Dashboard enseignant |
| `TeacherGroupAttendance.tsx` | ~120 | Présences par groupe |
| `TeacherGroupDetailClient.tsx` | 162 | Détail groupe (prof) |
| `TeacherGroupsListClient.tsx` | 141 | Liste groupes (prof) |
| `TeacherProfileAttendance.tsx` | 238 | Présences dans profil prof |
| `TeacherProfileClient.tsx` | 264 | Profil prof |
| `TeacherStudentDetailClient.tsx` | 224 | Détail élève (vue prof) |
| `TeacherStudentsListClient.tsx` | 182 | Liste élèves (vue prof) |

#### `/parent/` (4 composants)
| Fichier | Lignes | Rôle |
|---|---|---|
| `ParentChildProfileClient.tsx` | 603 | Profil enfant (vue parent) — très long |
| `ParentDashboardClient.tsx` | 171 | Dashboard parent |
| `ParentProfileAttendance.tsx` | 375 | Présences dans profil parent |
| `ParentProfileClient.tsx` | 351 | Profil parent |

#### `/student/` (6 composants)
| Fichier | Lignes | Rôle |
|---|---|---|
| `ReadyToReciteButton.tsx` | ~60 | Bouton "Prêt à réciter" |
| `StudentAttendanceClient.tsx` | 138 | Présences (vue élève) |
| `StudentBadgesClient.tsx` | ~100 | Badges (vue élève) |
| `StudentDashboardClient.tsx` | 271 | Dashboard élève |
| `StudentProgressClient.tsx` | 162 | Progression mémorisation |
| `VerseProgressTracker.tsx` | 254 | Suivi versets |

#### Autres composants
| Fichier | Lignes | Rôle |
|---|---|---|
| `superadmin/AuditLogClient.tsx` | 581 | Logs d'audit |
| `shared/FeedbackModal.tsx` | 314 | Modal feedback/bug |
| `ui/LanguageSwitcher.tsx` | ~50 | Sélecteur de langue |
| `providers/SessionProvider.tsx` | ~20 | Provider session |
| `LandingPage.tsx` | 755 | Page d'accueil (grosse) |
| `Providers.tsx` | ~30 | Providers globaux |
| `StudentsExport.tsx` | ~80 | Export élèves |
| `ThemeScript.tsx` | ~20 | Script dark mode |

---

### 1.4 `src/lib/` — Utilitaires

| Fichier | Lignes | Rôle |
|---|---|---|
| `prisma.ts` | ~10 | Instance Prisma singleton |
| `prisma-tenant.ts` | ~30 | Helper Prisma multi-tenant |
| `audit.ts` | 218 | Service audit logs |
| `badges.ts` | 147 | Logique badges/récompenses |
| `email.ts` | 364 | Service email (Resend) |
| `utils.ts` | 151 | Fonctions utilitaires |
| `i18n/translations.ts` | 253 | Dictionnaire FR/EN/AR |
| `i18n/pageTranslations.ts` | 164 | Traductions de pages |
| `validations/auth.ts` | ~30 | Schémas Zod auth |

### 1.5 `src/contexts/`
| Fichier | Lignes | Rôle |
|---|---|---|
| `LanguageContext.tsx` | 72 | Context langue global (localStorage → useState) |

### 1.6 `src/types/`
| Fichier | Rôle |
|---|---|
| `missing-packages.d.ts` | Déclarations de types manquants |

### 1.7 `prisma/`
| Fichier | Rôle |
|---|---|
| `schema.prisma` | Schéma complet (~380 lignes, 25 modèles) |
| `seed.ts` | Données de test (331 lignes) |
| `migrations/20260521010115_add_entity_fields/` | Migration champs entités |
| `migrations/20260521170841_add_emergency_phone/` | Migration téléphone urgence |
| `migration_school_requests.sql` | SQL manuel (school requests) |
| `migration_supabase.sql` | SQL manuel Supabase |

### 1.8 `public/`
| Dossier/Fichier | Contenu |
|---|---|
| `uploads/` | Logos uploadés par les écoles |

### 1.9 `messages/`
| Fichier | Lignes | Contenu |
|---|---|---|
| `fr.json` | 399 | Traductions françaises (next-intl) |
| `ar.json` | 399 | Traductions arabes (next-intl) |

---

## 2. DÉPENDANCES

### 2.1 `dependencies` (production)

| Package | Version | Usage |
|---|---|---|
| `next` | 15.1.0 | Framework principal |
| `react` + `react-dom` | 18.3.1 | UI |
| `next-auth` | 5.0.0-beta.25 | Auth JWT, Credentials provider |
| `@auth/prisma-adapter` | ^2.7.4 | Adapter Prisma pour NextAuth |
| `@prisma/client` | ^5.22.0 | ORM base de données |
| `next-intl` | ^3.26.3 | i18n (⚠️ **installé mais QUASI-INUTILISÉ**) |
| `bcryptjs` | ^2.4.3 | Hachage mots de passe |
| `bullmq` | ^5.16.0 | File de tâches (jobs) |
| `ioredis` | ^5.4.1 | Client Redis (pour BullMQ) |
| `resend` | ^6.12.2 | Envoi emails |
| `zod` | ^3.25.76 | Validation schémas |
| `react-hook-form` | ^7.75.0 | Formulaires |
| `@hookform/resolvers` | ^5.2.2 | Résolveurs Zod pour RHF |
| `recharts` | ^3.8.1 | Graphiques statistiques |
| `lucide-react` | ^1.14.0 | Icônes |
| `date-fns` | ^4.2.1 | Manipulation dates |
| `clsx` + `tailwind-merge` | ^2.1.1 / ^2.5.4 | Classes CSS conditionnelles |
| `sonner` | ^2.0.7 | Toast notifications |
| `use-debounce` | ^10.1.1 | Debounce pour recherche |
| `xlsx` | ^0.18.5 | Export Excel |
| `qrcode` | ^1.5.4 | Génération QR codes |
| `react-country-flag` | ^3.1.0 | Drapeaux pays |

### 2.2 `devDependencies`

| Package | Usage |
|---|---|
| `prisma` | CLI Prisma migrations |
| `typescript` | Typage |
| `tailwindcss` + `autoprefixer` + `postcss` | CSS |
| `eslint` | Linting |
| `vitest` | Tests unitaires |
| `@vitest/coverage-v8` | Couverture tests |
| `tsx` | Exécution TypeScript (workers) |

### 2.3 Scripts disponibles
```
dev          → next dev
build        → next build
test         → vitest run
db:migrate   → prisma migrate dev
db:seed      → prisma db seed
db:studio    → prisma studio
db:push      → prisma db push
db:reset     → reset + seed
workers:start → tsx jobs/workers.ts
```

---

## 3. FICHIERS MORTS / DOUBLONS / ANTI-PATTERNS

### 3.1 🔴 Fichier MORT confirmé

| Fichier | Preuve | Action recommandée |
|---|---|---|
| `src/components/admin/TeachersListI18n.tsx` (122 lignes) | Commentaire interne "DEPRECATED — renommé TeachersListClient.tsx. Ce fichier n'est plus importé." Grep confirmé : **aucun import** nulle part | **Supprimer** |

### 3.2 ⚠️ Wrappers I18n inutiles (Layer superflu)

Ces composants n'ajoutent qu'un titre traduit autour d'un composant existant. Ils créent un niveau d'indirection inutile et pourraient être absorbés directement dans la page.

| Wrapper | Lignes | Ce qu'il fait | Utilisé par |
|---|---|---|---|
| `StatsChartsI18n.tsx` | 28 | Ajoute titre traduit + wrap `<StatsCharts>` | `/admin/stats/page.tsx` |
| `CertificateTemplateEditorI18n.tsx` | 28 | Ajoute titre traduit + wrap `<CertificateTemplateEditor>` | `/admin/certificate-templates/page.tsx` |

**Solution** : fusionner le titre directement dans la page Server Component ou dans le composant lui-même.

### 3.3 🔴 Double système I18n en conflit

C'est le problème architectural **le plus sérieux** du projet :

| Système | Fichiers | Usage réel |
|---|---|---|
| **`LanguageContext`** (custom) | `src/contexts/LanguageContext.tsx` + `src/lib/i18n/translations.ts` (253 lignes) + `src/lib/i18n/pageTranslations.ts` (164 lignes) | **55+ fichiers** utilisent `useLanguage()` — c'est le système dominant |
| **`next-intl`** | `src/i18n/request.ts` + `messages/fr.json` + `messages/ar.json` (399 lignes chacun) | **Seulement `i18n/request.ts`** — le fichier de config existe mais `useTranslations()` / `getTranslations()` ne sont utilisés **nulle part** dans les composants |

**Problème** : `next-intl` est installé, configuré, et les fichiers `messages/*.json` sont complets (399 lignes chacun), mais **aucun composant ne l'utilise**. L'application utilise exclusivement le `LanguageContext` custom avec des objets `{ fr: "...", en: "...", ar: "..." }` inline dans chaque composant.

### 3.4 ⚠️ API en doublon — toggle vs status

Deux routes API font **exactement la même chose** (activer/désactiver un élève) :

| Route | Lignes | Différences |
|---|---|---|
| `POST /api/students/[id]/toggle/route.ts` | 67 | Supporte ADMIN + SUPERADMIN, bascule le statut automatiquement, audit log complet |
| `PATCH /api/students/[id]/status/route.ts` | 46 | Supporte uniquement ADMIN, reçoit `isActive` en body, audit log minimal |

**Action** : conserver `/toggle`, supprimer `/status`.

### 3.5 ⚠️ API Logo en quasi-doublon

| Route | Rôle | Différence |
|---|---|---|
| `/api/admin/school/logo/route.ts` | Upload logo pour ADMIN (sa propre école) | schoolId depuis session |
| `/api/admin/schools/logo/route.ts` | Upload logo pour SUPERADMIN (n'importe quelle école) | schoolId depuis le body |

Ces routes sont **légitimement différentes** (rôles distincts) mais partagent ~80% de logique identique. Une abstraction commune serait utile.

### 3.6 ⚠️ Double composant liste élèves

| Composant | Lignes | Utilisé par |
|---|---|---|
| `StudentsListClient.tsx` | 522 | **Jamais importé directement par une page admin** ⚠️ |
| `StudentTableClient.tsx` | 432 | `/admin/students/page.tsx` |

`StudentsListClient` existe mais n'est pas importé par `admin/students/page.tsx` (qui utilise `StudentTableClient`). Il faut vérifier s'il est utilisé ailleurs ou s'il s'agit d'un doublon en attente de suppression.

### 3.7 ⚠️ Pages "use client" qui devraient être Server Components

| Fichier | Lignes | Problème |
|---|---|---|
| `admin/students/[id]/edit/page.tsx` | 542 | Page complète en client, fetch via useEffect |
| `admin/students/new/page.tsx` | 504 | Page formulaire tout en client |
| `teacher/evaluations/page.tsx` | 519 | Labellisé "FIXED", tout en client avec fetch |
| `admin/super/page.tsx` | **1425** | Tout en client, fetch massif via useEffect, gère TOUT le panneau superadmin |

### 3.8 ⚠️ Traductions dupliquées inline dans les composants

Chaque composant définit **localement** ses traductions sous forme d'objet `const T = { key: { fr: "...", en: "...", ar: "..." } }`. On retrouve ce pattern dans ~40 fichiers, ce qui signifie que des traductions comme "Enregistrer / Save / حفظ" sont répétées des dizaines de fois alors qu'elles existent dans `translations.ts`.

---

## 4. FLUX DE DONNÉES PAR ENTITÉ

### 4.1 Students (Élèves)

```
[Server Component]
/admin/students/page.tsx
  → prisma.student.findMany() [direct DB, avec include user/group/teacher/parentLinks]
  → <StudentTableClient students groups teachers statusFilter />

[Client Component]
StudentTableClient.tsx
  → State: filtre local (search, status, group, teacher)
  → Calls: PATCH /api/students/[id]/toggle (activer/désactiver)
  → Calls: DELETE /api/students/[id] (supprimer)
  → Navigate: /admin/students/[id] (voir détail)

[API Routes]
GET  /api/students         → liste paginée
POST /api/students         → création (+ User en transaction)
GET  /api/students/[id]    → détail complet
PATCH /api/students/[id]   → modification
DELETE /api/students/[id]  → suppression
PATCH /api/students/[id]/toggle → activer/désactiver
PATCH /api/students/[id]/status → DOUBLON de toggle ⚠️
POST  /api/students/[id]/transfer → transfert de groupe
GET   /api/students/export  → CSV/Excel
```

**Doublon de logique** : La page `/admin/students/page.tsx` (Server, fetch Prisma direct) et les composants qui utilisent `fetch('/api/students')` implémentent deux chemins différents pour les mêmes données.

### 4.2 Teachers (Enseignants)

```
[Server Component]
/admin/teachers/page.tsx
  → prisma.teacher.findMany() [direct DB, paginé]
  → <TeachersListClient teachers total search />

[Client Component]
TeachersListClient.tsx → affichage liste, navigation
TeacherDetailClient.tsx → détail, toggle actif

[Teacher Side]
/teacher/dashboard/page.tsx → prisma direct
→ <TeacherDashboardClient />

[API Routes]
GET  /api/teachers → liste
POST /api/teachers → création (+ User)
```

### 4.3 Parents

```
[Server Component]
/admin/parents/page.tsx
  → prisma.parent.findMany() [direct DB, avec childrenLinks]
  → <ParentsListClient />

[Parent Dashboard]
/parent/dashboard/page.tsx → prisma direct
→ <ParentDashboardClient />

/parent/child/[id]/page.tsx → prisma direct
→ <ParentChildProfileClient /> (603 lignes, très dense)

[API Routes]
GET  /api/parents → liste
POST /api/parents → création
GET  /api/parents/[id] → détail (20 lignes seulement)
DELETE /api/parents/[id] → suppression
POST /api/parent/link → liaison parent-enfant
```

### 4.4 Groups (Groupes)

```
[Server Component]
/admin/groups/page.tsx
  → prisma.group.findMany() [direct DB, filtres status/level/teacher]
  → <GroupsListClient groups total page teachers />

/admin/groups/[id]/page.tsx → prisma direct
→ <GroupDetailClient />

[Teacher Side]
/teacher/groups/page.tsx → prisma direct
→ <TeacherGroupsListClient />
/teacher/groups/[id]/page.tsx → prisma direct
→ <TeacherGroupDetailClient />

[API Routes]
GET  /api/groups → liste (avec teacher info)
POST /api/groups → création
GET  /api/groups/[id] → détail
PATCH /api/groups/[id] → modification
DELETE /api/groups/[id] → suppression
```

### 4.5 Attendance (Présences)

```
[Admin Side — Client Component ⚠️]
/admin/attendance/page.tsx
  → useEffect: GET /api/groups (charger les groupes)
  → Bouton: GET /api/attendance/export?groupId=&dateFrom=&dateTo= (CSV)
  (Pas de fetch direct Prisma ici — tout passe par API)

[Teacher Side — Client Component]
/teacher/attendance/page.tsx
  → useEffect: GET /api/groups, GET /api/attendance?groupId=&date=
  → POST /api/attendance (soumettre présences)

[Student Side]
/student/attendance/page.tsx (Server)
  → prisma.attendance.findMany() [direct DB]
  → <StudentAttendanceClient />

[Parent Side]
ParentProfileAttendance.tsx (Client)
  → useEffect: GET /api/attendance?studentId=

[API Routes]
GET  /api/attendance → filtre par rôle (ADMIN/TEACHER/PARENT/STUDENT)
POST /api/attendance → création batch (records[])
GET  /api/attendance/export → export CSV
```

**Doublon de logique** : La gestion de présences côté admin est uniquement export CSV. La prise de présences se fait côté Teacher. Le GET `/api/attendance` contient 4 branches de logique selon le rôle — complexe mais justifié.

---

## 5. POINTS DE DOULEUR

### 5.1 🔴 Fichiers trop longs (> 400 lignes)

| Fichier | Lignes | Problème |
|---|---|---|
| `app/admin/super/page.tsx` | **1425** | Monolithe client : gère écoles, users, demandes, broadcast, audit, stats. À découper en sous-composants |
| `components/LandingPage.tsx` | 755 | Page marketing tout-en-un |
| `components/superadmin/AuditLogClient.tsx` | 581 | Tableau d'audit avec filtres complexes |
| `components/parent/ParentChildProfileClient.tsx` | 603 | Profil enfant (mémorisation + présences + évals) |
| `app/teacher/evaluations/page.tsx` | 519 | "FIXED" dans le commentaire — client component |
| `app/admin/students/[id]/edit/page.tsx` | 542 | Formulaire client trop dense |
| `app/admin/students/new/page.tsx` | 504 | Formulaire création tout-en-client |
| `components/admin/CertificateTemplateEditor.tsx` | 570 | Éditeur de template complexe |
| `components/admin/GroupsListClient.tsx` | 507 | Liste groupes avec filtres avancés |
| `components/admin/StudentsListClient.tsx` | 522 | Probablement inutilisée |
| `components/admin/AdminSettingsClient.tsx` | 491 | Settings tout-en-un |
| `components/admin/CertificatePrint.tsx` | 467 | Rendu PDF complexe |
| `components/admin/StudentTableClient.tsx` | 432 | Tableau élèves avec logique filter/sort |

### 5.2 🔴 Double système I18n (architectural)

- **55+ fichiers** utilisent `useLanguage()` + dictionnaire custom inline
- **`next-intl`** installé, configuré, `messages/*.json` remplis → mais **zéro usage**
- Les traductions sont **re-définies localement** dans chaque composant (ex: "Enregistrer" répété ~20 fois)
- **Coût** : bundle plus lourd, incohérences possibles, maintenance double

### 5.3 ⚠️ Pages "use client" qui font du fetch dans useEffect

Plusieurs pages Next.js sont marquées `"use client"` et chargent leurs données via `useEffect + fetch('/api/...')` alors qu'elles pourraient être des Server Components avec fetch Prisma direct.

| Page | Impact |
|---|---|
| `admin/attendance/page.tsx` | Waterfall requête : page → mount → fetch groups → display |
| `teacher/evaluations/page.tsx` | Idem |
| `admin/super/page.tsx` | Plusieurs useEffect en cascade |
| `admin/students/[id]/edit/page.tsx` | useEffect pour charger l'élève, reset() dans useEffect |

### 5.4 ⚠️ Props drilling modéré

Dans plusieurs endroits, les props sont nombreuses mais pas excessivement drillées (les composants font 1 niveau max). Exemple typique :

```tsx
// Page → Client : 7 props
<GroupsListClient
  groups={groups}
  total={total}
  page={page}
  totalPages={totalPages}
  search={search}
  statusFilter={statusFilter}
  levelFilter={levelFilter}
  teacherId={teacherId}
  teachers={teachers}
/>
```
Acceptable pour Next.js 15 (pas de Context Pollution). Pas critique.

### 5.5 ⚠️ Répétition du pattern d'authentification

Chaque route API répète :
```typescript
const session = await auth()
if (!session?.user || !["ADMIN"].includes(session.user.role)) {
  return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
}
const schoolId = session.user.schoolId
```
Ce pattern est présent dans **~25 fichiers API**. Il manque un helper `withAuth(roles, handler)`.

### 5.6 ⚠️ Incohérence status HTTP (401 vs 403)

- `/api/students/[id]/toggle/route.ts` → retourne 403 pour non-autorisé
- `/api/students/[id]/status/route.ts` → retourne 401 pour non-autorisé
- Convention non standardisée entre les routes

### 5.7 ⚠️ `StudentsListClient.tsx` possiblement orphelin

`StudentsListClient.tsx` (522 lignes) n'est jamais importé par `admin/students/page.tsx`. Ce dernier utilise `StudentTableClient.tsx`. Vérifier si ce fichier est encore utilisé ou s'il peut être supprimé.

### 5.8 ⚠️ `next-intl` installé inutilement

`next-intl` (~80kb gzip) est dans les dépendances production mais n'est pas utilisé par l'application. Soit le migrer (remplacer `LanguageContext`), soit le supprimer pour alléger le bundle.

### 5.9 ℹ️ `jobs/workers.ts` référencé mais absent dans `src/`

Le script `workers:start → tsx jobs/workers.ts` est dans `package.json` mais le dossier `jobs/` n'existe pas dans `src/`. Vérifier si ces workers BullMQ/Redis sont implémentés ailleurs ou prévus.

---

## 6. SCHÉMA DB — MODÈLES PRISMA

25 modèles répartis en 8 groupes :

| Groupe | Modèles |
|---|---|
| École | `School`, `SchoolRequest` |
| Utilisateurs | `User`, `Session`, `Admin`, `Teacher`, `Parent`, `Student`, `ParentStudentLink` |
| Groupes | `Group`, `GroupAnnouncement` |
| Mémorisation | `Surah`, `MemorizationProgress`, `StatusHistory`, `MemorizedSurah` |
| Évaluations | `Evaluation` |
| Présences | `Attendance` |
| Badges | `Badge`, `StudentBadge`, `StarsLog`, `StudentStats` |
| Communication | `Announcement`, `Notification`, `DirectMessage`, `Broadcast` |
| Système | `ErrorLog`, `AuditLog`, `Exam`, `Feedback` |

**Architecture** : Row-Level Isolation par `schoolId` sur School → Users → tout le reste. Solide.

---

## 7. RÉSUMÉ EXÉCUTIF

### Ce qui fonctionne bien ✅
- Architecture multi-tenant propre (isolation par schoolId)
- Séparation Server/Client Components globalement respectée
- Auth NextAuth v5 avec JWT bien configuré
- Prisma schema complet et cohérent
- Pattern page Server → composant Client bien appliqué dans 80% des cas
- Middleware de protection par rôle centralisé et clair

### Ce qui doit être corrigé 🔴

| Priorité | Problème | Impact |
|---|---|---|
| 🔴 P1 | `admin/super/page.tsx` 1425 lignes monolithique | Maintenabilité zéro |
| 🔴 P1 | Double système I18n (LanguageContext + next-intl inutilisé) | Bundle inutile, incohérence |
| 🔴 P2 | `TeachersListI18n.tsx` fichier mort | Confusion |
| 🔴 P2 | `/api/students/[id]/status` doublon de `/toggle` | Bug potential (comportements différents) |
| 🟡 P3 | Traductions inline répétées dans ~40 composants | DRY violation |
| 🟡 P3 | Wrappers `StatsChartsI18n` + `CertificateTemplateEditorI18n` | Layer inutile |
| 🟡 P3 | `StudentsListClient.tsx` probablement orphelin (522 lignes) | Dead code potentiel |
| 🟡 P3 | 5+ pages `"use client"` qui devraient être Server | Performance |
| 🟡 P4 | Pattern auth répété dans 25 routes API | DRY violation |
| 🟡 P4 | Incohérence 401 vs 403 dans les routes API | Standard API |
| 🟢 P5 | `jobs/workers.ts` référencé mais manquant | Risque runtime |

---

*Rapport généré automatiquement — Ne pas modifier manuellement*
