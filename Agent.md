# Adapt2Life • Agent Handbook

This document is aimed at anyone (human or AI) automating work in the Adapt2Life repository. It captures the conventions, guardrails, and preferred workflows for the project.

---

## 1. Project Snapshot

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Runtime:** React 19, TypeScript, Tailwind CSS 4
- **Tooling:** ESLint, Vitest + Testing Library (JSDOM)
- **Locales:** English (`en`), French (`fr`)
- **Deployment Target:** Vercel

---

## 2. Coding Guidelines

1. **TypeScript first.** Keep `strict` mode passing; prefer explicit types when inference is unclear.
2. **Preserve accessibility.** Use semantic HTML, proper labels, and keyboard-friendly patterns.
3. **Styling.** Tailwind utilities are preferred. Avoid inline styles unless dynamic tokens are required.
4. **Components.** Extract shared UI into `src/components`; keep pages lean, focused on composition.
5. **Async params.** Layouts receive `params` as a `Promise` in Next 15—always normalize before use.
6. **Hydration safety.** Avoid non-deterministic code (e.g., `Date.now()`) during SSR, especially in client components.

---

## 3. Internationalization Rules

1. **Two languages.** Every new copy block must include both `en` and `fr` variants.
2. **Shared copy.** Navigation/footer text lives in `src/i18n/common.ts`; page-specific strings stay close to their page.
3. **Links.** Build locale-aware URLs via the helpers used in `MarketingLayout`.
4. **Validation.** Confirm both locales render without hydration warnings.

---

## 4. Testing & QA

| Command            | Purpose                          |
| ------------------ | -------------------------------- |
| `npm run lint`     | ESLint validation                |
| `npm run test`     | Vitest run (JSDOM environment)   |
| `npm run test:watch` | Vitest in watch mode          |

- Add unit/interaction tests for new components.
- Keep snapshot usage to a minimum; prefer behavioural assertions.

---

## 5. Workflow Expectations

1. **Branches.** Work off feature branches created from `dev`.
2. **Commits.** Use descriptive messages (e.g., `feat: localize signup sidebar`).
3. **Pull Requests.** Include testing notes (`lint`, `test`) and screenshots/GIFs for UI changes.
4. **Dependencies.** Use npm. If another package manager is needed, coordinate before adding a new lockfile.

---

## 6. Common Tasks Cheat Sheet

- **Add a locale-aware page:**
  1. Create `src/app/[locale]/your-page/page.tsx`.
  2. Fetch shared copy via `getCommonCopy(locale)`.
  3. Supply localized strings within the page file or an adjacent helper.
  4. Validate both `/en/your-page` and `/fr/your-page`.

- **Add a translation key:**
  1. Extend the type definition (if required).
  2. Update both `en` and `fr` objects.
  3. Reference via helper functions—never hard-code labels in JSX.

- **Consume fonts or analytics:**
  - Keep font imports in `src/app/layout.tsx`.
  - Wrap new providers at the layout level unless they must be scoped to a route segment.

---

## 7. Release Notes

Before deploying:

1. `npm run lint && npm run test`
2. `npm run build` (locally, outside of sandbox restrictions)
3. Review Vercel preview URLs for both locales
4. Update documentation (README/Agent.md) when workflows or tooling change

---

## 8. Contact

For questions, ping the Adapt2Life maintainers or open an issue in the repository. Consistency across languages and UX polish are top priorities—flag anything that might regress them.
