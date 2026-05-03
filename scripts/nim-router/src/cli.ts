#!/usr/bin/env bun
/**
 * NIM Router CLI
 *
 * Usage:
 *   nim-router query  --task <task> --prompt <text>     # run a task via NIM
 *   nim-router enable                                    # enable NIM routing
 *   nim-router disable                                   # disable NIM routing
 *   nim-router status                                    # show current config
 *   nim-router set-model <model-id>                      # change the model
 *   nim-router set-task <task> <on|off>                  # toggle a task
 *   nim-router list-models                               # list NIM models
 *   nim-router list-tasks                                # list available tasks
 */

import pc from 'picocolors'
import { callNim } from './client'
import { loadApiKey, loadConfig, saveConfig } from './config'
import { getSystemPrompt } from './prompts'
import type { TaskType } from './types'
import { VALID_TASKS } from './types'

const args = process.argv.slice(2)
const command = args[0]

function flag(name: string): string | undefined {
	const idx = args.indexOf(name)
	return idx !== -1 ? args[idx + 1] : undefined
}

function printConfig() {
	const cfg = loadConfig()
	console.log(pc.bold('\nNIM Router — current configuration\n'))
	console.log(`  ${pc.dim('enabled:')} ${cfg.enabled ? pc.green('yes') : pc.red('no')}`)
	console.log(`  ${pc.dim('model:  ')} ${pc.cyan(cfg.model)}`)
	console.log(`  ${pc.dim('baseUrl:')} ${cfg.baseUrl}`)
	console.log(pc.bold('\n  tasks:'))
	for (const task of VALID_TASKS) {
		const on = cfg.tasks[task]
		console.log(`    ${task.padEnd(16)} ${on ? pc.green('enabled') : pc.dim('disabled')}`)
	}
	console.log()
}

async function listModels() {
	const key = loadApiKey()
	const cfg = loadConfig()
	const r = await fetch(`${cfg.baseUrl}/models`, {
		headers: { Authorization: `Bearer ${key}` },
	})
	if (!r.ok) throw new Error(`API error ${r.status}: ${await r.text()}`)
	const data = await r.json()
	const models: string[] = data.data
		.map((m: { id: string }) => m.id)
		.filter((id: string) => !id.includes('embed') && !id.includes('rerank'))
		.sort()
	console.log(pc.bold('\nAvailable NIM models:\n'))
	for (const m of models) {
		const mark = m === cfg.model ? pc.green(' ◀ current') : ''
		console.log(`  ${m}${mark}`)
	}
	console.log()
}

async function runQuery(task: TaskType, prompt: string) {
	const cfg = loadConfig()
	if (!cfg.enabled) {
		console.error(pc.red('NIM router is disabled. Run: nim-router enable'))
		process.exit(1)
	}
	if (!cfg.tasks[task]) {
		console.error(pc.red(`Task "${task}" is disabled in nim-config.json`))
		process.exit(1)
	}
	const key = loadApiKey()
	const systemPrompt = getSystemPrompt(task)
	const result = await callNim(key, cfg.baseUrl, cfg.model, systemPrompt, prompt)
	process.stdout.write(result.content)
	process.stderr.write(
		`\n[NIM] model=${result.model} prompt_tokens=${result.promptTokens} completion_tokens=${result.completionTokens}\n`,
	)
}

async function main() {
	try {
		switch (command) {
			case 'enable': {
				const cfg = loadConfig()
				cfg.enabled = true
				saveConfig(cfg)
				console.log(pc.green('NIM router enabled.'))
				break
			}
			case 'disable': {
				const cfg = loadConfig()
				cfg.enabled = false
				saveConfig(cfg)
				console.log(pc.yellow('NIM router disabled.'))
				break
			}
			case 'status': {
				printConfig()
				break
			}
			case 'set-model': {
				const model = args[1]
				if (!model) {
					console.error('Usage: nim-router set-model <model-id>')
					process.exit(1)
				}
				const cfg = loadConfig()
				cfg.model = model
				saveConfig(cfg)
				console.log(pc.green(`Model set to: ${model}`))
				break
			}
			case 'set-task': {
				const task = args[1] as TaskType
				const value = args[2]
				if (!task || !value || !['on', 'off'].includes(value)) {
					console.error('Usage: nim-router set-task <task> <on|off>')
					console.error(`Tasks: ${VALID_TASKS.join(', ')}`)
					process.exit(1)
				}
				if (!VALID_TASKS.includes(task)) {
					console.error(`Unknown task: ${task}. Valid: ${VALID_TASKS.join(', ')}`)
					process.exit(1)
				}
				const cfg = loadConfig()
				cfg.tasks[task] = value === 'on'
				saveConfig(cfg)
				console.log(pc.green(`Task "${task}" set to ${value}`))
				break
			}
			case 'list-models': {
				await listModels()
				break
			}
			case 'list-tasks': {
				console.log(pc.bold('\nAvailable tasks:\n'))
				for (const t of VALID_TASKS) console.log(`  ${t}`)
				console.log()
				break
			}
			case 'query': {
				const task = flag('--task') as TaskType
				const prompt = flag('--prompt')
				if (!task || !prompt) {
					console.error('Usage: nim-router query --task <task> --prompt <text>')
					process.exit(1)
				}
				if (!VALID_TASKS.includes(task)) {
					console.error(`Unknown task: ${task}. Valid: ${VALID_TASKS.join(', ')}`)
					process.exit(1)
				}
				await runQuery(task, prompt)
				break
			}
			default: {
				console.log(`Usage: nim-router <command>

Commands:
  enable                        Enable NIM routing
  disable                       Disable NIM routing
  status                        Show current configuration
  set-model <model-id>          Change the active model
  set-task <task> <on|off>      Toggle a task (file-analysis, code-review, explore, summarize, docs)
  list-models                   List available NIM models
  list-tasks                    List available task types
  query --task <t> --prompt <p> Run a task via NIM API
`)
			}
		}
	} catch (err) {
		console.error(pc.red(`Error: ${err instanceof Error ? err.message : String(err)}`))
		process.exit(1)
	}
}

main()
