<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Section, ContentItem } from '@/types/book'
import Sortable from 'sortablejs'
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

const editorStore = useEditorStore()
const childrenContainer = ref<HTMLElement | null>(null)

const isCollapsed = computed(() => props.collapsed)
const hasChildren = computed(() => props.section.subsections.length > 0 || props.section.contentItems.length > 0)

const paddingLeft = computed(() => `${props.level * 16}px`)

// Check if this section is selected
const isSectionSelected = computed(() => {
  return editorStore.selectedItemId === props.section.id && editorStore.selectedItemType === 'section'
})

// Check if a content item is selected
const isContentSelected = (itemId: number) => {
  return editorStore.selectedItemId === itemId && editorStore.selectedItemType === 'content'
}

// Strip HTML tags for preview
function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function getTextPreview(content: string, maxLength: number = 50): string {
  const text = stripHtml(content)
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Helper function for content item icon colors
function getContentItemIconStyle(item: ContentItem) {
  const isSelected = editorStore.selectedItemId === item.id && editorStore.selectedItemType === 'content'

  if (item.type === 'paragraph') {
    return {
      color: isSelected ? 'var(--color-accent-green)' : '#6B9080'
    }
  } else if (item.type === 'image') {
    return {
      color: isSelected ? 'var(--color-accent-purple)' : '#A48B7E'
    }
  }
  return {}
}

// Helper function for content item indicator
function getContentItemIndicatorStyle(item: ContentItem) {
  if (item.type === 'paragraph') {
    return {
      background: 'linear-gradient(135deg, #6B9080 0%, #4A6355 100%)',
      boxShadow: '0 0 8px rgba(107, 144, 128, 0.5)'
    }
  } else if (item.type === 'image') {
    return {
      background: 'linear-gradient(135deg, #A48B7E 0%, #8A6F62 100%)',
      boxShadow: '0 0 8px rgba(164, 139, 126, 0.5)'
    }
  }
  return {}
}

// Type-safe event handlers for inline mouse events
function handleChevronMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  if (target) {
    target.style.color = 'var(--color-text-secondary)'
  }
}

function handleChevronMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  if (target) {
    target.style.color = 'var(--color-text-tertiary)'
  }
}

function handleDeleteMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  if (target) {
    target.style.color = 'var(--color-error)'
    target.style.background = 'rgba(198, 93, 93, 0.1)'
  }
}

function handleDeleteMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  if (target) {
    target.style.color = 'var(--color-text-tertiary)'
    target.style.background = 'transparent'
  }
}

// Initialize drag-drop for children
onMounted(() => {
  if (childrenContainer.value) {
    Sortable.create(childrenContainer.value, {
      handle: '.drag-handle',
      group: 'booqz-tree',
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',

      onEnd: (evt) => {
        const { item, newIndex, oldIndex } = evt
        const itemId = parseInt(item.dataset.id || '0')
        const itemType = item.dataset.type || 'content'

        if (newIndex !== undefined && oldIndex !== undefined && newIndex !== oldIndex) {
          // TODO: Handle item move in store
          console.log('Item moved:', itemId, itemType, newIndex, oldIndex)
        }
      }
    })
  }
})
</script>

<style>
.sortable-ghost {
  opacity: 0.4;
  background-color: var(--color-bg-tertiary);
}

.sortable-drag {
  opacity: 0.8;
}

/* Section selected state */
.section-selected {
  background-color: rgba(183, 110, 78, 0.08);
  border-left: 4px solid var(--color-primary);
}

/* Section hover state */
.section-hover {
  border-left: 4px solid transparent;
}

.section-hover:hover {
  background-color: rgba(26, 26, 26, 0.02);
}

/* Content selected state */
.content-selected {
  background-color: rgba(26, 26, 26, 0.03);
  border-left: 4px solid var(--color-text-tertiary);
}

/* Content hover state */
.content-hover {
  border-left: 4px solid transparent;
}

.content-hover:hover {
  background-color: rgba(26, 26, 26, 0.02);
}
</style>

