<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBookStore } from '@/stores/book'
import { useSettingsStore } from '@/stores/settings'

const authStore = useAuthStore()
const bookStore = useBookStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  // Test Phase 1: Load book and settings
  console.log('=== Phase 1 Test ===')
  console.log('Loading book...')

  await bookStore.loadBook()

  console.log('Book loaded:', bookStore.book)
  console.log('Word count:', bookStore.wordCount)
  console.log('Chapter count:', bookStore.chapterCount)

  console.log('Settings:', settingsStore.settings)
  console.log('Selected AI Model:', settingsStore.getSelectedModel())
  console.log('Has OpenAI Key:', settingsStore.hasApiKey('openai'))

  console.log('=== Phase 1 Test Complete ===')
})

async function testAddChapter() {
  const chapter = bookStore.addChapter('Test Chapter')
  console.log('Chapter added:', chapter)
  await bookStore.saveBook()
}

async function testAddParagraph() {
  if (bookStore.book && bookStore.book.sections.length > 0) {
    const chapter = bookStore.book.sections[0]
    const paragraph = bookStore.addParagraph(chapter.id, '<p>This is a test paragraph with some words.</p>')
    console.log('Paragraph added:', paragraph)
    console.log('Word count:', bookStore.wordCount)
    await bookStore.saveBook()
  }
}

async function testVersionControl() {
  if (bookStore.book && bookStore.book.sections.length > 0) {
    const chapter = bookStore.book.sections[0]
    if (chapter.contentItems.length > 0) {
      const item = chapter.contentItems[0]
      if (item.type === 'paragraph') {
        console.log('Current version:', item.versionIndex, item.content_text)

        // Update with new version
        bookStore.updateContent(item.id, '<p>This is the improved version with more words.</p>')
        await bookStore.saveBook()

        console.log('After update:', item.versionIndex, item.content_text)
        console.log('Version history:', item.versions)
        console.log('Can undo:', bookStore.canUndo(item.id))

        // Test undo
        bookStore.undo(item.id)
        console.log('After undo:', item.versionIndex, item.content_text)
      }
    }
  }
}

function clearData() {
  if (confirm('Clear all data?')) {
    bookStore.book = null
    localStorage.clear()
    location.reload()
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-4">Phase 1 Test</h1>

    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <p class="text-blue-800">
        Welcome, <strong>{{ authStore.user?.email }}</strong>
      </p>
      <p class="text-blue-600 text-sm mt-1">Phase 1 foundation is complete. Testing stores and storage.</p>
    </div>

    <!-- Book Info -->
    <div class="bg-white border rounded-lg p-4 mb-4">
      <h2 class="text-lg font-semibold mb-2">Book Info</h2>
      <div v-if="bookStore.book" class="space-y-1 text-sm">
        <p><strong>Title:</strong> {{ bookStore.book.title }}</p>
        <p><strong>Language:</strong> {{ bookStore.book.language }}</p>
        <p><strong>Chapters:</strong> {{ bookStore.chapterCount }}</p>
        <p><strong>Total Words:</strong> {{ bookStore.wordCount }}</p>
        <p><strong>Last Saved:</strong> {{ bookStore.lastSaveTime?.toLocaleString() || 'Never' }}</p>
      </div>
      <div v-else class="text-gray-500">Loading book...</div>
    </div>

    <!-- Test Buttons -->
    <div class="bg-white border rounded-lg p-4 mb-4">
      <h2 class="text-lg font-semibold mb-3">Test Functions</h2>
      <div class="flex flex-wrap gap-2">
        <button
          @click="testAddChapter"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Chapter
        </button>
        <button
          @click="testAddParagraph"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Paragraph
        </button>
        <button
          @click="testVersionControl"
          class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Test Version Control
        </button>
        <button
          @click="clearData"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear All Data
        </button>
      </div>
    </div>

    <!-- Book Structure -->
    <div v-if="bookStore.book" class="bg-white border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2">Book Structure</h2>
      <div class="space-y-2">
        <div v-for="chapter in bookStore.book.sections" :key="chapter.id" class="border-l-4 border-blue-500 pl-3">
          <p class="font-medium">{{ chapter.title }} (Chapter {{ chapter.number }})</p>
          <p class="text-sm text-gray-600">{{ chapter.contentItems.length }} items</p>
          <div v-if="chapter.contentItems.length > 0" class="ml-4 mt-1 space-y-1">
            <div v-for="item in chapter.contentItems" :key="item.id" class="text-sm text-gray-700">
              <span class="inline-block w-16 text-gray-500">[{{ item.type }}]</span>
              <span v-if="item.type === 'paragraph'" class="line-clamp-1">{{ item.content_text }}</span>
              <span v-else class="text-gray-500">Image</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
