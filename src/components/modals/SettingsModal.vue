<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const emit = defineEmits<{
  close: []
}>()

const settingsStore = useSettingsStore()

const activeTab = ref('general')

const tabs = [
  { id: 'general', name: 'General', icon: 'fa-cog' },
  { id: 'translation', name: 'Translation', icon: 'fa-language' },
  { id: 'glossary', name: 'Glossary', icon: 'fa-book' },
  { id: 'apikeys', name: 'API Keys', icon: 'fa-key' },
  { id: 'cloud', name: 'Cloud Backup', icon: 'fa-cloud' },
  { id: 'speech', name: 'Speech', icon: 'fa-microphone' }
]

function close() {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="close"></div>

    <!-- Modal -->
    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h2 class="text-xl font-semibold">Settings</h2>
        <button
          @click="close"
          class="p-2 hover:bg-gray-100 rounded"
        >
          <i class="fas fa-times text-gray-500"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex">
        <!-- Tabs Sidebar -->
        <div class="w-48 border-r bg-gray-50">
          <nav class="p-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="w-full flex items-center gap-3 px-3 py-2 rounded mb-1 text-left"
              :class="activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'"
            >
              <i :class="['fas', tab.icon, 'w-5']"></i>
              <span class="text-sm font-medium">{{ tab.name }}</span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- General Tab -->
          <div v-if="activeTab === 'general'">
            <h3 class="text-lg font-semibold mb-4">General Settings</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  AI Model
                </label>
                <select
                  v-model="settingsStore.settings.selectedAIModel"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="openai-gpt4">OpenAI GPT-4 Mini</option>
                  <option value="gemini-pro">Google Gemini Pro</option>
                  <option value="gemini-flash">Google Gemini Flash</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">Select the AI model for translations</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Default Target Language
                </label>
                <select
                  v-model="settingsStore.settings.translatorGlobalSettings.defaultTargetLanguage"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p class="text-xs text-gray-500 mt-1">Default language for translations</p>
              </div>
            </div>
          </div>

          <!-- Translation Tab -->
          <div v-if="activeTab === 'translation'">
            <h3 class="text-lg font-semibold mb-4">Translation Settings</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Include Context
                </label>
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    v-model="settingsStore.settings.translatorGlobalSettings.includeContext"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-sm">Include surrounding paragraphs for better context</span>
                </label>
                <p class="text-xs text-gray-500 mt-1">Improves translation accuracy but uses more tokens</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Context Word Limit
                </label>
                <input
                  type="number"
                  v-model.number="settingsStore.settings.translatorGlobalSettings.contextWordLimit"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="50"
                  max="1000"
                  step="50"
                />
                <p class="text-xs text-gray-500 mt-1">Maximum words to include from surrounding text</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Translation Instructions
                </label>
                <textarea
                  v-model="settingsStore.settings.translatorGlobalSettings.instructions"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Additional instructions for the translator (optional)"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">Custom prompts to guide translation style</p>
              </div>
            </div>
          </div>

          <!-- API Keys Tab -->
          <div v-if="activeTab === 'apikeys'">
            <h3 class="text-lg font-semibold mb-4">API Keys</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  :value="settingsStore.settings.openai_api_key || ''"
                  @input="settingsStore.setApiKey('openai', ($event.target as HTMLInputElement).value)"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sk-..."
                />
                <p class="text-xs text-gray-500 mt-1">Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" class="text-blue-600 hover:underline">platform.openai.com</a></p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  :value="settingsStore.settings.google_api_key || ''"
                  @input="settingsStore.setApiKey('google', ($event.target as HTMLInputElement).value)"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AIza..."
                />
                <p class="text-xs text-gray-500 mt-1">Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-blue-600 hover:underline">Google AI Studio</a></p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Deepgram API Key
                </label>
                <input
                  type="password"
                  :value="settingsStore.settings.deepgram_api_key || ''"
                  @input="settingsStore.setApiKey('deepgram', ($event.target as HTMLInputElement).value)"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Deepgram API key"
                />
                <p class="text-xs text-gray-500 mt-1">For speech-to-text features</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  ImgBB API Key
                </label>
                <input
                  type="password"
                  :value="settingsStore.settings.imgbb_api_key || ''"
                  @input="settingsStore.setApiKey('imgbb', ($event.target as HTMLInputElement).value)"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ImgBB API key"
                />
                <p class="text-xs text-gray-500 mt-1">For image hosting</p>
              </div>
            </div>
          </div>

          <!-- Glossary Tab -->
          <div v-if="activeTab === 'glossary'">
            <h3 class="text-lg font-semibold mb-4">Translation Glossary</h3>

            <div class="space-y-4">
              <div class="text-sm text-gray-600">
                <p>Add term translations to ensure consistent vocabulary across your book.</p>
              </div>

              <div class="border rounded-lg divide-y max-h-96 overflow-y-auto">
                <div
                  v-for="(entry, index) in settingsStore.settings.translationGlossary"
                  :key="index"
                  class="flex items-center gap-2 p-2"
                >
                  <input
                    :value="entry.source"
                    @input="settingsStore.updateGlossaryEntry(index, ($event.target as HTMLInputElement).value, entry.target)"
                    class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Source term"
                  />
                  <span class="text-gray-400">→</span>
                  <input
                    :value="entry.target"
                    @input="settingsStore.updateGlossaryEntry(index, entry.source, ($event.target as HTMLInputElement).value)"
                    class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Translation"
                  />
                  <button
                    @click="settingsStore.removeGlossaryEntry(index)"
                    class="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <i class="fas fa-trash text-sm"></i>
                  </button>
                </div>
              </div>

              <button
                @click="settingsStore.addGlossaryEntry('', '')"
                class="w-full px-3 py-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
              >
                <i class="fas fa-plus mr-1"></i>
                Add Glossary Entry
              </button>
            </div>
          </div>

          <!-- Cloud Backup Tab -->
          <div v-if="activeTab === 'cloud'">
            <h3 class="text-lg font-semibold mb-4">Cloud Backup</h3>

            <div class="space-y-4">
              <div>
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    v-model="settingsStore.settings.cloudBackupEnabled"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium">Enable cloud backup to Supabase</span>
                </label>
                <p class="text-xs text-gray-500 mt-1">Automatically backup your book every minute</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Backup Username
                </label>
                <input
                  type="text"
                  v-model="settingsStore.settings.auth_username"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your username for backup identification"
                />
                <p class="text-xs text-gray-500 mt-1">Used to identify your backups</p>
              </div>
            </div>
          </div>

          <!-- Speech Tab -->
          <div v-if="activeTab === 'speech'">
            <h3 class="text-lg font-semibold mb-4">Speech-to-Text Settings</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Speech Language
                </label>
                <select
                  v-model="settingsStore.settings.speechSettings.language"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p class="text-xs text-gray-500 mt-1">Language for speech recognition</p>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Auto Punctuation</label>
                  <p class="text-xs text-gray-500">Add punctuation automatically</p>
                </div>
                <input
                  type="checkbox"
                  v-model="settingsStore.settings.speechSettings.autoPunctuate"
                  class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Profanity Filter</label>
                  <p class="text-xs text-gray-500">Filter profane language</p>
                </div>
                <input
                  type="checkbox"
                  v-model="settingsStore.settings.speechSettings.profanityFilter"
                  class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </div>

              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p class="text-sm text-yellow-800">
                  <i class="fas fa-info-circle mr-1"></i>
                  Speech-to-text requires a Deepgram API key. Add it in the API Keys tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t bg-gray-50 flex justify-end">
        <button
          @click="close"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>
