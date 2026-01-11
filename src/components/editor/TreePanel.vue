<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
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
  if (!confirm('Are you sure you want to delete this chapter and all its contents?')) return
  bookStore.deleteChapter(id)
  bookStore.saveBook()
  // Clear selection if it was the deleted item
  if (editorStore.selectedItemId === id) {
    editorStore.selectedItemId = null
    editorStore.selectedItemType = null
  }
}

function handleDeleteContent(id: number) {
  if (!confirm('Are you sure you want to delete this item?')) return
  bookStore.deleteItem(id, 'content')
  bookStore.saveBook()
  // Clear selection if it was the deleted item
  if (editorStore.selectedItemId === id) {
    editorStore.selectedItemId = null
    editorStore.selectedItemType = null
  }
}

function addChapter() {
  const newChapter = bookStore.addChapter()
  // Select the new chapter
  editorStore.selectSection(newChapter.id)
  bookStore.saveBook()
}

function addParagraph() {
  // Find target section: selected section, or last chapter, or first available section
  let targetSectionId = null

  if (editorStore.selectedItemId && editorStore.selectedItemType === 'section') {
    targetSectionId = editorStore.selectedItemId
  } else if (bookStore.book && bookStore.book.sections.length > 0) {
    // Use the last chapter
    const lastChapter = bookStore.book.sections[bookStore.book.sections.length - 1]
    targetSectionId = lastChapter.id
  } else {
    // No chapters exist, create one first
    const newChapter = bookStore.addChapter()
    targetSectionId = newChapter.id
  }

  if (targetSectionId) {
    const newParagraph = bookStore.addParagraph(targetSectionId, '<p>New paragraph</p>')
    // Select the new paragraph
    editorStore.selectContent(newParagraph.id)
    bookStore.saveBook()
  }
}

function addImage() {
  // Find target section: selected section, or last chapter, or first available section
  let targetSectionId = null

  if (editorStore.selectedItemId && editorStore.selectedItemType === 'section') {
    targetSectionId = editorStore.selectedItemId
  } else if (bookStore.book && bookStore.book.sections.length > 0) {
    // Use the last chapter
    const lastChapter = bookStore.book.sections[bookStore.book.sections.length - 1]
    targetSectionId = lastChapter.id
  } else {
    // No chapters exist, create one first
    const newChapter = bookStore.addChapter()
    targetSectionId = newChapter.id
  }

  if (targetSectionId) {
    const newImage = bookStore.addImage(targetSectionId, '', '')
    // Select the new image
    editorStore.selectContent(newImage.id)
    bookStore.saveBook()
  }
}

// Computed: Get selected item info for display
const selectedItemLabel = computed(() => {
  if (!editorStore.selectedItemId) {
    return 'Nothing selected'
  }

  if (editorStore.selectedItemType === 'section') {
    const section = bookStore.findSection(editorStore.selectedItemId)
    return section ? section.title : 'Unknown Section'
  } else {
    const result = bookStore.findContentItem(editorStore.selectedItemId)
    if (result && result.item.type === 'paragraph') {
      const text = result.item.content_text.replace(/<[^>]*>/g, '')
      return text.substring(0, 30) + (text.length > 30 ? '...' : '')
    } else if (result && result.item.type === 'image') {
      return '🖼 Image'
    }
    return 'Selected Item'
  }
})

const hasSelection = computed(() => !!editorStore.selectedItemId)

// Book title editing
const isEditingTitle = ref(false)
const bookTitleInput = ref('')