<template>
  <div class="tree-node">
    <!-- Section Header -->
    <div
      class="flex items-center py-2 px-3 cursor-pointer rounded-lg group transition-all duration-200"
      :class="{
        'bg-blue-50 border-l-4 border-blue-500': isSectionSelected,
        'hover:bg-gray-100 border-l-4 border-transparent': !isSectionSelected
      }"
      :style="{ paddingLeft }"
      :data-id="section.id"
      :data-type="'section'"
      :data-parent-id="section.id"
      @click.stop="$emit('select-section', section.id)"
    >
      <!-- Drag Handle -->
      <i class="fas fa-grip-vertical drag-handle mr-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity duration-200"
         style="color: rgba(26, 26, 26, 0.2);"></i>

      <!-- Collapse/Expand Icon -->
      <span
        v-if="hasChildren"
        class="w-4 h-4 mr-2 flex items-center justify-center transition-colors duration-200"
        style="color: var(--color-text-tertiary);"
        @click.stop="$emit('toggle-collapse', section.id)"
        @mouseenter="handleChevronMouseEnter"
        @mouseleave="handleChevronMouseLeave"
      >
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'" class="text-xs"></i>
      </span>
      <span v-else class="w-4 h-4 mr-2"></span>

      <!-- Icon -->
      <i :class="isSectionSelected ? 'fas fa-book' : 'fas fa-book'"
         class="mr-2 transition-colors duration-200"
         :style="isSectionSelected ? { color: 'var(--color-primary-dark)' } : { color: 'var(--color-primary)' }"></i>

      <!-- Title -->
      <span class="flex-1 truncate text-sm transition-colors duration-200"
            :class="{ 'font-semibold': isSectionSelected }"
            :style="isSectionSelected ? { color: 'var(--color-primary-dark)' } : { color: 'var(--color-text-primary)' }">
        {{ section.title }}
      </span>

      <!-- Count Badge -->
      <span class="text-xs ml-2 transition-colors duration-200"
            :style="isSectionSelected ? { color: 'var(--color-primary-dark)' } : { color: 'var(--color-text-tertiary)' }">
        {{ section.contentItems.length }}
      </span>

      <!-- Notes Indicator -->
      <i v-if="section.notes" class="fas fa-sticky-note ml-2 text-xs transition-all duration-200"
         style="color: var(--color-warning);"></i>

      <!-- Delete Button -->
      <button
        @click.stop="$emit('delete-section', section.id)"
        @mouseenter="handleDeleteMouseEnter"
        @mouseleave="handleDeleteMouseLeave"
        class="ml-2 p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded hover:scale-110"
        style="color: var(--color-text-tertiary);"
        title="Delete chapter"
      >
        <i class="fas fa-trash text-xs"></i>
      </button>

      <!-- Active Indicator (small dot) -->
      <span v-if="isSectionSelected"
            class="ml-2 w-2 h-2 rounded-full animate-pulse"
            style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); box-shadow: 0 0 8px rgba(183, 110, 78, 0.5);"></span>
    </div>

    <!-- Children (if not collapsed) -->
    <div v-if="!isCollapsed" ref="childrenContainer" :data-parent-id="section.id">
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
        class="flex items-center py-1.5 px-3 cursor-pointer rounded group transition-all duration-200"
        :class="{
          'content-selected': isContentSelected(item.id),
          'content-hover': !isContentSelected(item.id)
        }"
        :style="{ paddingLeft: `${(level + 1) * 16 + 16}px` }"
        :data-id="item.id"
        :data-type="item.type"
        :data-parent-id="section.id"
        @click.stop="$emit('select-content', item.id)"
      >
        <!-- Drag Handle -->
        <i class="fas fa-grip-vertical drag-handle mr-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity duration-200"
           style="color: rgba(26, 26, 26, 0.2);"></i>

        <!-- Icon -->
        <i
          :class="{
            'fas fa-paragraph': item.type === 'paragraph',
            'fas fa-image': item.type === 'image'
          }"
          class="mr-2 transition-colors duration-200"
          :style="getContentItemIconStyle(item)"
        ></i>

        <!-- Content Preview -->
        <span class="flex-1 text-sm truncate transition-colors duration-200"
              :class="{ 'font-medium': isContentSelected(item.id) }"
              :style="isContentSelected(item.id) ? { color: 'var(--color-text-primary)' } : { color: 'var(--color-text-secondary)' }">
          <span v-if="item.type === 'paragraph'">{{ getTextPreview(item.content_text) }}</span>
          <span v-else>{{ (item as any).name || 'Image' }}</span>
        </span>

        <!-- Notes Indicator -->
        <i v-if="item.notes" class="fas fa-sticky-note ml-2 text-xs transition-all duration-200"
           style="color: var(--color-warning);"></i>

        <!-- Delete Button -->
        <button
          @click.stop="$emit('delete-content', item.id)"
          @mouseenter="handleDeleteMouseEnter"
          @mouseleave="handleDeleteMouseLeave"
          class="ml-2 p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded hover:scale-110"
          style="color: var(--color-text-tertiary);"
          :title="item.type === 'paragraph' ? 'Delete paragraph' : 'Delete image'"
        >
          <i class="fas fa-trash text-xs"></i>
        </button>

        <!-- Active Indicator (small dot) -->
        <span v-if="isContentSelected(item.id)"
              class="ml-2 w-2 h-2 rounded-full animate-pulse"
              :style="getContentItemIndicatorStyle(item)"></span>
      </div>
    </div>
  </div>
</template>
