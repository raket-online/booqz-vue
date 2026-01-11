<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'
import EditorLayout from '@/components/editor/EditorLayout.vue'
import SettingsModal from '@/components/modals/SettingsModal.vue'

const bookStore = useBookStore()
const editorStore = useEditorStore()

const showSettings = ref(false)

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  // Ctrl+S / Cmd+S - Save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    bookStore.saveBook()
  }

  // Ctrl+Z / Cmd+Z - Undo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    if (editorStore.selectedItemId && editorStore.selectedItemType === 'content') {
      event.preventDefault()
      bookStore.undo(editorStore.selectedItemId)
    }
  }

  // Ctrl+Shift+Z / Cmd+Shift+Z - Redo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
    if (editorStore.selectedItemId && editorStore.selectedItemType === 'content') {
      event.preventDefault()
      bookStore.redo(editorStore.selectedItemId)
    }
  }

  // Escape - Clear selection
  if (event.key === 'Escape') {
    editorStore.clearSelection()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-screen overflow-hidden">
    <!-- Top Bar -->
    <div class="h-14 bg-white border-b flex items-center px-4">
      <h1 class="text-lg font-semibold text-gray-900">BOOQZ</h1>
      <span class="mx-3 text-gray-300">|</span>
      <span class="text-sm text-gray-600">{{ bookStore.book?.title || 'Book Editor' }}</span>
      <div class="flex-1"></div>
      <div class="flex items-center gap-3">
        <button
          @click="editorStore.toggleNotesPanel()"
          class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          :class="editorStore.notesPanelOpen ? 'bg-blue-50 text-blue-700 border-blue-300' : 'text-gray-700'"
        >
          <i class="fas fa-sticky-note mr-1"></i>
          Notes
        </button>
        <button
          @click="showSettings = true"
          class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-gray-700"
        >
          <i class="fas fa-cog mr-1"></i>
          Settings
        </button>
        <button
          @click="bookStore.saveBook()"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <i class="fas fa-save mr-1"></i>
          Save
        </button>
      </div>
    </div>

    <!-- Editor Layout -->
    <EditorLayout />

    <!-- Settings Modal -->
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>
