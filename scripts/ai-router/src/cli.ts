#!/usr/bin/env bun
/**
 * AI Router CLI — route analysis/review tasks to any AI provider
 *
 * Usage:
 *   ai-router status                              # show config & active provider
 *   ai-router use <provider>                      # switch active provider
 *   ai-router enable                              # enable routing
 *   ai-router disable                             # disable routing (fall back to Claude)
 *   ai-router set-model <model>                   # set model for active provider
 *   ai-router set-model <provider> <model>        # set model for specific provider
 *   ai-router set-url <url>                       # set base URL for active provider
 *   ai-router set-url <provider> <url>            # set base URL for specific provider
 *   ai-router task <task> <on|off>                # toggle a task
 *   ai-router providers                           # list all providers + status
 *   ai-router models                              # list models from active provider
 *   ai-router query --task <t> --prompt <p>       # run a task via active provider
 */

import pc from 'picocolors'
import { callProvider } from './client'
import {
	DEFAULT_CONFIG,
	getActiveProvider,
	loadApiKey,
	loadConfig,
	saveConfig,
} from './config'
import { getSystemPrompt } from './prompts'
import type { ProviderName, TaskType } from './types'
import { VALID_PROVIDERS, VALID_TASKS } from './types'
import { logUsage } from './usage-logger'

const args = process.argv.slice(2)
const command = args[0]

function flag(name: string): string | undefined {
	const idx = args.indexOf(name)
	return idx !== -1 ? args[idx + 1] : undefined
}

function providerLabel(name: ProviderName): string {
	const labels: Record<ProviderName, string> = {
		'nvidia-nim': 'NVIDIA NIM',
		openrouter: 'OpenRouter',
		ollama: 'Ollama (local/cloud)',
		deepseek: 'DeepSeek',
	}
	return labels[name]
}

function printStatus() {
	const cfg = loadConfig()
	const active = cfg.providers[cfg.activeProvider]

	console.log(pc.bold('\nAI Router — status\n'))
	console.log(
		`  ${pc.dim('routing:')}  ${active.enabled ? pc.green('enabled') : pc.red('disabled')}`,
	)
	console.log(`  ${pc.dim('provider:')} ${pc.cyan(providerLabel(cfg.activeProvider))} ${pc.dim(`(${cfg.activeProvider})`)}`)
	console.log(`  ${pc.dim('model:   ')} ${pc.cyan(active.model)}`)
	console.log(`  ${pc.dim('base URL:')} ${active.baseUrl}`)
	console.log(`  ${pc.dim('api key: ')} ${pc.dim(active.apiKeyEnvVar)} (from ~/.claude/.env)`)

	console.log(pc.bold('\n  tasks:'))
	for (const task of VALID_TASKS) {
		const on = cfg.tasks[task]
		console.log(`    ${task.padEnd(16)} ${on ? pc.green('on') : pc.dim('off')}`)
	}

	console.log(pc.bold('\n  providers:'))
	for (const name of VALID_PROVIDERS) {
		const p = cfg.providers[name]
		const isActive = name === cfg.activeProvider
		const marker = isActive ? pc.green(' ◀ active') : ''
		const status = p.enabled ? pc.dim('enabled') : pc.dim('disabled')
		console.log(`    ${providerLabel(name).padEnd(22)} ${p.model.padEnd(40)} ${status}${marker}`)
	}
	console.log()
}

function printProviders() {
	const cfg = loadConfig()
	console.log(pc.bold('\nAvailable providers:\n'))
	for (const name of VALID_PROVIDERS) {
		const p = cfg.providers[name]
		const isActive = name === cfg.activeProvider
		console.log(
			`  ${pc.bold(name)}${isActive ? pc.green(' ◀ active') : ''}`,
		)
		console.log(`    label:   ${providerLabel(name)}`)
		console.log(`    model:   ${p.model}`)
		console.log(`    baseUrl: ${p.baseUrl}`)
		console.log(`    apiKey:  ${p.apiKeyEnvVar} (set in ~/.claude/.env)`)
		console.log(`    status:  ${p.enabled ? pc.green('enabled') : pc.dim('disabled')}`)
		console.log()
	}
}

async function listModels() {
	const cfg = loadConfig()
	const providerName = cfg.activeProvider
	const p = cfg.providers[providerName]

	let key: string
	try {
		key = loadApiKey(providerName)
	} catch (err) {
		console.error(pc.red(`Cannot list models: ${err instanceof Error ? err.message : err}`))
		process.exit(1)
	}

	const r = await fetch(`${p.baseUrl.replace(/\/$/, '')}/models`, {
		headers: { Authorization: `Bearer ${key}` },
	})
	if (!r.ok) throw new Error(`API error ${r.status}: ${await r.text()}`)
	const data = await r.json()

	const models: string[] = (data.data ?? data.models ?? [])
		.map((m: { id?: string; name?: string }) => m.id ?? m.name ?? '')
		.filter(
			(id: string) => id && !id.includes('embed') && !id.includes('rerank'),
		)
		.sort()

	console.log(pc.bold(`\nModels from ${providerLabel(providerName)}:\n`))
	for (const m of models) {
		const mark = m === p.model ? pc.green(' ◀ current') : ''
		console.log(`  ${m}${mark}`)
	}
	console.log()
}

