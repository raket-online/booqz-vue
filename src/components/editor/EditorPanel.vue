<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'
import { useTranslator } from '@/composables/useTranslator'
import PellEditorWrapper from './PellEditorWrapper.vue'
import ImageViewer from './ImageViewer.vue'

const bookStore = useBookStore()
const editorStore = useEditorStore()
const { translating, improving, translateCurrentItem, improveCurrentItem } = useTranslator()

const errorMessage = ref('')
const content = ref('')
const isSaving = ref(false)

// Get selected item
const selectedItem = computed(() => {
  if (!editorStore.selectedItemId) return null
  if (editorStore.selectedItemType === 'section') {
    return bookStore.findSection(editorStore.selectedItemId)
  } else {
    const result = bookStore.findContentItem(editorStore.selectedItemId)
    return result?.item || null
  }
})

const isParagraph = computed(() => {
  return selectedItem.value && (selectedItem.value as any).type === 'paragraph'
})

const isImage = computed(() => {
  return selectedItem.value && (selectedItem.value as any).type === 'image'
})

const imageUrl = computed(() => {
  if (isImage.value) {
    return (selectedItem.value as any).url
  }
  return null
})

// Watch selection changes and load content
watch(() => [editorStore.selectedItemId, editorStore.selectedItemType], () => {
  if (editorStore.selectedItemId) {
    if (editorStore.selectedItemType === 'content') {
      const result = bookStore.findContentItem(editorStore.selectedItemId!)
      if (result && result.item.type === 'paragraph') {
        content.value = result.item.content_text
      } else {
        content.value = ''
      }
    } else {
      content.value = ''
    }
  } else {
    content.value = ''
  }
}, { immediate: true })

// Watch for content changes in the store
watch(() => selectedItem.value, (newItem) => {
  if (newItem && (newItem as any).type === 'paragraph') {
    const newContent = (newItem as any).content_text
    if (newContent !== content.value) {
      content.value = newContent
    }
  }
}, { deep: true })

// Auto-save with debounce
let saveTimeout: ReturnType<typeof setTimeout> | null = null

watch(content, async (newContent) => {
  if (!editorStore.selectedItemId || editorStore.selectedItemType !== 'content') return
  const result = bookStore.findContentItem(editorStore.selectedItemId)
  const storeContent = result && result.item.type === 'paragraph' ? result.item.content_text : null
  if (storeContent === newContent) return

  editorStore.setDirty(true)
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    isSaving.value = true
    bookStore.updateContent(editorStore.selectedItemId!, newContent)
    await bookStore.saveBook()
    editorStore.markSaved()
    isSaving.value = false
  }, 1000)
})

function handleSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  if (editorStore.selectedItemId && editorStore.selectedItemType === 'content') {
    bookStore.updateContent(editorStore.selectedItemId, content.value)
    bookStore.saveBook()
  }
}

async function handleUndo() {
  if (!editorStore.selectedItemId || editorStore.selectedItemType !== 'content') return
  if (saveTimeout) clearTimeout(saveTimeout)
  bookStore.undo(editorStore.selectedItemId)
  const result = bookStore.findContentItem(editorStore.selectedItemId)
  if (result && result.item.type === 'paragraph') {
    content.value = result.item.content_text
    await bookStore.saveBook()
  }
}

async function handleRedo() {
  if (!editorStore.selectedItemId || editorStore.selectedItemType !== 'content') return
  if (saveTimeout) clearTimeout(saveTimeout)
  bookStore.redo(editorStore.selectedItemId)
  const result = bookStore.findContentItem(editorStore.selectedItemId)
  if (result && result.item.type === 'paragraph') {
    content.value = result.item.content_text
    await bookStore.saveBook()
  }
}

const canUndo = computed(() => {
  if (!editorStore.selectedItemId || editorStore.selectedItemType !== 'content') return false
  return bookStore.canUndo(editorStore.selectedItemId)
})

const canRedo = computed(() => {
  if (!editorStore.selectedItemId || editorStore.selectedItemType !== 'content') return false
  return bookStore.canRedo(editorStore.selectedItemId)
})

