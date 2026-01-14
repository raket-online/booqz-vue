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
    instructions: 'Maintain formal tone and academic style. Preserve all HTML tags and structure exactly as they are. Only translate the text content within the tags.',
    improveInstructions: 'Improve for fluency, readability, and clarity while maintaining the original meaning. Preserve all HTML tags and structure exactly as they are. Only improve the text content within the tags.',
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
