import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Book, Section, ContentItem, Paragraph, FindContentResult, ParagraphContext } from '@/types/book'
import { useStorage } from '@/composables/useStorage'

export const useBookStore = defineStore('book', () => {
  // Use ref for full reactivity (changed from shallowRef to fix nested mutations)
  const book = ref<Book | null>(null)
  const loading = ref(false)
  const lastSaveTime = ref<Date | null>(null)
  const nextId = ref(1) // Counter for generating unique IDs
  const nextImageNumber = ref(1) // Counter for image naming

  const { saveBook: saveToStorage, loadBook: loadFromStorage } = useStorage()

  // Computed properties
  const wordCount = computed(() => {
    if (!book.value) return 0
    let count = 0
    book.value.sections.forEach(chapter => {
      count += countWordsInSection(chapter)
    })
    return count
  })

  const chapterCount = computed(() => book.value?.sections.length || 0)

  // Helper: Count words in a section and its subsections
  function countWordsInSection(section: Section): number {
    let count = 0

    // Count words in content items
    section.contentItems.forEach(item => {
      if (item.type === 'paragraph') {
        const text = stripHtml(item.content_text)
        count += text.split(/\s+/).filter(w => w.length > 0).length
      }
    })

    // Recursively count in subsections
    section.subsections.forEach(sub => {
      count += countWordsInSection(sub)
    })

    return count
  }

  // Helper: Strip HTML tags
  function stripHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  // Generate next unique ID
  function generateId(): number {
    return nextId.value++
  }

  // Load book from storage
  async function loadBook() {
    loading.value = true
    try {
      const loaded = await loadFromStorage()
      if (loaded) {
        book.value = loaded
        // Find highest ID and set nextId
        const maxId = findMaxId(loaded)
        nextId.value = maxId + 1
        // Find highest image number and set nextImageNumber
        const maxImageNumber = findMaxImageNumber(loaded)
        nextImageNumber.value = maxImageNumber + 1
      } else {
        // Create demo book
        book.value = createDemoBook()
      }
    } catch (error) {
      console.error('Failed to load book:', error)
      book.value = createDemoBook()
    } finally {
      loading.value = false
    }
  }

  // Find highest ID in book
  function findMaxId(book: Book): number {
    let max = 0

    function checkSection(section: Section) {
      if (section.id > max) max = section.id
      section.contentItems.forEach(item => {
        if (item.id > max) max = item.id
      })
      section.subsections.forEach(checkSection)
    }

    book.sections.forEach(checkSection)
    return max
  }

  // Find highest image number in book
  function findMaxImageNumber(book: Book): number {
    let max = 0

    function checkSection(section: Section) {
      section.contentItems.forEach(item => {
        if (item.type === 'image') {
          // Extract number from name (e.g., "Image 05" -> 5)
          const match = item.name.match(/Image (\d+)/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num > max) max = num
          }
        }
      })
      section.subsections.forEach(checkSection)
    }

    book.sections.forEach(checkSection)
    return max
  }

  // Save book to storage
  async function saveBook() {
    if (!book.value) return

    book.value.updatedAt = new Date().toISOString()
    await saveToStorage(book.value)
    lastSaveTime.value = new Date()
  }

  // Create demo book for new users
  function createDemoBook(): Book {
    return {
      id: 1,
      title: 'My New Book',
      language: 'en',
      version: '1.0',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: []
    }
  }

  // CRUD Operations - Chapter
  function addChapter(title?: string): Section {
    if (!book.value) throw new Error('No book loaded')

    const chapter: Section = {
      id: generateId(),
      type: 'chapter',
      number: book.value.sections.length + 1,
      title: title || `Chapter ${book.value.sections.length + 1}`,
      notes: '',
      sortOrder: book.value.sections.length,
      contentItems: [],
      subsections: []
    }

    book.value.sections.push(chapter)
    return chapter
  }

  function deleteChapter(chapterId: number) {
    if (!book.value) return
    book.value.sections = book.value.sections.filter(ch => ch.id !== chapterId)
    renumberChapters()
  }

  function renumberChapters() {
    if (!book.value) return
    book.value.sections.forEach((ch, index) => {
      ch.number = index + 1
      ch.sortOrder = index
    })
  }

  // CRUD Operations - Subchapter
  function addSubchapter(parentId: number, title?: string): Section {
    if (!book.value) throw new Error('No book loaded')

    const parent = findSectionRecursive(book.value.sections, parentId)
    if (!parent) {
      throw new Error('Parent section not found')
    }

    // Generate title based on parent type
    const defaultTitle = parent.type === 'chapter'
      ? `Section ${parent.subsections.length + 1}`
      : `Subsection ${parent.subsections.length + 1}`

    const subchapter: Section = {
      id: generateId(),
      type: 'subchapter',
      number: parent.subsections.length + 1,
      title: title || defaultTitle,
      notes: '',
      sortOrder: parent.subsections.length,
      contentItems: [],
      subsections: []
    }

    parent.subsections.push(subchapter)
    return subchapter
  }

  // CRUD Operations - Content Items
  function addParagraph(sectionId: number, content: string = '<p>New paragraph</p>'): ContentItem {
    if (!book.value) throw new Error('No book loaded')

    const section = findSectionRecursive(book.value.sections, sectionId)
    if (!section) throw new Error('Section not found')

    const paragraph: ContentItem = {
      id: generateId(),
      type: 'paragraph',
      content_text: content,
      versions: [content], // Store initial version
      versionIndex: 0,
      notes: '',
      sortOrder: section.contentItems.length
    }

    section.contentItems.push(paragraph)
    return paragraph
  }

  function addImage(sectionId: number, url: string, alt: string = ''): ContentItem {
    if (!book.value) throw new Error('No book loaded')

    const section = findSectionRecursive(book.value.sections, sectionId)
    if (!section) throw new Error('Section not found')

    // Generate image name with zero-padded number
    const imageNumber = nextImageNumber.value++
    const imageName = `Image ${String(imageNumber).padStart(2, '0')}`

    const image: ContentItem = {
      id: generateId(),
      type: 'image',
      content_text: `<img src="${url}" alt="${alt}" />`,
      url,
      alt,
      name: imageName,
      notes: '',
      sortOrder: section.contentItems.length
    }

    section.contentItems.push(image)
    return image
  }

  function deleteItem(itemId: number, itemType: 'section' | 'content') {
    if (!book.value) return

    if (itemType === 'section') {
      deleteSectionRecursive(book.value.sections, itemId)
      renumberChapters()
    } else {
      deleteContentItemRecursive(book.value.sections, itemId)
    }
  }

  function deleteSectionRecursive(sections: Section[], id: number): boolean {
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === id) {
        sections.splice(i, 1)
        return true
      }
      if (deleteSectionRecursive(sections[i].subsections, id)) {
        return true
      }
    }
    return false
  }

  function deleteContentItemRecursive(sections: Section[], id: number): boolean {
    for (const section of sections) {
      const index = section.contentItems.findIndex(item => item.id === id)
      if (index !== -1) {
        section.contentItems.splice(index, 1)
        return true
      }
      if (deleteContentItemRecursive(section.subsections, id)) {
        return true
      }
    }
    return false
  }

  // Update Operations
  function updateSectionTitle(sectionId: number, newTitle: string) {
    const section = findSectionRecursive(book.value?.sections || [], sectionId)
    if (section) {
      section.title = newTitle
    }
  }

  function updateSectionNotes(sectionId: number, notes: string) {
    const section = findSectionRecursive(book.value?.sections || [], sectionId)
    if (section) {
      section.notes = notes
    }
  }

  function updateContentNotes(itemId: number, notes: string) {
    const result = findContentItemRecursive(book.value?.sections || [], itemId)
    if (result) {
      result.item.notes = notes
    }
  }

  function updateImageName(itemId: number, name: string) {
    const result = findContentItemRecursive(book.value?.sections || [], itemId)
    if (result && result.item.type === 'image') {
      result.item.name = name
    }
  }

  function updateContent(itemId: number, content: string) {
    if (!book.value) return

    const result = findContentItemRecursive(book.value.sections, itemId)
    if (result) {
      const { item } = result

      if (item.type === 'paragraph') {
        const currentContent = item.content_text

        // If content hasn't changed, do nothing
        if (currentContent === content) return

        // Version management: save state before change
        const newVersions = [...item.versions]

        // If we're not at the latest version, we're in "undo" state
        // When user makes a new edit from an undo state, we need to:
        // 1. Remove all "future" versions (after current index)
        // 2. Add the new content as the next version
        if (item.versionIndex < newVersions.length - 1) {
          // We're in undo state - remove future versions
          newVersions.splice(item.versionIndex + 1)
        }

        // Add new content as the next version
        newVersions.push(content)

        // Keep only last 10 versions to prevent memory issues
        if (newVersions.length > 10) {
          newVersions.shift()
          // Adjust versionIndex if we removed from the front
          item.versionIndex = Math.max(0, item.versionIndex - 1)
        }

        // Update to point to the new version
        item.versionIndex = newVersions.length - 1
        item.versions = newVersions
        item.content_text = content
      } else if (item.type === 'image') {
        // For images, parse the HTML to extract URL and alt
        const imgMatch = content.match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/)
        if (imgMatch) {
          item.content_text = content
          item.url = imgMatch[1]
          item.alt = imgMatch[2]
        }
      }
    }
  }

  // Query Operations
  function findSection(id: number): Section | null {
    if (!book.value) return null
    return findSectionRecursive(book.value.sections, id)
  }

  function findSectionRecursive(sections: Section[], id: number): Section | null {
    for (const section of sections) {
      if (section.id === id) return section
      const found = findSectionRecursive(section.subsections, id)
      if (found) return found
    }
    return null
  }

  function findContentItem(id: number): { item: ContentItem, parent: Section } | null {
    if (!book.value) return null
    return findContentItemRecursive(book.value.sections, id)
  }

  function findContentItemRecursive(sections: Section[], id: number): FindContentResult | null {
    for (const section of sections) {
      const index = section.contentItems.findIndex(item => item.id === id)
      if (index !== -1) {
        return { item: section.contentItems[index], parent: section, index }
      }
      const found = findContentItemRecursive(section.subsections, id)
      if (found) return found
    }
    return null
  }

  function getAllParagraphs(): Paragraph[] {
    if (!book.value) return []
    const paragraphs: Paragraph[] = []

    function collectFromSection(section: Section) {
      section.contentItems.forEach(item => {
        if (item.type === 'paragraph') {
          paragraphs.push(item)
        }
      })
      section.subsections.forEach(collectFromSection)
    }

    book.value.sections.forEach(collectFromSection)
    return paragraphs
  }

  function getParagraphContext(itemId: number, wordLimit: number = 200): ParagraphContext {
    const paragraphs = getAllParagraphs()
    const index = paragraphs.findIndex(p => p.id === itemId)

    if (index === -1) {
      return { previous: null, current: '', next: null }
    }

    const getText = (p: Paragraph) => stripHtml(p.content_text)
    const getWords = (text: string) => text.split(/\s+/).filter(w => w.length > 0)

    const current = getText(paragraphs[index])
    const previous = index > 0 ? getText(paragraphs[index - 1]) : null
    const next = index < paragraphs.length - 1 ? getText(paragraphs[index + 1]) : null

    // Truncate to word limit
    const truncate = (text: string | null) => {
      if (!text) return null
      const words = getWords(text)
      if (words.length <= wordLimit) return text
      return words.slice(0, wordLimit).join(' ')
    }

    return {
      previous: truncate(previous),
      current,
      next: truncate(next)
    }
  }

  // Version Control
  function undo(itemId: number): Paragraph | null {
    if (!book.value) return null

    const result = findContentItemRecursive(book.value.sections, itemId)
    if (result && result.item.type === 'paragraph') {
      const { item } = result
      if (item.versionIndex > 0) {
        item.versionIndex--
        item.content_text = item.versions[item.versionIndex]
        return item
      }
    }
    return null
  }

  function redo(itemId: number): Paragraph | null {
    if (!book.value) return null

    const result = findContentItemRecursive(book.value.sections, itemId)
    if (result && result.item.type === 'paragraph') {
      const { item } = result
      if (item.versionIndex < item.versions.length - 1) {
        item.versionIndex++
        item.content_text = item.versions[item.versionIndex]
        return item
      }
    }
    return null
  }

  function canUndo(itemId: number): boolean {
    const result = findContentItemRecursive(book.value?.sections || [], itemId)
    if (result && result.item.type === 'paragraph') {
      return result.item.versionIndex > 0
    }
    return false
  }

  function canRedo(itemId: number): boolean {
    const result = findContentItemRecursive(book.value?.sections || [], itemId)
    if (result && result.item.type === 'paragraph') {
      return result.item.versionIndex < result.item.versions.length - 1
    }
    return false
  }

  // Get current version index for an item
  function getVersionIndex(itemId: number): number {
    const result = findContentItemRecursive(book.value?.sections || [], itemId)
    if (result && result.item.type === 'paragraph') {
      return result.item.versionIndex
    }
    return -1
  }

  // Get total number of versions for an item
  function getVersionCount(itemId: number): number {
    const result = findContentItemRecursive(book.value?.sections || [], itemId)
    if (result && result.item.type === 'paragraph') {
      return result.item.versions.length
    }
    return 0
  }

  // Move Operations (for drag-drop)
  function moveChapter(chapterId: number, newIndex: number): boolean {
    if (!book.value) return false

    const index = book.value.sections.findIndex(ch => ch.id === chapterId)
    if (index === -1) return false

    const [chapter] = book.value.sections.splice(index, 1)
    book.value.sections.splice(newIndex, 0, chapter)
    renumberChapters()
    return true
  }

  function moveItem(_itemId: number, _itemType: string, _newParentId: number, _newIndex: number): boolean {
    // Simplified implementation - to be expanded in Phase 2
    return false
  }

  // Book metadata
  function updateBookTitle(title: string) {
    if (book.value) {
      book.value.title = title
    }
  }

  function updateBookInfo(language: string, version: string) {
    if (book.value) {
      book.value.language = language
      book.value.version = version
    }
  }

  return {
    // State
    book,
    loading,
    lastSaveTime,

    // Computed
    wordCount,
    chapterCount,

    // Book operations
    loadBook,
    saveBook,

    // CRUD
    addChapter,
    deleteChapter,
    addSubchapter,
    addParagraph,
    addImage,
    deleteItem,
    updateSectionTitle,
    updateSectionNotes,
    updateContentNotes,
    updateImageName,
    updateContent,
    updateBookTitle,
    updateBookInfo,

    // Query
    findSection,
    findContentItem,
    getAllParagraphs,
    getParagraphContext,

    // Version control
    undo,
    redo,
    canUndo,
    canRedo,
    getVersionIndex,
    getVersionCount,

    // Move
    moveChapter,
    moveItem
  }
})
