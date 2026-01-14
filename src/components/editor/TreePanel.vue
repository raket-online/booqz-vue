<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'
import TreeNode from '@/components/tree/TreeNode.vue'

const bookStore = useBookStore()
const editorStore = useEditorStore()
const titleInput = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  'select-section': [id: number]
  'select-content': [id: number]
}>()

function handleSelectSection(id: number) {
  editorStore.selectSection(id)
  emit('select-section', id)
}

function handleSelectContent(id: number) {
  editorStore.selectContent(id)
  emit('select-content', id)
}

function handleToggleCollapse(id: number) {
  editorStore.toggleTreeNode(id)
}

function handleDeleteSection(id: number) {
  if (!confirm('Delete this chapter and all its contents?')) return
  bookStore.deleteChapter(id)
  bookStore.saveBook()
  if (editorStore.selectedItemId === id) {
    editorStore.selectedItemId = null
    editorStore.selectedItemType = null
  }
}

function handleDeleteContent(id: number) {
  if (!confirm('Delete this item?')) return
  bookStore.deleteItem(id, 'content')
  bookStore.saveBook()
  if (editorStore.selectedItemId === id) {
    editorStore.selectedItemId = null
    editorStore.selectedItemType = null
  }
}

function addChapter() {
  const newChapter = bookStore.addChapter()
  editorStore.selectSection(newChapter.id)
  bookStore.saveBook()
}

function addParagraph() {
  let targetSectionId = null

  if (editorStore.selectedItemId && editorStore.selectedItemType === 'section') {
    targetSectionId = editorStore.selectedItemId
  } else if (bookStore.book && bookStore.book.sections.length > 0) {
    const lastChapter = bookStore.book.sections[bookStore.book.sections.length - 1]
    targetSectionId = lastChapter.id
  } else {
    const newChapter = bookStore.addChapter()
    targetSectionId = newChapter.id
  }

  if (targetSectionId) {
    const newParagraph = bookStore.addParagraph(targetSectionId, '<p>New paragraph</p>')
    editorStore.selectContent(newParagraph.id)
    bookStore.saveBook()
  }
}

function addImage() {
  let targetSectionId = null

  if (editorStore.selectedItemId && editorStore.selectedItemType === 'section') {
    targetSectionId = editorStore.selectedItemId
  } else if (bookStore.book && bookStore.book.sections.length > 0) {
    const lastChapter = bookStore.book.sections[bookStore.book.sections.length - 1]
    targetSectionId = lastChapter.id
  } else {
    const newChapter = bookStore.addChapter()
    targetSectionId = newChapter.id
  }

  if (targetSectionId) {
    const newImage = bookStore.addImage(targetSectionId, '', '')
    editorStore.selectContent(newImage.id)
    bookStore.saveBook()
  }
}

function addSubchapter() {
  let targetSectionId = null

  // Prefer selected section, otherwise use last chapter, or create new chapter
  if (editorStore.selectedItemId && editorStore.selectedItemType === 'section') {
    targetSectionId = editorStore.selectedItemId
  } else if (bookStore.book && bookStore.book.sections.length > 0) {
    // Use last chapter if nothing selected
    const lastChapter = bookStore.book.sections[bookStore.book.sections.length - 1]
    targetSectionId = lastChapter.id
  }

  if (!targetSectionId) {
    // Create a new chapter first if no sections exist
    const newChapter = bookStore.addChapter()
    targetSectionId = newChapter.id
    bookStore.saveBook()
  }

  try {
    const newSubchapter = bookStore.addSubchapter(targetSectionId)
    editorStore.selectSection(newSubchapter.id)
    bookStore.saveBook()
  } catch (error: any) {
    console.error('Failed to add subchapter:', error)
    alert('Could not add section: ' + (error.message || 'Unknown error'))
  }
}

// Book title editing
const isEditingTitle = ref(false)
const bookTitleInput = ref('')

function startEditTitle() {
  bookTitleInput.value = bookStore.book?.title || 'Untitled Book'
  isEditingTitle.value = true
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

function saveBookTitle() {
  if (bookTitleInput.value.trim()) {
    bookStore.updateBookTitle(bookTitleInput.value.trim())
    bookStore.saveBook()
  }
  isEditingTitle.value = false
}

function cancelEditTitle() {
  isEditingTitle.value = false
}

function handleTitleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    saveBookTitle()
  } else if (event.key === 'Escape') {
    cancelEditTitle()
  }
}
</script>

