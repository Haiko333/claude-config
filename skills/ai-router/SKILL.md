---
name: ai-router
description: Manage the AI router — switch provider, check status, change models, toggle tasks. Supports nvidia-nim, openrouter, ollama, deepseek.
argument-hint: "[status|use <provider>|enable|disable|models|providers|set-model <model>|task <task> on|off]"
---

<objective>
Execute AI router management commands immediately using the Bash tool. Do not describe the commands — run them.
</objective>

<router_cli>
All commands run via:
```
bun /home/haiko/.claude/scripts/ai-router/src/cli.ts <command>
```
</router_cli>

<command_table>
| User says | Command to run |
|-----------|---------------|
| status / (no args) | `bun .../cli.ts status` |
| use nvidia-nim | `bun .../cli.ts use nvidia-nim` |
| use openrouter | `bun .../cli.ts use openrouter` |
| use ollama | `bun .../cli.ts use ollama` |
| use deepseek | `bun .../cli.ts use deepseek` |
| enable | `bun .../cli.ts enable` |
| disable | `bun .../cli.ts disable` |
| providers | `bun .../cli.ts providers` |
| models | `bun .../cli.ts models` |
| set-model \<m\> | `bun .../cli.ts set-model <m>` |
| task \<t\> on/off | `bun .../cli.ts task <t> on` |
</command_table>

<execution_rules>
1. Parse `{args}` to determine which command to run
2. If no args or "status" → run status command
3. Run the command immediately using Bash tool with full path:
   `bun /home/haiko/.claude/scripts/ai-router/src/cli.ts <parsed-command>`
4. Show the output to the user
5. If command fails, show the error and suggest the correct syntax
</execution_rules>

<providers>
- **nvidia-nim** — NVIDIA NIM API (cheapest for code tasks)
- **openrouter** — OpenRouter (access 100+ models via one key)
- **ollama** — Local or hosted Ollama instance (no API cost)
- **deepseek** — DeepSeek API (strong coding models)
</providers>

<env_keys>
Keys go in `~/.claude/.env` (gitignored):
- NVIDIA_NIM_API_KEY
- OPENROUTER_API_KEY
- DEEPSEEK_API_KEY
- OLLAMA_API_KEY (optional, only if auth required)

See `~/.claude/env.example` for the full template.
</env_keys>