async function handleTranslate() {
  if (!editorStore.selectedItemId) return
  errorMessage.value = ''
  try {
    await translateCurrentItem()
  } catch (error: any) {
    errorMessage.value = error.message || 'Translation failed'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

async function handleImprove() {
  if (!editorStore.selectedItemId) return
  errorMessage.value = ''
  try {
    await improveCurrentItem()
  } catch (error: any) {
    errorMessage.value = error.message || 'Improvement failed'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}
</script>

<template>
  <div class="h-full flex flex-col" style="background: var(--color-canvas);">
    <!-- Focus Mode Toolbar -->
    <div class="px-6 py-4 border-b animate-fade-in" style="border-color: var(--color-elevated); background: var(--color-surface);">
      <div class="flex items-center gap-2">
        <!-- AI Actions -->
        <div class="flex items-center gap-1.5 pr-4 border-r" style="border-color: var(--color-elevated);">
          <button
            @click="handleImprove"
            :disabled="!editorStore.selectedItemId || improving || translating"
            class="btn btn-icon relative hover-lift"
            :style="!editorStore.selectedItemId || improving || translating ? 'opacity: 0.4;' : 'opacity: 1; color: #A48B7E;'"
            title="Improve with AI"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2-9-2 9-5.714-2.143L9 7l5.714-2.143L13 3z"/>
            </svg>
            <span v-if="improving" class="absolute inset-0 rounded-lg animate-ping" style="background: rgba(164, 139, 126, 0.3);"></span>
          </button>
          <button
            @click="handleTranslate"
            :disabled="!editorStore.selectedItemId || improving || translating"
            class="btn btn-icon relative hover-lift"
            :style="!editorStore.selectedItemId || improving || translating ? 'opacity: 0.4;' : 'opacity: 1; color: var(--color-accent);'"
            title="Translate with AI"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
            </svg>
            <span v-if="translating" class="absolute inset-0 rounded-lg animate-ping" style="background: rgba(124, 156, 108, 0.3);"></span>
          </button>
        </div>

        <!-- Undo/Redo -->
        <div class="flex items-center gap-1.5 pr-4 border-r" style="border-color: var(--color-elevated);">
          <button
            @click="handleUndo"
            :disabled="!canUndo"
            class="btn btn-icon hover-lift"
            :style="canUndo ? 'color: var(--color-text-secondary);' : 'opacity: 0.3;'"
            title="Undo (Ctrl+Z)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
          </button>
          <button
            @click="handleRedo"
            :disabled="!canRedo"
            class="btn btn-icon hover-lift"
            :style="canRedo ? 'color: var(--color-text-secondary);' : 'opacity: 0.3;'"
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
            </svg>
          </button>
        </div>

        <!-- Save Button -->
        <button
          @click="handleSave"
          :disabled="!editorStore.isDirty"
          class="btn btn-ghost hover-lift"
          :style="editorStore.isDirty ? 'color: var(--color-accent);' : 'opacity: 0.5;'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          <span class="text-sm font-medium">{{ editorStore.isDirty ? 'Save' : 'Saved' }}</span>
        </button>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Status Indicator -->
        <div class="flex items-center gap-2 text-xs" style="color: var(--color-text-tertiary);">
          <span v-if="errorMessage" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style="background: rgba(198, 93, 93, 0.1); color: var(--color-error);">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ errorMessage }}
          </span>
          <span v-else-if="improving || translating" class="flex items-center gap-1.5">
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ improving ? 'Polishing...' : 'Translating...' }}
          </span>
          <span v-else-if="isSaving" class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Saving...
          </span>
          <span v-else-if="editorStore.isDirty" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style="background: rgba(212, 165, 116, 0.1); color: var(--color-warning);">
            <span class="w-1.5 h-1.5 rounded-full" style="background: var(--color-warning);"></span>
            Unsaved
          </span>
          <span v-else class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full" style="background: var(--color-success);"></span>
            Saved
          </span>
        </div>

        <!-- Toggle Notes -->
        <button
          v-if="!editorStore.notesPanelOpen"
          @click="editorStore.toggleNotesPanel()"
          class="btn btn-icon hover-lift ml-4"
          style="color: var(--color-text-secondary);"
          title="Open notes panel"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Empty State -->
      <div v-if="!selectedItem" class="h-full flex items-center justify-center animate-fade-in">
        <div class="text-center">
          <div class="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style="background: var(--color-elevated);">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-accent);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </div>
          <h3 class="font-display text-2xl mb-2" style="color: var(--color-text-primary);">Start writing</h3>
          <p class="text-base max-w-sm mx-auto" style="color: var(--color-text-tertiary);">Select a paragraph from the document outline to begin editing.</p>
        </div>
      </div>

      <!-- Image Viewer -->
      <ImageViewer
        v-else-if="isImage && editorStore.selectedItemId"
        :item-id="editorStore.selectedItemId"
        :url="imageUrl || ''"
        :alt="(selectedItem as any).alt || ''"
      />

      <!-- Text Editor -->
      <PellEditorWrapper
        v-else-if="isParagraph"
        v-model="content"
        placeholder="Begin writing your masterpiece..."
        class="h-full animate-fade-in"
      />

      <!-- Section Title Editor -->
      <div v-else class="h-full flex items-center justify-center animate-fade-in">
        <div class="text-center">
          <div class="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style="background: var(--color-elevated);">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-accent);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3 class="font-display text-xl mb-2" style="color: var(--color-text-primary);">{{ (selectedItem as any).title }}</h3>
          <p class="text-sm" style="color: var(--color-text-tertiary);">Section editing</p>
        </div>
      </div>
    </div>
  </div>
</template>
