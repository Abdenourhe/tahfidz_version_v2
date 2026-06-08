# 🚀 Guide de déploiement — TAHFIDZ PRO

## Prérequis
- Compte [Vercel](https://vercel.com)
- Compte [Supabase](https://supabase.com) (PostgreSQL gratuit)
- Compte [SendGrid](https://sendgrid.com) (emails)
- Compte [Uploadthing](https://uploadthing.com) (fichiers gratuit)

---

## Étape 1 — Base de données Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **Settings → Database → Connection string → URI**
3. Copier l'URL (format : `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`)
4. Garder cette URL pour l'étape 3

---

## Étape 2 — SendGrid (emails)

1. Créer un compte sur [sendgrid.com](https://sendgrid.com)
2. **Settings → API Keys** → Create API Key → Copier `SG.xxx` (Full Access ou Mail Send)
3. **Settings → Sender Authentication** → Single Sender Verification → Ajouter et vérifier votre email

---

## Étape 3 — Uploadthing (avatars & fichiers)

1. Créer un compte sur [uploadthing.com](https://uploadthing.com)
2. Créer une app → Copier `UPLOADTHING_SECRET` et `UPLOADTHING_APP_ID`

---

## Étape 4 — Variables d'environnement locales

Créer `.env.local` :

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
AUTH_SECRET="votre-secret-32-chars"  # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"
SENDGRID_API_KEY="SG.xxx"
SMTP_FROM="TAHFIDZ <ton-email-verifie@gmail.com>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Tahfidz Pro"
```

---

## Étape 5 — Initialisation locale

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Créer les tables en base
npm run db:migrate

# Insérer les données de test (114 sourates + comptes)
npm run db:seed

# Lancer en développement
npm run dev
```

---

## Étape 6 — Déploiement sur Vercel

### Option A — Via GitHub (recommandé)

```bash
# 1. Créer un repo GitHub
git init
git add .
git commit -m "Initial commit — Tahfidz Pro"
git remote add origin https://github.com/VOTRE-USER/tahfidz-pro.git
git push -u origin main
```

2. Aller sur [vercel.com](https://vercel.com) → **New Project**
3. Importer votre repo GitHub
4. Ajouter toutes les variables d'environnement (voir ci-dessous)
5. **Deploy** !

### Option B — Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Variables d'environnement Vercel

Dans le dashboard Vercel → **Settings → Environment Variables**, ajouter :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Supabase |
| `DIRECT_URL` | URL Supabase (même valeur) |
| `AUTH_SECRET` | Secret 32 caractères |
| `NEXTAUTH_URL` | `https://votre-app.vercel.app` |
| `UPLOADTHING_SECRET` | Clé Uploadthing |
| `UPLOADTHING_APP_ID` | ID Uploadthing |
| `SENDGRID_API_KEY` | Clé API SendGrid (SG.xxx) |
| `SMTP_FROM` | Email vérifié SendGrid |
| `NEXT_PUBLIC_APP_URL` | `https://votre-app.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `Tahfidz Pro` |

---

## Étape 7 — Migration en production

Après le premier déploiement, exécuter la migration :

```bash
# Avec DATABASE_URL pointant vers Supabase
npx prisma migrate deploy
npx prisma db seed
```

Ou directement depuis Vercel :
- **Settings → Functions → Run** → `npx prisma migrate deploy`

---

## Domaine personnalisé (optionnel)

1. Vercel → **Settings → Domains** → Ajouter votre domaine
2. Configurer les DNS chez votre registrar
3. Mettre à jour `NEXTAUTH_URL` et `NEXT_PUBLIC_APP_URL` avec votre domaine

---

## Comptes par défaut (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@tahfidz-pro.com | Admin@123456 |
| Enseignant | teacher1@tahfidz-pro.com | Teacher@123456 |
| Parent | parent@tahfidz-pro.com | Parent@123456 |
| Élève | yusuf.student@tahfidz-pro.com | Student@123456 |

> ⚠️ **Changer tous les mots de passe en production !**

---

## Commandes utiles

```bash
npm run dev           # Développement local
npm run build         # Build production
npm run db:studio     # Interface visuelle Prisma Studio
npm run db:seed       # Re-insérer les données de test
npm run db:reset      # Remettre la DB à zéro (⚠️ perd toutes les données)
npm run lint          # Vérification ESLint
```

---

## Stack complète

```
Frontend      : Next.js 14 (App Router) + TypeScript
Styling       : Tailwind CSS + shadcn/ui
Auth          : NextAuth.js v5 (JWT)
ORM           : Prisma
Base de données: PostgreSQL (Supabase)
Emails        : SendGrid API
Fichiers      : Uploadthing
Graphiques    : Recharts
Animations    : Framer Motion
i18n          : next-intl (FR + AR)
Déploiement   : Vercel
```
