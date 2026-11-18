---
name: handoff
description: Écrit un résumé de reprise avant /clear, avant une compaction manuelle ou en fin de tâche - état, décisions, fichiers touchés, prochaine étape. À utiliser quand l'utilisateur dit handoff, reprise, « on s'arrête là », ou quand une tâche est finie.
---

# Handoff

Produis un résumé qui permet à une nouvelle session, sans aucun historique, de reprendre le travail. Écris des faits vérifiés, pas d'intentions.

## Où l'écrire
1. Tâche Multica (variable `MULTICA_TASK_ID` définie) : poste-le comme commentaire de l'issue via `"$MULTICA_CLI_PATH"`. C'est le seul compte rendu détaillé de la tâche.
2. Sinon, dans un dépôt git : `.claude/handoff.md` à la racine (écrase l'ancien ; vérifie que `.claude/handoff.md` est dans `.gitignore`, sinon ajoute-le).
3. Sinon : affiche-le simplement.

## Contenu (60 lignes max)
```markdown
# Handoff — <sujet> — <AAAA-MM-JJ HH:MM>
## Objectif
<1-2 phrases>
## État
- Fait : <liste courte, avec preuves : tests passés, commit <sha>>
- En cours : <ce qui est à moitié fait, où>
- Pas fait / bloqué : <et pourquoi>
## Décisions
- <décision> — <raison> (une ligne chacune)
## Fichiers clés
- `chemin:ligne` — <rôle>
## Pièges rencontrés
- <erreur> → <cause> → <solution>
## Prochaine étape
<la toute prochaine action concrète, avec la commande si possible>
```

## Règles
- Lance `git status --short` et `git log --oneline -5` avant d'écrire, pour ne lister que ce qui existe vraiment.
- Pas de secret, pas de contenu de fichier, pas de log brut (une ligne d'erreur suffit).
- Après l'écriture, en session interactive, propose `/clear` et dis comment reprendre : « lis `.claude/handoff.md` ».
- Si le serveur MCP `obsidian` est connecté et que la session a produit des décisions ou des bugs résolus, propose aussi `/resume-vault`.