async function runQuery(task: TaskType, prompt: string) {
	const cfg = loadConfig()
	const providerName = cfg.activeProvider
	const p = cfg.providers[providerName]

	if (!p.enabled) {
		console.error(pc.red('AI routing is disabled. Run: ai-router enable'))
		process.exit(1)
	}
	if (!cfg.tasks[task]) {
		console.error(pc.red(`Task "${task}" is disabled. Run: ai-router task ${task} on`))
		process.exit(1)
	}

	let key: string
	try {
		key = loadApiKey(providerName)
	} catch (err) {
		console.error(pc.red(`API key error: ${err instanceof Error ? err.message : err}`))
		process.exit(1)
	}

	const systemPrompt = getSystemPrompt(task)
	const result = await callProvider(key, p.baseUrl, p.model, providerName, systemPrompt, prompt)

	process.stdout.write(result.content)
	process.stderr.write(
		`\n[ai-router] provider=${result.provider} model=${result.model} prompt_tokens=${result.promptTokens} completion_tokens=${result.completionTokens}\n`,
	)
	logUsage(result.provider, result.model, task, result.promptTokens, result.completionTokens)
}

async function main() {
	try {
		switch (command) {
			case 'enable': {
				const cfg = loadConfig()
				cfg.providers[cfg.activeProvider].enabled = true
				saveConfig(cfg)
				console.log(pc.green(`AI routing enabled (provider: ${cfg.activeProvider})`))
				break
			}

			case 'disable': {
				const cfg = loadConfig()
				cfg.providers[cfg.activeProvider].enabled = false
				saveConfig(cfg)
				console.log(pc.yellow(`AI routing disabled — Claude models will be used instead`))
				break
			}

			case 'use': {
				const provider = args[1] as ProviderName
				if (!provider || !VALID_PROVIDERS.includes(provider)) {
					console.error(
						`Usage: ai-router use <provider>\nProviders: ${VALID_PROVIDERS.join(', ')}`,
					)
					process.exit(1)
				}
				const cfg = loadConfig()
				cfg.activeProvider = provider
				cfg.providers[provider].enabled = true
				saveConfig(cfg)
				console.log(pc.green(`Active provider set to: ${providerLabel(provider)}`))
				break
			}

			case 'set-model': {
				const cfg = loadConfig()
				let provider: ProviderName = cfg.activeProvider
				let model: string

				if (args.length === 3 && VALID_PROVIDERS.includes(args[1] as ProviderName)) {
					provider = args[1] as ProviderName
					model = args[2]
				} else if (args[1]) {
					model = args[1]
				} else {
					console.error(
						'Usage: ai-router set-model <model>\n       ai-router set-model <provider> <model>',
					)
					process.exit(1)
				}

				cfg.providers[provider].model = model
				saveConfig(cfg)
				console.log(pc.green(`Model for ${providerLabel(provider)} set to: ${model}`))
				break
			}

			case 'set-url': {
				const cfg = loadConfig()
				let provider: ProviderName = cfg.activeProvider
				let url: string

				if (args.length === 3 && VALID_PROVIDERS.includes(args[1] as ProviderName)) {
					provider = args[1] as ProviderName
					url = args[2]
				} else if (args[1]) {
					url = args[1]
				} else {
					console.error(
						'Usage: ai-router set-url <url>\n       ai-router set-url <provider> <url>',
					)
					process.exit(1)
				}

				cfg.providers[provider].baseUrl = url
				saveConfig(cfg)
				console.log(pc.green(`Base URL for ${providerLabel(provider)} set to: ${url}`))
				break
			}

			case 'task': {
				const task = args[1] as TaskType
				const value = args[2]
				if (!task || !value || !['on', 'off'].includes(value)) {
					console.error(`Usage: ai-router task <task> <on|off>\nTasks: ${VALID_TASKS.join(', ')}`)
					process.exit(1)
				}
				if (!VALID_TASKS.includes(task)) {
					console.error(`Unknown task: ${task}. Valid: ${VALID_TASKS.join(', ')}`)
					process.exit(1)
				}
				const cfg = loadConfig()
				cfg.tasks[task] = value === 'on'
				saveConfig(cfg)
				console.log(pc.green(`Task "${task}" ${value === 'on' ? 'enabled' : 'disabled'}`))
				break
			}

			case 'status': {
				printStatus()
				break
			}

			case 'providers': {
				printProviders()
				break
			}

			case 'models': {
				await listModels()
				break
			}

			case 'query': {
				const task = flag('--task') as TaskType
				const prompt = flag('--prompt')
				if (!task || !prompt) {
					console.error('Usage: ai-router query --task <task> --prompt <text>')
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
				console.log(`AI Router — delegate tasks to external AI providers

Usage: ai-router <command> [args]

Provider management:
  status                            Show config, active provider, tasks
  providers                         List all providers with their settings
  use <provider>                    Switch active provider and enable it
  enable                            Enable routing for active provider
  disable                           Disable routing (fall back to Claude)

Model & URL:
  set-model <model>                 Set model for active provider
  set-model <provider> <model>      Set model for specific provider
  set-url <url>                     Set base URL for active provider
  set-url <provider> <url>          Set base URL for specific provider
  models                            List models from active provider's API

Tasks:
  task <task> <on|off>              Toggle a task type
  Tasks: ${VALID_TASKS.join(', ')}

Test:
  query --task <t> --prompt <text>  Run a query via active provider

Providers: ${VALID_PROVIDERS.join(', ')}
`)
				break
			}
		}
	} catch (err) {
		console.error(pc.red(`Error: ${err instanceof Error ? err.message : String(err)}`))
		process.exit(1)
	}
}

main()
