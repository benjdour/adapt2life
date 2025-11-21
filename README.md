# Adapt2Life

Adapt2Life est une application Next.js (App Router) qui orchestre l’onboarding Stack Auth, la persistance Postgres (Drizzle ORM) et la synchronisation de données sportives via Garmin Connect. Le socle inclut :

- Authentification Stack (App Router)
- Schéma Drizzle (users, workouts) et migrations versionnées
- UI typographique Inter/Poppins/Orbitron avec toasts Sonner et composants Tailwind
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

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...

# Domaine & CORS
APP_URL=https://adapt2life.dev
NEXT_PUBLIC_SITE_URL=https://app.adapt2life.dev
CORS_ALLOWED_ORIGINS=https://adapt2life.dev,https://app.adapt2life.dev
# fallback simple si besoin
CORS_ALLOWED_ORIGIN=https://adapt2life.dev

# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
RATE_LIMIT_WINDOW_MS=60000         # optionnel (ms)
RATE_LIMIT_MAX_REQUESTS=120        # optionnel
RATE_LIMIT_REDIS_PREFIX=rate_limit # optionnel

# OAuth Garmin
GARMIN_CLIENT_ID=...
GARMIN_CLIENT_SECRET=...
GARMIN_REDIRECT_URI=https://adapt2life.dev/api/garmin/callback
GARMIN_TOKEN_ENCRYPTION_KEY=base64-encoded-32-byte-key

# Webhooks Garmin
GARMIN_WEBHOOK_SECRET=super-secret

# Cron interne
CRON_SECRET=cron-secret-value

# Garmin Trainer / OpenRouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1   # optionnel
OPENROUTER_CHAT_PATH=/chat/completions            # optionnel
GARMIN_TRAINER_MODEL=openai/gpt-5                # optionnel
GARMIN_TRAINER_SYSTEM_PROMPT="..."               # optionnel
GARMIN_TRAINER_PROMPT="..."                      # peut aussi provenir de docs/garmin_trainer_prompt.txt
GARMIN_TRAINER_JOB_TIMEOUT_MS=600000             # optionnel (10 min par défaut)
GARMIN_TRAINER_FETCH_TIMEOUT_MS=120000           # optionnel (timeout création/schedule Garmin)

