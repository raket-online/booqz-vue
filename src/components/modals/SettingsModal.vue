<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const emit = defineEmits<{
  close: []
}>()

const settingsStore = useSettingsStore()

const activeTab = ref('general')

const tabs = [
  { id: 'general', name: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'translation', name: 'Translation', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
  { id: 'glossary', name: 'Glossary', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'apikeys', name: 'API Keys', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
  { id: 'cloud', name: 'Cloud', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
  { id: 'speech', name: 'Speech', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' }
]

function close() {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 animate-fade-in" style="background: rgba(28, 25, 23, 0.4); backdrop-filter: blur(4px);" @click="close"></div>

    <!-- Modal -->
    <div class="relative w-full max-w-5xl h-[650px] overflow-hidden flex flex-col animate-scale-in"
         style="background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-2xl);">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b animate-fade-in" style="border-color: var(--color-elevated);">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: var(--color-rose-subtle);">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-accent);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div>
            <h2 class="font-display text-lg font-semibold" style="color: var(--color-text-primary);">Settings</h2>
            <p class="text-xs" style="color: var(--color-text-tertiary);">Customize your experience</p>
          </div>
        </div>
        <button
          @click="close"
          class="btn-close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex">
        <!-- Tabs Sidebar -->
        <div class="w-56 border-r" style="border-color: var(--color-elevated); background: var(--color-canvas);">
          <nav class="p-3 space-y-1">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all duration-200 settings-tab"
              :class="{ 'settings-tab-active': activeTab === tab.id }"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon"/>
              </svg>
              <span class="text-sm font-medium">{{ tab.name }}</span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- General Tab -->
          <div v-if="activeTab === 'general'" class="animate-fade-in">
            <h3 class="font-display text-base font-semibold mb-5" style="color: var(--color-text-primary);">General Settings</h3>

            <div class="space-y-5">
              <div class="settings-field">
                <label class="settings-label">AI Model</label>
                <select
                  v-model="settingsStore.settings.selectedAIModel"
                  class="settings-select"
                >
                  <option value="openai-gpt4">OpenAI GPT-4 Mini</option>
                  <option value="gemini-pro">Google Gemini Pro</option>
                  <option value="gemini-flash">Google Gemini Flash</option>
                </select>
                <p class="settings-hint">Select the AI model for translations</p>
              </div>

              <div class="settings-field">
                <label class="settings-label">Default Target Language</label>
                <select
                  v-model="settingsStore.settings.translatorGlobalSettings.defaultTargetLanguage"
                  class="settings-select"
                >
                  <option value="nl">Dutch (Nederlands)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="fr">French (Français)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="it">Italian (Italiano)</option>
                  <option value="pt">Portuguese (Português)</option>
                  <option value="ru">Russian (Русский)</option>
                  <option value="zh">Chinese (中文)</option>
                  <option value="ja">Japanese (日本語)</option>
                  <option value="ko">Korean (한국어)</option>
                  <option value="ar">Arabic (العربية)</option>
                </select>
                <p class="settings-hint">Default language for translations</p>
              </div>
            </div>
          </div>

          <!-- Translation Tab -->
          <div v-if="activeTab === 'translation'" class="animate-fade-in">
            <h3 class="font-display text-base font-semibold mb-5" style="color: var(--color-text-primary);">Translation Settings</h3>

            <div class="space-y-5">
              <div class="settings-field">
                <label class="settings-label">Include Context</label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="settingsStore.settings.translatorGlobalSettings.includeContext"
                    class="settings-checkbox"
                  />
                  <span class="text-sm" style="color: var(--color-text-secondary);">Include surrounding paragraphs for better context</span>
                </label>
                <p class="settings-hint">Improves translation accuracy but uses more tokens</p>
              </div>

              <div class="settings-field">
                <label class="settings-label">Context Word Limit</label>
                <input
                  type="number"
                  v-model.number="settingsStore.settings.translatorGlobalSettings.contextWordLimit"
                  class="settings-input"
                  min="50"
                  max="1000"
                  step="50"
                />
                <p class="settings-hint">Maximum words to include from surrounding text</p>
              </div>

              <div class="settings-field">
                <label class="settings-label">Translation Instructions</label>
                <textarea
                  v-model="settingsStore.settings.translatorGlobalSettings.instructions"
                  class="settings-textarea"
                  rows="4"
                  placeholder="Additional instructions for the translator (optional)"
                ></textarea>
                <p class="settings-hint">Custom prompts to guide translation style</p>
              </div>
            </div>
          </div>

          <!-- API Keys Tab -->
          <div v-if="activeTab === 'apikeys'" class="animate-fade-in">
            <h3 class="font-display text-base font-semibold mb-5" style="color: var(--color-text-primary);">API Keys</h3>

            <div class="space-y-5">
              <div class="settings-field">
                <label class="settings-label">OpenAI API Key</label>
                <input
                  type="password"
                  :value="settingsStore.settings.openai_api_key || ''"
                  @input="settingsStore.setApiKey('openai', ($event.target as HTMLInputElement).value)"
                  class="settings-input"
                  placeholder="sk-..."
                />
                <p class="settings-hint">Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" class="settings-link">platform.openai.com</a></p>
              </div>

              <div class="settings-field">
                <label class="settings-label">Google Gemini API Key</label>
                <input
                  type="password"
                  :value="settingsStore.settings.google_api_key || ''"
                  @input="settingsStore.setApiKey('google', ($event.target as HTMLInputElement).value)"
                  class="settings-input"
                  placeholder="AIza..."
                />
                <p class="settings-hint">Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" class="settings-link">Google AI Studio</a></p>
              </div>

              <div class="settings-field">
                <label class="settings-label">Deepgram API Key</label>
                <input
                  type="password"
                  :value="settingsStore.settings.deepgram_api_key || ''"
                  @input="settingsStore.setApiKey('deepgram', ($event.target as HTMLInputElement).value)"
                  class="settings-input"
                  placeholder="Deepgram API key"
                />
                <p class="settings-hint">For speech-to-text features</p>
              </div>

              <div class="settings-field">
                <label class="settings-label">ImgBB API Key</label>
                <input
                  type="password"
                  :value="settingsStore.settings.imgbb_api_key || ''"
                  @input="settingsStore.setApiKey('imgbb', ($event.target as HTMLInputElement).value)"
                  class="settings-input"
                  placeholder="ImgBB API key"
                />
                <p class="settings-hint">For image hosting</p>
              </div>
            </div>
          </div>

          <!-- Glossary Tab -->
          <div v-if="activeTab === 'glossary'" class="animate-fade-in">
            <h3 class="font-display text-base font-semibold mb-5" style="color: var(--color-text-primary);">Translation Glossary</h3>

            <div class="space-y-4">
              <div class="card p-4">
                <p class="text-sm" style="color: var(--color-text-secondary);">
                  Add term translations to ensure consistent vocabulary across your book.
                </p>
              </div>

              <div class="border rounded-lg overflow-hidden" style="border-color: var(--color-elevated);">
                <div
                  v-for="(entry, index) in settingsStore.settings.translationGlossary"
                  :key="index"
                  class="flex items-center gap-2 px-4 py-2.5 border-b last:border-b-0 transition-colors hover:bg-elevated"
                  style="border-color: var(--color-elevated);"
                >
                  <input
                    :value="entry.source"
                    @input="settingsStore.updateGlossaryEntry(index, ($event.target as HTMLInputElement).value, entry.target)"
                    class="flex-1 px-3 py-1.5 text-sm rounded-lg border settings-input-mini"
                    placeholder="Source term"
                  />
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-text-tertiary);">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                  <input
                    :value="entry.target"
                    @input="settingsStore.updateGlossaryEntry(index, entry.source, ($event.target as HTMLInputElement).value)"
                    class="flex-1 px-3 py-1.5 text-sm rounded-lg border settings-input-mini"
                    placeholder="Translation"
                  />
                  <button
                    @click="settingsStore.removeGlossaryEntry(index)"
                    class="p-2 rounded-lg transition-all duration-200 hover-lift"
                    style="color: var(--color-error);"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>

              <button
                @click="settingsStore.addGlossaryEntry('', '')"
                class="w-full px-4 py-2.5 rounded-lg border-2 border-dashed text-sm font-medium transition-all duration-200 hover-lift"
                style="border-color: var(--color-elevated); color: var(--color-text-secondary);"
              >
                <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Glossary Entry
              </button>
            </div>
          </div>

          <!-- Cloud Backup Tab -->
          <div v-if="activeTab === 'cloud'" class="animate-fade-in">
            <h3 class="font-display text-base font-semibold mb-5" style="color: var(--color-text-primary);">Cloud Backup</h3>

            <div class="space-y-5">
              <div class="settings-field">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="settingsStore.settings.cloudBackupEnabled"
                    class="settings-checkbox"
                  />
                  <span class="text-sm font-medium" style="color: var(--color-text-primary);">Enable cloud backup to Supabase</span>
                </label>
                <p class="settings-hint">Automatically backup your book every minute</p>
              </div>

              <div class="settings-field">
                <label class="settings-label">Backup Username</label>
                <input
                  type="text"
                  v-model="settingsStore.settings.auth_username"
                  class="settings-input"
                  placeholder="Your username for backup identification"
                />
                <p class="settings-hint">Used to identify your backups</p>
              </div>
            </div>
          </div>

          <!-- Speech Tab -->
          <div v-if="activeTab === 'speech'" class="animate-fade-in">
            <h3 class="font-display text-base font-semibold mb-5" style="color: var(--color-text-primary);">Speech-to-Text Settings</h3>

            <div class="space-y-5">
              <div class="settings-field">
                <label class="settings-label">Speech Language</label>
                <select
                  v-model="settingsStore.settings.speechSettings.language"
                  class="settings-select"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="nl-NL">Dutch (Nederlands)</option>
                  <option value="de-DE">German (Deutsch)</option>
                  <option value="fr-FR">French (Français)</option>
                  <option value="es-ES">Spanish (Español)</option>
                  <option value="it-IT">Italian (Italiano)</option>
                  <option value="pt-BR">Portuguese (Português)</option>
                  <option value="ru-RU">Russian (Русский)</option>
                  <option value="zh-CN">Chinese (中文)</option>
                  <option value="ja-JP">Japanese (日本語)</option>
                  <option value="ko-KR">Korean (한국어)</option>
                </select>
                <p class="settings-hint">Language for speech recognition</p>
              </div>

              <div class="flex items-center justify-between p-4 rounded-lg card">
                <div>
                  <label class="settings-label">Auto Punctuation</label>
                  <p class="text-xs" style="color: var(--color-text-tertiary);">Add punctuation automatically</p>
                </div>
                <input
                  type="checkbox"
                  v-model="settingsStore.settings.speechSettings.autoPunctuate"
                  class="settings-checkbox"
                />
              </div>

              <div class="flex items-center justify-between p-4 rounded-lg card">
                <div>
                  <label class="settings-label">Profanity Filter</label>
                  <p class="text-xs" style="color: var(--color-text-tertiary);">Filter profane language</p>
                </div>
                <input
                  type="checkbox"
                  v-model="settingsStore.settings.speechSettings.profanityFilter"
                  class="settings-checkbox"
                />
              </div>

              <div class="p-4 rounded-lg" style="background: rgba(212, 165, 116, 0.1); border: 1px solid var(--color-warning);">
                <p class="text-sm" style="color: var(--color-warning-dark, #92400E);">
                  <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Speech-to-text requires a Deepgram API key. Add it in the API Keys tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t" style="border-color: var(--color-elevated); background: var(--color-canvas);">
        <div class="flex justify-end">
          <button
            @click="close"
            class="btn-primary-settings"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-close {
  @apply w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200;
  color: var(--color-text-tertiary);
}

.btn-close:hover {
  background: var(--color-elevated);
  color: var(--color-text-primary);
  transform: scale(1.05);
}

.settings-tab {
  color: var(--color-text-secondary);
}

.settings-tab:hover {
  background: var(--color-elevated);
  color: var(--color-text-primary);
}

.settings-tab-active {
  background: var(--color-rose-subtle) !important;
  color: var(--color-accent) !important;
  font-weight: 600;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.settings-label {
  @apply text-sm font-medium;
  color: var(--color-text-primary);
}

.settings-select,
.settings-input,
.settings-textarea {
  @apply w-full px-4 py-2.5 rounded-lg border;
  background: var(--color-surface);
  border-color: var(--color-elevated);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.settings-select:focus,
.settings-input:focus,
.settings-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(124, 156, 108, 0.1);
}

.settings-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.settings-input-mini {
  background: var(--color-surface);
  border-color: var(--color-elevated);
  color: var(--color-text-primary);
  transition: all 0.2s ease;
}

.settings-input-mini:focus {
  outline: none;
  border-color: var(--color-accent);
}

.settings-checkbox {
  @apply w-5 h-5 rounded border;
  border-color: var(--color-elevated);
  accent-color: var(--color-accent);
  cursor: pointer;
}

.settings-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 156, 108, 0.1);
}

.settings-hint {
  @apply text-xs;
  color: var(--color-text-tertiary);
  margin-top: calc(var(--space-1) * -0.5);
}

.settings-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
}

.settings-link:hover {
  color: var(--color-accent-dark);
  text-decoration: underline;
}

.btn-primary-settings {
  @apply px-6 py-2.5 rounded-lg font-semibold transition-all duration-200;
  background: var(--color-accent);
  color: white;
}

.btn-primary-settings:hover {
  background: var(--color-accent-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.hover-bg-elevated:hover {
  background: var(--color-elevated);
}
</style>
