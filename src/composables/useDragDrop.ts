import { onMounted, onUnmounted, ref } from 'vue'
import { useBookStore } from '@/stores/book'
import Sortable from 'sortablejs'

export interface DragDropOptions {
  containerClass: string
  handleClass?: string
  group?: string
  animation?: number
  ghostClass?: string
  onEnd?: (evt: Sortable.SortableEvent) => void
}

export function useDragDrop(options: DragDropOptions) {
  const bookStore = useBookStore()
  const sortableInstance = ref<Sortable | null>(null)
  const isDragging = ref(false)

  /**
   * Initialize SortableJS on the container
   */
  function initSortable(container: HTMLElement) {
    sortableInstance.value = Sortable.create(container, {
      handle: options.handleClass || '',
      group: options.group || 'booqz-tree',
      animation: options.animation || 150,
      ghostClass: options.ghostClass || 'sortable-ghost',
      dragClass: 'sortable-drag',

      onStart: () => {
        isDragging.value = true
      },

      onEnd: (evt) => {
        isDragging.value = false

        const { oldIndex, newIndex, item, from, to } = evt

        // If position didn't change, do nothing
        if (oldIndex === newIndex && from === to) {
          return
        }

        // Get the item ID from the dragged element
        const itemId = parseInt(item.dataset.id || '0')
        const itemType = item.dataset.type || 'content'
        const parentId = parseInt(to.dataset.parentId || '0')

        // Validate the move
        if (isValidMove(itemId, itemType, parentId, newIndex || 0)) {
          // Perform the move in the store
          performMove(itemId, itemType, parentId, newIndex || 0)

          // Flash animation
          flashItem(item)

          // Call custom onEnd callback
          if (options.onEnd) {
            options.onEnd(evt)
          }
        } else {
          // Invalid move - revert the UI
          console.warn('Invalid move attempted')
        }
      }
    })
  }

  /**
   * Validate if a move is allowed
   */
  function isValidMove(_itemId: number, itemType: string, newParentId: number, _newIndex: number): boolean {
    // Can't move a chapter inside another chapter
    if (itemType === 'chapter' && newParentId !== 0) {
      return false
    }

    // Can't move a section inside a content item
    if (itemType === 'section' && newParentId !== 0) {
      const parent = bookStore.findSection(newParentId)
      if (parent && parent.type !== 'chapter') {
        return false
      }
    }

    return true
  }

  /**
   * Perform the move in the book store
   */
  function performMove(itemId: number, itemType: string, newParentId: number, newIndex: number) {
    if (itemType === 'chapter') {
      // Move chapter
      bookStore.moveChapter(itemId, newIndex)
    } else if (itemType === 'section') {
      // Move subchapter
      bookStore.moveItem(itemId, 'section', newParentId, newIndex)
    } else if (itemType === 'content') {
      // Move content item
      bookStore.moveItem(itemId, 'content', newParentId, newIndex)
    }
  }

  /**
   * Flash animation on moved item
   */
  function flashItem(element: HTMLElement) {
    element.classList.add('bg-blue-100')
    setTimeout(() => {
      element.classList.remove('bg-blue-100')
    }, 500)
  }

  /**
   * Destroy Sortable instance
   */
  function destroy() {
    if (sortableInstance.value) {
      sortableInstance.value.destroy()
      sortableInstance.value = null
    }
  }

  /**
   * Set up drag drop on mount
   */
  onMounted(() => {
    const containers = document.querySelectorAll(`.${options.containerClass}`)
    containers.forEach(container => {
      initSortable(container as HTMLElement)
    })
  })

  /**
   * Clean up on unmount
   */
  onUnmounted(() => {
    destroy()
  })

  return {
    isDragging,
    initSortable,
    destroy
  }
}

/**
 * Setup drag drop for a specific element
 */
export function setupDragDrop(element: HTMLElement, options: DragDropOptions) {
  const sortable = Sortable.create(element, {
    handle: options.handleClass || '',
    group: options.group || 'booqz-tree',
    animation: options.animation || 150,
    ghostClass: options.ghostClass || 'sortable-ghost',
    dragClass: 'sortable-drag'
  })

  return sortable
}
