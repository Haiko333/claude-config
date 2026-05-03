---
name: nim
description: Manage NVIDIA NIM routing — enable/disable, change model, toggle tasks. Run `/nim` for status, `/nim help` for all commands.
model: haiku
allowed-tools: Bash(bun *)
---

# NIM Router Management

Manage which AI tasks are delegated to NVIDIA NIM instead of Anthropic models.

## Current status

!`bun /home/haiko/.claude/scripts/nim-router/src/cli.ts status`

## Commands

Parse the user's message for one of these intents:

### Enable / Disable

```
/nim enable     → bun .../cli.ts enable
/nim disable    → bun .../cli.ts disable
/nim on         → bun .../cli.ts enable
/nim off        → bun .../cli.ts disable
```

### Set model

```
/nim model <model-id>           → bun .../cli.ts set-model <model-id>
/nim set-model <model-id>       → same
/nim model qwen/qwen3-coder-480b-a35b-instruct
```

### Toggle a task

```
/nim task <task> on|off         → bun .../cli.ts set-task <task> on|off
/nim task file-analysis off     → disable file analysis via NIM
/nim task code-review on        → enable code review via NIM
```

Valid tasks: `file-analysis`, `code-review`, `explore`, `summarize`, `docs`

### List models / tasks

```
/nim models     → bun .../cli.ts list-models
/nim tasks      → bun .../cli.ts list-tasks
```

### Status

```
/nim            → show current config (already loaded above)
/nim status     → same
```

### Help

```
/nim help       → print this command reference
```

## Workflow

1. Identify the user's intent from their message (after `/nim`)
2. Run the corresponding `bun /home/haiko/.claude/scripts/nim-router/src/cli.ts <command>` via Bash
3. Show the output clearly
4. If `list-models` is run, highlight the currently active model

## NIM CLI path

```
bun /home/haiko/.claude/scripts/nim-router/src/cli.ts <command>
```

## Cost context

When NIM is enabled, these agents use NIM instead of Anthropic:
- **nim-explore** — replaces `explore-codebase` for file-analysis and explore tasks
- **nim-review** — first-pass review before `code-reviewer` for code-review tasks

This reduces Anthropic token spend for read-heavy, analysis-only tasks.
