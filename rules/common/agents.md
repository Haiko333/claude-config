# Agent Orchestration

## Core Philosophy

Claude's role is to **orchestrate and write**, not to read and analyze.
All read-only work MUST be delegated to agents. This is non-negotiable.

## Automatic Agent Triggers (no user prompt needed)

These trigger automatically — Claude decides, user does not ask:

| Situation | Agent to use | Timing |
|-----------|-------------|--------|
| Need to understand files/codebase | `Explore` | BEFORE reading any file |
| Exploring more than 1 file | `Explore` | Always, in parallel |
| Grep/search across codebase | `Explore` | Always |
| Just wrote or modified code | `code-reviewer` | Immediately after |
| Security-sensitive code changed | `security-reviewer` | Immediately after |
| Build or type errors | `build-error-resolver` | Immediately |
| Complex feature request | `Plan` agent | Before any code |
| Architectural decision needed | `Plan` agent | Before implementing |
| Writing SQL, migrations, or DB schema (MySQL) | `mysql-reviewer` | Immediately after |

## Available Agents

| Agent | Type | Best for |
|-------|------|----------|
| `Explore` | Anthropic | File reads, grep, codebase exploration |
| `explore-codebase` | Anthropic | Deep multi-file analysis |
| `code-reviewer` | Anthropic | Code review |
| `security-reviewer` | Anthropic | Security audit |
| `build-error-resolver` | Anthropic | Build/type errors |
| `typescript-reviewer` | Anthropic | TS/JS specific review |
| `mysql-reviewer` | Anthropic | MySQL queries, schema, migrations, performance |
| `Plan` | Anthropic | Implementation planning |

## Parallel Execution

ALWAYS send independent agents in a single message:

```
# One message with multiple Agent calls = parallel execution
Agent(Explore, task A) + Agent(Explore, task B) + Agent(Explore, task C)
```

Split parallel work whenever:
- Analyzing multiple files or modules
- Running exploration + review simultaneously
- Any set of tasks without dependencies between them

## What Stays in Main Context

Only these actions belong in the main conversation:
- Writing or editing files (Write, Edit tools)
- Making decisions based on agent findings
- Orchestrating the overall plan
- Talking to the user

Everything else → delegate.
