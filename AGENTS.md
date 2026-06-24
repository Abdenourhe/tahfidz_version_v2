# TAHFIDZ — Guide de navigation pour agents IA

> Ce fichier est destiné aux agents de codage IA. Il résume l'architecture, les conventions et les commandes essentielles du projet. Le lecteur est supposé ne rien savoir du projet au préalable.

---

## 1. Vue d'ensemble

**TAHFIDZ** est une plateforme SaaS multi-tenant de gestion et de suivi de la mémorisation du Coran pour des écoles (madrassas / instituts).

Chaque école dispose de son propre sous-domaine (ex: `al-nour.tahfidz.app`). L'isolation des données est **logique** : base de données PostgreSQL partagée avec injection automatique du `schoolId` sur chaque requête Prisma.

Rôles utilisateurs : `SUPERADMIN`, `ADMIN`, `TEACHER`, `PARENT`, `STUDENT`.

Langues supportées : **français** (par défaut), **anglais**, **arabe** (RTL).

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript 5.6 (strict) |
| React | 18.3 |
| Auth | NextAuth.js v5 (JWT, stratégie Credentials) |
| ORM | Prisma 5.22 |
| Base de données | PostgreSQL 16+ |
| Cache / Queue | Redis 7 (Docker local) |
| Styling | Tailwind CSS 3.4 + `cn()` (clsx + tailwind-merge) |
| Thèmes | `next-themes` (dark mode via `class`) |
| UI | Composants custom + Lucide React + Recharts |
| i18n | Dictionnaire maison (`src/lib/i18n/translations.ts`) |
| Email | SendGrid API + Nodemailer |
| PDF | jspdf + html2canvas |
| QR Code | `qrcode.react` |
| Tests | Vitest 2.1 (config implicite) + Testing Library |
| CI/CD | GitHub Actions (lint + type-check + tests) |
| Déploiement | Vercel (recommandé) |

---

## 3. Organisation du code

```
prisma/
  schema.prisma          # ~30 modèles, ~15 enums, commentaires en français
  seed.ts                # Données de démo : 114 sourates + 2 écoles
  migrations/            # Générées par Prisma Migrate

src/
  app/                   # Next.js App Router
    page.tsx             # Landing page marketing
    layout.tsx           # Root layout (fonts, Providers, script RTL)
    globals.css          # Tailwind + variables CSS
    not-found.tsx        # 404

    # Portails par rôle (routes protégées par middleware.ts)
    admin/               # Dashboard, élèves, enseignants, parents, groupes,
                         # évaluations, présences, annonces, paramètres, super
    teacher/             # Dashboard, élèves, évaluations, groupes, halaqa
    student/             # Dashboard, mémorisation, progression, présences, badges
    parent/              # Dashboard, lien enfant, halaqa, notifications
    superadmin/          # Audit, profil

    api/                 # Route handlers Next.js
      auth/[...nextauth]/route.ts   # NextAuth v5 handlers
      # CRUD REST par domaine : students, teachers, parents, groups,
      # evaluations, attendance, memorization, notifications, etc.

  components/
    admin/               # Composants spécifiques au portail admin
    teacher/             # Composants spécifiques au portail enseignant
    student/             # Composants spécifiques au portail élève
    parent/              # Composants spécifiques au portail parent
    superadmin/          # Composants superadmin
    layout/              # Sidebars, bottom navs, top bars (par rôle)
    landing/             # Landing page
    ui/                  # Composants UI partagés
    shared/              # Modals & composants transversaux

  contexts/
    LanguageContext.tsx  # Gestion de la locale (fr/en/ar) + direction RTL

  hooks/
    useMobile.ts         # Détection mobile via breakpoint

  lib/
    prisma.ts            # Singleton PrismaClient (log dev en local)
    prisma-tenant.ts     # Extension Prisma injectant schoolId automatiquement
    utils.ts             # `cn()`, helpers dates, scores, grades, statuts
    validations/         # Schémas Zod (auth, etc.)
    i18n/translations.ts # Dictionnaire trilingue (~2000 clés)
    email.ts / mail.ts   # Envoi d'emails
    audit.ts             # Helpers de journalisation d'audit
    badges.ts            # Logique de calcul des badges
    bigbluebutton.ts     # Intégration Halaqa Online (BBB)

  auth.ts                # Configuration NextAuth v5 (Credentials, JWT, callbacks)

middleware.ts            # Vérification session + RBAC + redirections
```

### Conventions de nommage

- **Fichiers** : `kebab-case` pour les dossiers de routes ; `PascalCase` pour les composants React ; `camelCase` pour les utilitaires.
- **Exports** : Préférer les exports nommés pour les helpers ; `default` uniquement pour les pages Next.js et les composants pages.
- **Commentaires** : Rédigés en **français** dans tout le codebase (sauf les clés de traduction en anglais).
- **Types** : TypeScript strict activé. `any` toléré (règle ESLint désactivée) mais à éviter dans le nouveau code.

---

## 4. Commandes essentielles

### Développement local

