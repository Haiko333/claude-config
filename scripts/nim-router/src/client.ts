import type { CompletionResult } from './types'

export async function callNim(
	apiKey: string,
	baseUrl: string,
	model: string,
	systemPrompt: string,
	userPrompt: string,
): Promise<CompletionResult> {
	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
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
		throw new Error(`NIM API error ${response.status}: ${body}`)
	}

	const data = await response.json()
	const choice = data.choices?.[0]
	if (!choice) throw new Error('NIM returned no choices')

	return {
		content: choice.message.content ?? '',
		model: data.model ?? model,
		promptTokens: data.usage?.prompt_tokens ?? 0,
		completionTokens: data.usage?.completion_tokens ?? 0,
	}
}
