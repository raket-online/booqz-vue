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
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 p-3 border-b bg-gray-50">
      <!-- AI Actions -->
      <div class="flex items-center gap-1 pr-3 border-r">
        <button
          @click="handleImprove"
          :disabled="!editorStore.selectedItemId || improving || translating"
          class="p-2 rounded hover:bg-purple-100 disabled:opacity-30 disabled:cursor-not-allowed"
          :class="!editorStore.selectedItemId || improving || translating ? 'text-gray-400' : 'text-purple-600'"
          title="Improve text with AI"
        >
          <i class="fas fa-magic text-base"></i>
        </button>
        <button
          @click="handleTranslate"
          :disabled="!editorStore.selectedItemId || improving || translating"
          class="p-2 rounded hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed"
          :class="!editorStore.selectedItemId || improving || translating ? 'text-gray-400' : 'text-blue-600'"
          title="Translate with AI"
        >
          <i class="fas fa-language text-base"></i>
        </button>
      </div>

      <!-- Undo/Redo -->
      <div class="flex items-center gap-1 pr-3 border-r">
        <button
          @click="handleUndo"
          :disabled="!canUndo"
          class="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700"
          title="Undo (Ctrl+Z)"
        >
          <i class="fas fa-undo text-base"></i>
        </button>
        <button
          @click="handleRedo"
          :disabled="!canRedo"
          class="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700"
          title="Redo (Ctrl+Shift+Z)"
        >
          <i class="fas fa-redo text-base"></i>
        </button>
      </div>

      <!-- Save -->
      <button
        @click="handleSave"
        :disabled="!editorStore.isDirty"
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i class="fas fa-save mr-1"></i>
        Save
      </button>

      <!-- Toggle Notes -->
      <button
        v-if="!editorStore.notesPanelOpen"
        @click="editorStore.toggleNotesPanel()"
        class="p-2 rounded hover:bg-gray-200 text-gray-600"
        title="Open notes panel"
      >
        <i class="fas fa-chevron-left text-base"></i>
      </button>

      <!-- Status -->
      <div class="flex-1 text-right text-sm">
        <span v-if="errorMessage" class="text-red-600">{{ errorMessage }}</span>
        <span v-else-if="improving || translating" class="text-blue-600">
          <i class="fas fa-spinner fa-spin mr-1"></i>
          {{ improving ? 'Improving...' : 'Translating...' }}
        </span>
        <span v-else-if="isSaving" class="text-blue-600">Saving...</span>
        <span v-else-if="editorStore.isDirty" class="text-orange-600">Unsaved</span>
        <span v-else class="text-green-600">Saved</span>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="flex-1 p-6 overflow-hidden">
      <!-- Empty State -->
      <div v-if="!selectedItem" class="h-full flex items-center justify-center text-gray-400">
        <div class="text-center">
          <i class="fas fa-mouse-pointer text-4xl mb-3"></i>
          <p class="text-lg">Select an item to edit</p>
          <p class="text-sm mt-1">Choose a paragraph from the tree panel</p>
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
        class="h-full"
      />

      <!-- Section Title Editor -->
      <div v-else class="h-full">
        <h3 class="text-lg font-semibold mb-4">{{ (selectedItem as any).title }}</h3>
        <p class="text-gray-500">Section editing coming soon</p>
      </div>
    </div>
  </div>
</template>
