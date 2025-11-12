
# 🎨 Adapt2Life — Design System V6

## 🌐 Vision
**Adapt2Life** est une application de coaching sportif et bien-être pilotée par l’IA.  
Cette version V6 du Design System est une **spécification opérationnelle** : exploitable par Codex, Figma Tokens, et l’équipe dev pour assurer cohérence, accessibilité et automatisation.

---

## 🧩 Identité visuelle
- **Logo :** cercle double flèche → adaptation, cycle, énergie.  
- **Palette :** Bleu technologique `#0068B5`, Vert vitalité `#2FBF71`.  
- **Style général :** futuriste, humain, fluide, apaisant.  

---

## 🎨 Palette de couleurs

| Élément | Couleur | Usage |
|----------|----------|-------|
| **Primary** | `#0068B5` | CTA, liens, accents |
| **Secondary** | `#2FBF71` | Succès, validation |
| **Background Dark** | `#0C0F12` | Dashboard |
| **Background Light** | `#F5F8FA` | Landing page |
| **Text Primary** | `#FFFFFF` / `#1E1E1E` | Lecture principale |
| **Text Secondary** | `#6C757D` | Sous-titres, légendes |
| **Error** | `#F25C54` | États d’erreur |
| **Warning** | `#F5A623` | États intermédiaires |
| **Success** | `#2FBF71` | Validation |
| **Info** | `#5DA9E9` | Notifications informatives |

---

## 🦾 Accessibilité & Inclusivité

### Normes principales
- **WCAG 2.1 AA** minimum.  
- Contraste texte/fond ≥ 4.5:1.  
- Titres ≥ 3:1.  
- Taille tactile minimale : 44×44 px.  

### Focus & interactions
- Focus toujours visible (halo bleu/vert).  
- Aucun `outline: none` sans équivalent visuel.  

### Checklist Couleurs
- ✅ Contraste conforme WCAG.  
- ✅ Test daltonisme.  
- ✅ Gradient jamais seul porteur d’info.  
- ✅ Test avec background clair/sombre.  

---

## 🎛️ Design Tokens

### Spacing
| Nom | Valeur |
|------|--------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 40px |

### Border Radius
| Nom | Valeur |
|------|--------|
| sm | 6px |
| md | 12px |
| lg | 20px |
| 2xl | 32px |

### Shadows
| Nom | Valeur |
|------|--------|
| sm | 0 1px 2px rgba(0,0,0,0.1) |
| md | 0 4px 6px rgba(0,0,0,0.15) |
| lg | 0 10px 20px rgba(0,0,0,0.25) |

### Opacity & Blur
| Token | Valeur | Usage |
|--------|---------|--------|
| opacity-overlay | 0.6 | Arrière-plan modaux |
| opacity-disabled | 0.5 | Boutons désactivés |
| blur-overlay | 12px | Fond modaux |
| blur-card | 4px | Effet glass léger |

### Animation Tokens
| Élément | Durée | Easing | Usage |
|----------|--------|--------|-------|
| Micro-interactions | 150ms | ease-out | Hover, focus |
| Transitions UI | 250ms | ease-in-out | États |
| Modaux/Toasts | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Apparition |
| Graphiques | 500ms | ease-in-out | Score AI |

---

## 🧭 Layout / Grid System

### Breakpoints
| Nom | Largeur min | Usage |
|------|--------------|--------|
| sm | 640px | Mobile |
| md | 768px | Tablette |
| lg | 1024px | Desktop |
| xl | 1280px | Grand écran |
| 2xl | 1536px | Ultra-wide |

### Grille principale
- **Max width :** 1440px  
- **Gutter :** 24px (mobile) / 40px (desktop)  
- **Colonnes :** 12 flexibles  
- **Col gap :** 16px / **Row gap :** 24px  
- **Responsive :**  
  - Mobile : 1 colonne  
  - Tablette : 2 colonnes  
  - Desktop : 3–4 colonnes  

---

## 🧭 Navigation Components

| Élément | Description | États |
|----------|--------------|-------|
| Sidebar | Navigation latérale icônes + labels | collapsed / expanded |
| Topbar | Barre supérieure (logo, profil, notif) | sticky |
| Breadcrumbs | Arborescence contextuelle | truncation |

- Sidebar width : 280px / 96px (collapsed).  
- Hover : fond sombre léger, texte accentué.  
- Icône active : gradient bleu → vert.  

---

## 🔔 Notifications & Banners

| Type | Couleur | Icône | Usage |
|-------|----------|--------|--------|
| Info | #5DA9E9 | info | Messages neutres |
| Success | #2FBF71 | check-circle | Confirmation |
| Warning | #F5A623 | alert-triangle | Attention |
| Error | #F25C54 | alert-octagon | Erreur |

- Inline alerts : dans le flux de page.  
- Banners : haut du dashboard, durée 5–10s, dismissible.  

---

## 🧾 Form Patterns Avancés

- Multi-step forms avec barre de progression.  
- Sliders : min 4px track height, couleur primaire.  
- Toggles : switch vert/bleu, animation 150ms.  
- Checkbox/Radio : hit zone 44px, bord 2px bleu.  
- Uploads : drag & drop, prévisualisation miniature.  

---

## 🎞️ Motion Guidelines

### Keyframes
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```
### Patterns
- Toasts : fadeInUp 300ms ease-in-out  
- Modal : blur + opacity 250ms  
- AIScoreGraph : stroke-dashoffset 500ms ease-in-out  

---

## 🌗 Theme Mapping

| Élément | Light | Dark |
|----------|--------|------|
| Background | #F5F8FA | #0C0F12 |
| Text | #1E1E1E | #FFFFFF |
| Card | #FFFFFF | #15191C |
| Toast | #E8F0FE | #15191C |
| Chart Base | #E5E9F0 | rgba(255,255,255,0.08) |

---

## 📦 Tokens Export (JSON Example)

```json
{
  "color": {
    "primary": { "value": "#0068B5" },
    "secondary": { "value": "#2FBF71" }
  },
  "radius": { "md": { "value": "12px" } },
  "shadow": { "lg": { "value": "0 10px 20px rgba(0,0,0,0.25)" } }
}
```

---

## 🧪 QA Protocols

- Outils contrastes : axe DevTools, Lighthouse, Stark.  
- Responsive : Chrome DevTools (iPhone, iPad, Desktop).  
- Scripts QA : `/scripts/qa-accessibility.js`.  
- Plan : tester 10 composants clés / release.  

---

## 🖌️ Illustrations Guidelines

- Couleurs : bleu/vert doux, fond neutre.  
- Style : vectoriel, inclusif, formes arrondies.  
- Pas de texte intégré dans l’image.  
- Thèmes : sport, énergie, récupération, équilibre.  

---

## 🗞️ Changelog & Diffusion

| Version | Date | Changements |
|----------|------|-------------|
| 5.0.0 | 2025-11-12 | Base complète Design System |
| 6.0.0 | à venir | UI refs + exports + QA tests |

- Notifications via Slack #design-system + email interne.  
- Pull Request Template :  
  - [ ] Tokens modifiés  
  - [ ] Composants testés  
  - [ ] Docs à jour  

---

## ⚙️ Instructions Codex

- Framework : Next.js + Tailwind + Shadcn UI.  
- Mode sombre par défaut.  
- Générer : `Button`, `Input`, `Toast`, `DashboardGrid`, `AIScoreGraph`, `Modal`, `Sidebar`.  

### Exemple CLI
```
codex design "Generate Adapt2Life components and dashboard layout based on design_spec_v6.md"
```
