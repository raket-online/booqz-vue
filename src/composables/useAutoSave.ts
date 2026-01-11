import { watch } from 'vue'
import { useBookStore } from '@/stores/book'

export function useAutoSave() {
  const bookStore = useBookStore()
  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  // Watch for book changes and auto-save
  watch(
    () => bookStore.book,
    () => {
      // Debounce save (1000ms)
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(async () => {
        await bookStore.saveBook()
      }, 1000)
    },
    { deep: true }
  )

  // Manual save function
  async function saveNow() {
    if (saveTimeout) clearTimeout(saveTimeout)
    await bookStore.saveBook()
  }

  return {
    saveNow
  }
}