<template>
  <div class="h-full flex flex-col" style="background: var(--color-canvas);">
    <!-- Compact Header -->
    <div class="px-4 py-3 border-b animate-fade-in" style="border-color: var(--color-elevated); background: var(--color-surface);">
      <!-- Book Title with Inline Stats -->
      <div class="flex items-center gap-2">
        <div v-if="!isEditingTitle" @click="startEditTitle" class="flex-1 cursor-pointer group">
          <div class="flex items-center gap-2">
            <h1 class="font-display text-base font-semibold" style="color: var(--color-text-primary);">
              {{ bookStore.book?.title || 'Untitled Book' }}
            </h1>
            <span class="text-xs px-1.5 py-0.5 rounded" style="background: var(--color-elevated); color: var(--color-text-tertiary);">
              {{ bookStore.chapterCount }} chapters · {{ bookStore.wordCount }} words
            </span>
          </div>
          <svg class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-accent);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
        </div>
        <div v-else class="flex-1 flex items-center gap-2">
          <input
            ref="titleInput"
            v-model="bookTitleInput"
            @keydown="handleTitleKeydown"
            @blur="saveBookTitle"
            class="flex-1 px-2 py-1 font-display text-sm font-semibold input"
            placeholder="Book title..."
          />
          <button @click="saveBookTitle" class="btn-icon-compact" style="color: var(--color-accent);">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </button>
          <button @click="cancelEditTitle" class="btn-icon-compact" style="color: var(--color-text-tertiary);">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Document Tree -->
    <div class="flex-1 overflow-y-auto px-3 py-2">
      <div v-if="bookStore.book && bookStore.book.sections.length > 0" class="space-y-1 animate-fade-in">
        <TreeNode
          v-for="section in bookStore.book.sections"
          :key="section.id"
          :section="section"
          :collapsed="editorStore.isTreeNodeCollapsed(section.id)"
          @select-section="handleSelectSection"
          @select-content="handleSelectContent"
          @toggle-collapse="handleToggleCollapse"
          @delete-section="handleDeleteSection"
          @delete-content="handleDeleteContent"
        />
      </div>
      <div v-else class="h-full flex flex-col items-center justify-center text-center py-8 animate-fade-in">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background: var(--color-elevated);">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-accent);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <h3 class="font-display text-sm mb-1" style="color: var(--color-text-primary);">Start your book</h3>
        <p class="text-xs max-w-xs mx-auto" style="color: var(--color-text-tertiary);">Create your first chapter to begin writing.</p>
      </div>
    </div>

    <!-- Footer with Action Buttons & Save Status -->
    <div class="border-t animate-fade-in" style="border-color: var(--color-elevated); background: var(--color-surface);">
      <!-- Action Buttons Grid - 4 Buttons -->
      <div class="px-3 py-2 border-b" style="border-color: var(--color-elevated);">
        <div class="grid grid-cols-4 gap-2">
          <!-- Chapter Button -->
          <button
            @click="addChapter"
            class="group relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg compact-btn"
          >
            <div class="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                 style="background: var(--color-rose-subtle); color: var(--color-accent);">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <p class="text-[10px] font-medium" style="color: var(--color-accent-dark);">Chapter</p>
          </button>

          <!-- Subchapter Button -->
          <button
            @click="addSubchapter"
            class="group relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg compact-btn"
          >
            <div class="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                 style="background: rgba(124, 156, 108, 0.15); color: var(--color-accent);">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253 M9 5l7 7-7 7"/>
              </svg>
            </div>
            <p class="text-[10px] font-medium" style="color: var(--color-accent);">Subchapter</p>
          </button>

          <!-- Paragraph Button -->
          <button
            @click="addParagraph"
            class="group relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg compact-btn"
          >
            <div class="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                 style="background: rgba(107, 144, 128, 0.1); color: var(--color-success);">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
            </div>
            <p class="text-[10px] font-medium" style="color: var(--color-success);">Text</p>
          </button>

          <!-- Image Button -->
          <button
            @click="addImage"
            class="group relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg compact-btn"
          >
            <div class="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                 style="background: rgba(164, 139, 126, 0.1); color: #A48B7E;">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-[10px] font-medium" style="color: #A48B7E;">Image</p>
          </button>
        </div>
      </div>

      <!-- Save Status -->
      <div class="px-3 py-2">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5" style="color: var(--color-text-tertiary);">
            <span v-if="bookStore.lastSaveTime" class="flex items-center gap-1">
              <span class="w-1 h-1 rounded-full" style="background: var(--color-success);"></span>
              <span class="text-[10px]">Saved {{ bookStore.lastSaveTime?.toLocaleTimeString() }}</span>
            </span>
            <span v-else class="flex items-center gap-1">
              <span class="w-1 h-1 rounded-full" style="background: var(--color-warning);"></span>
              <span class="text-[10px]">Unsaved</span>
            </span>
          </div>
          <button
            v-if="bookStore.lastSaveTime"
            @click="bookStore.saveBook()"
            class="btn-icon-compact"
            style="color: var(--color-accent);"
            title="Save now"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-icon-compact {
  @apply w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200;
}

.btn-icon-compact:hover {
  background: var(--color-elevated);
}

.compact-btn {
  transition: all 0.2s ease;
}

.compact-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-xs);
}
</style>
