<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Section } from '@/types/book'
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
  background-color: #e5e7eb;
}

.sortable-drag {
  opacity: 0.8;
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
      <i class="fas fa-grip-vertical drag-handle text-gray-300 hover:text-gray-500 mr-2 cursor-grab opacity-0 group-hover:opacity-100"></i>

      <!-- Collapse/Expand Icon -->
      <span
        v-if="hasChildren"
        class="w-4 h-4 mr-2 flex items-center justify-center text-gray-400 hover:text-gray-600"
        @click.stop="$emit('toggle-collapse', section.id)"
      >
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'" class="text-xs"></i>
      </span>
      <span v-else class="w-4 h-4 mr-2"></span>

      <!-- Icon -->
      <i :class="isSectionSelected ? 'fas fa-book text-blue-600' : 'fas fa-book text-blue-500'" class="mr-2"></i>

      <!-- Title -->
      <span class="flex-1 truncate text-sm" :class="{ 'font-semibold text-blue-900': isSectionSelected }">
        {{ section.title }}
      </span>

      <!-- Count Badge -->
      <span class="text-xs ml-2" :class="{ 'text-blue-600': isSectionSelected, 'text-gray-500': !isSectionSelected }">
        {{ section.contentItems.length }}
      </span>

      <!-- Notes Indicator -->
      <i v-if="section.notes" class="fas fa-sticky-note text-yellow-500 ml-2 text-xs"></i>

      <!-- Delete Button -->
      <button
        @click.stop="$emit('delete-section', section.id)"
        class="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete chapter"
      >
        <i class="fas fa-trash text-xs"></i>
      </button>

      <!-- Active Indicator (small dot) -->
      <span v-if="isSectionSelected" class="ml-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
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
          'bg-blue-50 border-l-4 border-blue-500': isContentSelected(item.id),
          'hover:bg-gray-100 border-l-4 border-transparent': !isContentSelected(item.id)
        }"
        :style="{ paddingLeft: `${(level + 1) * 16 + 16}px` }"
        :data-id="item.id"
        :data-type="item.type"
        :data-parent-id="section.id"
        @click.stop="$emit('select-content', item.id)"
      >
        <!-- Drag Handle -->
        <i class="fas fa-grip-vertical drag-handle text-gray-300 hover:text-gray-500 mr-2 cursor-grab opacity-0 group-hover:opacity-100"></i>

        <!-- Icon -->
        <i
          :class="{
            'fas fa-paragraph text-green-600': isContentSelected(item.id) && item.type === 'paragraph',
            'fas fa-paragraph text-green-500': !isContentSelected(item.id) && item.type === 'paragraph',
            'fas fa-image text-purple-600': isContentSelected(item.id) && item.type === 'image',
            'fas fa-image text-purple-500': !isContentSelected(item.id) && item.type === 'image'
          }"
          class="mr-2"
        ></i>

        <!-- Content Preview -->
        <span class="flex-1 text-sm truncate" :class="{ 'font-medium text-gray-900': isContentSelected(item.id), 'text-gray-700': !isContentSelected(item.id) }">
          <span v-if="item.type === 'paragraph'">{{ getTextPreview(item.content_text) }}</span>
          <span v-else>{{ (item as any).name || 'Image' }}</span>
        </span>

        <!-- Notes Indicator -->
        <i v-if="item.notes" class="fas fa-sticky-note text-yellow-500 ml-2 text-xs"></i>

        <!-- Delete Button -->
        <button
          @click.stop="$emit('delete-content', item.id)"
          class="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
          :title="item.type === 'paragraph' ? 'Delete paragraph' : 'Delete image'"
        >
          <i class="fas fa-trash text-xs"></i>
        </button>

        <!-- Active Indicator (small dot) -->
        <span v-if="isContentSelected(item.id)" class="ml-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
      </div>
    </div>
  </div>
</template>
