export type TaskType = 'file-analysis' | 'code-review' | 'explore' | 'summarize' | 'docs'

export const VALID_TASKS: TaskType[] = [
	'file-analysis',
	'code-review',
	'explore',
	'summarize',
	'docs',
]

export type ProviderName = 'nvidia-nim' | 'openrouter' | 'ollama' | 'deepseek'

export const VALID_PROVIDERS: ProviderName[] = ['nvidia-nim', 'openrouter', 'ollama', 'deepseek']

export interface ProviderConfig {
	enabled: boolean
	model: string
	baseUrl: string
	apiKeyEnvVar: string
}

export interface RouterConfig {
	activeProvider: ProviderName
	tasks: Partial<Record<TaskType, boolean>>
	providers: Record<ProviderName, ProviderConfig>
}

export interface CompletionResult {
	content: string
	model: string
	provider: ProviderName
	promptTokens: number
	completionTokens: number
}
