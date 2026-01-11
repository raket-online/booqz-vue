// Core data model types for BOOQZ book translator editor

export type ContentType = 'paragraph' | 'image'
export type SectionType = 'chapter' | 'subchapter'

export interface BaseItem {
  id: number
  notes: string
  sortOrder: number
}

export interface Paragraph extends BaseItem {
  type: 'paragraph'
  content_text: string        // HTML content
  versions: string[]          // Version history (max 4)
  versionIndex: number        // Current version pointer
}

export interface Image extends BaseItem {
  type: 'image'
  content_text: string        // HTML img tag
  url: string                 // Extracted URL
  alt?: string
  name: string                // Display name (e.g., "Image 01", "Image 02")
}

export type ContentItem = Paragraph | Image

export interface Section {
  id: number
  type: SectionType
  number: number              // Section number (1, 2, 3...)
  title: string
  notes: string
  sortOrder: number
  contentItems: ContentItem[]
  subsections: Section[]      // Nested subchapters (chapters only)
}

export interface BookMetadata {
  id: number
  title: string
  language: string            // Source language code (e.g., "en")
  version: string             // Version string (e.g., "1.0")
  notes: string               // Book-level notes (HTML)
  createdAt: string           // ISO date string
  updatedAt: string           // ISO date string
}

export interface BookTranslationSettings {
  targetLanguage: string      // Target language code
  translationInstructions: string  // Custom translation prompt
}

export interface Book extends BookMetadata {
  sections: Section[]         // Top-level chapters
  translationSettings?: BookTranslationSettings
}

export interface FindContentResult {
  item: ContentItem
  parent: Section
  index: number
}

export interface FindSectionResult {
  section: Section
  parent?: Section            // Present for subchapters
  index: number
}

export interface ParagraphContext {
  previous: string | null
  current: string
  next: string | null
}
