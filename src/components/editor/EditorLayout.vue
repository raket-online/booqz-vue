<script setup lang="ts">
import { onMounted } from 'vue'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'
import TreePanel from './TreePanel.vue'
import EditorPanel from './EditorPanel.vue'
import NotesPanel from './NotesPanel.vue'

const bookStore = useBookStore()
const editorStore = useEditorStore()

onMounted(async () => {
  // Load book on mount
  await bookStore.loadBook()
  editorStore.loadTreeState()
})
</script>

<template>
  <div class="flex h-screen">
    <!-- Tree Panel (35%) -->
    <aside class="w-[35%] min-w-[280px] max-w-[400px]">
      <TreePanel
        @select-section="(id) => console.log('Selected section:', id)"
        @select-content="(id) => console.log('Selected content:', id)"
      />
    </aside>

    <!-- Editor Panel (flexible, adjusts based on notes) -->
    <main class="flex-[3]" :class="{ 'w-0': editorStore.notesPanelOpen }">
      <EditorPanel />
    </main>

    <!-- Notes Panel (flexible width when open) - moved one position down -->
    <aside
      v-if="editorStore.notesPanelOpen"
      class="flex-1 min-w-[180px] max-w-[250px]"
    >
      <NotesPanel />
    </aside>
  </div>
</template>
