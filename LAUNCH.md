# 🚀 Lancer TAHFIDZ SaaS avec VS Code — Guide complet

## Ce dont vous avez besoin (à installer une seule fois)

| Outil | Version | Lien |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker Desktop | dernière | https://docker.com/products/docker-desktop |
| VS Code | dernière | https://code.visualstudio.com |

---

## Étape 1 — Ouvrir le projet dans VS Code

```
Fichier → Ouvrir le dossier → sélectionner le dossier tahfidz-saas
```

Extensions VS Code recommandées (VS Code les propose automatiquement) :
- Prisma
- Tailwind CSS IntelliSense
- ESLint

---

## Étape 2 — Installer les dépendances

Ouvrir le terminal intégré VS Code : **Ctrl + `** (backtick)

```bash
pnpm install
```

---

## Étape 3 — Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ouvrir `.env` dans VS Code et générer le secret :

```bash
# Dans le terminal VS Code :
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copier la sortie dans AUTH_SECRET=
```

Le fichier `.env` final doit ressembler à :
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tahfidz"
AUTH_SECRET="votre_secret_généré_ici"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"
REDIS_URL="redis://localhost:6379"
INTERNAL_API_SECRET="dev_secret_local"
```

---

## Étape 4 — Démarrer PostgreSQL et Redis

S'assurer que Docker Desktop est lancé, puis :

```bash
docker compose up -d
```

Vérifier que les deux conteneurs sont verts :
```bash
docker compose ps
```

Vous devez voir `tahfidz_postgres` et `tahfidz_redis` avec le statut `healthy`.

---

## Étape 5 — Initialiser la base de données

```bash
# Créer les tables (applique les migrations Prisma)
pnpm db:migrate
# → Taper un nom quand demandé : "init"

# Injecter les données de démonstration
pnpm db:seed
```

Résultat attendu :
```
🌱  TAHFIDZ SaaS — Démarrage du seed…
📖  9 sourates de référence insérées
🏫  Création de « Madrassa Al-Nour »…
   ✅  Madrassa Al-Nour — 5 élèves, 2 enseignants
🏫  Création de « Institut Al-Amin »…
   ✅  Institut Al-Amin — 5 élèves, 2 enseignants
🎉  Seed terminé avec succès !
```

---

## Étape 6 — Lancer l'application

```bash
pnpm dev
```

Ouvrir dans le navigateur : **http://localhost:3000**

---

## Étape 7 — Se connecter

Sur la page de login, utiliser un des comptes de démo :

| Champ | Valeur (école Al-Nour) |
|---|---|
| Identifiant de l'école | `al-nour` |
| Email | `admin@al-nour.tahfidz.app` |
| Mot de passe | `Admin@1234` |

Pour tester le compte enseignant :

| Champ | Valeur |
|---|---|
| Identifiant de l'école | `al-nour` |
| Email | `ustadh.ahmad@al-nour.tahfidz.app` |
| Mot de passe | `Teacher@1234` |

---

## Commandes utiles pendant le développement

```bash
# Ouvrir Prisma Studio (interface visuelle de la DB)
pnpm db:studio
# → Ouvre http://localhost:5555

# Lancer les tests
pnpm test

# Réinitialiser la DB (repart de zéro + seed)
pnpm db:reset

# Lancer les workers BullMQ (dans un 2e terminal)
pnpm workers:start

# Vérifier que l'API répond
curl http://localhost:3000/api/health
```

---

## Structure des fichiers après installation

```
tahfidz-saas/
├── app/
│   ├── (tenant)/           ← Pages protégées (dashboard, élèves…)
│   │   ├── layout.tsx      ← Sidebar + auth
│   │   ├── dashboard/
│   │   ├── students/
│   │   └── memorization/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── v1/             ← API REST
│   │   ├── health/
│   │   └── internal/
│   ├── login/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── auth/               ← NextAuth config + RBAC
│   ├── prisma-tenant.ts    ← Client Prisma multi-tenant
│   └── audit.ts
├── services/               ← Logique métier
├── jobs/                   ← BullMQ workers
├── tests/                  ← Vitest
├── prisma/
│   └── seed.ts
├── schema.prisma
├── middleware.ts
├── docker-compose.yml
├── .env                    ← À ne jamais commiter
└── package.json
```

---

## En cas de problème

**Erreur `Can't reach database server`**
→ Docker n'est pas lancé ou le conteneur postgres n'est pas prêt.
→ `docker compose up -d` puis attendre 10 secondes.

**Erreur `AUTH_SECRET` manquant**
→ Vérifier que le fichier `.env` existe et que `AUTH_SECRET` est renseigné.

**Port 3000 déjà utilisé**
→ `pnpm dev -- --port 3001`

**`pnpm db:migrate` échoue**
→ Vérifier `DATABASE_URL` dans `.env` (postgres:postgres@localhost:5432/tahfidz)

**Prisma Studio ne s'ouvre pas**
→ `npx prisma studio` directement dans le terminal.
