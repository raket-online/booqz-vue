<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import type { Section, ContentItem } from '@/types/book'
import Sortable from 'sortablejs'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'

interface Props {
  section: Section
  level?: number
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  collapsed: false
})

const emit = defineEmits<{
  'select-section': [id: number]
  'select-content': [id: number]
  'toggle-collapse': [id: number]
  'delete-section': [id: number]
  'delete-content': [id: number]
}>()

const bookStore = useBookStore()
const editorStore = useEditorStore()
const childrenContainer = ref<HTMLElement | null>(null)

// Section title editing
const isEditingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
const editedTitle = ref('')

const isCollapsed = computed(() => props.collapsed)
const hasChildren = computed(() => props.section.subsections.length > 0 || props.section.contentItems.length > 0)

// Selection states
const isSectionSelected = computed(() => {
  return editorStore.selectedItemId === props.section.id && editorStore.selectedItemType === 'section'
})

const isContentSelected = (itemId: number) => {
  return editorStore.selectedItemId === itemId && editorStore.selectedItemType === 'content'
}

// Text preview helpers
function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function getTextPreview(content: string, maxLength: number = 40): string {
  const text = stripHtml(content)
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Helper function for content item icon styles
function getContentIconStyle(item: ContentItem) {
  const isSelected = editorStore.selectedItemId === item.id && editorStore.selectedItemType === 'content'

  if (item.type === 'paragraph') {
    return isSelected
      ? 'background: var(--color-success); color: white;'
      : 'background: rgba(107, 144, 128, 0.1); color: var(--color-success);'
  } else if (item.type === 'image') {
    return isSelected
      ? 'background: #A48B7E; color: white;'
      : 'background: rgba(164, 139, 126, 0.1); color: #A48B7E;'
  }
  return 'background: var(--color-elevated); color: var(--color-text-tertiary);'
}

// Section title editing
function startEditTitle(event: Event) {
  event.stopPropagation()
  editedTitle.value = props.section.title
  isEditingTitle.value = true
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

async function saveTitle() {
  if (editedTitle.value.trim()) {
    bookStore.updateSectionTitle(props.section.id, editedTitle.value.trim())
    await bookStore.saveBook()
  }
  isEditingTitle.value = false
}

function cancelEditTitle() {
  isEditingTitle.value = false
}

function handleTitleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    saveTitle()
  } else if (event.key === 'Escape') {
    cancelEditTitle()
  }
}

