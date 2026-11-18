---
name: animations
description: Motion et animations d'interface selon la philosophie d'Emil Kowalski. À charger pour créer une animation ou une transition, relire du code d'animation (diff ou PR), auditer toutes les animations d'un projet, ou trancher une question de finition UI (courbes, durées, ressorts, gestes).
---

# Animations

Un seul skill, quatre modes. Lis **uniquement** le fichier du mode demandé, puis suis-le.

| Demande | Mode | Fichier | Références à charger au besoin |
|---|---|---|---|
| Animer quelque chose, ajouter une transition, rendre un composant « vivant » | build | [build.md](build.md) | [RECIPES.md](RECIPES.md) |
| Relire une animation, un diff ou une PR qui touche au mouvement | review | [review.md](review.md) | [STANDARDS.md](STANDARDS.md) |
| Auditer le mouvement de tout un projet, produire des plans de correction | audit | [audit.md](audit.md) | [AUDIT.md](AUDIT.md), [PLAN-TEMPLATE.md](PLAN-TEMPLATE.md) |
| Question de finition UI, de choix de design ou de philosophie | philosophie | [philosophy.md](philosophy.md) | — |

En cas de doute entre build et review : du code à écrire → build ; du code existant à juger → review.

Origine : skills `animate`, `review-animations`, `improve-animations` et `emil-design-eng` (emilkowalski/skills), fusionnés le 2026-11-18. Les mises à jour en amont ne s'appliquent plus automatiquement.
