import { openDB } from 'idb'
import type { Book } from '@/types/book'

const DB_NAME = 'TranslatorDB'
const DB_VERSION = 1
const STORE_NAME = 'books'

export function useStorage() {
  async function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })
  }

  async function saveBook(bookData: Book): Promise<void> {
    try {
      const db = await getDB()
      // Create a plain object copy to avoid reactivity proxy issues
      const plainData = JSON.parse(JSON.stringify(bookData))
      await db.put(STORE_NAME, plainData, 1) // Fixed key = 1 (single book)
      console.log('Book saved to IndexedDB')
    } catch (error) {
      console.error('Failed to save book to IndexedDB:', error)
      throw error
    }
  }

  async function loadBook(): Promise<Book | null> {
    try {
      const db = await getDB()
      const book = await db.get(STORE_NAME, 1)
      return book || null
    } catch (error) {
      console.error('Failed to load book from IndexedDB:', error)
      return null
    }
  }

  async function clearAll(): Promise<boolean> {
    try {
      const db = await getDB()
      await db.clear(STORE_NAME)
      console.log('IndexedDB cleared')
      return true
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error)
      return false
    }
  }

  return {
    saveBook,
    loadBook,
    clearAll
  }
}
