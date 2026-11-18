# Règles globales

Règles communes à toutes les sessions (PC et serveur). Les règles par langage sont dans `rules/<langage>/`, chargées seulement sur les fichiers concernés.

Priorité : qualité maximale sur les décisions d'architecture et la relecture ; économie de tokens par défaut sur tout le reste.

## Concision
- Réponses courtes : le résultat, pas le récit de ce que tu as fait. Pas de récapitulatif de fin de message.
- Commentaires d'issue, de PR et messages de commit : 1 à 5 lignes. Un compte rendu détaillé n'est écrit qu'en fin de tâche (skill `handoff`).
- Ne recopie pas de gros blocs de code ou de logs dans une réponse : cite `fichier:ligne`.
- Langue : français, sauf le code, les identifiants et les messages de commit (anglais, `type: description`).

## Contexte
- Lis un fichier par plages (`offset`/`limit`) quand tu sais ce que tu cherches. Lis entièrement seulement un fichier que tu vas modifier en profondeur.
- Recherche large dans un code inconnu (plus de ~5 fichiers à parcourir) : délègue au sous-agent `scout`, qui te rend des chemins et des extraits.
- Commandes bruyantes (tests, build, install) : filtre la sortie (`| tail -50`, `--silent`, `-q`, `grep -E 'FAIL|Error'`). Relance le seul test qui échoue, pas toute la suite.
- Après une tâche terminée ou avant de changer de sujet : skill `handoff`, puis `/clear`.

## Travail
- Change d'échelle selon la tâche : petit correctif → lis, modifie, vérifie, fin. Fonctionnalité → courte liste d'étapes, tests, puis revue.
- Réutilise l'existant (code du projet, bibliothèque standard, dépendances installées) avant d'écrire du neuf.
- Vérifie avant d'annoncer : lance les tests ou la commande concernés et donne le résultat réel. Si une étape a été sautée, dis-le.
- Trois échecs de suite sur le même problème : arrête, résume ce qui a été essayé et ce que tu soupçonnes, et demande (ou écris dans l'issue).
- Code : fonctions courtes, pas de mutation inutile, erreurs gérées explicitement, entrées validées aux frontières, pas de secret en dur.

## Sous-agents
- Exploration et recherche dans le code → `scout`, jamais `general-purpose` ni `Explore`. Y compris pendant un skill superpowers (brainstorming, writing-plans, systematic-debugging…) : quand il faut explorer, c'est `scout`. Les sous-agents d'implémentation et de revue de superpowers restent `general-purpose`.
- `scout` : n'indique pas de `model` à l'appel (le paramètre l'emporte sur son frontmatter, qui fixe Haiku).
- Autres sous-agents : modèle explicite, `sonnet` pour une tâche mécanique, `opus` seulement pour l'architecture ou un débogage difficile.
- Une revue par tâche au plus, et seulement pour du code multi-fichiers ou sensible (auth, entrées utilisateur, secrets, SQL, chemins de fichiers). Pas de revue sur une config, une doc ou un petit correctif.
- Pas de `fork` sur une session dont le contexte dépasse ~100k : il recopie tout le contexte.

## Advisor
- Chaque appel renvoie toute la conversation sans cache : coûteux. Seulement sur les tâches en plusieurs étapes (fonctionnalité, gros refactor, débogage difficile) :
  - au plus une fois avant de choisir l'approche, et une fois avant d'annoncer la fin ;
  - aussi quand tu bloques (erreurs qui reviennent, approche qui ne converge pas).
- Jamais pour une question, une explication, une modif de config ou de script, ou un petit changement sur 1-2 fichiers.

## Git et sécurité
- Commit ou push seulement sur demande (ou si l'issue le demande). Jamais sur `main` directement : branche dédiée.
- Aucun secret dans le code, les commits, les commentaires d'issue ni le vault.

## Mémoire Obsidian (si le serveur MCP `obsidian` est connecté)
- Sur une tâche de projet : `vault_bootstrap` puis `project_resolve` une fois en début de session, lire `_index.md` et `erreurs/`.
- Notes sans `source: claude-*` : écrites par l'utilisateur, ne jamais les réécrire, seulement ajouter une section datée à la fin.
