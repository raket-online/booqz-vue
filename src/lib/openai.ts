import type { OpenAIRequest, OpenAIResponse } from '@/types/api'

const BASE_URL = 'https://api.openai.com/v1/chat/completions'

export async function callOpenAI(
  apiKey: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string = 'gpt-4.1-mini-2025-04-14'
): Promise<string> {
  const request: OpenAIRequest = {
    model,
    messages,
    max_completion_tokens: 32768
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.statusText} - ${error}`)
  }

  const data: OpenAIResponse = await response.json()
  return data.choices[0].message.content
}

export function getOpenAIModelId(modelId: string): string {
  // Simply return the model ID as-is (no mapping needed)
  return modelId
}
