export type TaskType = 'file-analysis' | 'code-review' | 'explore' | 'summarize' | 'docs'

export const VALID_TASKS: TaskType[] = [
	'file-analysis',
	'code-review',
	'explore',
	'summarize',
	'docs',
]

export interface NimConfig {
	enabled: boolean
	model: string
	baseUrl: string
	tasks: Partial<Record<TaskType, boolean>>
}

export interface CompletionResult {
	content: string
	model: string
	promptTokens: number
	completionTokens: number
}
