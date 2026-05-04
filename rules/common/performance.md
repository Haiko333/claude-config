# Performance Optimization

## MANDATORY: Token-Cost Decision Tree

Before ANY action, apply this decision tree — no exceptions:

```
Is the task READ-ONLY? (explore files, grep, analyze, summarize, review)
  └─ YES → use ai-explore or ai-review agent. NEVER use Read/Bash/Grep directly.
  └─ NO → Is it WRITING or COMPLEX REASONING?
              └─ YES → use Sonnet (main context) or Write/Edit tools directly.
```

**NEVER read files directly in the main context when the goal is analysis or exploration.**
Always delegate to an agent first. Only read a file directly if you need to make an edit to it.

## Agent Selection (MANDATORY — not optional)

| Task | MUST use | NEVER use |
|------|----------|-----------|
| Read/explore files for context | `ai-explore` | Read, Bash, Grep directly |
| First-pass code review | `ai-review` | code-reviewer directly |
| Understand codebase structure | `ai-explore` | multiple direct Read calls |
| Grep for symbols/patterns | `ai-explore` | Bash grep directly |
| Write/edit files | main context | agents |
| Complex reasoning, architecture | main context | external providers |
| Build errors | `build-error-resolver` | direct debugging in main context |

## Model Tiers

**External AI (cheapest — mandatory for read-only):**
- `ai-explore` → file analysis, codebase exploration, grep, summarize
- `ai-review` → first-pass code review (escalates to code-reviewer if CRITICAL/HIGH)
- Config: `~/.claude/ai-router-config.json` | Keys: `~/.claude/.env`
- CLI: `bun ~/.claude/scripts/ai-router/src/cli.ts <command>`
- Providers: `nvidia-nim` | `openrouter` | `ollama` | `deepseek`

**Haiku 4.5 (use for lightweight agents):**
- Worker agents in multi-agent pipelines
- Repetitive pattern-matching tasks
- Simple transformations

**Sonnet 4.6 (main context — reserve for):**
- Writing and editing files
- Orchestrating multi-agent workflows
- Complex reasoning and decisions

**Opus 4.7 (only when strictly needed):**
- Architectural decisions requiring deep reasoning
- Nothing else

## Parallel Execution (MANDATORY)

ALWAYS launch independent agents in parallel in a single message.
NEVER run agents sequentially when they don't depend on each other.

```
# CORRECT: single message, multiple Agent tool calls
Agent(ai-explore, "analyze file A") + Agent(ai-explore, "analyze file B")

# WRONG: sequential when independent
Agent(ai-explore, "analyze file A") → wait → Agent(ai-explore, "analyze file B")
```

## Context Window

When context > 80%:
- Stop large explorations immediately
- Delegate remaining reads to ai-explore
- Summarize and compact before continuing

## Build Troubleshooting

Build fails → immediately use `build-error-resolver` agent. Do not debug inline.
