// Settings and configuration types

import type { Book } from './book'

export type AIModelId = 'openai-gpt4' | 'gemini-pro' | 'gemini-flash'

export interface AIModel {
  id: AIModelId
  name: string
  provider: 'openai' | 'google'
  maxTokens: number
}

export interface TranslationSettings {
  includeContext: boolean
  contextWordLimit: number
  instructions: string        // Custom translation prompt
  defaultTargetLanguage: string
}

export interface GlossaryEntry {
  source: string              // Source term
  target: string              // Translation
}

export interface SpeechSettings {
  language: string            // Language code for Deepgram (e.g., 'en-US', 'nl-NL')
  autoPunctuate: boolean      // Auto punctuation
  profanityFilter: boolean    // Filter profanity
}

export interface AppSettings {
  // API Keys
  openai_api_key: string | null
  google_api_key: string | null
  deepgram_api_key: string | null
  imgbb_api_key: string | null

  // AI Settings
  selectedAIModel: AIModelId

  // Translation
  translatorGlobalSettings: TranslationSettings

  // Glossary
  translationGlossary: GlossaryEntry[]

  // Speech
  speechSettings: SpeechSettings

  // Cloud Backup
  cloudBackupEnabled: boolean
  auth_username: string

  // UI State
  notesPanelOpen: boolean
  treeCollapseState: Record<number, boolean>
}

export interface BackupMetadata {
  id: number
  timestamp: string
  bookTitle: string
  size: number                // Bytes
}

export interface Backup extends BackupMetadata {
  book: Book
  settings: AppSettings
}
