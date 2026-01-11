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

// Watch for content changes in the store (after translation/improvement)
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

  // Get current store content to check if it actually changed
  const result = bookStore.findContentItem(editorStore.selectedItemId)
  const storeContent = result && result.item.type === 'paragraph' ? result.item.content_text : null

  // Skip if content is the same as what's in the store (prevents loops after undo/redo)
  if (storeContent === newContent) return

  editorStore.setDirty(true)

  // Debounce save
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

  // Cancel any pending auto-save
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

  // Cancel any pending auto-save
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

function handleSaveMouseEnter(event: MouseEvent) {
  if (editorStore.isDirty) {
    const target = event.currentTarget as HTMLElement
    target.style.boxShadow = '0 4px 12px rgba(183, 110, 78, 0.4)'
  }
}

function handleSaveMouseLeave(event: MouseEvent) {
  if (editorStore.isDirty) {
    const target = event.currentTarget as HTMLElement
    target.style.boxShadow = '0 2px 8px rgba(183, 110, 78, 0.3)'
  }
}

// Type-safe handlers for AI buttons
function handleImproveMouseEnter(event: Event) {
  if (editorStore.selectedItemId && !improving.value && !translating.value) {
    const target = event.currentTarget as HTMLElement
    target.style.background = 'rgba(164, 139, 126, 0.1)'
  }
}

function handleImproveMouseLeave(event: Event) {
  if (editorStore.selectedItemId && !improving.value && !translating.value) {
    const target = event.currentTarget as HTMLElement
    target.style.background = 'transparent'
  }
}

function handleTranslateMouseEnter(event: Event) {
  if (editorStore.selectedItemId && !improving.value && !translating.value) {
    const target = event.currentTarget as HTMLElement
    target.style.background = 'rgba(183, 110, 78, 0.1)'
  }
}

function handleTranslateMouseLeave(event: Event) {
  if (editorStore.selectedItemId && !improving.value && !translating.value) {
    const target = event.currentTarget as HTMLElement
    target.style.background = 'transparent'
  }
}

// Type-safe handlers for undo/redo
function handleUndoMouseEnter(event: Event) {
  if (canUndo.value) {
    const target = event.currentTarget as HTMLElement
    target.style.background = 'rgba(26, 26, 26, 0.06)'
  }
}

function handleUndoMouseLeave(event: Event) {
  if (canUndo.value) {
    const target = event.currentTarget as HTMLElement
    target.style.background = 'transparent'
  }
}

function handleRedoMouseEnter(event: Event) {
  if (canRedo.value) {
    const target = event.currentTarget as HTMLElement
    target.style.background = 'rgba(26, 26, 26, 0.06)'
  }
}

function handleRedoMouseLeave(event: Event) {
  if (canRedo.value) {
    const target = event.currentTarget as HTMLElement
    target.style.background = 'transparent'
  }
}

// Type-safe handler for toggle notes button
function handleToggleNotesMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(26, 26, 26, 0.06)'
}

function handleToggleNotesMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'transparent'
}
</script>