```bash
# 1. Base de données (PostgreSQL + Redis)
docker compose up -d

# 2. Dépendances
npm install        # ou pnpm install

# 3. Variables d'environnement
cp .env.example .env
# Remplir DATABASE_URL, AUTH_SECRET, etc.

# 4. Base de données
npm run db:migrate   # Crée/applique les migrations
npm run db:seed      # Insère les données de démo
npm run db:studio    # Interface Prisma Studio (http://localhost:5555)

# 5. Lancer le serveur de développement
npm run dev          # http://localhost:3000
```

### Build & qualité

```bash
npm run build        # Build production (inclut migrate deploy + prisma generate + next build)
npm run start        # Démarrage en production (après build)
npm run lint         # ESLint (Next.js core-web-vitals + typescript)
npm run type-check   # tsc --noEmit
npm run test         # Vitest run
npm run test:watch   # Vitest en mode watch
```

### Base de données

```bash
npm run db:generate  # Génère le client Prisma
npm run db:push      # Push le schema (dev uniquement)
npm run db:reset     # ⚠️ Reset total + re-seed
npm run workers:start # Lance les workers BullMQ (tsx jobs/workers.ts)
```

---

## 5. Architecture multi-tenant

### Isolation des données

Chaque table métier porte un `schoolId` indexé. Le `tenantPrisma(schoolId)` (dans `src/lib/prisma-tenant.ts`) est une extension Prisma qui injecte automatiquement ce `schoolId` dans toutes les opérations CRUD.

```
Request → middleware.ts (auth + role check)
        → Server Component / Route Handler
        → Service / Direct Prisma call
        → tenantPrisma(schoolId)   ← injection automatique
        → Prisma → PostgreSQL
```

Tables protégées par `tenantPrisma` : `user`, `group`, `announcement`, `notification`, `auditLog`, `exam`, `directMessage`, `badge`.

Tables globales (pas de `schoolId`) : `surah` (114 sourates de référence), `error_log`.

### Authentification

- **NextAuth v5** avec stratégie JWT (`maxAge: 8h`).
- Login par email + mot de passe + identifiant d'école (`schoolSlug`).
- Le `SUPERADMIN` fait un bypass (pas besoin de `schoolSlug`).
- Le token JWT contient : `id`, `role`, `schoolId`, `schoolSlug`.
- La session exposée côté client contient ces mêmes champs.

### Middleware (`middleware.ts`)

- Protège toutes les routes sauf `PUBLIC_PATHS` (`/`, `/login`, `/register-school`, `/api/auth`, etc.).
- Redirige vers `/login` si pas de session.
- Vérifie le rôle : `ROLE_ROUTES` associe un préfixe de route aux rôles autorisés.
- Redirige vers le dashboard du rôle si accès refusé.

---

## 6. Modèle de données (aperçu)

Voir `prisma/schema.prisma` pour le détail complet.

**Racine** : `School` (tenant) → `User` (compte, `schoolId + email` unique).

**Profils** : `Admin`, `Teacher`, `Parent`, `Student` (1:1 avec `User`).

**Pédagogie** :
- `Surah` — 114 sourates (table globale)
- `MemorizationProgress` — progression d'un élève sur une sourate
- `MemorizedSurah` — sourates validées
- `Evaluation` — évaluation détaillée (mémorisation, tajwîd, fluidité, makharij)
- `StatusHistory` — historique des changements de statut
- `DailyProgressLog` — carnet quotidien (hifz, muraja, talqin, cours scientifique)

**Organisation** : `Group` (classe) ↔ `Student` via `groupId`.

**Présences** : `Attendance` (enseignant) + `ParentAttendance` (parent).

**Gamification** : `Badge` + `StudentBadge` + `StarsLog`.

**Communication** : `Announcement`, `Notification`, `DirectMessage`, `Broadcast`.

**Examens & Halaqa** : `Exam`, `HalaqaSession` (BigBlueButton), `HalaqaEvaluation`.

