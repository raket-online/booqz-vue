import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'

export const useSidebarStore = defineStore('sidebar', () => {
  const isCollapsed = ref(localStorage.getItem(STORAGE_KEY) === 'true')

  watch(isCollapsed, (value) => {
    localStorage.setItem(STORAGE_KEY, String(value))
  })

  function toggle() {
    isCollapsed.value = !isCollapsed.value
  }

  return {
    isCollapsed,
    toggle
  }
})