<template>
  <div class="h-full flex flex-col" style="background: var(--color-bg-primary);">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 px-4 py-3 border-b animate-fade-in"
         style="border-bottom-color: rgba(26, 26, 26, 0.06); background: linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);">
      <!-- AI Actions -->
      <div class="flex items-center gap-1 pr-3 border-r" style="border-right-color: rgba(26, 26, 26, 0.08);">
        <button
          @click="handleImprove"
          @mouseenter="handleImproveMouseEnter"
          @mouseleave="handleImproveMouseLeave"
          :disabled="!editorStore.selectedItemId || improving || translating"
          class="p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          :style="!editorStore.selectedItemId || improving || translating
            ? 'color: var(--color-text-tertiary); background: transparent;'
            : 'color: var(--color-accent-purple); background: transparent;'"
          title="Improve text with AI"
        >
          <i class="fas fa-magic text-base"></i>
        </button>
        <button
          @click="handleTranslate"
          @mouseenter="handleTranslateMouseEnter"
          @mouseleave="handleTranslateMouseLeave"
          :disabled="!editorStore.selectedItemId || improving || translating"
          class="p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          :style="!editorStore.selectedItemId || improving || translating
            ? 'color: var(--color-text-tertiary); background: transparent;'
            : 'color: var(--color-primary); background: transparent;'"
          title="Translate with AI"
        >
          <i class="fas fa-language text-base"></i>
        </button>
      </div>

      <!-- Undo/Redo -->
      <div class="flex items-center gap-1 pr-3 border-r" style="border-right-color: rgba(26, 26, 26, 0.08);">
        <button
          @click="handleUndo"
          @mouseenter="handleUndoMouseEnter"
          @mouseleave="handleUndoMouseLeave"
          :disabled="!canUndo"
          class="p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          style="color: var(--color-text-secondary); background: transparent;"
          title="Undo (Ctrl+Z)"
        >
          <i class="fas fa-undo text-base"></i>
        </button>
        <button
          @click="handleRedo"
          @mouseenter="handleRedoMouseEnter"
          @mouseleave="handleRedoMouseLeave"
          :disabled="!canRedo"
          class="p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          style="color: var(--color-text-secondary); background: transparent;"
          title="Redo (Ctrl+Shift+Z)"
        >
          <i class="fas fa-redo text-base"></i>
        </button>
      </div>

      <!-- Save -->
      <button
        @click="handleSave"
        @mouseenter="handleSaveMouseEnter"
        @mouseleave="handleSaveMouseLeave"
        :disabled="!editorStore.isDirty"
        class="px-3 py-1.5 text-sm rounded-lg transition-all duration-200 btn-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none save-button"
        :style="!editorStore.isDirty
          ? 'background: var(--color-bg-tertiary); color: var(--color-text-tertiary);'
          : 'background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: white; box-shadow: 0 2px 8px rgba(183, 110, 78, 0.3);'"
      >
        <i class="fas fa-save mr-1"></i>
        Save
      </button>

      <!-- Toggle Notes -->
      <button
        v-if="!editorStore.notesPanelOpen"
        @click="editorStore.toggleNotesPanel()"
        @mouseenter="handleToggleNotesMouseEnter"
        @mouseleave="handleToggleNotesMouseLeave"
        class="p-2 rounded-lg transition-all duration-200 hover:scale-105"
        style="color: var(--color-text-secondary); background: transparent;"
        title="Open notes panel"
      >
        <i class="fas fa-chevron-left text-base"></i>
      </button>

      <!-- Status -->
      <div class="flex-1 text-right text-sm transition-all duration-200" style="color: var(--color-text-tertiary);">
        <span v-if="errorMessage" class="transition-colors duration-200" style="color: var(--color-error);">{{ errorMessage }}</span>
        <span v-else-if="improving || translating" class="transition-colors duration-200" style="color: var(--color-primary);">
          <i class="fas fa-spinner fa-spin mr-1"></i>
          {{ improving ? 'Improving...' : 'Translating...' }}
        </span>
        <span v-else-if="isSaving" class="transition-colors duration-200" style="color: var(--color-primary);">Saving...</span>
        <span v-else-if="editorStore.isDirty" class="transition-colors duration-200" style="color: var(--color-warning);">Unsaved</span>
        <span v-else class="transition-colors duration-200" style="color: var(--color-success);">Saved</span>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="flex-1 p-6 overflow-hidden">
      <!-- Empty State -->
      <div v-if="!selectedItem" class="h-full flex items-center justify-center animate-fade-in" style="color: var(--color-text-tertiary);">
        <div class="text-center">
          <i class="fas fa-mouse-pointer text-5xl mb-4 transition-all duration-300" style="color: var(--color-primary-light); opacity: 0.5;"></i>
          <p class="text-lg heading" style="color: var(--color-text-secondary);">Select an item to edit</p>
          <p class="text-sm mt-2 body" style="color: var(--color-text-tertiary);">Choose a paragraph from the tree panel</p>
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
        placeholder="Start writing..."
        class="h-full animate-fade-in"
      />

      <!-- Section Title Editor -->
      <div v-else class="h-full animate-fade-in">
        <h3 class="text-lg heading mb-4" style="color: var(--color-text-primary);">{{ (selectedItem as any).title }}</h3>
        <p class="body" style="color: var(--color-text-tertiary);">Section editing coming soon</p>
      </div>
    </div>
  </div>
</template>