**Traçabilité** : `AuditLog` (immuable — pas d'update/delete applicatif).

---

## 7. Stratégie de tests

- **Framework** : Vitest 2.1 avec `@vitejs/plugin-react`, `happy-dom`, `@testing-library/react`.
- **Couverture** : `@vitest/coverage-v8`.
- **Commandes** : `npm run test` (run), `npm run test:watch` (watch).
- **État actuel** : Vitest est configuré dans `package.json` mais le projet compte peu de fichiers de test. Les tests sont à créer au besoin.
- **CI** : GitHub Actions lance `npm run lint`, `npm run type-check`, puis `npm run test -- --coverage`.

---

## 8. Considérations de sécurité

| Risque | Mitigation |
|--------|------------|
| Fuite inter-tenant | `tenantPrisma` injecte `schoolId` sur toute opération |
| Slug squatting | Regex de validation + unicité en base |
| Escalade de privilèges | Enum `UserRole` + vérification dans chaque service + middleware |
| Données financières | `Decimal` Prisma (pas de float natif) — actuellement géré via `Float`/`Int` dans le modèle |
| Journal effaçable | `AuditLog` : pas d'update/delete applicatif |
| Mots de passe | `bcryptjs` (hash côté création de compte) |
| XSS / CSRF | Géré par Next.js et NextAuth v5 |

### Points d'attention pour le code

- Toujours utiliser `tenantPrisma(schoolId)` (ou vérifier `schoolId` manuellement) dans les API routes.
- Ne jamais faire confiance au `schoolId` côté client ; le lire depuis la session JWT côté serveur.
- Les super-routes `/admin/super` et `/api/admin/schools` sont réservées à `SUPERADMIN`.

---

## 9. Configuration clé

### Variables d'environnement (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` / `POSTGRES_URL` | PostgreSQL (pooling) |
| `POSTGRES_URL_NON_POOLING` | Connexion directe (migrations) |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Secret NextAuth (min 32 caractères) |
| `NEXTAUTH_URL` | URL publique de l'app |
| `AUTH_TRUST_HOST` | `true` pour le dev local |
| `SENDGRID_API_KEY` | Clé API SendGrid (emails transactionnels) |
| `SMTP_FROM` | Expéditeur vérifié SendGrid |
| `NEXT_PUBLIC_APP_URL` | URL publique côté client |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Domaine racine pour la résolution des tenants |

### Next.js (`next.config.ts`)

- `serverExternalPackages`: `@prisma/client`, `bcryptjs`
- `images.unoptimized: true`
- `typescript.ignoreBuildErrors: true` et `eslint.ignoreDuringBuilds: true` (tolérance en build)

### TypeScript (`tsconfig.json`)

- `strict: true`, `target: ES2017`, `moduleResolution: bundler`
- Alias `~@/*` → `./src/*`
- Les fichiers de test (`*.test.ts`, `*.test.tsx`) et le seed Prisma sont exclus du build.

---

## 10. Déploiement

### Recommandé : Vercel

1. Pousser sur GitHub.
2. Importer le repo dans Vercel.
3. Configurer les variables d'environnement (voir `.env.example`).
4. Le build Vercel exécute automatiquement `prisma migrate deploy && prisma generate && next build`.
5. Après le premier déploiement : `npx prisma migrate deploy && npx prisma db seed`.

### Local Docker (dev)

`docker compose up -d` lance PostgreSQL 16 + Redis 7.

---

## 11. Comptes de démo (après seed)

| Rôle | Email (ex: école `al-nour`) | Mot de passe |
|------|----------------------------|--------------|
| Admin | `admin@al-nour.tahfidz.app` | `Admin@1234` |
| Enseignant | `ustadh.ahmad@al-nour.tahfidz.app` | `Teacher@1234` |
| Parent | `parent@al-nour.tahfidz.app` | `Parent@1234` |
| Élève | `yusuf.student@al-nour.tahfidz.app` | `Student@1234` |

Le SUPERADMIN peut se connecter avec n'importe quel email de super-admin sans `schoolSlug`.

---

## 12. Notes pour les agents IA

- **Langue** : Les commentaires et la documentation interne sont en **français**. Préserver cette convention.
- **Multi-tenant** : Avant toute requête Prisma dans une API route, vérifier que `schoolId` est bien présent (via `req.auth.user.schoolId` ou `session.user.schoolId`). Utiliser `tenantPrisma` quand c'est pertinent.
- **RBAC** : Le middleware gère les redirections, mais les API routes doivent aussi vérifier le rôle côté serveur si l'action est sensible.
- **i18n** : Utiliser le dictionnaire `translations` dans `src/lib/i18n/translations.ts` pour tout texte affiché. Ne pas hardcoder de labels en français dans l'UI sans les passer par le système de traduction.
- **Tailwind** : Utiliser la fonction `cn()` pour composer les classes conditionnelles.
- **Couleurs custom** : `tahfidz-green`, `tahfidz-gold`, `tahfidz-purple` et leurs variantes `-light`.
- **Dark mode** : Géré par `next-themes` avec `attribute="class"`. Les composants doivent supporter `dark:`.
- **RTL** : La langue arabe bascule automatiquement la direction. Le script d'initialisation dans `layout.tsx` s'exécute avant hydration.
- **Plans tarifaires** : Les quotas techniques (max élèves, enseignants, Halaqas, durée) sont la source unique de vérité dans `src/lib/halaqa-quota.ts` (`PLAN_CONFIG` / `PLANS`). L'affichage marketing (nom, tranche, prix, features, devise) est lu depuis la configuration landing (`siteConfig` key `landing`, section `pricing`) éditable dans `/admin/super/site-config`. La landing page, le formulaire d'inscription d'école et le panneau SuperAdmin récupèrent ces plans via `/api/site-config/landing/plans`.
- **README.md** : Le fichier racine est intentionnellement minimal (titre + mention "Projet privé"). Ne pas y réintroduire de détails techniques, comptes de démo ou architecture. La documentation utilisateur détaillée reste dans [`PRESENTATION_UTILISATEUR_TAHFIDZ.md`](./PRESENTATION_UTILISATEUR_TAHFIDZ.md) et la documentation technique interne dans [`docs/`](./docs/).
