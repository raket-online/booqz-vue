import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useEditorStore = defineStore('editor', () => {
  // Current selection
  const selectedItemId = ref<number | null>(null)
  const selectedItemType = ref<'section' | 'content' | null>(null)

  // Editor state
  const isDirty = ref(false)
  const isSaving = ref(false)
  const lastSaveTime = ref<Date | null>(null)

  // Tree collapse state
  const treeCollapseState = ref<Record<number, boolean>>({})

  // Load tree state from localStorage
  function loadTreeState() {
    const saved = localStorage.getItem('treeCollapseState')
    if (saved) {
      try {
        treeCollapseState.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse tree collapse state:', e)
      }
    }
  }

  // Persist tree state to localStorage
  function persistTreeState() {
    localStorage.setItem('treeCollapseState', JSON.stringify(treeCollapseState.value))
  }

  // Watch for changes and persist
  watch(treeCollapseState, () => {
    persistTreeState()
  }, { deep: true })

  // Selection
  function selectSection(id: number) {
    selectedItemId.value = id
    selectedItemType.value = 'section'
  }

  function selectContent(id: number) {
    selectedItemId.value = id
    selectedItemType.value = 'content'
  }

  function clearSelection() {
    selectedItemId.value = null
    selectedItemType.value = null
  }

  // Tree collapse
  function toggleTreeNode(id: number) {
    treeCollapseState.value[id] = !treeCollapseState.value[id]
  }

  function isTreeNodeCollapsed(id: number): boolean {
    return treeCollapseState.value[id] === true
  }

  // Dirty state
  function setDirty(value: boolean) {
    isDirty.value = value
  }

  function markSaved() {
    isDirty.value = false
    lastSaveTime.value = new Date()
  }

  // Notes panel state (using localStorage)
  const notesPanelOpen = ref<boolean>(
    localStorage.getItem('notesPanelOpen') !== 'false'
  )

  watch(notesPanelOpen, (value) => {
    localStorage.setItem('notesPanelOpen', String(value))
  })

  function toggleNotesPanel() {
    notesPanelOpen.value = !notesPanelOpen.value
  }

  return {
    // State
    selectedItemId,
    selectedItemType,
    isDirty,
    isSaving,
    lastSaveTime,
    treeCollapseState,
    notesPanelOpen,

    // Actions
    selectSection,
    selectContent,
    clearSelection,
    toggleTreeNode,
    isTreeNodeCollapsed,
    setDirty,
    markSaved,
    toggleNotesPanel,
    loadTreeState,
    persistTreeState
  }
})
