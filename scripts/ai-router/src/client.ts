import type { CompletionResult, ProviderName } from './types'

export async function callProvider(
	apiKey: string,
	baseUrl: string,
	model: string,
	provider: ProviderName,
	systemPrompt: string,
	userPrompt: string,
): Promise<CompletionResult> {
	const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`

	const headers: Record<string, string> = {
		Authorization: `Bearer ${apiKey}`,
		'Content-Type': 'application/json',
	}

	if (provider === 'openrouter') {
		headers['HTTP-Referer'] = 'https://github.com/Haiko333/claude-config'
		headers['X-Title'] = 'Claude Code Config'
	}

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			model,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			],
			temperature: 0.2,
			max_tokens: 4096,
		}),
	})

	if (!response.ok) {
		const body = await response.text()
		throw new Error(`${provider} API error ${response.status}: ${body}`)
	}

	const data = await response.json()
	const choice = data.choices?.[0]
	if (!choice) throw new Error(`${provider} returned no choices`)

	return {
		content: choice.message?.content ?? '',
		model: data.model ?? model,
		provider,
		promptTokens: data.usage?.prompt_tokens ?? 0,
		completionTokens: data.usage?.completion_tokens ?? 0,
	}
}
