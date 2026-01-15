<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'
import EditorLayout from '@/components/editor/EditorLayout.vue'
import SettingsModal from '@/components/modals/SettingsModal.vue'
import FullscreenLoader from '@/components/layout/FullscreenLoader.vue'

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
  <div class="h-screen flex flex-col" style="background: var(--color-canvas);">
    <!-- Editorial Top Bar -->
    <header class="flex-shrink-0 border-b animate-fade-in" style="border-color: var(--color-elevated); background: var(--color-surface);">
      <div class="flex items-center justify-between px-5 py-3">
        <!-- Left: Brand & Book Info -->
        <div class="flex items-center gap-4">
          <!-- Branded Logo -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                 style="background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%); box-shadow: var(--shadow-sm);">
              <span class="text-white font-display text-lg font-semibold">B</span>
            </div>
            <div class="h-6 w-px" style="background: var(--color-elevated);"></div>
            <div>
              <h1 class="font-display text-sm font-semibold" style="color: var(--color-text-primary);">BOOQZ</h1>
              <p class="text-xs" style="color: var(--color-text-tertiary);">{{ bookStore.book?.title || 'Book Editor' }}</p>
            </div>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <!-- Settings -->
          <button
            @click="showSettings = true"
            class="btn-icon-icon"
            title="Settings (⌘,)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-xs font-medium">Settings</span>
          </button>

          <!-- Save Button -->
          <button
            @click="bookStore.saveBook()"
            class="btn-primary"
            title="Save book (⌘S)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
            </svg>
            <span class="text-xs font-semibold">Save</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Editor Layout -->
    <div class="flex-1 overflow-hidden">
      <EditorLayout />
    </div>

    <!-- Settings Modal -->
    <SettingsModal v-if="showSettings" @close="showSettings = false" />

    <!-- Fullscreen Loader -->
    <FullscreenLoader />
  </div>
</template>

<style scoped>
.btn-icon-icon {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.btn-icon-icon:hover {
  background: var(--color-elevated);
  color: var(--color-text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-xs);
}

.btn-icon-icon.btn-icon-active {
  background: var(--color-rose-subtle);
  color: var(--color-accent);
}

.btn-primary {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200;
  background: var(--color-accent);
  color: white;
  font-weight: 600;
}

.btn-primary:hover {
  background: var(--color-accent-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
</style>
