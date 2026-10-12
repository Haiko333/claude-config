# Agent Orchestration

Agents start cold and cost tokens. Default: work directly in the main context.

## When to delegate

| Situation | Agent |
|-----------|-------|
| Broad search across many files or an unfamiliar large codebase | `Explore` |
| Feature touching several modules, or an architectural decision | `Plan` |
| Auth, user input, secrets, payments, DB queries changed | `security-reviewer` |
| Build or type errors not fixed after one direct attempt | `build-error-resolver` |
| Non-trivial code change before a PR | `code-reviewer` (`typescript-reviewer` for TS/JS) |

Do not delegate reading a few known files, small edits, config, or scripts.

## Parallel execution

Independent agents go in a single message, never one after another.
