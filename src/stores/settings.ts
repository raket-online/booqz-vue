import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { AppSettings, TranslationSettings, AIModelId } from '@/types/settings'

const DEFAULT_SETTINGS: AppSettings = {
  openai_api_key: null,
  google_api_key: null,
  deepgram_api_key: null,
  imgbb_api_key: null,
  selectedAIModel: 'openai-gpt4',
  translatorGlobalSettings: {
    includeContext: true,
    contextWordLimit: 200,
    instructions: `# Role
Act as an expert translator and localization specialist. You are skilled in transcreation, ensuring that the essence, emotional impact, and cultural nuances of the source text are perfectly preserved in the target language.

# Task
Translate the provided text from the [SOURCE LANGUAGE] to [TARGET LANGUAGE], adhering to these professional standards:

1. **Meaning over Literalism:** Prioritize the original intent and meaning over a word-for-word translation. If a literal translation sounds awkward, choose an equivalent expression that is common in the target language.
2. **Contemporary Usage:** Use modern, natural-sounding language. Avoid archaic phrasing unless the original text explicitly calls for it.
3. **Cultural Adaptation:** Adapt idioms, metaphors, and cultural references so they resonate with the target audience. If a reference doesn't exist in the target culture, replace it with a culturally appropriate equivalent that conveys the same message.
4. **Tone & Style:** Maintain the original tone (e.g., professional, poetic, humorous, or urgent). The reader should feel as though the text was originally written in the target language.

# Constraints
- **Output Format:** Provide ONLY the translated text. No introductions or explanations.
- **Accuracy:** Ensure no factual information or core messages are lost in the process.`,
    improveInstructions: `# Role
Act as a professional developmental editor and proofreader. You specialize in manuscript restoration and stylistic refinement, focusing on readability and structural flow.

# Task
Your objective is to rewrite the provided text to enhance its professional quality while strictly maintaining its original essence. Follow these requirements:

1. **Text Restoration:** Identify and fix broken sentences caused by line breaks or formatting errors. Merge fragments into complete, logical sentences.
2. **Paragraph Structuring:** Evaluate the paragraph breaks. If the text is a "wall of text" or if the breaks are illogical, redistribute the content into clear, well-structured paragraphs to improve readability.
3. **Grammar & Spelling:** Correct all errors in spelling, punctuation, and syntax.
4. **Clarity & Flow:** Improve the sentence transitions to ensure a smooth, professional reading experience.
5. **Tone Preservation:** Maintain the exact "Tone of Voice" of the input text. The rewritten version must mirror the atmosphere and intent of the original.

# Constraints
- **Language Policy:** Write the output in the EXACT same language as the input text.
- **Output Format:** Provide only the rewritten text. Do not provide introductions, explanations, or meta-comments.
- **Content Integrity:** Do not alter the core meaning or facts of the original text.`,
    targetAudience: 'General adult readers',
    defaultTargetLanguage: 'nl'
  },
  translationGlossary: [],
  speechSettings: {
    language: 'en-US',
    autoPunctuate: true,
    profanityFilter: false
  },
  cloudBackupEnabled: false,
  auth_username: '',
  notesPanelOpen: true,
  treeCollapseState: {}
}

export const useSettingsStore = defineStore('settings', () => {
  // Load settings from localStorage
  const loadSettings = (): AppSettings => {
    const stored = localStorage.getItem('booqz_settings')
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      } catch (e) {
        console.error('Failed to parse settings:', e)
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  }

  const settings = ref<AppSettings>(loadSettings())

  // Persist to localStorage
  watch(settings, (value) => {
    localStorage.setItem('booqz_settings', JSON.stringify(value))
  }, { deep: true })

  // API Keys
  function setApiKey(provider: 'openai' | 'google' | 'deepgram' | 'imgbb', key: string) {
    const keyMap: Record<string, keyof AppSettings> = {
      openai: 'openai_api_key',
      google: 'google_api_key',
      deepgram: 'deepgram_api_key',
      imgbb: 'imgbb_api_key'
    }
    const settingKey = keyMap[provider]
    if (settingKey) {
      ;(settings.value as any)[settingKey] = key || null
    }
  }

  function getApiKey(provider: 'openai' | 'google' | 'deepgram' | 'imgbb'): string | null {
    const keyMap: Record<string, keyof AppSettings> = {
      openai: 'openai_api_key',
      google: 'google_api_key',
      deepgram: 'deepgram_api_key',
      imgbb: 'imgbb_api_key'
    }
    const settingKey = keyMap[provider]
    if (settingKey) {
      return (settings.value as any)[settingKey] || null
    }
    return null
  }

  function hasApiKey(provider: 'openai' | 'google' | 'deepgram' | 'imgbb'): boolean {
    return !!getApiKey(provider)
  }

  // AI Model
  function setSelectedModel(modelId: AIModelId) {
    settings.value.selectedAIModel = modelId
  }

  function getSelectedModel(): AIModelId {
    return settings.value.selectedAIModel
  }

  // Translation Settings
  function updateTranslationSettings(newSettings: Partial<TranslationSettings>) {
    settings.value.translatorGlobalSettings = {
      ...settings.value.translatorGlobalSettings,
      ...newSettings
    }
  }

  // Glossary
  function addGlossaryEntry(source: string, target: string) {
    settings.value.translationGlossary.push({ source, target })
  }

  function removeGlossaryEntry(index: number) {
    settings.value.translationGlossary.splice(index, 1)
  }

  function updateGlossaryEntry(index: number, source: string, target: string) {
    if (settings.value.translationGlossary[index]) {
      settings.value.translationGlossary[index] = { source, target }
    }
  }

  // Speech
  function updateSpeechSettings(newSettings: Partial<typeof settings.value.speechSettings>) {
    settings.value.speechSettings = {
      ...settings.value.speechSettings,
      ...newSettings
    }
  }

  function setSpeechLanguage(language: string) {
    settings.value.speechSettings.language = language
  }

  // Cloud Backup
  function setCloudBackupEnabled(enabled: boolean) {
    settings.value.cloudBackupEnabled = enabled
  }

  function setAuthUsername(username: string) {
    settings.value.auth_username = username
  }

  // Reset to defaults
  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
  }

  return {
    settings,
    setApiKey,
    getApiKey,
    hasApiKey,
    setSelectedModel,
    getSelectedModel,
    updateTranslationSettings,
    addGlossaryEntry,
    removeGlossaryEntry,
    updateGlossaryEntry,
    updateSpeechSettings,
    setSpeechLanguage,
    setCloudBackupEnabled,
    setAuthUsername,
    resetSettings
  }
})
