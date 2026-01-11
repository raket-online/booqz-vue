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
    <div class="mb-6">
      <h1 class="font-display text-2xl font-semibold mb-2" style="color: var(--color-text-primary);">Phase 1 Test</h1>
      <p class="text-sm" style="color: var(--color-text-tertiary);">Testing stores and storage</p>
    </div>

    <!-- Welcome Card -->
    <div class="card p-5 mb-6 animate-fade-in" style="background: var(--color-rose-subtle); border: 1px solid rgba(124, 156, 108, 0.2);">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--color-accent);">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: white;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-medium mb-1" style="color: var(--color-accent-dark);">Welcome, <strong>{{ authStore.user?.email }}</strong></p>
          <p class="text-sm" style="color: var(--color-text-secondary);">Phase 1 foundation is complete. All systems operational.</p>
        </div>
      </div>
    </div>

    <!-- Book Info -->
    <div class="card p-5 mb-4 animate-slide-up">
      <h2 class="font-display text-base font-semibold mb-4 flex items-center gap-2" style="color: var(--color-text-primary);">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-accent);">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        Book Info
      </h2>
      <div v-if="bookStore.book" class="space-y-2 text-sm">
        <div class="flex items-center gap-2">
          <span class="w-24" style="color: var(--color-text-tertiary);">Title:</span>
          <span class="font-medium" style="color: var(--color-text-primary);">{{ bookStore.book.title }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24" style="color: var(--color-text-tertiary);">Language:</span>
          <span style="color: var(--color-text-secondary);">{{ bookStore.book.language }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24" style="color: var(--color-text-tertiary);">Chapters:</span>
          <span style="color: var(--color-text-secondary);">{{ bookStore.chapterCount }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24" style="color: var(--color-text-tertiary);">Total Words:</span>
          <span style="color: var(--color-text-secondary);">{{ bookStore.wordCount }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24" style="color: var(--color-text-tertiary);">Last Saved:</span>
          <span style="color: var(--color-text-secondary);">{{ bookStore.lastSaveTime?.toLocaleString() || 'Never' }}</span>
        </div>
      </div>
      <div v-else class="flex items-center gap-2" style="color: var(--color-text-tertiary);">
        <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Loading book...
      </div>
    </div>

    <!-- Test Buttons -->
    <div class="card p-5 mb-4 animate-slide-up" style="animation-delay: 50ms;">
      <h2 class="font-display text-base font-semibold mb-4 flex items-center gap-2" style="color: var(--color-text-primary);">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #A48B7E;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2-9-2 9-5.714-2.143L9 7l5.714-2.143L13 3z"/>
        </svg>
        Test Functions
      </h2>
      <div class="flex flex-wrap gap-3">
        <button
          @click="testAddChapter"
          class="btn-test"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          Add Chapter
        </button>
        <button
          @click="testAddParagraph"
          class="btn-test btn-test-success"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
          </svg>
          Add Paragraph
        </button>
        <button
          @click="testVersionControl"
          class="btn-test btn-test-purple"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Test Version Control
        </button>
        <button
          @click="clearData"
          class="btn-test btn-test-danger"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Clear All Data
        </button>
      </div>
    </div>

    <!-- Book Structure -->
    <div v-if="bookStore.book" class="card p-5 animate-slide-up" style="animation-delay: 100ms;">
      <h2 class="font-display text-base font-semibold mb-4 flex items-center gap-2" style="color: var(--color-text-primary);">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-accent);">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        Book Structure
      </h2>
      <div class="space-y-3">
        <div v-for="chapter in bookStore.book.sections" :key="chapter.id" class="p-4 rounded-lg" style="border-left: 4px solid var(--color-accent); background: var(--color-canvas);">
          <p class="font-medium" style="color: var(--color-text-primary);">{{ chapter.title }} (Chapter {{ chapter.number }})</p>
          <p class="text-sm" style="color: var(--color-text-tertiary);">{{ chapter.contentItems.length }} items</p>
          <div v-if="chapter.contentItems.length > 0" class="ml-4 mt-2 space-y-1">
            <div v-for="item in chapter.contentItems" :key="item.id" class="text-sm p-2 rounded" style="color: var(--color-text-secondary); background: var(--color-surface);">
              <span class="inline-block w-20 font-mono text-xs px-2 py-0.5 rounded" style="background: var(--color-elevated); color: var(--color-text-tertiary);">[{{ item.type }}]</span>
              <span v-if="item.type === 'paragraph'" class="line-clamp-1">{{ item.content_text }}</span>
              <span v-else style="color: #A48B7E;">🖼 Image</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-test {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200;
  background: var(--color-accent);
  color: white;
}

.btn-test:hover {
  background: var(--color-accent-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-test-success {
  background: var(--color-success);
}

.btn-test-success:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-test-purple {
  background: #A48B7E;
}

.btn-test-purple:hover {
  background: #8B7366;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-test-danger {
  background: var(--color-error);
}

.btn-test-danger:hover {
  background: #B91C1C;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
</style>
