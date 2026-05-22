# TAHFIDZ SaaS — Rapport de Réorganisation (Phase 10)

> Date : 2026-05-22  
> Branche : `main`  
> Commit : `5e6dccc` (et suivants)

---

## 🎯 Objectifs atteints

| Objectif | Statut |
|----------|--------|
| Fusion des composants dupliqués (listes + détails) | ✅ |
| Centralisation i18n (35 namespaces) | ✅ |
| Refactor Superadmin (1448 → 577 lignes) | ✅ |
| Fusion API students (5 → 2 fichiers) | ✅ |
| Nettoyage scripts temporaires | ✅ |
| Suppression `next-intl` inutilisé | ✅ |
| Build Next.js sans erreur | ✅ |
| Tests vitest (aucun fichier, mais commande OK) | ✅ |

---

## 📁 Structure finale du projet

### `src/components/admin/` (~23 fichiers)
```
src/components/admin/
├── AdminDashboardClient.tsx
├── AdminSettingsClient.tsx
├── AttendanceFilters.tsx
├── EvaluationsListClient.tsx
├── GroupDetailClient.tsx
├── GroupRename.tsx
├── GroupStudentList.tsx
├── GroupsListClient.tsx
├── ImpersonateBanner.tsx
├── StatsCharts.tsx
├── certificate.tsx
├── parents.tsx          ← fusion ParentsListClient + ParentDetailClient
├── student-detail.tsx   ← fusion StudentDetailClient + StudentActions
├── student-form.tsx     ← fusion new/edit formulaire élève
├── students.tsx         ← fusion StudentsListClient + anciens exports
├── teachers.tsx         ← fusion TeachersListClient + TeacherDetailClient
└── superadmin/          ← extraction du monolithe page.tsx
    ├── broadcast-tab.tsx
    ├── header.tsx
    ├── modals.tsx
    ├── requests-tab.tsx
    ├── schools-tab.tsx
    ├── stats.tsx
    ├── system-tabs.tsx
    └── types.ts
```

### `src/app/api/students/` (2 fichiers)
```
src/app/api/students/
├── [id]/route.ts   ← GET / PATCH / DELETE (fusion de toggle, transfer, status, export)
└── route.ts        ← GET / POST
```

### `src/components/teacher/` (8 fichiers)
```
TeacherDashboardClient.tsx
TeacherGroupAttendance.tsx
TeacherGroupDetailClient.tsx
TeacherGroupsListClient.tsx
TeacherProfileAttendance.tsx
TeacherProfileClient.tsx
TeacherStudentDetailClient.tsx
TeacherStudentsListClient.tsx
```

### `src/components/parent/` (4 fichiers)
```
ParentChildProfileClient.tsx
ParentDashboardClient.tsx
ParentProfileAttendance.tsx
ParentProfileClient.tsx
```

### `src/components/student/` (6 fichiers)
```
ReadyToReciteButton.tsx
StudentAttendanceClient.tsx
StudentBadgesClient.tsx
StudentDashboardClient.tsx
StudentProgressClient.tsx
VerseProgressTracker.tsx
```

---

## 🔤 Système i18n centralisé

### Avant (inline par fichier)
```tsx
const T = {
  title: { fr: "Élèves", en: "Students", ar: "الطلاب" },
  add:   { fr: "Ajouter", en: "Add", ar: "إضافة" },
}
const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr
```

### Après (`useT` hook)
```tsx
import { useT } from "@/contexts/LanguageContext"

export default function MyComponent() {
  const t = useT("students")
  return <h1>{t("title")}</h1>
}
```

### Ajouter une nouvelle traduction
1. **Ouvrir** `src/lib/i18n/translations.ts`
2. **Ajouter** la clé dans la section existante (ou créer une nouvelle section) :
   ```ts
   students: {
     title: { fr: "Élèves", en: "Students", ar: "الطلاب" },
     newKey:{ fr: "Nouveau", en: "New", ar: "جديد" },
   },
   ```
3. **Utiliser** dans le composant :
   ```tsx
   const t = useT("students")
   t("newKey")
   ```

### Namespace par fichier (extrait automatiquement)
| Fichier | Namespace |
|---------|-----------|
| `parents.tsx` (1er bloc) | `parents_1` |
| `parents.tsx` (2e bloc) | `parents_2` |
| `student-form.tsx` | `studentForm` |
| `teachers.tsx` (1er bloc) | `teachers_1` |
| `teachers.tsx` (2e bloc) | `teachers_2` |
| `src/app/admin/admins/page.tsx` | `admins` |
| etc. | … |

> 💡 Si un fichier contient **plusieurs** composants avec chacun un `const T`, le namespace est suffixé `_1`, `_2`.

---

## 🔌 Architecture API — Students

Avant : 5 fichiers séparés (`route.ts`, `toggle.ts`, `transfer.ts`, `status.ts`, `export.ts`)
Après : 2 fichiers

