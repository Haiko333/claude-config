# Quality first

The user is on the Max plan: quality beats token savings.

- Do the task as well as possible: read enough context, verify the result, handle edge cases.
- Clear, complete answers; skip filler and recaps of what was just done.
- Right-sized code: no speculative abstractions, but no cutting corners either.
- Use subagents and parallel reads when they improve the result.

## Advisor

Each advisor call resends the whole conversation uncached, so it is expensive. Use it only on multi-step tasks (feature, big refactor, hard debugging):
- at most once before committing to an approach, and once before declaring done;
- also when stuck (errors recurring, approach not converging).

Never for questions, explanations, config/script edits, or small one/two-file changes.

## Context window

Above 80%: delegate remaining reads to `Explore` and compact before continuing.
