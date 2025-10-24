<h1 align="center">Adapt2Life</h1>

Adapt2Life is a bilingual (EN/FR) coaching experience that helps users balance training and lifestyle with AI-guided recommendations. The app is built on Next.js 15 with the App Router, Turbopack, React 19, and Tailwind CSS 4.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

The development server boots on [http://localhost:3000](http://localhost:3000). Default content is available in English and French via the `/en` and `/fr` locale segments.

### Environment

- Node.js 20+
- npm (recommended)  
  If you prefer pnpm/yarn/bun, add the corresponding lockfile before switching.

### Available Scripts

| Script          | Description                                                   |
| --------------- | ------------------------------------------------------------- |
| `npm run dev`   | Start the Next.js dev server with Turbopack                   |
| `npm run build` | Create an optimized production build                          |
| `npm run start` | Serve the production build                                    |
| `npm run lint`  | Lint the codebase with ESLint                                 |
| `npm run test`  | Run the Vitest suite once (uses JSDOM + Testing Library setup) |
| `npm run test:watch` | Run Vitest in watch mode                                 |

---

## 🧱 Project Structure

```
src/
 ├─ app/
 │   ├─ [locale]/              # Locale-specific routes (en, fr, …)
 │   │   ├─ login/             # Login page
 │   │   ├─ signup/            # Signup form with localized copy
 │   │   └─ …                  # Marketing & legal pages
 │   └─ layout.tsx             # Root layout (applies fonts & analytics)
 ├─ components/                # Reusable UI pieces (layouts, widgets…)
 ├─ components/ui/             # UI primitives (e.g., ToasterProvider)
 ├─ i18n/                      # i18n configuration & shared copy
 └─ __tests__/                 # Vitest test files
```

Key configuration files:

- `vitest.config.ts` / `vitest.setup.ts` – testing environment and aliases
- `tsconfig.json` – TypeScript settings with `@/*` path alias
- `tailwind.config` (via `tailwindcss` v4 preset) – utility-first styling

---

## 🌍 Internationalization

- Locales are defined in `src/i18n/config.ts`.
- Shared navigation/footer copy lives in `src/i18n/common.ts`.
- Route segments under `src/app/[locale]/…` use localized copy fetched through helper functions.
- When adding new UI, ensure both English and French variants are provided to avoid hydration mismatches.

---

## ✅ Testing

We use [Vitest](https://vitest.dev) with [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and `jsdom`.

```
npm run test          # run once
npm run test:watch    # watch mode
```

Add your tests next to components (e.g., `Component.test.tsx`) or under `src/__tests__/`.

---

## 🔔 Notifications

- Toasts are handled by [Sonner](https://sonner.emilkowal.ski/). The global provider is mounted in `src/app/layout.tsx` via `ToasterProvider`.
- Within client components, import `toast` from `sonner` to show success and error feedback (see `LoginForm` / `SignupForm`).
- Keep toast copy bilingual and consistent with the page language.

---

## 📦 Deployment

The project is optimized for Vercel. Build using `npm run build`; review environment variables before deploying.

For more deployment guidance, see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

---

## 🤝 Contributing

1. Create a feature branch from `dev`.
2. Keep UI changes bilingual (EN/FR).
3. Run `npm run lint` and `npm run test` before submitting a PR.

Feel free to file issues or suggestions to improve the Adapt2Life experience.
