## Architecture technique Adapt2Life

### Vue d’ensemble
- **Framework** : Next.js (App Router) avec rendu hybride (SSR/ISR) et composants React côté client (`components/*`) et serveur (`app/*`).
- **Langage** : TypeScript partout (front + API + scripts).
- **Styling/UI** : Tailwind CSS + composants maison (`components/ui`), toasts + formulaires.
- **Base de données** : PostgreSQL piloté par Drizzle ORM (`db/schema.ts`, migrations dans `drizzle/`).
- **Infra** : Déploiement principal sur Vercel (build Next.js, edge/API routes). Jobs ou scripts longs lancés via routes API ou CRON Vercel (`/api/cron/...`).
- **AI/LLM** : Intégration OpenRouter (clients `lib/ai/*`) pour la génération de plans (`/api/training-plan`) et conversion Garmin (`/api/garmin-trainer`, services `lib/services/garminTrainerJobs.ts`).
- **Garmin** : Intégration OAuth, webhooks et push workouts (`app/api/garmin/*`, `lib/services/garmin-connections.ts`).

### Couche serveur / API
```
app/api/
├─ training-plan/route.ts          -> Génération de plan Markdown (LLM)
├─ garmin-trainer/route.ts         -> Conversion Markdown -> JSON Garmin (LLM)
├─ garmin-trainer/jobs/*.ts        -> Création/polling des jobs Garmin
├─ garmin/webhooks/*               -> Ingestion des webhooks Garmin (signatures, stockage)
├─ garmin/oauth/*                  -> OAuth PKCE (start + callback)
├─ garmin-trainer/push/route.ts    -> Push du JSON généré vers Garmin (Workout + Schedule API)
└─ cron/garmin/*                   -> Tâches planifiées (ex. Women Health)
```
- Routes `NextRequest/NextResponse` → validation Zod → services (`lib/services/*`) → accès BD via Drizzle → dépendances externes (Garmin, OpenRouter).
- `stackServerApp` assure l’auth côté Stack (SSO) pour les routes protégées.
- Logs via `lib/logger` (pino-like) avec scopes (`createLogger("garmin-trainer-jobs")`).

### Data & ORM
- `db/schema.ts` : schéma Drizzle typé (tables utilisateurs, connexions Garmin, jobs Garmin Trainer, webhooks, etc.).
- `drizzle/####.sql` : migrations générées depuis le schéma (historique). `_journal.json` suivis.
- Accès via `db.select()/insert()/update()` dans `lib/services/*`.
- Gestion des artifacts IA (plans, workouts JSON) via `lib/services/userGeneratedArtifacts`.

### Garmin trainer jobs
1. Front appelle `/api/garmin-trainer/jobs` (POST) → création `garmin_trainer_jobs` avec le Markdown.
2. `triggerGarminTrainerJobProcessing` lance `processGarminTrainerJobById`.
3. `convertPlanMarkdownForUser` : charge prompt, choisit modèle, appelle LLM via `lib/ai/garminAiClient`, nettoie JSON, valide contre `src/schemas/garminWorkout.schema.ts`.
4. `pushWorkoutForUser` : rafraîchit token Garmin, POST workout puis schedule.
5. Statut mis à jour (`pending` → `processing` → `success/failed`, `aiRawResponse` stocké).
6. Front poll `/api/garmin-trainer/jobs/[jobId]`. Timeout configurable (env `GARMIN_TRAINER_JOB_TIMEOUT_MS`, défaut 5 min).

### Stack AI / OpenRouter
- `lib/ai/garminAiClient.ts` : deux clients (classic, strict) selon usage d’outils (`exercise_lookup`).
- `lib/services/aiModelConfig.ts` + `lib/constants/aiFeatures.ts` : choix des modèles par feature (`training-plan`, `garmin-trainer`) avec fallback.
- `docs/garmin_trainer_prompt.txt` : prompt par défaut (peut être override par `GARMIN_TRAINER_PROMPT`).
- Gestion d’exercices : `lib/garminExercises.ts`, `lib/services/exerciseLookup.ts`, `src/constants/garminExerciseData.ts`.

### Intégration Garmin
- **OAuth** : routes `/api/garmin/oauth/start` (PKCE + cookie state) et `/api/garmin/callback`.
- **Connexions** : table `garmin_connections` avec tokens chiffrés (AES). Services `lib/services/garmin-connections.ts`.
- **Webhooks** : routes `/api/garmin/webhooks/push/[summaryType]` + `/dailies`, signature `x-garmin-signature`, stockage `garmin_webhook_events`, `garmin_daily_summaries`.
- **Pull Women Health** : `/api/cron/garmin/women-health/pull`.
- **Push workouts** : `app/api/garmin-trainer/push/route.ts` (utilisé par jobs ou interface).

### Front / UI
- `app/*` structure Next.js : pages marketing (`/`, `/features`, `/how-it-works`), pages sécurisées (`/secure/*`), intégrations.
- `components/TrainingPlanGeneratorForm.tsx` : formulaire principal (génération + envoi Garmin + toasts).
- `components/GarminTrainerGenerator.tsx` & `components/GarminWorkoutPreview.tsx` : preview JSON généré.
- Auth Stack gérée dans `app/layout.tsx` (`TopNav`, `Footer`).

### Sécurité & config
- Variables env documentées dans `README.md` (tokens Garmin, OpenRouter, secrets Cron…).
- Middleware / proxy (`proxy.ts`) protège les routes `/secure/*`, `/garmin-trainer/*`, etc.
- Rate limiting basique via `lib/security/rateLimiter.ts`.
- Signature Garmin (`lib/security/garminSignature.ts`).

### Observabilité
- Logs Pino-like via `lib/logger`.
- Traces Vercel (Analytics, SpeedInsights) dans `app/layout.tsx`.
- Jobs Garmin stockent `aiRawResponse`, `aiDebugPayload`, `error` pour diagnostic via DB/logs.