// Drag-drop with reordering - Fixed to properly save
onMounted(() => {
  if (childrenContainer.value) {
    Sortable.create(childrenContainer.value, {
      handle: '.drag-handle',
      group: 'booqz-tree',
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: async (evt) => {
        try {
          const { item, newIndex, oldIndex } = evt
          const itemId = parseInt(item.dataset.id || '0')
          const itemType = item.dataset.type || 'content'

          if (newIndex !== undefined && oldIndex !== undefined && newIndex !== oldIndex) {
            console.log('=== DRAG DROP REORDER START ===')
            console.log('Looking for section ID:', props.section.id, 'in', props.section.title)
            console.log('Item moved:', itemId, itemType, 'from', oldIndex, 'to', newIndex)
            console.log('Book has', bookStore.book?.sections.length || 0, 'top-level sections')

            // Log all available sections for debugging
            if (bookStore.book) {
              console.log('All section IDs:', bookStore.book.sections.map(s => ({ id: s.id, title: s.title })))
            }

            // Find the actual section in the store's book
            console.log('Calling findSection for ID:', props.section.id)
            const section = bookStore.findSection(props.section.id)
            console.log('findSection returned:', section ? section.title : 'NULL')

            if (!section) {
              console.error('Section NOT found! ID:', props.section.id)
              console.error('Available section IDs:', bookStore.book?.sections.map(s => s.id))
              return
            }

            console.log('✓ Section found:', section.title, 'with', section.contentItems.length, 'content items, and', section.subsections.length, 'subsections')

            // Handle reordering based on itemType
            if (itemType === 'paragraph' || itemType === 'image') {
              // Reordering content items (paragraphs/images)
              console.log('Reordering content item:', itemType)
              console.log('Content items before reorder:', section.contentItems.map(i => ({ id: i.id, type: i.type })))

              // Get the current content items array from the found section
              const contentItems = section.contentItems

              // Verify we have items to move
              if (oldIndex >= contentItems.length || newIndex >= contentItems.length) {
                console.error('Invalid indices:', { oldIndex, newIndex, length: contentItems.length })
                return
              }

              // Remove from old position and insert at new position
              const [movedItem] = contentItems.splice(oldIndex!, 1)
              contentItems.splice(newIndex!, 0, movedItem)

              console.log('Content items after splice:', section.contentItems.map(i => ({ id: i.id, type: i.type })))

              // Update sortOrder for all items to match their new positions
              contentItems.forEach((item, index) => {
                item.sortOrder = index
              })

              // CRITICAL: Create a completely new array and replace to trigger Vue's reactivity
              section.contentItems = Array.from(contentItems)

              console.log('Content items after replacement:', section.contentItems.map(i => ({ id: i.id, type: i.type, order: i.sortOrder })))

              // Save the entire book to persist changes
              console.log('Calling saveBook()...')
              await bookStore.saveBook()
              console.log('✓ saveBook() completed - Content items reordered')

            } else if (itemType === 'section') {
              // Reordering subsections (chapters/subchapters)
              console.log('Reordering subsection')
              console.log('Subsections before reorder:', section.subsections.map(s => ({ id: s.id, title: s.title })))

              // Get the current subsections array
              const subsections = section.subsections

              // Verify we have items to move
              if (oldIndex >= subsections.length || newIndex >= subsections.length) {
                console.error('Invalid subsection indices:', { oldIndex, newIndex, length: subsections.length })
                return
              }

              // Remove from old position and insert at new position
              const [movedSection] = subsections.splice(oldIndex!, 1)
              subsections.splice(newIndex!, 0, movedSection)

              console.log('Subsections after splice:', section.subsections.map(s => ({ id: s.id, title: s.title })))

              // Update sortOrder and numbering for all subsections
              subsections.forEach((sub, index) => {
                sub.sortOrder = index
                sub.number = index + 1
              })

              // CRITICAL: Create a completely new array to trigger Vue's reactivity
              section.subsections = Array.from(subsections)

              console.log('Subsections after replacement:', section.subsections.map(s => ({ id: s.id, title: s.title, order: s.sortOrder })))

              // Save the entire book to persist changes
              console.log('Calling saveBook()...')
              await bookStore.saveBook()
              console.log('✓ saveBook() completed - Subsections reordered')

            } else {
              console.log('Skipping reorder - unknown item type:', itemType)
            }
          } else {
            console.log('Skipping reorder - no change ( newIndex === oldIndex )')
          }
        } catch (error) {
          console.error('ERROR in drag-drop handler:', error)
          console.error('Error stack:', (error as Error).stack)
        }
      }
    })
  }
})
</script>

