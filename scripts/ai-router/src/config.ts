import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { ProviderConfig, ProviderName, RouterConfig, TaskType } from './types'
import { VALID_PROVIDERS, VALID_TASKS } from './types'

const CLAUDE_DIR = join(homedir(), '.claude')
const CONFIG_PATH = join(CLAUDE_DIR, 'ai-router-config.json')
const LEGACY_CONFIG_PATH = join(CLAUDE_DIR, 'nim-config.json')
const ENV_PATH = join(CLAUDE_DIR, '.env')

export const DEFAULT_CONFIG: RouterConfig = {
	activeProvider: 'nvidia-nim',
	tasks: {
		'file-analysis': true,
		'code-review': true,
		explore: true,
		summarize: true,
		docs: false,
	},
	providers: {
		'nvidia-nim': {
			enabled: true,
			model: 'qwen/qwen3-coder-480b-a35b-instruct',
			baseUrl: 'https://integrate.api.nvidia.com/v1',
			apiKeyEnvVar: 'NVIDIA_NIM_API_KEY',
		},
		openrouter: {
			enabled: false,
			model: 'deepseek/deepseek-coder',
			baseUrl: 'https://openrouter.ai/api/v1',
			apiKeyEnvVar: 'OPENROUTER_API_KEY',
		},
		ollama: {
			enabled: false,
			model: 'qwen2.5-coder:32b',
			baseUrl: 'http://localhost:11434/v1',
			apiKeyEnvVar: 'OLLAMA_API_KEY',
		},
		deepseek: {
			enabled: false,
			model: 'deepseek-coder',
			baseUrl: 'https://api.deepseek.com/v1',
			apiKeyEnvVar: 'DEEPSEEK_API_KEY',
		},
	},
}

function migrateLegacyConfig(): RouterConfig | null {
	if (!existsSync(LEGACY_CONFIG_PATH)) return null
	try {
		const raw = readFileSync(LEGACY_CONFIG_PATH, 'utf-8')
		const legacy = JSON.parse(raw)
		const migrated: RouterConfig = {
			...DEFAULT_CONFIG,
			activeProvider: 'nvidia-nim',
			tasks: { ...DEFAULT_CONFIG.tasks, ...(legacy.tasks ?? {}) },
			providers: {
				...DEFAULT_CONFIG.providers,
				'nvidia-nim': {
					...DEFAULT_CONFIG.providers['nvidia-nim'],
					enabled: legacy.enabled ?? true,
					model: legacy.model ?? DEFAULT_CONFIG.providers['nvidia-nim'].model,
					baseUrl: legacy.baseUrl ?? DEFAULT_CONFIG.providers['nvidia-nim'].baseUrl,
				},
			},
		}
		return migrated
	} catch {
		return null
	}
}

export function loadConfig(): RouterConfig {
	if (existsSync(CONFIG_PATH)) {
		try {
			const raw = readFileSync(CONFIG_PATH, 'utf-8')
			const parsed = JSON.parse(raw)
			return deepMerge(DEFAULT_CONFIG, parsed) as RouterConfig
		} catch {
			return { ...DEFAULT_CONFIG }
		}
	}
	const migrated = migrateLegacyConfig()
	if (migrated) {
		saveConfig(migrated)
		return migrated
	}
	return { ...DEFAULT_CONFIG }
}

export function saveConfig(cfg: RouterConfig): void {
	writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n', 'utf-8')
}

function deepMerge(base: unknown, override: unknown): unknown {
	if (typeof base !== 'object' || base === null) return override ?? base
	if (typeof override !== 'object' || override === null) return override ?? base
	const result = { ...(base as Record<string, unknown>) }
	for (const key of Object.keys(override as Record<string, unknown>)) {
		const overrideVal = (override as Record<string, unknown>)[key]
		const baseVal = (base as Record<string, unknown>)[key]
		result[key] = deepMerge(baseVal, overrideVal)
	}
	return result
}

function loadEnv(): Record<string, string> {
	if (!existsSync(ENV_PATH)) return {}
	const lines = readFileSync(ENV_PATH, 'utf-8').split('\n')
	const env: Record<string, string> = {}
	for (const line of lines) {
		const m = line.match(/^([A-Z0-9_]+)=(.+)$/)
		if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
	}
	return env
}

export function loadApiKey(provider: ProviderName): string {
	const cfg = loadConfig()
	const providerCfg = cfg.providers[provider]
	const envVarName = providerCfg.apiKeyEnvVar

	if (provider === 'ollama') {
		const env = loadEnv()
		return env[envVarName] ?? 'ollama'
	}

	const env = loadEnv()
	const key = env[envVarName]

	if (!key) {
		throw new Error(
			`${envVarName} not set in ~/.claude/.env\nAdd: ${envVarName}=your-key-here`,
		)
	}
	return key
}

export function getActiveProvider(): ProviderConfig & { name: ProviderName } {
	const cfg = loadConfig()
	return { name: cfg.activeProvider, ...cfg.providers[cfg.activeProvider] }
}

export function isRoutingEnabled(): boolean {
	const cfg = loadConfig()
	const provider = cfg.providers[cfg.activeProvider]
	return provider.enabled
}

export function isTaskEnabled(task: TaskType): boolean {
	const cfg = loadConfig()
	if (!isRoutingEnabled()) return false
	return cfg.tasks[task] ?? false
}

export function validateProvider(p: string): p is ProviderName {
	return VALID_PROVIDERS.includes(p as ProviderName)
}

export function validateTask(t: string): t is TaskType {
	return VALID_TASKS.includes(t as TaskType)
}
