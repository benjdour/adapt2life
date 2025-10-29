# Adapt2Life

Adapt2Life est une application Next.js (App Router) qui orchestre l’onboarding Stack Auth, la persistance Postgres (Drizzle ORM) et la synchronisation de données sportives via Garmin Connect. Le socle inclut :

- Authentification Stack (App Router)
- Schéma Drizzle (users, workouts) et migrations versionnées
- UI themée (Geist) avec notifications sonner
- Configuration prête pour l’intégration Garmin OAuth2 (variables d’environnement)

## Prérequis

- Node.js 22+
- PostgreSQL (Neon recommandé)
- npm 10+

## Installation

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Créer un fichier `.env.local` (voir ci-dessous) pour vos credentials locaux.

3. Lancer l’environnement de développement :

   ```bash
   npm run dev
   ```

L’application tourne sur [http://localhost:3000](http://localhost:3000).

## Variables d’environnement

```bash
# Base de données
DATABASE_URL=postgres://user:password@host:port/db

# Stack
NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...

# Domaine applicatif
APP_URL=https://adapt2life.dev

# OAuth Garmin (préconfiguré mais optionnel tant que l’intégration n’est pas finalisée)
GARMIN_CLIENT_ID=...
GARMIN_CLIENT_SECRET=...
GARMIN_REDIRECT_URI=https://adapt2life.dev/api/garmin/callback
GARMIN_TOKEN_ENCRYPTION_KEY=base64-encoded-32-byte-key
```

> Pour générer une clé de chiffrement : `openssl rand -base64 32`

## Scripts npm

- `npm run dev` : démarrage local (Next.js App Router)
- `npm run build` : build production
- `npm run start` : serveur Next.js en mode production
- `npm run lint` : linting ESLint
- `npm run test` : suite de tests Vitest

## Base de données (Drizzle)

- `npx drizzle-kit generate` : générer une nouvelle migration
- `npx drizzle-kit migrate` : appliquer les migrations

Les migrations sont stockées dans `drizzle/` et le schéma dans `db/schema.ts`.

## Tests

La stack de tests s’appuie sur Vitest + Testing Library. Pour lancer la suite :

```bash
npm run test
```

Le répertoire `tests/` contient des tests unitaires pour les helpers (ex : `cn`) et servira de base pour les futurs tests de services (Stack, Drizzle, Garmin).

## Flux Garmin OAuth2 PKCE

1. `GET /api/garmin/oauth/start`  
   - Vérifie la session Stack Auth et prépare le couple PKCE.  
   - Écrit un cookie HttpOnly `garmin_oauth_state` (10 minutes) contenant l’état et le `code_verifier`.
2. Redirection vers `https://connect.garmin.com/oauth2Confirm`.
3. `GET /api/garmin/oauth/callback`  
   - Valide les paramètres, échange le code contre des tokens, récupère le `userId` Garmin.  
   - Chiffre `access_token` et `refresh_token` (AES-256-GCM) avant stockage dans `garmin_connections`.
4. Redirection vers `/integrations/garmin?status=success|error`.

Les colonnes sensibles `access_token_encrypted` et `refresh_token_encrypted` sont chiffrées au repos, conformément à la spécification sécurité.

## Architecture

- `app/` : routes Next.js (App Router) et composants front
- `db/` : schéma Drizzle + helpers
- `lib/` : utilitaires partagés (helpers Tailwind, logique métier)
- `stack/` : configuration Stack Auth (client + server)
- `drizzle/` : migrations générées automatiquement

Ce setup fournit un socle prêt pour construire le MVP Adapt2Life : helper `cn`, theming, auth Stack et couche database sont déjà intégrés, à compléter avec les modules Garmin, coaching et analytics décrits dans les spécifications. 
