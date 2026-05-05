# Performance Optimization

## Agent Selection (MANDATORY — not optional)

| Task | MUST use | NEVER use |
|------|----------|-----------|
| Read/explore files for context | `Explore` agent | Read, Bash, Grep directly |
| Understand codebase structure | `Explore` agent | multiple direct Read calls |
| Grep for symbols/patterns | `Explore` agent | Bash grep directly |
| Code review | `code-reviewer` | skipping review |
| Write/edit files | main context | agents |
| Complex reasoning, architecture | main context | — |
| Build errors | `build-error-resolver` | direct debugging in main context |

**NEVER read files directly in the main context when the goal is analysis or exploration.**
Always delegate to an agent first. Only read a file directly if you need to make an edit to it.

## Model Tiers

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
Agent(Explore, "analyze file A") + Agent(Explore, "analyze file B")

# WRONG: sequential when independent
Agent(Explore, "analyze file A") → wait → Agent(Explore, "analyze file B")
```

## Context Window

When context > 80%:
- Stop large explorations immediately
- Delegate remaining reads to Explore agent
- Summarize and compact before continuing

## Build Troubleshooting

Build fails → immediately use `build-error-resolver` agent. Do not debug inline.
