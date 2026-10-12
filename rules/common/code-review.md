# Code Review

## When

- Before a PR or a commit to a shared branch.
- Always for security-sensitive code: auth, user input, DB queries, file paths, external APIs, crypto, payments → `security-reviewer`.
- Skip for config, docs, and trivial edits.

## Checklist

- Readable, well-named; functions <50 lines, files <800, nesting ≤4
- Errors handled explicitly
- No hardcoded secrets, no debug statements
- Risky logic has a test
- No SQL built by string concatenation, no unescaped user input, no unsanitized paths
- No N+1 or unbounded queries

## Severity

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Security vulnerability or data loss | Must fix before merge |
| HIGH | Bug or significant quality issue | Should fix before merge |
| MEDIUM | Maintainability | Consider fixing |
| LOW | Style | Optional |
