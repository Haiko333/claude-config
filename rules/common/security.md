# Security Guidelines

## Before a commit that touches auth, user input, DB queries, secrets or external APIs
- No hardcoded secrets (API keys, passwords, tokens)
- User input validated at the boundary
- Parameterized queries, no SQL by string concatenation
- Output escaped (XSS); CSRF protection on cookie-auth forms
- Error messages don't leak sensitive data
- Rate limiting on public endpoints

## Secret Management
- Secrets live in environment variables or a secret manager, never in code
- Validate required secrets at startup
- Rotate any secret that may have been exposed

## If a security issue is found
Fix CRITICAL issues before continuing; use the **security-reviewer** agent for anything non-trivial.
