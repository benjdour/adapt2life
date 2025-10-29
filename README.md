# Adapt2Life

Adapt2Life est une application Next.js (App Router) qui orchestre l’onboarding Stack Auth, la persistance Postgres (Drizzle ORM) et la synchronisation de données sportives via Garmin Connect.

## Prérequis

- Node.js 22+
- PostgreSQL (Neon recommandé)
- npm 10+

## Installation rapide

```bash
npm install
npm run dev
```

L’application démarre sur `http://localhost:3000`.

## Variables d’environnement

Créer un fichier `.env.local` et définir au minimum :

```bash
DATABASE_URL=postgres://user:password@host:port/db
APP_URL=https://app.exemple.com # URL de base de l’app (utilisée pour les redirections post-OAuth)

# Garmin Connect OAuth2 PKCE
GARMIN_CLIENT_ID=xxxxxxxx
GARMIN_CLIENT_SECRET=yyyyyyyy
GARMIN_REDIRECT_URI=https://app.exemple.com/api/garmin/oauth/callback
GARMIN_TOKEN_ENCRYPTION_KEY=base64-encoded-32-byte-key
```

`GARMIN_TOKEN_ENCRYPTION_KEY` doit être une clé symétrique de 32 octets encodée en base64 (ex. `openssl rand -base64 32`).

## Flux Garmin OAuth2 PKCE

1. L’utilisateur authentifié appelle `GET /api/garmin/oauth/start`.  
   - La route vérifie la session Stack Auth, récupère l’utilisateur local et prépare le couple PKCE (code_verifier / code_challenge).  
   - Un cookie `garmin_oauth_state` (HttpOnly) conserve l’état et le `code_verifier` pendant 10 minutes.
2. L’utilisateur est redirigé vers `https://connect.garmin.com/oauth2Confirm`.  
3. Garmin renvoie sur `GET /api/garmin/oauth/callback`.  
   - Validation de l’état, échange du code contre des tokens, récupération du `userId` Garmin.  
   - Les tokens sont chiffrés (AES-256-GCM) et stockés dans `garmin_connections`. Une association Garmin déjà liée à un autre compte est rejetée.
4. Redirection vers `/integrations/garmin?status=success` (ou `status=error` en cas d’échec).  

Les colonnes sensibles `access_token_encrypted` et `refresh_token_encrypted` sont chiffrées au repos, conformément à la spécification sécurité.

## Migrations Drizzle

Les schémas sont versionnés dans `drizzle/`. Pour appliquer les migrations :

```bash
npx drizzle-kit migrate
```

## Tests

```bash
npm test
```

Les tests Vitest couvrent notamment la génération PKCE et le chiffrement des secrets Garmin.
