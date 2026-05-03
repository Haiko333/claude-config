import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { NimConfig, TaskType } from './types'
import { VALID_TASKS } from './types'

const CLAUDE_DIR = join(homedir(), '.claude')
const CONFIG_PATH = join(CLAUDE_DIR, 'nim-config.json')
const ENV_PATH = join(CLAUDE_DIR, '.env')

const DEFAULT_CONFIG: NimConfig = {
	enabled: false,
	model: 'qwen/qwen3-coder-480b-a35b-instruct',
	baseUrl: 'https://integrate.api.nvidia.com/v1',
	tasks: {
		'file-analysis': true,
		'code-review': true,
		explore: true,
		summarize: true,
		docs: false,
	},
}

export function loadConfig(): NimConfig {
	if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG }
	try {
		const raw = readFileSync(CONFIG_PATH, 'utf-8')
		return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
	} catch {
		return { ...DEFAULT_CONFIG }
	}
}

export function saveConfig(cfg: NimConfig): void {
	writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n', 'utf-8')
}

export function loadApiKey(): string {
	if (!existsSync(ENV_PATH)) {
		throw new Error(`No .env found at ${ENV_PATH}`)
	}
	const env = readFileSync(ENV_PATH, 'utf-8')
	const match = env.match(/^NVIDIA_NIM_API_KEY=(.+)$/m)
	if (!match?.[1]?.trim()) {
		throw new Error('NVIDIA_NIM_API_KEY not set in ~/.claude/.env')
	}
	return match[1].trim().replace(/^["']|["']$/g, '')
}

export function isTaskEnabled(task: TaskType): boolean {
	const cfg = loadConfig()
	if (!cfg.enabled) return false
	return cfg.tasks[task] ?? false
}

export function validateTask(task: string): task is TaskType {
	return VALID_TASKS.includes(task as TaskType)
}
