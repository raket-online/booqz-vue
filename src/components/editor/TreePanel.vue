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

// Type-safe event handlers for buttons
function handleChapterMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.borderColor = 'rgba(183, 110, 78, 0.3)'
  target.style.boxShadow = '0 4px 12px rgba(183, 110, 78, 0.15)'
}

function handleChapterMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.borderColor = 'rgba(26, 26, 26, 0.06)'
  target.style.boxShadow = 'var(--shadow-xs)'
}

function handleParagraphMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.borderColor = 'rgba(107, 144, 128, 0.3)'
  target.style.boxShadow = '0 4px 12px rgba(107, 144, 128, 0.15)'
}

function handleParagraphMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.borderColor = 'rgba(26, 26, 26, 0.06)'
  target.style.boxShadow = 'var(--shadow-xs)'
}

function handleImageMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.borderColor = 'rgba(164, 139, 126, 0.3)'
  target.style.boxShadow = '0 4px 12px rgba(164, 139, 126, 0.15)'
}

function handleImageMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.borderColor = 'rgba(26, 26, 26, 0.06)'
  target.style.boxShadow = 'var(--shadow-xs)'
}

function handleSaveTitleMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(126, 155, 126, 0.2)'
}

function handleSaveTitleMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(126, 155, 126, 0.1)'
}

function handleCancelTitleMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(154, 154, 154, 0.2)'
}

function handleCancelTitleMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(154, 154, 154, 0.1)'
}

function handleSaveBookMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(183, 110, 78, 0.1)'
}

function handleSaveBookMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'transparent'
}
</script>

