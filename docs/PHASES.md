# TAHFIDZ SaaS — Récapitulatif complet des phases

## Architecture

```
tahfidz.app               → Marketing / super-admin
al-nour.tahfidz.app       → Madrassa Al-Nour   (tenant A — plan PRO)
al-amin.tahfidz.app       → Institut Al-Amin   (tenant B — plan STARTER)
```

### Stack technique

| Couche       | Technologie              |
|---|---|
| Framework    | Next.js 15 (App Router)  |
| Auth         | NextAuth v5 (JWT)        |
| ORM          | Prisma 5 + PostgreSQL    |
| Validation   | Zod                      |
| Jobs         | BullMQ + Redis (Upstash) |
| Tests        | Vitest + vitest-mock-extended |
| Deploy       | Vercel (Next.js) + Railway (DB + Workers) |
| CI/CD        | GitHub Actions           |

---

## Phase 1 — Schéma & fondations

| Fichier | Contenu |
|---|---|
| `schema.prisma` | 14 modèles, 8 enums, isolation par schoolId |
| `lib/prisma-tenant.ts` | Extension Prisma : inject schoolId sur tout |
| `prisma/seed.ts` | 2 écoles démo, élèves, présences, paiements |
| `middleware.ts` | Résolution tenant slug → schoolId |
| `services/school.service.ts` | CRUD tenants, gestion des plans |
| `services/student.service.ts` | CRUD élèves, pagination, stats |
| `services/memorization.service.ts` | Évaluations, progression, dashboard |

## Phase 2 — Authentification

| Fichier | Contenu |
|---|---|
| `lib/auth/auth.config.ts` | NextAuth Credentials provider multi-tenant |
| `lib/auth/index.ts` | Export auth, signIn, signOut + augmentation types |
| `lib/auth/rbac.ts` | Hiérarchie de rôles, guards API et Server Components |

Points clés :
- Le JWT embarque `{ schoolId, schoolSlug, userId, role }` — aucun appel DB sur les routes protégées
- `authorize()` cherche l'utilisateur via `(schoolId, email)` — deux écoles peuvent avoir le même email
- Session stateless (JWT), durée 8h
- `requireRole(request, ["TEACHER"])` retourne la session ou lève une `Response 403`

## Phase 3 — API REST

| Route | Méthodes | Rôles |
|---|---|---|
| `/api/v1/students` | GET, POST | SCHOOL_ADMIN, TEACHER |
| `/api/v1/students/[id]` | GET, PATCH | SCHOOL_ADMIN, TEACHER, PARENT |
| `/api/v1/memorization` | GET, POST | SCHOOL_ADMIN, TEACHER |
| `/api/v1/attendance` | GET, POST | SCHOOL_ADMIN, TEACHER |
| `/api/v1/payments` | GET, POST | SCHOOL_ADMIN |

Chaque handler : `requireRole()` → `new XxxService(session.user.schoolId)` → response JSON

## Phase 4 — Services métier avancés

| Service | Fonctionnalités clés |
|---|---|
| `AttendanceService` | Saisie en lot, rapport mensuel, absences consécutives |
| `PaymentService` | Enregistrement, solde dû, impayés, données reçu, rapport mensuel |

## Phase 5 — Jobs asynchrones & audit

| Fichier | Contenu |
|---|---|
| `jobs/queues.ts` | BullMQ : queues absence-alerts, payment-reminders, weekly-report |
| `lib/audit.ts` | Extension Prisma : AuditLog automatique sur modèles sensibles |

Jobs :
- `enqueueAbsenceAlert()` — délai 5 min, 3 tentatives, WhatsApp + email
- `enqueuePaymentReminder()` — délai configurable J+3/J+7/J+30
- `scheduleWeeklyReport()` — cron lundi 7h, résumé enseignants

## Phase 6 — Dashboard, tests, CI/CD

| Fichier | Contenu |
|---|---|
| `app/(tenant)/dashboard/page.tsx` | Server Component avec Suspense par widget |
| `tests/services.test.ts` | Vitest : StudentService, MemorizationService, isolation tenant |
| `.github/workflows/ci.yml` | Lint → tests → staging → production avec migrations auto |

---

## Démarrage complet

```bash
# 1. Cloner et installer
git clone https://github.com/votre-org/tahfidz
cd tahfidz && pnpm install

# 2. Variables d'environnement
cp .env.example .env
# DATABASE_URL=postgresql://user:pass@localhost:5432/tahfidz
# NEXTAUTH_SECRET=<openssl rand -base64 32>
# NEXTAUTH_URL=http://localhost:3000
# NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
# REDIS_URL=redis://localhost:6379
# INTERNAL_API_SECRET=changeme

# 3. Base de données
npx prisma migrate dev --name init
npx prisma db seed

# 4. Développement
pnpm dev

# 5. Tests
pnpm test

# 6. Workers (terminal séparé)
node dist/workers/start.js
```

## Comptes de test

| Email | Mot de passe | École | Rôle |
|---|---|---|---|
| admin@al-nour.tahfidz.app | Admin@1234 | Al-Nour | SCHOOL_ADMIN |
| admin@al-amin.tahfidz.app | Admin@1234 | Al-Amin | SCHOOL_ADMIN |
| ustadh.ahmad@al-nour.tahfidz.app | Teacher@1234 | Al-Nour | TEACHER |

---

## Sécurité — matrice des protections

| Risque | Mitigation |
|---|---|
| Cross-tenant data leak | `tenantClient` : `WHERE schoolId = ?` sur toute opération |
| Auth token forgery | JWT signé `NEXTAUTH_SECRET`, TTL 8h |
| Escalade de privilèges | `requireRole()` vérifie rôle ET schoolId header |
| Injection SQL | Prisma ORM — pas de requêtes brutes |
| Paiements corrompus | `Decimal` Prisma, jamais `Float` natif |
| Audit effaçable | `AuditLog` : aucun `update`/`delete` applicatif autorisé |
| Mot de passe en clair | bcrypt (salt 10) |
| Données sensibles en JWT | Jamais `hashedPassword` ou données PII dans le token |

---

## Roadmap Phase 7+

- [ ] **Rapport PDF** — `@react-pdf/renderer` pour reçus et bulletins de mémorisation
- [ ] **App mobile** — Expo + tRPC (réutilise les services existants)
- [ ] **Multi-langue** — `next-intl` (arabe, français, anglais)
- [ ] **Tableau Kanban mémorisation** — drag-and-drop des sourates par élève
- [ ] **Export données** — CSV/Excel (RGPD : droit à la portabilité)
- [ ] **Webhooks** — notifier les systèmes tiers lors d'un paiement confirmé
- [ ] **Super-admin dashboard** — métriques cross-écoles (MRR, churn, usage)