# Admin front
ADMIN_MENU_USER_IDS=user-id-1,user-id-2
```

`CRON_SECRET` alimente l’en-tête `x-cron-secret` attendu par `/api/cron/garmin/women-health/pull` (par exemple depuis un job Vercel Cron toutes les 12 h).

> Pour générer une clé de chiffrement : `openssl rand -base64 32`
>
> `GARMIN_TRAINER_PROMPT` est prioritaire sur le fichier `docs/garmin_trainer_prompt.txt`. Le modèle/system prompt sont optionnels (les valeurs par défaut conviennent pour OpenRouter).

## Scripts npm

- `npm run dev` : démarrage local (Next.js App Router)
- `npm run build` : build production
- `npm run start` : serveur Next.js en mode production
- `npm run lint` : linting ESLint
- `npm run typecheck` : vérifie les types avec `tsc --noEmit`
- `npm run test` : suite Vitest (helpers + composants)
- `npm run test:routes` : tests Vitest ciblés sur `tests/app`
- `npm run test:garmin` : tests API Garmin (`tests/app/api/garmin` + `tests/lib/garmin`)
- `npm run audit` : `scripts/audit-allowlist.mjs` (`npm audit` avec allowlist contrôlée)
- `npm run verify` : pipeline CI complet (lint + typecheck + tests + audit)
- `npm run db:push` : pousse le schéma sur la base cible via Drizzle
- `npm run validate:workout` : valide un JSON d’entraînement via `scripts/validateWorkout.ts`
- `npm run test -- --coverage` : exécute la suite Vitest avec coverage (installer `@vitest/coverage-v8` localement pour générer le rapport).

## Base de données (Drizzle)

- `npx drizzle-kit generate` : générer une nouvelle migration
- `npx drizzle-kit migrate` : appliquer les migrations

Les migrations sont stockées dans `drizzle/` et le schéma dans `db/schema.ts`.

## Tests

La stack de tests s’appuie sur Vitest + Testing Library.

- `npm run test` : tests unitaires (helpers, composants, lib).
- `npm run test:routes` : tests d’API Next.js (ex : `/api/training-plan`).
- `npm run test:garmin` : couverture dédiée aux flux Garmin (OAuth, webhooks, librairies).
- `npm run test -- --coverage` : génère un rapport de couverture (nécessite `@vitest/coverage-v8`).

Les dossiers `tests/app`, `tests/components` et `tests/lib` couvrent respectivement les routes, les composants et la logique partagée.

## Sécurité & audit

- `npm run verify` réplique la CI locale : lint, typecheck, tests, tests routes et audit.
- `npm run audit` exécute `scripts/audit-allowlist.mjs`, qui tolère uniquement les vulnérabilités connues sur `cookie` et `esbuild` (dépendances transitives `@stackframe/stack` et `drizzle-kit`). Toute alerte supplémentaire échoue le job.
- Les en-têtes de sécurité et règles CORS sont gérés dans `next.config.ts`.
- Le rate limiting applicatif (voir ci-dessous) renvoie 429 + `Retry-After` sur saturation, et tombe en 503 si Upstash est injoignable.

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

## Middleware & rate limiting

- `proxy.ts` agit comme middleware Next.js et protège :
  - `/secure/*`, `/generateur-entrainement`, `/garmin-trainer/*`, `/integrations/garmin`, ainsi que toutes les routes `/api/*` hors exceptions publiques (contact, webhooks Garmin, callback OAuth).
  - Les utilisateurs non authentifiés sont redirigés vers `/handler/sign-in` (ou reçoivent un 401 côté API).
  - Les stratégies par rôle peuvent être étendues via `PROTECTED_ROUTE_POLICIES`.
- Toutes les requêtes API passent par `lib/security/rateLimiter.ts` :
  - nécessite `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
  - variables `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_REDIS_PREFIX` permettent de régler la fenêtre.
  - `/api/garmin/webhooks` est ignoré pour éviter de bloquer les callbacks Garmin.

## Garmin Trainer & OpenRouter

L’endpoint `/api/garmin-trainer` convertit une description Markdown "humaine" en JSON Garmin Training API V2.

- Le prompt est chargé depuis `GARMIN_TRAINER_PROMPT` ou, par défaut, `docs/garmin_trainer_prompt.txt`.
- `OPENROUTER_API_KEY` est obligatoire. `OPENROUTER_BASE_URL` et `OPENROUTER_CHAT_PATH` permettent de cibler un proxy personnalisé.
- `GARMIN_TRAINER_MODEL` et `GARMIN_TRAINER_SYSTEM_PROMPT` sont optionnels (défaut : `openai/gpt-5` + prompt système local).
- Les métadonnées Stack (`ownerId`) sont récupérées côté serveur pour contextualiser la génération et lier un utilisateur local si nécessaire.
- En cas de surcharge OpenRouter (429), une réponse explicite est renvoyée au client pour ajuster la fréquence des requêtes.
- Les jobs `/api/garmin-trainer/jobs` sont traités en arrière-plan (`lib/services/garminTrainerJobs.ts`) avec un timeout configurable (`GARMIN_TRAINER_JOB_TIMEOUT_MS`, 10 min par défaut). Au-delà, le job passe en `failed` avec un message invitant à relancer.

# Pages publiques

- `/features` : présentation des fonctionnalités clés.
- `/how-it-works` : processus en 4 étapes + CTA.
- `/faq` : 20 questions/réponses avec schema FAQ pour le SEO.
- `/contact` : formulaire (prénom, nom, email, objet, message) + mailto fallback.

## Architecture

- `app/` : routes Next.js (App Router) et composants front
- `db/` : schéma Drizzle + helpers
- `lib/` : utilitaires partagés (helpers Tailwind, logique métier)
- `design/` : tokens et thème Adapt2Life (Design System V6)
- `stack/` : configuration Stack Auth (client + server)
- `drizzle/` : migrations générées automatiquement
- `proxy.ts` : middleware global (auth + rate limiting)

Ce setup fournit un socle prêt pour construire le MVP Adapt2Life : helper `cn`, theming, auth Stack et couche database sont déjà intégrés, à compléter avec les modules Garmin, coaching et analytics décrits dans les spécifications. 

## Design System (V6)

- Les tokens officiels sont disponibles dans `design/theme.ts` et exposés à Tailwind via `tailwind.config.ts`.
- Les composants UI de base (`Button`, `Input`, `Modal`, `Toast`, `DashboardGrid`, `AIScoreGraph`, `Sidebar`, `Card`…) sont alignés sur `docs/design_spec_v6.md`.
- Les fonts Poppins/Inter/Orbitron et les toasts Sonner customisés sont chargés dans `app/layout.tsx`.
- Pour générer de nouveaux écrans, se référer à `docs/design_spec_v6.md` ou lancer la commande `codex design "Generate Adapt2Life components and dashboard layout based on design_spec_v6.md"`.