<template>
  <div class="h-full flex flex-col" style="background: #FEFEFD;">
    <!-- Header -->
    <div class="px-6 py-5 border-b animate-fade-in" style="border-bottom-color: rgba(26, 26, 26, 0.06); background: linear-gradient(180deg, #FEFEFD 0%, #F8F6F4 100%);">
      <div v-if="!isEditingTitle" @click="startEditTitle" class="cursor-pointer group">
        <h2 class="text-xl heading inline-flex items-center gap-3" style="color: #1A1A1A;">
          {{ bookStore.book?.title || 'Book' }}
          <span class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
            <i class="fas fa-pen text-xs" style="color: #B76E4E;"></i>
          </span>
        </h2>
      </div>
      <div v-else class="flex items-center gap-3">
        <input
          ref="titleInput"
          v-model="bookTitleInput"
          @keydown="handleTitleKeydown"
          @blur="saveBookTitle"
          class="flex-1 px-3 py-2 text-xl heading border rounded-lg focus:outline-none"
          style="border-color: rgba(183, 110, 78, 0.3); background: #FEFEFD;"
          placeholder="Book title..."
        />
        <button
          @click="saveBookTitle"
          @mouseenter="handleSaveTitleMouseEnter"
          @mouseleave="handleSaveTitleMouseLeave"
          class="p-2 rounded-lg transition-all duration-200"
          style="color: #7E9B7E; background: rgba(126, 155, 126, 0.1);"
        >
          <i class="fas fa-check"></i>
        </button>
        <button
          @click="cancelEditTitle"
          @mouseenter="handleCancelTitleMouseEnter"
          @mouseleave="handleCancelTitleMouseLeave"
          class="p-2 rounded-lg transition-all duration-200"
          style="color: #9A9A9A; background: rgba(154, 154, 154, 0.1);"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <p class="text-xs mt-2" style="color: #9A9A9A;">{{ bookStore.chapterCount }} chapters • {{ bookStore.wordCount }} words</p>
    </div>

    <!-- Add Toolbar -->
    <div class="px-5 py-4 border-b animate-fade-in" style="border-bottom-color: rgba(26, 26, 26, 0.06); background: #F8F6F4;">
      <!-- Selected Item Indicator -->
      <div class="mb-3 px-4 py-2.5 rounded-xl text-xs flex items-center gap-3 transition-all duration-300"
           :class="hasSelection ? '' : ''"
           :style="hasSelection ? 'background: rgba(183, 110, 78, 0.08); border: 1px solid rgba(183, 110, 78, 0.2); color: #8F4A31;' : 'background: rgba(26, 26, 26, 0.03); border: 1px solid rgba(26, 26, 26, 0.06); color: #9A9A9A;'">
        <i class="fas fa-crosshairs text-xs"></i>
        <span class="flex-1 font-medium">{{ hasSelection ? 'Selected:' : 'Nothing selected' }}</span>
        <span class="truncate max-w-[120px]">{{ selectedItemLabel }}</span>
      </div>

      <!-- Add Buttons Row -->
      <div class="grid grid-cols-3 gap-3">
        <!-- Add Chapter Button -->
        <button
          @click="addChapter"
          @mouseenter="handleChapterMouseEnter"
          @mouseleave="handleChapterMouseLeave"
          class="group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 btn-base border-subtle"
          style="background: #FEFEFD;"
        >
          <div class="absolute -top-2 -right-2 w-5 h-5 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
               style="background: linear-gradient(135deg, #B76E4E 0%, #8F4A31 100%); box-shadow: 0 2px 8px rgba(183, 110, 78, 0.4);">
            <i class="fas fa-plus text-white text-[10px]"></i>
          </div>
          <i class="fas fa-book text-lg" style="color: #2C3E50;"></i>
          <span class="text-[10px] font-semibold tracking-wide" style="color: #8F4A31;">CHAPTER</span>
        </button>

        <!-- Add Paragraph Button -->
        <button
          @click="addParagraph"
          @mouseenter="handleParagraphMouseEnter"
          @mouseleave="handleParagraphMouseLeave"
          class="group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 btn-base border-subtle"
          style="background: #FEFEFD;"
        >
          <div class="absolute -top-2 -right-2 w-5 h-5 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
               style="background: linear-gradient(135deg, #6B9080 0%, #4A6355 100%); box-shadow: 0 2px 8px rgba(107, 144, 128, 0.4);">
            <i class="fas fa-plus text-white text-[10px]"></i>
          </div>
          <i class="fas fa-paragraph text-lg" style="color: #2C3E50;"></i>
          <span class="text-[10px] font-semibold tracking-wide" style="color: #4A6355;">PARAGRAPH</span>
        </button>

        <!-- Add Image Button -->
        <button
          @click="addImage"
          @mouseenter="handleImageMouseEnter"
          @mouseleave="handleImageMouseLeave"
          class="group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 btn-base border-subtle"
          style="background: #FEFEFD;"
        >
          <div class="absolute -top-2 -right-2 w-5 h-5 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
               style="background: linear-gradient(135deg, #A48B7E 0%, #8A6F62 100%); box-shadow: 0 2px 8px rgba(164, 139, 126, 0.4);">
            <i class="fas fa-plus text-white text-[10px]"></i>
          </div>
          <i class="fas fa-image text-lg" style="color: #2C3E50;"></i>
          <span class="text-[10px] font-semibold tracking-wide" style="color: #8A6F62;">IMAGE</span>
        </button>
      </div>

      <!-- Helper Text -->
      <div class="mt-3 px-4 py-2 rounded-xl" style="background: rgba(183, 110, 78, 0.06); border: 1px solid rgba(183, 110, 78, 0.15);">
        <p class="text-[10px] flex items-start gap-2 leading-relaxed" style="color: #8F4A31;">
          <i class="fas fa-lightbulb text-[10px] mt-0.5"></i>
          <span v-if="!hasSelection">Click buttons to add, or select an item</span>
          <span v-else>Adding below <strong>{{ selectedItemLabel }}</strong></span>
        </p>
      </div>
    </div>

    <!-- Tree Content -->
    <div class="flex-1 overflow-y-auto p-4 animate-fade-in">
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
      <div v-else class="text-center py-12" style="color: #9A9A9A;">
        <i class="fas fa-book-open text-5xl mb-3" style="color: #D4A088;"></i>
        <p class="text-sm font-medium">No chapters yet</p>
        <p class="text-xs mt-1">Click "Chapter" to add one</p>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="px-5 py-3 border-t animate-fade-in" style="border-top-color: rgba(26, 26, 26, 0.06); background: #F8F6F4;">
      <div class="flex items-center justify-between text-xs" style="color: #9A9A9A;">
        <div class="flex items-center gap-2">
          <span v-if="bookStore.lastSaveTime" class="truncate">
            Saved {{ bookStore.lastSaveTime?.toLocaleTimeString() }}
          </span>
          <span v-else>Not saved</span>
        </div>
        <button
          v-if="bookStore.lastSaveTime"
          @click="bookStore.saveBook()"
          @mouseenter="handleSaveBookMouseEnter"
          @mouseleave="handleSaveBookMouseLeave"
          class="p-2 rounded-lg transition-all duration-200 hover:scale-105"
          style="color: #B76E4E;"
        >
          <i class="fas fa-save"></i>
        </button>
      </div>
    </div>
  </div>
</template>
