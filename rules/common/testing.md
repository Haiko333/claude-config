# Testing

## When to test

- Logic with a branch, loop, parser, money, or security: leave a test behind.
- Bug fix: add a test that fails without the fix.
- Config, glue code, one-off scripts: no test needed; run it once to verify.

In projects with an existing test suite, follow its conventions and coverage target (80% if none is stated).

## How

- Test first when the behavior is clear up front (RED → GREEN → refactor).
- Arrange-Act-Assert structure.
- Names describe behavior: `returns empty array when no markets match query`.
- Failing test: fix the implementation, not the test, unless the test is wrong.
