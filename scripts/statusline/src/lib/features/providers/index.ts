import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const AI_ROUTER_DATA_DIR = join(homedir(), '.claude', 'scripts', 'ai-router', 'data')

interface UsageEntry {
	timestamp: string
	provider: string
	model: string
	task: string
	promptTokens: number
	completionTokens: number
	totalTokens: number
	actualCostUsd: number
	haikuEquivCostUsd: number
}

export interface ProviderDayStats {
	totalTokens: number
	promptTokens: number
	completionTokens: number
	callCount: number
	actualCostUsd: number
	haikuEquivCostUsd: number
	byProvider: Record<
		string,
		{
			tokens: number
			callCount: number
			actualCostUsd: number
			haikuEquivCostUsd: number
		}
	>
}

function todayFile(): string {
	const date = new Date().toISOString().split('T')[0]
	return join(AI_ROUTER_DATA_DIR, `${date}.jsonl`)
}

export function getTodayProviderStats(): ProviderDayStats | null {
	try {
		const file = todayFile()
		if (!existsSync(file)) return null

		const lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean)
		if (lines.length === 0) return null

		const entries: UsageEntry[] = lines
			.map((l) => {
				try {
					return JSON.parse(l) as UsageEntry
				} catch {
					return null
				}
			})
			.filter((e): e is UsageEntry => e !== null)

		if (entries.length === 0) return null

		const stats: ProviderDayStats = {
			totalTokens: 0,
			promptTokens: 0,
			completionTokens: 0,
			callCount: 0,
			actualCostUsd: 0,
			haikuEquivCostUsd: 0,
			byProvider: {},
		}

		for (const e of entries) {
			stats.totalTokens += e.totalTokens
			stats.promptTokens += e.promptTokens
			stats.completionTokens += e.completionTokens
			stats.callCount++
			stats.actualCostUsd += e.actualCostUsd
			stats.haikuEquivCostUsd += e.haikuEquivCostUsd

			if (!stats.byProvider[e.provider]) {
				stats.byProvider[e.provider] = {
					tokens: 0,
					callCount: 0,
					actualCostUsd: 0,
					haikuEquivCostUsd: 0,
				}
			}
			const p = stats.byProvider[e.provider]
			p.tokens += e.totalTokens
			p.callCount++
			p.actualCostUsd += e.actualCostUsd
			p.haikuEquivCostUsd += e.haikuEquivCostUsd
		}

		return stats
	} catch {
		return null
	}
}
