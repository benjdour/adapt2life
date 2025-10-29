---
title: "Spécification technique & Best Practices — Adapt2Life (V2)"
version: "2.0"
last_updated: "2025-10-29"
tags: ["Adapt2Life", "Next.js", "Security", "Drizzle", "Stack Auth", "Vitest", "CSP", "OWASP"]
---

# ⚙️ Spécification technique & Best Practices — Adapt2Life (V2)

## Sommaire
- [1. Stack technique complète (2025)](#1-stack-technique-complète-2025)
- [2. Architecture & conventions](#2-architecture--conventions)
- [3. Sécurité applicative & des routes (obligatoire)](#3-sécurité-applicative--des-routes-obligatoire)
- [4. Endpoints critiques — patterns sécurisés (Next.js)](#4-endpoints-critiques--patterns-sécurisés-nextjs)
- [5. Tests & qualité (Vitest)](#5-tests--qualité-vitest)
- [6. Performance & fiabilité](#6-performance--fiabilité)
- [7. Références & implémentation rapide](#7-références--implémentation-rapide)

---

## 1. Stack technique complète (2025)
- **Next.js (App Router)**  
- **UI :** Tailwind CSS + Shadcn/UI (Mobile‑first)  
- **Base de données :** Neon (PostgreSQL)  
- **ORM :** Drizzle ORM (+ drizzle‑kit)  
- **Auth :** Stack Auth (sessions signées, rôles user/admin, middleware de protection)  
- **Tests :** Vitest + Testing Library  
- **IA :** GPT‑5 via Responses API (`/lib/ai.ts`) — gestion des timeouts, retries, logs  
- **Notifications :** Sonner (toasts succès/erreur) + erreurs centralisées (`/lib/errors.ts`)  
- **Déploiement :** Vercel (previews PR, prod sur main), Security Headers (CSP, HSTS)  

---

## 2. Architecture & conventions
- **Structure des répertoires :**
  ```
  /app              → pages & route handlers
  /lib              → db, auth, adapters, ai, errors
  /components/ui    → Shadcn components
  /drizzle          → schema & migrations
  ```
- **Adapters API :** `/lib/adapters/{garmin,apple,googlefit,suunto}.ts` → mapping vers modèle commun  
- **Mobile‑first :** breakpoints Tailwind; actions principales accessibles; tests manuels petits écrans  
- **Erreurs centralisées :** enum `ErrorCode`, messages i18n, sévérité, mapping HTTP; affichage toast + fallback UI  

---

## 3. Sécurité applicative & des routes (obligatoire)
- AuthN/AuthZ côté serveur : vérifier la session sur chaque route `/api/*` et page sécurisée; rôles et ownership (BOLA).  
- Validation d’entrée `zod` systématique; rejeter champs non attendus (OWASP API Security Top 10).  
- Rate limiting (Upstash/Redis) en Edge Middleware; backoff exponentiel; pagination par défaut.  
- CORS strict (origines autorisées); HTTPS only; HSTS; suppression de `X‑Powered‑By`; headers `no‑sniff`.  
- CSRF pour actions sensibles; cookies `Secure`, `HttpOnly`, `SameSite=Strict`.  
- CSP restrictive (`script-src`, `connect-src`, `img-src`); nonces sur scripts inline si nécessaire.  
- Secrets & tokens : ENV Vercel; tokens Garmin chiffrés en DB; jamais renvoyés au client; rotation/refresh planifiés.  
- Journalisation : reqId, tentatives interdites, échecs OAuth, quotas atteints; corrélation logs client/serveur.  

---

## 4. Endpoints critiques — patterns sécurisés (Next.js)
- Route Handlers : vérifier session/role; limiter le champ des données renvoyées; réponses avec codes cohérents.  
- Server Actions : pas d’accès aux secrets côté client; valider inputs avec zod; éviter E2E secrets visibles.  
- Uploads & webhooks : tailles limites; content-type strict; signature; replay protection.  
- Erreurs : messages génériques côté client; détails en logs; ID d’erreur pour support.  

---

## 5. Tests & qualité (Vitest)
- **Unitaires :** moteur d’analyse, utilitaires de parsing API  
- **Composants :** Testing Library  
- **Intégration :** Route Handlers avec sessions mockées; tests d’autorisations et ownership  
- **CI gates :** lint, type‑check, build, test, audit; blocage du merge si échec  
- **Processus complet :** test listing → build → test suite complète → déploiement après chaque feature majeure  

---

## 6. Performance & fiabilité
- Edge/runtime : privilégier le server‑side; limiter la surface client; streaming pour longues réponses.  
- Cache : pas de données sensibles dans cache public; revalidation ciblée; SWR prudent.  
- Drizzle : requêtes paramétrées; index pertinents; migrations atomiques; backups Neon.  

---

## 7. Références & implémentation rapide
- Next.js : Data Security, Route Handlers, Server Actions  
- Vercel : Security Headers & CSP; Upstash rate‑limit  
- OWASP : API Security Top 10 (2023)  
- Garmin : OAuth2 PKCE  
