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
</script>

<template>
  <div class="h-full flex flex-col bg-white border-l">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b">
      <div class="flex items-center">
        <i class="fas fa-sticky-note text-yellow-500 mr-2"></i>
        <h3 class="font-semibold text-sm">Notes</h3>
      </div>
      <button
        @click="closePanel"
        class="p-1 hover:bg-gray-100 rounded"
        title="Collapse panel"
      >
        <i class="fas fa-chevron-right text-gray-400"></i>
      </button>
    </div>

    <!-- Notes Editor -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="selectedItem" class="h-full">
        <textarea
          v-model="notes"
          class="w-full h-full min-h-[300px] p-4 border-0 rounded-none resize-none focus:outline-none focus:ring-0 text-sm"
          placeholder="Add notes for this item..."
        ></textarea>
      </div>
      <div v-else class="h-full flex items-center justify-center text-gray-400 text-center p-3">
        <div>
          <i class="fas fa-sticky-note text-3xl mb-2"></i>
          <p class="text-sm">Select an item to add notes</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="selectedItem && notes" class="p-3 border-t">
      <button
        @click="clearNotes"
        class="w-full px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
      >
        Clear Notes
      </button>
    </div>
  </div>
</template>
