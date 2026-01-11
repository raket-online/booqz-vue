import type { GeminiRequest, GeminiResponse } from '@/types/api'

export async function callGemini(
  apiKey: string,
  prompt: string,
  model: string = 'gemini-3-flash-preview'
): Promise<string> {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models'

  const request: GeminiRequest = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  }

  const response = await fetch(
    `${baseUrl}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${error}`)
  }

  const data: GeminiResponse = await response.json()

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API returned no candidates')
  }

  return data.candidates[0].content.parts[0].text
}

export function getGeminiModelId(modelId: string): string {
  const modelMap: Record<string, string> = {
    'gemini-pro': 'gemini-3-pro-preview',
    'gemini-flash': 'gemini-3-flash-preview'
  }
  return modelMap[modelId] || modelId
}
