import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'
import { callOpenAI, getOpenAIModelId } from '@/lib/openai'
import { callGemini, getGeminiModelId } from '@/lib/gemini'
import { isLoadingGlobal, translatingGlobal, improvingGlobal } from '@/composables/useGlobalLoader'

export function useTranslator() {
  const settingsStore = useSettingsStore()
  const bookStore = useBookStore()
  const editorStore = useEditorStore()

  const progress = ref({ current: 0, total: 0 })
  const cancelled = ref(false)

  function buildTranslationPrompt(
    content: string,
    targetLanguage: string,
    instructions: string,
    targetAudience: string,
    context?: string
  ): string {
    let prompt = ''

    if (targetAudience) {
      prompt += `Target audience: ${targetAudience}\n\n`
    }

    if (instructions) {
      prompt += `Translation instructions: ${instructions}\n\n`
    }

    if (context) {
      prompt += `Context from surrounding text:\n${context}\n\n---\n\n`
    }

    prompt += `Translate the following HTML content to ${targetLanguage}.\n\n`
    prompt += `Content to translate:\n${content}`

    return prompt
  }

  function buildImprovementPrompt(
    content: string,
    instructions: string,
    targetAudience: string
  ): string {
    let prompt = ''

    if (targetAudience) {
      prompt += `Target audience: ${targetAudience}\n\n`
    }

    if (instructions) {
      prompt += `Improvement instructions: ${instructions}\n\n`
    }

    prompt += `Improve the following HTML content.\n\n`
    prompt += `Content to improve:\n${content}`

    return prompt
  }

  async function translateCurrentItem(): Promise<void> {
    const itemId = editorStore.selectedItemId
    if (!itemId || editorStore.selectedItemType !== 'content') {
      throw new Error('Please select a paragraph to translate')
    }

    const result = bookStore.findContentItem(itemId)
    if (!result || result.item.type !== 'paragraph') {
      throw new Error('Selected item is not a paragraph')
    }

    translatingGlobal.value = true
    cancelled.value = false
    isLoadingGlobal.value = true

    try {
      const settings = settingsStore.settings
      const modelId = settings.selectedAIModel

      // Get API key
      let apiKey: string | null = null
      if (modelId.startsWith('gemini')) {
        apiKey = settingsStore.getApiKey('google')
      } else {
        apiKey = settingsStore.getApiKey('openai')
      }

      if (!apiKey) {
        throw new Error('API key not configured. Please add your API key in Settings.')
      }

      // Get translation settings
      const targetLanguage = settings.translatorGlobalSettings.defaultTargetLanguage
      const instructions = settings.translatorGlobalSettings.instructions
      const targetAudience = settings.translatorGlobalSettings.targetAudience

      // Get context if enabled
      let context = ''
      if (settings.translatorGlobalSettings.includeContext) {
        const ctx = bookStore.getParagraphContext(
          itemId,
          settings.translatorGlobalSettings.contextWordLimit
        )
        context = buildContextString(ctx)
      }

      // Build prompt
      const content = result.item.content_text
      const prompt = buildTranslationPrompt(content, targetLanguage, instructions, targetAudience, context)

      // Call AI
      let translatedContent: string
      if (modelId.startsWith('gemini')) {
        const model = getGeminiModelId(modelId)
        translatedContent = await callGemini(apiKey, prompt, model)
      } else {
        const model = getOpenAIModelId(modelId)
        const messages: Array<{ role: 'system' | 'user'; content: string }> = [
          { role: 'system', content: 'You are a professional translator. Preserve HTML structure exactly.' },
          { role: 'user', content: prompt }
        ]
        translatedContent = await callOpenAI(apiKey, messages, model)
      }

      // Strip markdown code blocks if present
      translatedContent = stripMarkdownCodeBlocks(translatedContent)

      // Update content with new version
      bookStore.updateContent(itemId, translatedContent)
      await bookStore.saveBook()

    } catch (error: any) {
      console.error('Translation error:', error)
      throw error
    } finally {
      translatingGlobal.value = false
      isLoadingGlobal.value = false
      }
  }

  async function improveCurrentItem(): Promise<void> {
    const itemId = editorStore.selectedItemId
    if (!itemId || editorStore.selectedItemType !== 'content') {
      throw new Error('Please select a paragraph to improve')
    }

    const result = bookStore.findContentItem(itemId)
    if (!result || result.item.type !== 'paragraph') {
      throw new Error('Selected item is not a paragraph')
    }

    improvingGlobal.value = true
    cancelled.value = false
    isLoadingGlobal.value = true

    try {
      const settings = settingsStore.settings
      const modelId = settings.selectedAIModel

      // Get API key
      let apiKey: string | null = null
      if (modelId.startsWith('gemini')) {
        apiKey = settingsStore.getApiKey('google')
      } else {
        apiKey = settingsStore.getApiKey('openai')
      }

      if (!apiKey) {
        throw new Error('API key not configured. Please add your API key in Settings.')
      }

      // Get improvement settings
      const improveInstructions = settings.translatorGlobalSettings.improveInstructions
      const targetAudience = settings.translatorGlobalSettings.targetAudience

      // Build prompt
      const content = result.item.content_text
      const prompt = buildImprovementPrompt(content, improveInstructions, targetAudience)

      // Call AI
      let improvedContent: string
      if (modelId.startsWith('gemini')) {
        const model = getGeminiModelId(modelId)
        improvedContent = await callGemini(apiKey, prompt, model)
      } else {
        const model = getOpenAIModelId(modelId)
        const messages: Array<{ role: 'system' | 'user'; content: string }> = [
          { role: 'system', content: 'You are a professional editor. Improve text for fluency and readability while preserving HTML structure.' },
          { role: 'user', content: prompt }
        ]
        improvedContent = await callOpenAI(apiKey, messages, model)
      }

      // Strip markdown code blocks if present
      improvedContent = stripMarkdownCodeBlocks(improvedContent)

      // Update content with new version
      bookStore.updateContent(itemId, improvedContent)
      await bookStore.saveBook()

    } catch (error: any) {
      console.error('Improvement error:', error)
      throw error
    } finally {
      improvingGlobal.value = false
      isLoadingGlobal.value = false
      }
  }

  async function translateAll(onProgress?: (current: number, total: number) => void): Promise<void> {
    const allParagraphs = bookStore.getAllParagraphs()

    if (allParagraphs.length === 0) {
      throw new Error('No paragraphs to translate')
    }

    translatingGlobal.value = true
    cancelled.value = false
    progress.value = { current: 0, total: allParagraphs.length }

    try {
      const settings = settingsStore.settings
      const modelId = settings.selectedAIModel

      // Get API key
      let apiKey: string | null = null
      if (modelId.startsWith('gemini')) {
        apiKey = settingsStore.getApiKey('google')
      } else {
        apiKey = settingsStore.getApiKey('openai')
      }

      if (!apiKey) {
        throw new Error('API key not configured. Please add your API key in Settings.')
      }

      const targetLanguage = settings.translatorGlobalSettings.defaultTargetLanguage
      const instructions = settings.translatorGlobalSettings.instructions
      const targetAudience = settings.translatorGlobalSettings.targetAudience

      for (let i = 0; i < allParagraphs.length; i++) {
        if (cancelled.value) break

        const paragraph = allParagraphs[i]

        // Build prompt (without context for bulk translation)
        const prompt = buildTranslationPrompt(paragraph.content_text, targetLanguage, instructions, targetAudience)

        // Call AI
        let translatedContent: string
        if (modelId.startsWith('gemini')) {
          const model = getGeminiModelId(modelId)
          translatedContent = await callGemini(apiKey, prompt, model)
        } else {
          const model = getOpenAIModelId(modelId)
          const messages: Array<{ role: 'system' | 'user'; content: string }> = [
            { role: 'system', content: 'You are a professional translator. Preserve HTML structure exactly.' },
            { role: 'user', content: prompt }
          ]
          translatedContent = await callOpenAI(apiKey, messages, model)
        }

        // Update content
        bookStore.updateContent(paragraph.id, translatedContent)

        progress.value.current = i + 1
        if (onProgress) {
          onProgress(i + 1, allParagraphs.length)
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Save once at the end
      await bookStore.saveBook()

    } catch (error: any) {
      console.error('Batch translation error:', error)
      throw error
    } finally {
      translatingGlobal.value = false
      progress.value = { current: 0, total: 0 }
    }
  }

  function cancelTranslation() {
    cancelled.value = true
  }

  function buildContextString(context: { previous: string | null; current: string; next: string | null }): string {
    let str = ''
    if (context.previous) str += `Previous: ${context.previous}\n\n`
    str += `Current: ${context.current}\n\n`
    if (context.next) str += `Next: ${context.next}\n`
    return str
  }

  function stripMarkdownCodeBlocks(text: string): string {
    // Remove markdown code blocks (```html ... ```)
    return text.replace(/```html\s*\n?([\s\S]*?)\n?```/g, '$1')
                .replace(/```\s*\n?([\s\S]*?)\n?```/g, '$1')
                .trim()
  }

  return {
    translating: translatingGlobal,
    improving: improvingGlobal,
    progress,
    translateCurrentItem,
    improveCurrentItem,
    translateAll,
    cancelTranslation
  }
}