function startEditTitle() {
  bookTitleInput.value = bookStore.book?.title || ''
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
  <div class="h-full flex flex-col bg-white border-r">
    <!-- Header -->
    <div class="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-white">
      <div v-if="!isEditingTitle" @click="startEditTitle" class="cursor-pointer group">
        <h2 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors inline-flex items-center gap-2">
          {{ bookStore.book?.title || 'Book' }}
          <i class="fas fa-pen text-xs text-gray-400 opacity-0 group-hover:opacity-100"></i>
        </h2>
      </div>
      <div v-else class="flex items-center gap-2">
        <input
          ref="titleInput"
          v-model="bookTitleInput"
          @keydown="handleTitleKeydown"
          @blur="saveBookTitle"
          class="flex-1 px-2 py-1 text-lg font-semibold border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Book title..."
        />
        <button
          @click="saveBookTitle"
          class="p-1 text-blue-600 hover:text-blue-700"
          title="Save"
        >
          <i class="fas fa-check"></i>
        </button>
        <button
          @click="cancelEditTitle"
          class="p-1 text-gray-400 hover:text-gray-600"
          title="Cancel"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-1">{{ bookStore.chapterCount }} chapters • {{ bookStore.wordCount }} words</p>
    </div>

    <!-- Add Toolbar -->
    <div class="px-3 py-2 border-b bg-gradient-to-b from-gray-50 to-white">
      <!-- Selected Item Indicator -->
      <div class="mb-2 px-2 py-1.5 rounded-md text-xs flex items-center gap-2 border" :class="hasSelection ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-500'">
        <i class="fas fa-crosshairs text-xs"></i>
        <span class="flex-1 truncate font-medium">{{ hasSelection ? 'Selected:' : 'Nothing selected' }}</span>
        <span class="truncate max-w-[120px]">{{ selectedItemLabel }}</span>
      </div>

      <!-- Add Buttons Row -->
      <div class="grid grid-cols-3 gap-2">
        <!-- Add Chapter Button -->
        <button
          @click="addChapter"
          class="relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 active:scale-95 group"
          title="Add a new chapter to the book"
        >
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
            <i class="fas fa-plus text-white text-[10px]"></i>
          </div>
          <i class="fas fa-book text-sm text-blue-600"></i>
          <span class="text-[10px] font-semibold text-blue-700 leading-tight">Add Chapter</span>
        </button>

        <!-- Add Paragraph Button -->
        <button
          @click="addParagraph"
          class="relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 bg-white border border-green-200 hover:border-green-400 hover:bg-green-50 active:scale-95 group"
          title="Add a new paragraph"
        >
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
            <i class="fas fa-plus text-white text-[10px]"></i>
          </div>
          <i class="fas fa-paragraph text-sm text-green-600"></i>
          <span class="text-[10px] font-semibold text-green-700 leading-tight">Add Paragraph</span>
        </button>

        <!-- Add Image Button -->
        <button
          @click="addImage"
          class="relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 active:scale-95 group"
          title="Add an image"
        >
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center shadow-sm">
            <i class="fas fa-plus text-white text-[10px]"></i>
          </div>
          <i class="fas fa-image text-sm text-purple-600"></i>
          <span class="text-[10px] font-semibold text-purple-700 leading-tight">Add Image</span>
        </button>
      </div>

      <!-- Helper Text -->
      <div class="mt-2 px-2 py-1.5 bg-blue-50 rounded-md border border-blue-100">
        <p class="text-[10px] text-blue-700 flex items-start gap-1.5 leading-tight">
          <i class="fas fa-lightbulb text-[10px] mt-0.5"></i>
          <span v-if="!hasSelection">Click buttons to add, or select an item</span>
          <span v-else>Adding below <strong>{{ selectedItemLabel }}</strong></span>
        </p>
      </div>
    </div>

    <!-- Tree Content -->
    <div class="flex-1 overflow-y-auto p-2">
      <div v-if="bookStore.book && bookStore.book.sections.length > 0" class="space-y-1">
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
      <div v-else class="text-center py-8 text-gray-500">
        <i class="fas fa-book-open text-4xl mb-2 text-gray-300"></i>
        <p class="text-sm">No chapters yet</p>
        <p class="text-xs">Click "Chapter" to add one</p>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-2 border-t text-xs text-gray-500">
      <div class="flex items-center justify-between">
        <span v-if="bookStore.lastSaveTime" class="truncate">
          Saved {{ bookStore.lastSaveTime?.toLocaleTimeString() }}
        </span>
        <span v-else>Not saved</span>
        <button
          v-if="bookStore.lastSaveTime"
          @click="bookStore.saveBook()"
          class="text-blue-600 hover:text-blue-700"
          title="Save now"
        >
          <i class="fas fa-save"></i>
        </button>
      </div>
    </div>
  </div>
</template>
