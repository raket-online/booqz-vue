<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'

const bookStore = useBookStore()
const editorStore = useEditorStore()
const notes = ref('')

const selectedItem = computed(() => {
  if (!editorStore.selectedItemId) return null
  if (editorStore.selectedItemType === 'section') {
    return bookStore.findSection(editorStore.selectedItemId)
  } else {
    const result = bookStore.findContentItem(editorStore.selectedItemId)
    return result?.item || null
  }
})

watch(() => [editorStore.selectedItemId, editorStore.selectedItemType], () => {
  if (selectedItem.value && selectedItem.value.notes) {
    notes.value = selectedItem.value.notes
  } else {
    notes.value = ''
  }
}, { immediate: true })

let saveTimeout: ReturnType<typeof setTimeout> | null = null
watch(notes, async (newNotes) => {
  if (!editorStore.selectedItemId) return
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
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
  <div class="h-full flex flex-col" style="background: var(--color-surface); border-left: 1px solid var(--color-elevated);">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b animate-fade-in" style="border-color: var(--color-elevated);">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--color-rose-subtle);">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-warning);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </div>
        <h3 class="font-heading text-sm" style="color: var(--color-text-primary);">Notes</h3>
      </div>
      <button
        @click="closePanel"
        class="btn btn-icon hover-lift"
        style="color: var(--color-text-tertiary);"
        title="Collapse panel"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- Notes Editor -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="selectedItem" class="h-full animate-fade-in">
        <textarea
          v-model="notes"
          class="w-full h-full min-h-[300px] p-5 border-0 resize-none focus:outline-none focus:ring-0 text-sm body input"
          style="background: var(--color-canvas); color: var(--color-text-primary); line-height: 1.6;"
          placeholder="Add your thoughts, context, or reminders here..."
        ></textarea>
      </div>
      <div v-else class="h-full flex items-center justify-center text-center p-6 animate-fade-in">
        <div class="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style="background: var(--color-elevated);">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-text-tertiary);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </div>
        <p class="text-sm" style="color: var(--color-text-tertiary);">Select an item to add notes</p>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="selectedItem && notes" class="p-4 border-t animate-fade-in" style="border-color: var(--color-elevated);">
      <button
        @click="clearNotes"
        class="w-full btn btn-ghost hover-lift"
        style="color: var(--color-error);"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Clear Notes
      </button>
    </div>
  </div>
</template>
