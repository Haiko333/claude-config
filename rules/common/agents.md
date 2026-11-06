# Agent Orchestration

Delegate when it improves the result; small known-file reads and edits stay in the main context.

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

## Subagent model & review loop (overrides superpowers:subagent-driven-development)

Always set `model` explicitly when dispatching a subagent:

| Task | Model |
|------|-------|
| Simple/mechanical: 1-2 files, clear spec, tests, small fixes, per-task review, Explore/search | `sonnet` |
| Multi-file integration, tricky debugging, final branch review | `opus` |
| Architecture / design decisions | `opus` |

Never use `haiku` for implementation or review.

`CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is set: a subagent dispatched without `model` runs on Sonnet, so pass `model: "opus"` explicitly for the opus rows above.

**Per-task review only when it earns it.** Skip the per-task review subagent for simple/mechanical tasks (1-2 files, clear spec, tests pass): verify them yourself (diff + tests) and let the final branch review cover them. Dispatch a per-task review for tasks touching several files, shared interfaces, or security-sensitive code.

**No second review.** At most one review per task. When it reports findings, dispatch the fix, then verify the fix yourself (read the diff, run the tests) — do not dispatch a scoped re-review subagent. Same for the final review: one fix wave, verified by you, no re-review.

**Exception — re-review allowed** (one scoped re-review, `opus`) when the fix:
- addresses a Critical finding or a security issue (auth, user input, secrets, SQL/DB queries, crypto, file paths), or
- is large or touches several files, or
- can't be verified by tests (no test covers it, or tests can't run).
Say in one line why you're re-reviewing.
