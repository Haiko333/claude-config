# Claude Code Config

Personal Claude Code configuration — agents, rules, skills, hooks, and scripts that make Claude Code more productive and secure.

## What's inside

| Directory / File | Purpose |
|------------------|---------|
| `agents/` | Custom agent definitions (code-reviewer, security-reviewer, nim-explore, nim-review, …) |
| `rules/common/` | Language-agnostic rules loaded on every session (security, testing, git workflow, …) |
| `rules/typescript/` | TypeScript-specific rules |
| `skills/` | Slash-command skills (`/ultrathink`, `/tdd-workflow`, `/apex`, `/nim`, …) |
| `scripts/command-validator/` | PreToolUse security hook — blocks dangerous Bash commands |
| `scripts/statusline/` | Custom status bar (git branch, session cost, token usage) |
| `scripts/nim-router/` | NVIDIA NIM routing CLI — delegates analysis tasks to NIM models |
| `nim-config.json` | NIM routing config — which tasks go to NIM and which model to use |
| `settings.json` | Main Claude Code settings (hooks, permissions, statusline) |
| `install.sh` | Installer for Linux & macOS |
| `install.ps1` | Installer for Windows (PowerShell) |

## Install

### Linux / macOS

One-liner (SSH auth required for clone, falls back to HTTPS automatically):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Haiko333/claude-config/main/install.sh)
```

Or clone first and run locally:

```bash
git clone git@github.com:Haiko333/claude-config.git ~/.claude
bash ~/.claude/install.sh
```

### Windows

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
irm https://raw.githubusercontent.com/Haiko333/claude-config/main/install.ps1 | iex
```

Or clone and run locally:

```powershell
git clone https://github.com/Haiko333/claude-config.git $env:USERPROFILE\.claude
Set-ExecutionPolicy Bypass -Scope Process -Force
& "$env:USERPROFILE\.claude\install.ps1"
```

### What the installer does

1. Installs **Bun** if not already present
2. Clones the repo into `~/.claude` (or updates it if already present)
3. Runs `bun install` inside `scripts/` to install hook and statusline dependencies
4. Rewrites hardcoded author paths in `settings.json` to your actual home directory
5. Resolves `{CLAUDE_PATH}` placeholders in plugin hook files
6. Installs `ccusage` globally (required by the statusline)
7. Adds `cc` and `ccc` shell aliases to your profile

## Agents

| Agent | When it's used |
|-------|---------------|
| `action` | Conditional action executor |
| `build-error-resolver` | Automatically fixes build and TypeScript errors |
| `code-reviewer` | Reviews code after every write/modify |
| `database-reviewer` | SQL, schema design, and Supabase patterns |
| `explore-codebase` | Broad codebase exploration tasks |
| `explore-docs` | Library documentation research via Context7 |
| `nim-explore` | File analysis and exploration via NVIDIA NIM (cheaper than Anthropic for read tasks) |
| `nim-review` | First-pass code review via NVIDIA NIM, escalates to code-reviewer if needed |
| `security-reviewer` | OWASP Top 10 and vulnerability detection |
| `typescript-reviewer` | TypeScript/JavaScript type safety review |
| `websearch` | Quick web searches |

## Skills (slash commands)

| Skill | Command | Purpose |
|-------|---------|---------|
| ultrathink | `/ultrathink` | Deep thinking mode for complex problems |
| apex | `/apex` | Analyze-Plan-Execute-Validate workflow |
| tdd-workflow | `/tdd-workflow` | Enforces write-tests-first discipline |
| code | `/code` | Structured feature implementation (explore → plan → execute → test) |
| oneshot | `/oneshot` | Ultra-fast single-file feature implementation |
| security-review | `/security-review` | Full security review of current branch changes |
| commit | `/commit` | Quick commit with clean message |
| create-pr | `/create-pr` | Auto-generate PR title and description |
| fix-errors | `/fix-errors` | Fix all ESLint and TypeScript errors in parallel |
| fix-pr-comments | `/fix-pr-comments` | Apply all PR review comments automatically |

## Rules loaded on every session

- **security** — mandatory checks before every commit (no hardcoded secrets, input validation, etc.)
- **testing** — 80% minimum coverage, TDD workflow enforced
- **code-review** — mandatory review triggers and severity levels
- **coding-style** — immutability, KISS/DRY/YAGNI, file size limits
- **git-workflow** — conventional commits format, PR workflow
- **development-workflow** — research → plan → TDD → review → commit pipeline
- **performance** — model selection strategy, context window management
- **agents** — when to spawn which agent and how to parallelize
- **patterns** — repository pattern, API response format, skeleton projects

## Security hook

Every Bash command is validated by `scripts/command-validator/src/cli.ts` before execution. It blocks patterns like `rm -rf /`, `curl | bash`, `sudo`, and other destructive operations.

Run tests:

```bash
cd ~/.claude/scripts
bun test command-validator
```

## NVIDIA NIM routing

Delegate read-heavy tasks (file analysis, code exploration, first-pass review) to NVIDIA NIM models instead of Anthropic models, reducing costs.

### Setup

Add your API key to `~/.claude/.env` (gitignored):

```bash
NVIDIA_NIM_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
```

### Configure via CLI

```bash
cd ~/.claude/scripts
bun nim-router/src/cli.ts status                             # show config
bun nim-router/src/cli.ts enable                             # enable NIM routing
bun nim-router/src/cli.ts disable                            # disable, fall back to Anthropic
bun nim-router/src/cli.ts set-model qwen/qwen3-coder-480b-a35b-instruct
bun nim-router/src/cli.ts set-task code-review off           # disable a task
bun nim-router/src/cli.ts list-models                        # list all available models
```

### Configuration file

`nim-config.json` (tracked in git, no secrets):

```json
{
  "enabled": true,
  "model": "qwen/qwen3-coder-480b-a35b-instruct",
  "tasks": {
    "file-analysis": true,
    "code-review": true,
    "explore": true,
    "summarize": true,
    "docs": false
  }
}
```

### CLI (direct)

```bash
cd ~/.claude/scripts
bun run nim:status
bun run nim:enable
bun run nim:disable
bun run nim:models
```

## Statusline

The custom status bar shows git branch, session cost, and token usage. It requires `ccusage`:

```bash
bun add -g ccusage
```

## Updating

```bash
cd ~/.claude
git pull
bun install --cwd scripts
```

## Notes

- `settings.json` contains hardcoded absolute paths — the install script rewrites them automatically on new machines.
- Audio hooks (`paplay`) are Linux-only. On macOS the installer switches to `afplay`. On Windows, Stop/Notification hooks are removed.
- `CLAUDE.md` (local orientation guide for Claude sessions) is gitignored and not included in this repo.