<template>
  <div class="tree-node">
    <!-- Section Card - Compact -->
    <div
      class="group section-card mb-1 rounded-lg transition-all duration-200 cursor-pointer animate-slide-in"
      :class="{
        'section-selected': isSectionSelected,
        'section-hover': !isSectionSelected
      }"
      :data-id="section.id"
      :data-type="'section'"
      @click="$emit('select-section', section.id)"
    >
      <div class="flex items-center gap-2 px-3 py-1.5">
        <!-- Grip Handle -->
        <div class="drag-handle flex-shrink-0 cursor-grab" style="color: var(--color-text-tertiary); opacity: 0.6;">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
          </svg>
        </div>

        <!-- Collapse Toggle -->
        <button
          v-if="hasChildren"
          @click.stop="$emit('toggle-collapse', section.id)"
          class="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all duration-150"
          :style="isSectionSelected ? 'background: rgba(124, 156, 108, 0.15);' : 'background: var(--color-elevated);'"
        >
          <svg class="w-3 h-3 transition-transform duration-200" :class="{ 'rotate-90': !isCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div v-else class="w-5"></div>

        <!-- Section Icon -->
        <div class="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center section-icon"
             :style="isSectionSelected ? 'background: var(--color-accent); color: white;' : 'background: var(--color-rose-subtle); color: var(--color-accent);'">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>

        <!-- Section Title & Info -->
        <div class="flex-1 min-w-0">
          <!-- View Mode -->
          <template v-if="!isEditingTitle">
            <div class="flex items-center gap-1 group">
              <h3 class="text-sm font-medium truncate transition-colors duration-200 flex-1"
                  :style="isSectionSelected ? 'color: var(--color-text-primary);' : 'color: var(--color-text-secondary);'">
                {{ section.title }}
              </h3>
              <!-- Edit Icon - only visible on hover -->
              <button
                @click="startEditTitle"
                class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-0.5 rounded hover-lift"
                style="color: var(--color-text-tertiary);"
                title="Click to rename"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </button>
            </div>
          </template>
          <!-- Edit Mode -->
          <input v-else
                 ref="titleInput"
                 v-model="editedTitle"
                 @keydown="handleTitleKeydown"
                 @blur="saveTitle"
                 @click.stop
                 class="w-full text-sm font-medium px-1.5 py-0.5 rounded border"
                 style="background: var(--color-surface); border-color: var(--color-accent); color: var(--color-text-primary); outline: none;"
          />
        </div>

        <!-- Notes Indicator -->
        <div v-if="section.notes" class="flex-shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-warning);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </div>

        <!-- Delete Action (visible on hover) -->
        <button
          @click.stop="$emit('delete-section', section.id)"
          class="delete-btn-section flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          title="Delete chapter"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Children (when expanded) -->
    <div v-if="!isCollapsed" ref="childrenContainer" class="ml-2 space-y-0.5">
      <!-- Subsections -->
      <TreeNode
        v-for="subsection in section.subsections"
        :key="subsection.id"
        :section="subsection"
        :level="level + 1"
        :collapsed="false"
        @select-section="emit('select-section', $event)"
        @select-content="emit('select-content', $event)"
        @toggle-collapse="emit('toggle-collapse', $event)"
        @delete-section="emit('delete-section', $event)"
        @delete-content="emit('delete-content', $event)"
      />

      <!-- Content Items -->
      <div
        v-for="item in section.contentItems"
        :key="item.id"
        class="content-card rounded transition-all duration-200 cursor-pointer animate-slide-in"
        :class="{
          'content-selected': isContentSelected(item.id),
          'content-hover': !isContentSelected(item.id)
        }"
        :data-id="item.id"
        :data-type="item.type"
        @click="$emit('select-content', item.id)"
      >
        <div class="flex items-center gap-2 px-3 py-1">
          <!-- Grip Handle -->
          <div class="drag-handle flex-shrink-0 cursor-grab" style="color: var(--color-text-tertiary); opacity: 0.6;">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
            </svg>
          </div>

          <div class="w-5"></div>

          <!-- Icon -->
          <div class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center content-icon"
               :style="getContentIconStyle(item)">
            <svg v-if="item.type === 'paragraph'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
            </svg>
            <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>

          <!-- Content Preview -->
          <div class="flex-1 min-w-0">
            <p class="text-xs truncate transition-colors duration-200 font-body"
               :style="isContentSelected(item.id) ? 'color: var(--color-text-primary);' : 'color: var(--color-text-secondary);'">
              <span v-if="item.type === 'paragraph'">{{ getTextPreview(item.content_text) }}</span>
              <span v-else class="flex items-center gap-1">
                <span style="color: #A48B7E;">🖼</span>
                {{ (item as any).name || 'Image' }}
              </span>
            </p>
          </div>

          <!-- Notes Indicator -->
          <div v-if="item.notes" class="flex-shrink-0">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-warning);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </div>

          <!-- Delete Action -->
          <button
            @click.stop="$emit('delete-content', item.id)"
            class="delete-btn-content flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            :title="item.type === 'paragraph' ? 'Delete paragraph' : 'Delete image'"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-selected {
  background: var(--color-rose-subtle);
  border: 1px solid rgba(124, 156, 108, 0.3);
}

.section-hover:hover {
  background: var(--color-surface);
  border: 1px solid var(--color-elevated);
}

.section-hover {
  background: var(--color-surface);
  border: 1px solid transparent;
}

.content-selected {
  background: var(--color-surface);
  border: 1px solid rgba(124, 156, 108, 0.2);
}

.content-hover:hover {
  background: var(--color-surface);
  border: 1px solid var(--color-elevated);
}

.content-hover {
  background: transparent;
  border: 1px solid transparent;
}

/* Drag & Drop Ghost Styles */
.sortable-ghost {
  opacity: 0.4;
  background: var(--color-elevated);
  border-radius: var(--radius-md);
}

.sortable-drag {
  opacity: 0.9;
  box-shadow: var(--shadow-lg);
}

/* Delete button styles */
.delete-btn-section {
  color: var(--color-text-tertiary);
  transition: all 0.2s ease;
}

.delete-btn-section:hover {
  color: var(--color-error);
  background: rgba(198, 93, 93, 0.1);
}

.delete-btn-content {
  color: var(--color-text-tertiary);
  transition: all 0.2s ease;
}

.delete-btn-content:hover {
  color: var(--color-error);
  background: rgba(198, 93, 93, 0.1);
}
</style>
