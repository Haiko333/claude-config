import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { ProviderName, TaskType } from './types'

const DATA_DIR = join(homedir(), '.claude', 'scripts', 'ai-router', 'data')

// Haiku 4.5 pricing per million tokens (USD)
const HAIKU_INPUT_PER_MTOK = 0.8
const HAIKU_OUTPUT_PER_MTOK = 4.0

// Known model pricing [inputPerMTok, outputPerMTok]
const MODEL_PRICING: Record<string, [number, number]> = {
	// NVIDIA NIM
	'qwen/qwen3-coder-480b-a35b-instruct': [0.4, 1.2],
	'qwen/qwen2.5-coder-32b-instruct': [0.2, 0.6],
	'mistralai/mistral-large-2-instruct': [2.0, 6.0],
	'meta/llama-3.3-70b-instruct': [0.12, 0.4],
	// DeepSeek
	'deepseek-coder': [0.14, 0.28],
	'deepseek-chat': [0.14, 0.28],
	'deepseek-coder-v2': [0.14, 0.28],
	'deepseek-reasoner': [0.55, 2.19],
	// OpenRouter (canonical model IDs)
	'deepseek/deepseek-coder': [0.14, 0.28],
	'deepseek/deepseek-chat': [0.14, 0.28],
	'deepseek/deepseek-r1': [0.55, 2.19],
	'anthropic/claude-haiku-4-5': [0.8, 4.0],
	'anthropic/claude-sonnet-4-5': [3.0, 15.0],
}

export interface UsageEntry {
	timestamp: string
	provider: ProviderName
	model: string
	task: TaskType
	promptTokens: number
	completionTokens: number
	totalTokens: number
	actualCostUsd: number
	haikuEquivCostUsd: number
}

function todayFile(): string {
	const date = new Date().toISOString().split('T')[0]
	return join(DATA_DIR, `${date}.jsonl`)
}

function calcActualCost(
	provider: ProviderName,
	model: string,
	promptTokens: number,
	completionTokens: number,
): number {
	if (provider === 'ollama') return 0
	const pricing = MODEL_PRICING[model]
	if (!pricing) return 0
	const [inputRate, outputRate] = pricing
	return (promptTokens * inputRate + completionTokens * outputRate) / 1_000_000
}

function calcHaikuEquiv(promptTokens: number, completionTokens: number): number {
	return (
		(promptTokens * HAIKU_INPUT_PER_MTOK + completionTokens * HAIKU_OUTPUT_PER_MTOK) / 1_000_000
	)
}

export function logUsage(
	provider: ProviderName,
	model: string,
	task: TaskType,
	promptTokens: number,
	completionTokens: number,
): void {
	try {
		if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

		const entry: UsageEntry = {
			timestamp: new Date().toISOString(),
			provider,
			model,
			task,
			promptTokens,
			completionTokens,
			totalTokens: promptTokens + completionTokens,
			actualCostUsd: calcActualCost(provider, model, promptTokens, completionTokens),
			haikuEquivCostUsd: calcHaikuEquiv(promptTokens, completionTokens),
		}

		appendFileSync(todayFile(), `${JSON.stringify(entry)}\n`, 'utf-8')
	} catch {
		// Never crash the router due to logging failure
	}
}

export function readTodayUsage(): UsageEntry[] {
	try {
		const file = todayFile()
		if (!existsSync(file)) return []
		const lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean)
		return lines
			.map((l) => {
				try {
					return JSON.parse(l) as UsageEntry
				} catch {
					return null
				}
			})
			.filter((e): e is UsageEntry => e !== null)
	} catch {
		return []
	}
}
