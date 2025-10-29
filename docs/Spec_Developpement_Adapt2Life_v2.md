---
title: "Spécification du développement Adapt2Life (V2)"
version: "2.0"
last_updated: "2025-10-29"
tags: ["Adapt2Life", "Next.js", "Drizzle", "Stack Auth", "Vitest", "GPT-5", "Shadcn", "Sonner"]
---

# 📘 Spécification du développement Adapt2Life (V2)

## Sommaire
- [1. Contexte & objectifs](#1-contexte--objectifs)
- [2. Stack officielle du projet (2025)](#2-stack-officielle-du-projet-2025)
- [3. Phases & livrables](#3-phases--livrables)
- [4. Modules du MVP (ordre recommandé)](#4-modules-du-mvp-ordre-recommandé)
- [5. Plan d’exécution & dépendances](#5-plan-dexécution--dépendances)
- [6. Workflow Git & CI/CD](#6-workflow-git--cicd)
- [7. Critères de validation (Definition of Done)](#7-critères-de-validation-definition-of-done)
- [8. Suivi, maintenance & qualité continue](#8-suivi-maintenance--qualité-continue)
- [9. Périmètre futur (phase 3)](#9-périmètre-futur-phase-3)

---

## 1. Contexte & objectifs
**Vision :** aider chaque sportif à atteindre ses objectifs en tenant compte de sa forme du moment et de ses contraintes de vie.  
**Mission :** générer des plans d’entraînement adaptatifs alimentés par des données fiables.  
**Objectif prioritaire :** livrer un MVP utile et stable.

---

## 2. Stack officielle du projet (2025)
- **Framework :** Next.js (App Router)  
- **UI :** Tailwind CSS + Shadcn/UI (Mobile‑first)  
- **Base de données :** Neon (PostgreSQL)  
- **ORM & migrations :** Drizzle ORM (+ drizzle‑kit)  
- **Auth & sécurité :** Stack Auth (sessions, rôles, middleware)  
- **Tests & qualité :** Vitest (+ Testing Library), build & test suite après chaque fonctionnalité majeure  
- **IA :** GPT‑5 models family via Responses API endpoint (`/lib/ai.ts`)  
- **UX Feedback :** Sonner (toasts succès/erreur) + erreurs centralisées (`/lib/errors.ts`)  

---

## 3. Phases & livrables

| Phase | Objectif | Livrables clés | Indicateurs |
|-------|-----------|----------------|--------------|
| **1 — MVP** | Valider la valeur | Auth (Stack Auth), DB (Drizzle+Neon), Garmin OAuth2 PKCE, moteur v1, dashboard mobile‑first (Shadcn) | login ok, sync ok, séance générée |
| **2 — Intelligence & UX** | Affiner recommandations | Moteur v2 (contraintes), dashboard avancé, historique & feedback | adhérence, retours qualitatifs |
| **3 — Expansion & Go‑to‑Market** | Ouvrir & monétiser | Apple Health/Google Fit/Suunto, apps mobiles, Stripe, sécurité renforcée | rétention, abonnements |

---

## 4. Modules du MVP (ordre recommandé)
1. Auth & sessions (Stack Auth) + routes protégées (middleware)  
2. Schéma & migrations (Drizzle ORM + Neon)  
3. Garmin Connect OAuth2 PKCE + sync quotidienne (`adapters/garmin.ts`)  
4. Moteur de recommandation v1 (règles : Body Battery / sommeil / stress)  
5. Dashboard mobile‑first (Shadcn : Card, Button, Progress, Tabs) + Sonner toasts  

---

## 5. Plan d’exécution & dépendances
- Sprints de 2 semaines, 1 fonctionnalité majeure par sprint  
- Après chaque feature majeure : test listing → build → test suite (Vitest) → déploiement  
- Dépendances : Auth → DB → Garmin → Engine → UI  

---

## 6. Workflow Git & CI/CD
- Branches : `main`, `develop`, `feature/*`  
- PR obligatoires avec revues  
- Checks requis : lint, type‑check, build, Vitest, audit vulnérabilités  
- Vercel : previews par PR → merge sur `main` = déploiement prod  

---

## 7. Critères de validation (Definition of Done)
- Tests Vitest verts (unitaires + intégration API)  
- Couverture définie par module  
- Aucune régression Lighthouse (Perf/Accessibilité)  
- Sécurité : validation d’inputs (`zod`), rate‑limit, authz vérifiée, headers CSP/HSTS/CORS  
- Documentation : README & changelog mis à jour  
- Messages d’erreur centralisés cohérents  

---

## 8. Suivi, maintenance & qualité continue
- Logs structurés (reqId) + métriques de sync + alertes (échecs OAuth, quotas)  
- Feedback utilisateurs (toasts + formulaires) et boucle d’amélioration  
- Rotation tokens Garmin; revues de permissions & dépendances régulières  

---

## 9. Périmètre futur (phase 3)
- Intégrations : Apple Health, Google Fit, Suunto  
- Apps mobiles : Expo / React Native  
- Monétisation : Stripe, plan Premium (analyses avancées, multi‑sources)
