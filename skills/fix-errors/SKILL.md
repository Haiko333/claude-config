---
name: fix-errors
description: Corrige toutes les erreurs ESLint et TypeScript d'un projet JS/TS (lint + typecheck), avec des correctifs minimaux. À utiliser quand on demande de « fixer le lint », « corriger les erreurs TS », ou de rendre le typecheck vert.
allowed-tools: Bash(pnpm :*), Bash(npm :*), Bash(npx :*), Bash(bun :*), Bash(tsc :*), Read, Edit, Agent
---

# Fix Errors

Corrige les erreurs ESLint et TypeScript, rien d'autre.

## Méthode

1. **Commandes** : lis `package.json` pour trouver les scripts exacts (`lint`, `typecheck`, `type-check`, `tsc`, `format`) et le gestionnaire de paquets (lockfile).
2. **Diagnostic** : lance le lint et le typecheck (`tsc --noEmit` à défaut), sortie filtrée : `2>&1 | grep -E 'error|✖' | head -100`, plus le total.
3. **Regroupe** les erreurs par fichier, puis par zone (même dossier ou fonctionnalité), 5 fichiers maximum par zone.
4. **Corrige** :
   - 1 ou 2 zones : corrige toi-même.
   - 3 zones ou plus : un sous-agent `build-error-resolver` par zone, tous lancés dans le même message. Donne-lui la liste des fichiers et les erreurs exactes de chacun, avec la consigne : « Corrige seulement ces erreurs dans ces fichiers, changements minimaux, ne touche à rien d'autre. »
5. **Vérifie** : relance le lint et le typecheck. Il reste des erreurs : un deuxième passage sur celles-ci. Encore des erreurs : liste-les et arrête.
6. **Formate** avec le script `format` s'il existe, sur les fichiers modifiés seulement.

## Règles
- Correctifs minimaux : pas de refactorisation ni de fonctionnalité.
- Pas de `// @ts-ignore`, `eslint-disable` ou `any` pour faire taire une erreur, sauf si c'est la seule solution raisonnable ; dans ce cas, signale-le.
- Chaque erreur est soit corrigée, soit listée comme restante dans le compte rendu.

Compte rendu : erreurs avant → après, fichiers modifiés, erreurs restantes avec `fichier:ligne`.

User: $ARGUMENTS
