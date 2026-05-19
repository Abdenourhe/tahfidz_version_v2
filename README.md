# TAHFIDZ SaaS — Phase 1 : Fondations multi-tenant

## Architecture

```
tahfidz.app              → Marketing / Super-admin
al-nour.tahfidz.app      → Madrassa Al-Nour   (tenant A)
al-amin.tahfidz.app      → Institut Al-Amin   (tenant B)
```

### Isolation des données

L'isolation est **logique** (shared database, shared schema).  
Chaque table métier porte un `schoolId` indexé.  
Le `tenantClient` injecte ce `schoolId` automatiquement dans **toutes** les requêtes Prisma (lecture, écriture, suppression).

```
Request → Middleware (slug → schoolId)
        → Server Component / Route Handler
        → new StudentService(schoolId)
        → tenantClient(schoolId)            ← injection automatique
        → Prisma → PostgreSQL
```

---

## Livrables Phase 1

| Fichier | Rôle |
|---|---|
| `schema.prisma` | Modèle de données complet (14 modèles, 8 enums) |
| `lib/prisma-tenant.ts` | Client Prisma tenant-aware (extension `$allModels`) |
| `prisma/seed.ts` | Seed de démo : 2 écoles, élèves, présences, paiements |
| `middleware.ts` | Résolution du tenant via sous-domaine |
| `services/school.service.ts` | CRUD tenants + gestion des plans |
| `services/student.service.ts` | CRUD élèves + pagination + stats |
| `services/memorization.service.ts` | Évaluations + progression + tableau de bord |

---

## Démarrage rapide

```bash
# 1. Variables d'environnement
cp .env.example .env
# DATABASE_URL=postgresql://user:pass@localhost:5432/tahfidz
# NEXT_PUBLIC_ROOT_DOMAIN=tahfidz.app
# INTERNAL_API_SECRET=changeme

# 2. Migrations
npx prisma migrate dev --name init

# 3. Seed
npx prisma db seed

# 4. Démarrer
pnpm dev
```

---

## Phase 2 — Prochaines étapes

- [ ] **Auth** : NextAuth v5 avec session multi-tenant (JWT inclut `schoolId` + `role`)
- [ ] **API REST** : Route handlers `/api/[version]/students`, `/api/[version]/memorization`
- [ ] **RBAC** : Middleware de vérification des rôles (`SCHOOL_ADMIN`, `TEACHER`, `PARENT`)
- [ ] **AttendanceService** : Saisie en lot, rapport mensuel PDF
- [ ] **PaymentService** : Génération de reçus, relances automatiques
- [ ] **Dashboard** : Server Components avec `Suspense` par widget
- [ ] **Notifications** : Queue BullMQ → e-mail / WhatsApp
- [ ] **Audit** : Middleware Prisma d'écriture automatique dans `AuditLog`
- [ ] **Tests** : Vitest + `prisma-mock` pour les services, Playwright pour les flows critiques
- [ ] **CI/CD** : GitHub Actions → migrations auto en staging, deploy Vercel + Railway

---

## Modèle de données — Résumé

### Tenant / Auth
- `School` — tenant racine, 1 ligne = 1 école abonnée
- `User` — compte unique par école (`schoolId + email` unique)

### Personnes
- `Student` — élève, lié optionnellement à un `User`
- `Teacher` — enseignant, toujours lié à un `User`

### Organisation
- `Class` — groupe d'élèves pour une année scolaire
- `Enrollment` — inscriptions élève ↔ classe

### Référentiel coranique
- `SurahRef` — 114 sourates, table globale partagée (pas de `schoolId`)

### Pédagogie
- `MemorizationRecord` — résultat d'évaluation (sourate, versets, note, statut)
- `RecitationSession` — session orale avec erreurs tajwîd structurées

### Suivi
- `Attendance` — présence quotidienne par élève × classe

### Financier
- `Fee` — grille tarifaire de l'école
- `Payment` — paiement d'un élève pour un tarif donné

### Communication & Traçabilité
- `Notification` — messages internes (absence, note, annonce)
- `AuditLog` — journal immuable de toutes les modifications

---

## Sécurité

| Risque | Mitigation |
|---|---|
| Cross-tenant data leak | `tenantClient` injecte `schoolId` sur toute opération |
| Slug squatting | Validation regex + unicité en base |
| Escalade de privilèges | `Role` enum + vérification dans chaque service |
| Données financières | `Decimal` Prisma, jamais `Float` natif |
| Journal effaçable | `AuditLog` : pas de `update`/`delete` applicatif |