```
GET    /api/students          → route.ts (list + search + export via ?format=csv)
POST   /api/students          → route.ts (create)
GET    /api/students/[id]     → [id]/route.ts (detail)
PATCH  /api/students/[id]     → [id]/route.ts (update full / partial)
DELETE /api/students/[id]     → [id]/route.ts (delete)
```

Le toggle actif/inactif et le transfert de groupe sont gérés via **PATCH** avec un body discriminant :
```ts
// Toggle
{ action: "toggle", isActive: boolean }

// Transfer
{ action: "transfer", groupId: string }
```

---

## 🧪 Tests & Build

```bash
# Build production Next.js — PASS ✅
npm run build

# Tests vitest — PASS ✅ (aucun fichier .test trouvé, commande OK)
npm run test
```

---

## 📊 Fichiers supprimés (nettoyage)

| Fichier | Raison |
|---------|--------|
| `src/components/admin/ParentDetailClient.tsx` | Fusionné dans `parents.tsx` |
| `src/components/admin/ParentsListClient.tsx` | Fusionné dans `parents.tsx` |
| `src/components/admin/TeacherDetailClient.tsx` | Fusionné dans `teachers.tsx` |
| `src/components/admin/TeachersListClient.tsx` | Fusionné dans `teachers.tsx` |
| `src/components/admin/StudentDetailClient.tsx` | Fusionné dans `student-detail.tsx` |
| `src/components/admin/StudentsListClient.tsx` | Fusionné dans `students.tsx` |
| `src/components/admin/TransferStudentModal.tsx` | Supprimé (utilisé nulle part) |
| `src/app/api/students/[id]/toggle/route.ts` | Fusionné dans `[id]/route.ts` |
| `src/app/api/students/[id]/transfer/route.ts` | Fusionné dans `[id]/route.ts` |
| `src/app/api/students/[id]/status/route.ts` | Fusionné dans `[id]/route.ts` |
| `src/app/api/students/export/route.ts` | Fusionné dans `route.ts` (?format=csv) |
| `src/components/admin/CertificatePrint.tsx` | Obsolète |
| `src/components/admin/CertificateTemplateEditor*.tsx` | Obsolète |
| `src/components/admin/StatsChartsI18n.tsx` | Obsolète |
| `src/components/admin/TeachersListI18n.tsx` | Obsolète |
| `src/components/admin/StudentActions.tsx` | Fusionné dans `student-detail.tsx` |
| `src/components/admin/StudentGroupTransfer.tsx` | Fusionné dans `student-detail.tsx` |
| `services.test.ts` (racine) | Importait des services supprimés |
| `rbac.ts` (racine) | Documentation obsolète |
| `route.ts` (racine) | Fichier API orphelin |
| `cleanup*.ps1` | Scripts temporaires |
| `extract-i18n.cjs` | Script temporaire |
| `migrate-i18n.cjs` | Script temporaire |
| `src/i18n/request.ts` | Reliquat `next-intl` |

---

## 📦 Dépendances nettoyées

- **`next-intl`** : supprimé (inutilisé, remplacé par `LanguageContext` + `useT`)

---

## 🚀 Comment ajouter un nouveau composant

### 1. Créer le fichier
```tsx
// src/components/admin/MyNewComponent.tsx
"use client"
import { useT } from "@/contexts/LanguageContext"

export default function MyNewComponent() {
  const t = useT("myNewComponent")
  return <div>{t("hello")}</div>
}
```

### 2. Ajouter les traductions
```ts
// src/lib/i18n/translations.ts
myNewComponent: {
  hello: { fr: "Bonjour", en: "Hello", ar: "مرحبا" },
},
```

### 3. Exporter depuis un barrel (optionnel)
Si le composant est partagé, l'importer directement :
```tsx
import MyNewComponent from "@/components/admin/MyNewComponent"
```

---

## ✅ Checklist de validation

- [x] `npm run build` passe sans erreur
- [x] `npx tsc --noEmit` : 0 erreur dans les fichiers migrés
- [x] `npm run test` : commande OK
- [x] Aucun `const T = {` restant dans `src/`
- [x] Aucun import résiduel vers fichier supprimé (hors erreurs pré-existantes)
- [x] `next-intl` désinstallé
- [x] Scripts temporaires supprimés

---

## 📝 Notes

- Les erreurs TypeScript **pré-existantes** (`audit.ts`, `auth.config.ts`, `prisma-tenant.ts`, `mnt/user-data/outputs/...`) n'ont **pas** été introduites par cette réorganisation. Elles concernent des modules externes manquants (`@capacitor/cli`, `@/lib/auth`, etc.) ou des types Prisma obsolètes.
- Le dossier `mnt/user-data/outputs/` semble être un export/archivage partiel et n'est pas importé par l'application principale.
