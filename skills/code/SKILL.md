---
name: code
description: Structured feature implementation workflow with 4 phases: explore context, plan, execute, validate. Use when implementing features, fixing bugs, or making code changes. Runs explore-codebase, explore-docs, and websearch agents to gather context, then enters plan mode for approval before executing.
argument-hint: "<feature or task description>"
---

<objective>
Implement features or fixes using a structured 4-phase workflow: Explore → Plan → Execute → Validate.
</objective>

<workflow>

## Phase 1 — Explore

Gather all context needed to implement `{args}` by launching agents in parallel.

**Always run these agents based on what is needed:**

| Agent | When to use |
|-------|-------------|
| `explore-codebase` | Always — find relevant files, patterns, existing utilities |
| `explore-docs` | When using libraries/frameworks — fetch official documentation |
| `websearch` | When approach is unclear — find best practices, examples, gotchas |

**Rules:**
- Always use `explore-codebase` to understand the existing codebase structure
- If the task involves any library or framework, always search its documentation with `explore-docs`
- Launch agents in parallel for efficiency
- Adapt the number of agents to complexity: simple bug fix → 1-2, new feature → 2-4, complex integration → 3-5

**Goal:** Collect enough context to write a concrete implementation plan. Summarize findings before moving to Phase 2.

---

## Phase 2 — Plan

Enter plan mode and produce a detailed implementation plan.

1. Call `EnterPlanMode`
2. Write a step-by-step plan covering:
   - Files to create or modify
   - Key decisions and rationale
   - Any risks or edge cases
3. Wait for user approval before proceeding

---

## Phase 3 — Execute

After the plan is approved, exit plan mode and implement it.

1. Call `ExitPlanMode`
2. Execute the plan step by step
3. Follow existing code conventions and patterns found during exploration

---

## Phase 4 — Validate

Verify the implementation is correct and clean.

1. Run the project's linter (check for `eslint`, `prettier`, `ruff`, `flake8`, `golint`, `cargo clippy`, or similar in the project)
2. Run type checking if applicable (`tsc --noEmit`, `mypy`, etc.)
3. Run relevant tests if they exist
4. Fix any errors found before declaring done
5. Report what was done and the final status

</workflow>

<execution_rules>
- Complete all 4 phases in order — do not skip any phase
- In Phase 1, always check documentation when a library is involved
- In Phase 2, do not start coding until the plan is approved
- In Phase 4, always attempt to run linting/type-checking; do not skip validation
</execution_rules>
