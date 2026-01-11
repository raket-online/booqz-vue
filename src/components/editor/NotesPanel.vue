<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'

const bookStore = useBookStore()
const editorStore = useEditorStore()

const notes = ref('')

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

// Watch selection changes and load notes
watch(() => [editorStore.selectedItemId, editorStore.selectedItemType], () => {
  if (selectedItem.value && selectedItem.value.notes) {
    notes.value = selectedItem.value.notes
  } else {
    notes.value = ''
  }
}, { immediate: true })

// Auto-save notes with debounce
let saveTimeout: ReturnType<typeof setTimeout> | null = null

watch(notes, async (newNotes) => {
  if (!editorStore.selectedItemId) return

  // Debounce save
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    // Save notes to the appropriate item
    if (editorStore.selectedItemType === 'section') {
      bookStore.updateSectionNotes(editorStore.selectedItemId!, newNotes)
    } else {
      bookStore.updateContentNotes(editorStore.selectedItemId!, newNotes)
    }
    await bookStore.saveBook()
  }, 1000)
})

function clearNotes() {
  notes.value = ''
  // Also clear in store
  if (editorStore.selectedItemId) {
    if (editorStore.selectedItemType === 'section') {
      bookStore.updateSectionNotes(editorStore.selectedItemId, '')
    } else {
      bookStore.updateContentNotes(editorStore.selectedItemId, '')
    }
    bookStore.saveBook()
  }
}

function closePanel() {
  editorStore.toggleNotesPanel()
}

// Type-safe event handlers
function handleCloseMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(26, 26, 26, 0.06)'
}

function handleCloseMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'transparent'
}

function handleClearMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(198, 93, 93, 0.15)'
}

function handleClearMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(198, 93, 93, 0.1)'
}
</script>

<template>
  <div class="h-full flex flex-col" style="background: var(--color-bg-primary); border-left: 1px solid rgba(26, 26, 26, 0.06);">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b animate-fade-in transition-all duration-200"
         style="border-bottom-color: rgba(26, 26, 26, 0.06); background: linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);">
      <div class="flex items-center gap-2">
        <i class="fas fa-sticky-note text-base transition-all duration-200" style="color: var(--color-warning);"></i>
        <h3 class="heading text-sm" style="color: var(--color-text-primary);">Notes</h3>
      </div>
      <button
        @click="closePanel"
        @mouseenter="handleCloseMouseEnter"
        @mouseleave="handleCloseMouseLeave"
        class="p-1.5 rounded-lg transition-all duration-200 hover:scale-105"
        style="color: var(--color-text-tertiary); background: transparent;"
        title="Collapse panel"
      >
        <i class="fas fa-chevron-right text-sm"></i>
      </button>
    </div>

    <!-- Notes Editor -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="selectedItem" class="h-full animate-fade-in">
        <textarea
          v-model="notes"
          class="w-full h-full min-h-[300px] p-4 border-0 rounded-none resize-none focus:outline-none focus:ring-0 text-sm body transition-colors duration-200"
          style="background: var(--color-bg-primary); color: var(--color-text-primary);"
          placeholder="Add notes for this item..."
        ></textarea>
      </div>
      <div v-else class="h-full flex items-center justify-center text-center p-3 animate-fade-in">
        <div>
          <i class="fas fa-sticky-note text-4xl mb-3 transition-all duration-300" style="color: var(--color-warning); opacity: 0.5;"></i>
          <p class="text-sm body" style="color: var(--color-text-tertiary);">Select an item to add notes</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="selectedItem && notes" class="px-4 py-3 border-t animate-fade-in" style="border-top-color: rgba(26, 26, 26, 0.06);">
      <button
        @click="clearNotes"
        @mouseenter="handleClearMouseEnter"
        @mouseleave="handleClearMouseLeave"
        class="w-full px-3 py-1.5 text-sm rounded-lg transition-all duration-200 btn-base hover:scale-105"
        style="color: var(--color-error); background: rgba(198, 93, 93, 0.1); border: 1px solid rgba(198, 93, 93, 0.2);"
      >
        <i class="fas fa-trash-alt mr-2 text-xs"></i>
        Clear Notes
      </button>
    </div>
  </div>
</template>
