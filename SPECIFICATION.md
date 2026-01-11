# BOOQZ - Book Translator Editor
## Complete Project Specification

---

# Part A: ProjectSpecs

## 1. Application Overview

**BOOQZ** is a modern web application for editing and translating books with a tree-based navigation structure, AI-powered translation capabilities, and cloud backup functionality. The application runs entirely in the browser as a Single Page Application (SPA) using Vue.js

### Core Purpose
- Edit books with hierarchical chapter/subchapter structure
- Translate content using AI (OpenAI GPT-4, Google Gemini)
- Speech-to-text dictation (Deepgram Nova-3)
- Cloud and local backup system
- Import/Export various formats (EPUB, ODT, DOCX, JSON, HTML)

### Technology Stack
| Component | Technology |
|-----------|------------|
| Frontend | Vue.js, Tailwind, Typescript |
| Rich Text Editor | Pell (1kB lightweight editor) |
| Drag & Drop | SortableJS |
| File Handling | JSZip |
| Icons | Font Awesome 6.5.1 |
| Local Storage | Pinia |
| Cloud Storage | Supabase database, Supabase Bucket | 
| AI Translation | OpenAI API, Google Gemini API |
| Speech-to-Text | Deepgram Nova-3 API |
| Image Hosting | ImgBB API |

---


## 3. UI Layout



```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [BOOQZ] [Last backup: X ago]  [Import/Export ▼] [Book Settings] [Settings]  │
├─────────────────┬────────────────────────────────────┬──────────────────────┤
│  Tree Panel     │  Editor Panel                      │  Notes Panel         │
│  (35% width)    │  (50% width)                       │  (15% width)         │
│                 │                                    │                      │
│  📖 Book Title  │  ┌──────────────────────────────┐  │  📝 Notes   [🗑️][◀] │
│  ├─ Ch 1 📝     │  │ [Improve][Translate][↶][↷]  │  │                      │
│  │  ├─ 1.1      │  │ [B][I][U][•][1.][🔗][―][🎤] │  │  [Notes Editor]      │
│  │  │  • ¶      │  └──────────────────────────────┘  │                      │
│  │  │  • 🖼     │                                    │                      │
│  │  └─ 1.2      │  [Rich text editor area]           │                      │
│  └─ Ch 2        │                                    │                      │
│                 │                          [Save]    │                      │
│  [+Ch][+Sub]    │                                    │                      │
│  [+¶][+🖼]      │                                    │                      │
└─────────────────┴────────────────────────────────────┴──────────────────────┘
```

---

## 4. Authentication Flow

### Username-based Authentication (Cloud Backup)

1. **First Launch**: Login modal appears requesting username and password
2. **Session**: Check Supabase Auth database and login


---

## 5. Core Functionality Descriptions

### 5.1 Book Editing

**Description**: Edit books with hierarchical structure (Book → Chapters → Subchapters → Paragraphs/Images)

**UI Elements**:
- Tree panel (left): Hierarchical navigation with collapse/expand
- Editor panel (center): Pell rich text editor with toolbar
- Notes panel (right): Per-item annotations

**User Flow**:
1. Click item in tree to select
2. Content loads in editor
3. Edit with formatting toolbar (Bold, Italic, Underline, Lists, Links)
4. Auto-save triggers after 1000ms of inactivity
5. Manual save button available

### 5.2 AI Translation

**Description**: Translate content using OpenAI GPT-4 or Google Gemini models

**UI Elements**:
- "Translate" button in editor toolbar
- "Translate All" in settings for bulk translation
- Progress modal during translation
- Cancel button for stopping mid-operation

**User Flow**:
1. Select item (paragraph, chapter, or subchapter)
2. Click "Translate" button
3. AI translates preserving HTML formatting
4. Original version saved for revert
5. Context from surrounding paragraphs used (configurable word limit)

**Available Models**:
- `openai-gpt4`: gpt-4.1-mini-2025-04-14 (32K tokens)
- `gemini-pro`: gemini-2.5-pro
- `gemini-flash`: gemini-2.5-flash

### 5.3 Text Improvement

**Description**: AI-powered text enhancement for fluency and readability

**UI Elements**:
- "Improve" button in editor toolbar

**User Flow**:
1. Select paragraph
2. Click "Improve"
3. AI rewrites for better readability
4. Original version preserved

### 5.4 Speech-to-Text

**Description**: Real-time dictation using Deepgram Nova-3

**UI Elements**:
- Microphone button in editor toolbar
- Visual states: gray (idle), red pulsing (recording), orange (error)

**User Flow**:
1. Click microphone or press Ctrl+M
2. Speak into microphone
3. Text inserted at cursor position in real-time
4. Click again to stop recording
5. Maximum 20 minutes recording time

**Technical Requirements**:
- HTTPS or localhost required
- Microphone permission needed
- WebSocket connection to Deepgram

### 5.5 Image Management

**Description**: Upload and manage images via ImgBB cloud hosting

**UI Elements**:
- Image viewer (replaces editor for images)
- File upload input
- URL input field
- "Upload & Replace" button

**User Flow**:
1. Add image to chapter/subchapter
2. Choose file or enter URL
3. Upload to ImgBB (if API key configured)
4. Image displays in viewer

### 5.6 Notes/Annotations

**Description**: Per-item notes for brainstorming, plot ideas, TODOs

**UI Elements**:
- Notes panel (right side, collapsible)
- Rich text editor for notes
- 📝 indicator in tree for items with notes
- Clear notes button

**User Flow**:
1. Select any item
2. Notes panel shows item's notes
3. Edit with formatting
4. Auto-save after 1000ms
5. Notes excluded from all exports

### 5.7 Drag & Drop Reordering

**Description**: Reorder chapters, subchapters, and content items

**UI Elements**:
- Grab cursor on tree items
- Ghost preview during drag
- Drop zones highlighted

**User Flow**:
1. Click and hold tree item
2. Drag to new position
3. Drop to reorder
4. Auto-renumbering applied
5. Flash animation confirms change

### 5.8 Backup System

**Description**: Automatic local and cloud backups

**UI Elements**:
- "Last backup: X ago" in toolbar
- Backup settings in Settings modal
- Restore backup modal with list

**Local Storage** (Pinia):
- Saves onchange (5 seconds delay)
- Manual download as JSON

**Cloud Storage** (Supabase database):
- Every 1 minutes when enabled

### 5.9 Import/Export

**Import Formats**:
| Format | Features |
|--------|----------|
| EPUB | Full EPUB 2.0/3.0, chapters, subchapters, images |
| ODT | OpenDocument Text, headings → chapters, formatting preserved |
| DOCX | Microsoft Word, heading styles, bold/italic |
| JSON | Full book structure backup |

**Export Formats**:
| Format | Features |
|--------|----------|
| HTML | Single file, proper heading structure |
| JSON | Complete backup with all data |
| EPUB | Simplified (not fully implemented) |

---

## 6. Settings Management

### 6.1 Settings Tabs

The Settings modal contains 6 tabs:

1. **General**: AI Model selection, Default target language
2. **Translation**: Translation/Improve instructions, Context settings
3. **Glossary**: Term translations with search, import/export
4. **API Keys**: OpenAI, Google, Deepgram, ImgBB keys
5. **Cloud Backup**: Username, enable/disable auto-backup
6. **Speech**: Speech-to-text language selection

### 6.2 Settings Storage (localStorage)

| Key | Description | Location |
|-----|-------------|----------|
| `openai_api_key` | OpenAI API key|
| `google_api_key` | Google Gemini API key |
| `deepgram_api_key` | Deepgram API key |
| `supabase__url` | Supabase URL |
| `supabase_api_key` | Supabase API key |
| `speech_language` | Speech input language |
| `selected_ai_model` | Selected AI model ID |
| `translatorGlobalSettings` | Translation settings JSON |
| `translationGlossary` | Glossary entries JSON |
| `auth_username` | Cloud backup username |
| `notesPanelOpen` | Notes panel state |
| `treeCollapseState` | Tree collapse state JSON |

### 6.3 Book-level Settings (in book object)

| Field | Description |
|-------|-------------|
| `targetLanguage` | Book-specific target language |
| `translationInstructions` | Book-specific translation prompt |

---

## 7. Database Queries (IndexedDB)

### 7.1 Book Storage Database

**Database Name**: `TranslatorDB`
**Object Store**: `books`

| Operation | Function | Line | Description |
|-----------|----------|------|-------------|
| Save Book | `saveBook(bookData)` | 35-55 | Save entire book object |
| Load Book | `loadBook()` | 57-75 | Load book (key: 1) |
| Clear All | `clearAll()` | 77-95 | Delete all stored data |

---


# Part B: FunctionCatalog

## Module: StorageManager (`/js/storage.js`)

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `saveBook` | `bookData: Object` | `Promise<{storage: string}>` | Save book to IndexedDB |
| `loadBook` | none | `Promise<Object\|null>` | Load book from IndexedDB |
| `clearAll` | none | `Promise<boolean>` | Clear all stored data |

---

## Module: DataManager (`/js/data.js`)

### Book Operations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `loadBook` | none | `Promise<Object>` | Load book from storage or create demo |
| `saveBook` | none | `void` | Non-blocking save wrapper |
| `saveBookAsync` | none | `Promise<boolean>` | Async save to storage |
| `getBook` | none | `Object` | Get current book object |
| `importBook` | `bookData: Object, replace?: boolean` | `Promise<boolean>` | Import book from JSON |

### Title & Info Operations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `updateBookTitle` | `title: string` | `void` | Update book title |
| `updateBookInfo` | `language: string, version: string` | `void` | Update language/version |
| `updateBookTranslationSettings` | `instructions: string, targetLanguage: string` | `void` | Update translation settings |

### CRUD Operations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `addChapter` | `title?: string` | `Object` | Add new chapter |
| `addSubchapter` | `parentId: number, title?: string` | `Object` | Add subchapter to section |
| `addParagraph` | `sectionId: number, content?: string` | `Object` | Add paragraph to section |
| `addImage` | `sectionId: number, url: string, alt?: string` | `Object` | Add image to section |
| `deleteItem` | `itemId: number, itemType: string` | `void` | Delete chapter/subchapter/content |
| `updateSectionTitle` | `sectionId: number, newTitle: string` | `void` | Update section title |
| `updateContent` | `itemId: number, content: string, createNewVersion?: boolean` | `void` | Update content item |

### Version Control

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `undo` | `itemId: number` | `Object\|null` | Go to previous version |
| `redo` | `itemId: number` | `Object\|null` | Go to next version |
| `canUndo` | `itemId: number` | `boolean` | Check if undo available |
| `canRedo` | `itemId: number` | `boolean` | Check if redo available |
| `getVersionInfo` | `itemId: number` | `Object\|null` | Get version info for UI |

### Search/Query Operations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `findSection` | `sections: Array, id: number` | `Object\|null` | Find section by ID recursively |
| `findSectionById` | `sectionId: number` | `Object\|null` | Public section finder |
| `findContentItem` | `sections: Array, id: number` | `{item, parent}\|null` | Find content item |
| `getAllParagraphs` | none | `Array` | Get all paragraphs in book |
| `getAllSections` | none | `Array` | Get all chapters + subchapters |
| `getAllChapters` | none | `Array` | Get all chapters |
| `getAllSubchapters` | none | `Array` | Get all subchapters |
| `getParagraphContext` | `itemId: number, wordLimit?: number` | `{previous, current, next}` | Get surrounding paragraphs |

### Move Operations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `moveItem` | `itemId, itemType, newParentId, newIndex` | `boolean` | Move any item |
| `moveChapter` | `chapterId: number, newIndex: number` | `boolean` | Move chapter position |
| `promoteToChapter` | `subchapterId: number` | `Object` | Promote subchapter to chapter |
| `demoteToSubchapter` | `chapterId: number` | `Object` | Demote chapter to subchapter |

### Word Count

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `countWordsInHtml` | `html: string` | `number` | Count words in HTML |
| `getSubchapterWordCount` | `subchapterId: number` | `number` | Get subchapter word count |
| `getChapterWordCount` | `chapterId: number` | `number` | Get chapter word count (includes subs) |
| `getBookWordCount` | none | `number` | Get total book word count |

### Utility

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `saveCollapseState` | `state: Object` | `void` | Save tree collapse state |
| `loadCollapseState` | none | `Object` | Load tree collapse state |
| `getLastWords` | `html: string, wordCount: number` | `string` | Extract last N words |
| `getFirstWords` | `html: string, wordCount: number` | `string` | Extract first N words |

---

## Module: TreeManager 

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `init` | `onSelect: Function, onDelete: Function` | `void` | Initialize tree with callbacks |
| `renderTree` | none | `void` | Render entire tree HTML |
| `selectItem` | `id: number, type: string` | `void` | Select item and trigger callback |
| `getSelectedItem` | none | `{id, type}` | Get currently selected item |
| `flashItem` | `itemId: number, itemType: string` | `void` | Flash animation on item |

---

## Module: EditorManager

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `init` | none | `void` | Initialize Pell editor |
| `loadContent` | `id: number, type: string` | `void` | Load item content into editor |
| `saveContent` | none | `void` | Save editor content to data model |
| `getCurrentItem` | none | `{id, type}\|null` | Get currently loaded item |
| `enableEditor` | none | `void` | Enable contenteditable |
| `disableEditor` | none | `void` | Disable contenteditable |

---

## Module: NotesManager

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `init` | none | `void` | Initialize notes panel and editor |
| `loadNotes` | `itemId: number, itemType: string` | `void` | Load notes for item |
| `saveNotes` | none | `void` | Save notes to data model |
| `clearNotes` | none | `void` | Clear notes editor |
| `clearCurrentNotes` | none | `void` | Clear notes for current item |
| `hasNotes` | `itemId: number, itemType: string` | `boolean` | Check if item has notes |
| `openPanel` | none | `void` | Open notes panel |
| `closePanel` | none | `void` | Close notes panel |
| `scheduleAutoSave` | none | `void` | Schedule debounced auto-save |

---

## Module: TranslatorManager

### API Key Management

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getOpenAIApiKey` | none | `string\|null` | Get OpenAI API key |
| `saveOpenAIApiKey` | `key: string` | `void` | Save OpenAI API key |
| `getGoogleApiKey` | none | `string\|null` | Get Google API key |
| `saveGoogleApiKey` | `key: string` | `void` | Save Google API key |
| `hasApiKey` | none | `boolean` | Check if selected model has key |

### Model Management

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getSelectedModel` | none | `string` | Get selected model ID |
| `saveSelectedModel` | `modelId: string` | `void` | Save selected model |
| `getAvailableModels` | none | `Array` | Get all available models |

### Settings

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getGlobalSettings` | none | `Object` | Get global translation settings |
| `saveGlobalSettings` | `settings: Object` | `void` | Save global settings |
| `getEffectiveSettings` | none | `Object` | Get merged book + global settings |

### Glossary

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getGlossary` | none | `Array` | Get glossary entries |
| `saveGlossary` | `glossary: Array` | `void` | Save glossary |
| `addGlossaryEntry` | `source: string, target: string` | `void` | Add glossary entry |
| `removeGlossaryEntry` | `index: number` | `void` | Remove glossary entry |

### Translation Operations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `translateCurrentItem` | none | `Promise<void>` | Translate selected item |
| `translateItem` | `itemId, targetLang, instructions, includeContext, contextWordLimit` | `Promise<void>` | Translate single paragraph |
| `translateSectionTitle` | `sectionId, targetLang, instructions` | `Promise<void>` | Translate section title |
| `translateAll` | `targetLang, customPrompt, onProgress` | `Promise<void>` | Translate entire book |
| `translateContent` | `htmlContent, targetLang, instructions, context` | `Promise<string>` | Call AI API |
| `cancelTranslation` | none | `void` | Cancel ongoing translation |
| `isInProgress` | none | `boolean` | Check if translation in progress |

### Improvement

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `improveCurrentItem` | none | `Promise<void>` | Improve selected item |
| `improveParagraph` | `itemId: number` | `Promise<void>` | Improve paragraph text |
| `improveSectionTitle` | `sectionId: number` | `Promise<void>` | Improve section title |

---

## Module: SpeechManager

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `init` | none | `void` | Initialize speech module |
| `toggleRecording` | none | `void` | Start/stop recording |
| `startRecording` | none | `Promise<void>` | Start microphone and WebSocket |
| `stopRecording` | none | `void` | Stop recording and cleanup |
| `isInProgress` | none | `boolean` | Check if recording active |
| `hasApiKey` | none | `boolean` | Check Deepgram API key exists |
| `getLanguage` | none | `string` | Get speech language setting |
| `saveLanguage` | `lang: string` | `void` | Save speech language |

---

## Module: ImageManager

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `init` | none | `void` | Initialize image viewer |
| `getApiKey` | none | `string\|null` | Get ImgBB API key |
| `saveApiKey` | `key: string` | `void` | Save ImgBB API key |
| `hasApiKey` | none | `boolean` | Check if API key exists |
| `loadImageViewer` | `imageId: number` | `void` | Load image in viewer |
| `hideImageViewer` | none | `void` | Hide image viewer |
| `uploadImagesToImgBB` | `images: Object, onProgress?: Function` | `Promise<Object>` | Batch upload images |
| `base64ToBlob` | `base64String: string` | `Blob` | Convert base64 to Blob |

---


## Module: DragDropManager

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `init` | none | `void` | Initialize SortableJS instances |
| `destroy` | none | `void` | Destroy all Sortable instances |

---

## Module: MobileManager

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `init` | none | `void` | Initialize mobile features |
| `toggleTreeDrawer` | none | `void` | Toggle tree drawer |
| `openTreeDrawer` | none | `void` | Open tree drawer |
| `closeTreeDrawer` | none | `void` | Close tree drawer |
| `navigatePrevious` | none | `void` | Navigate to previous item |
| `navigateNext` | none | `void` | Navigate to next item |
| `updateCurrentItem` | `id: number, type: string` | `void` | Update current item display |
| `isMobile` | none | `boolean` | Check if mobile view |
| `isTablet` | none | `boolean` | Check if tablet view |

---

## Import Modules

### EPUBImporter

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `importFromEPUB` | `file: File, onProgress?: Function, options?: Object` | `Promise<{success, book, stats}>` | Import EPUB file |

### ODTImporter

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `importFromODT` | `file: File, onProgress?: Function, options?: Object` | `Promise<{success, book, stats}>` | Import ODT file |

### DOCXImporter

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `importFromDOCX` | `file: File, onProgress?: Function, options?: Object` | `Promise<{success, book, stats}>` | Import DOCX file |

---

## Export Modules

### JSONExporter

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `exportToJSON` | none | `void` | Export book as JSON download |
| `importFromJSON` | `file: File` | `Promise<Object>` | Parse and validate JSON |

### HTMLExporter

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `exportToHTML` | none | `void` | Export book as HTML download |

### EPUBExporter

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `exportToEPUB` | none | `void` | Export to EPUB (simplified) |

---

# Part C: EndpointCatalog



## External API Integrations

### OpenAI API

**Endpoint**: `https://api.openai.com/v1/chat/completions`

**Method**: POST

**Headers**:
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Request Body**:
```json
{
  "model": "gpt-4.1-mini-2025-04-14",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "max_completion_tokens": 32768
}
```

---

### Google Gemini API

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

**Method**: POST

**Query Parameters**:
- `key`: Google API key

**Request Body**:
```json
{
  "contents": [
    {
      "parts": [
        { "text": "..." }
      ]
    }
  ]
}
```

---

### Deepgram API (WebSocket)

**Endpoint**: `wss://api.deepgram.com/v1/listen`

**Protocol**: WebSocket with token authentication

**Query Parameters**:
- `model`: nova-3
- `language`: {configured language}
- `punctuate`: true
- `smart_format`: true
- `encoding`: linear16
- `sample_rate`: 48000

**Authentication**: Token subprotocol with API key

---


# Part D: DataModel

## Book Structure

```javascript
{
  // Book metadata
  id: number,                    // Unique identifier
  title: string,                 // Book title
  language: string,              // Source language code (e.g., "en")
  version: string,               // Version string (e.g., "1.0")
  notes: string,                 // Book-level notes (HTML)
  createdAt: string,             // ISO date string
  updatedAt: string,             // ISO date string

  // Translation settings (optional, overrides global)
  targetLanguage: string,        // Target language code
  translationInstructions: string, // Custom translation prompt

  // Content hierarchy
  sections: Section[]            // Array of chapters
}
```

## Section (Chapter/Subchapter)

```javascript
{
  id: number,                    // Unique identifier
  type: "chapter" | "subchapter", // Section type
  number: number,                // Section number (1, 2, 3...)
  title: string,                 // Section title
  notes: string,                 // Section notes (HTML)
  sortOrder: number,             // Position in parent
  contentItems: ContentItem[],   // Paragraphs and images
  subsections: Section[]         // Nested subchapters
}
```

## ContentItem (Paragraph/Image)

```javascript
// Paragraph
{
  id: number,                    // Unique identifier
  type: "paragraph",             // Content type
  content_text: string,          // Current content (HTML)
  versions: string[],            // Version history (max 4)
  versionIndex: number,          // Current version index
  notes: string,                 // Item notes (HTML)
  sortOrder: number              // Position in section
}

// Image
{
  id: number,                    // Unique identifier
  type: "image",                 // Content type
  content_text: string,          // HTML img tag
  notes: string,                 // Item notes (HTML)
  sortOrder: number              // Position in section
}
```


## Pinia

| Key | Type | Description |
|-----|------|-------------|
| `openai_api_key` | string | OpenAI API key |
| `google_api_key` | string | Google Gemini API key |
| `deepgram_api_key` | string | Deepgram API key |
| `imgbb_api_key` | string | ImgBB API key |
| `speech_language` | string | Speech-to-text language |
| `selected_ai_model` | string | Selected AI model ID |
| `translatorGlobalSettings` | JSON | Global translation settings |
| `translationGlossary` | JSON | Glossary entries array |
| `auth_username` | string | Cloud backup username |
| `notesPanelOpen` | "true"/"false" | Notes panel state |
| `treeCollapseState` | JSON | Tree collapse state object |
| `cloudBackupEnabled` | "true"/"false" | Cloud backup toggle |

## IndexedDB Databases

### TranslatorDB
- **Object Store**: `books`
- **Key**: Fixed value `1` (single book)
- **Value**: Complete Book object

### TranslatorBackups
- **Object Store**: `backups`
- **Key**: Auto-increment
- **Index**: `timestamp`
- **Value**: Backup object with book, settings, timestamp

---

## Version History Model

Each paragraph maintains up to 4 versions:

```javascript
{
  versions: [
    "<p>Original text</p>",        // Index 0
    "<p>First translation</p>",    // Index 1
    "<p>Improvement</p>",          // Index 2
    "<p>Current version</p>"       // Index 3 (max)
  ],
  versionIndex: 3  // Currently active version
}
```

**Version Rules**:
- Normal edits update current version in-place
- Translate/Improve create new versions
- Max 4 versions (oldest removed when exceeded)
- Undo/Redo navigate through versions

---

## Glossary Entry

```javascript
{
  source: string,    // Source term (e.g., "Church")
  target: string     // Translation (e.g., "gemeente")
}
```

---

## Import Stats Object

```javascript
{
  success: boolean,
  book: Book,           // Imported book object
  stats: {
    chapters: number,
    subchapters: number,
    paragraphs: number,
    images: number
  },
  error?: string        // Only if success: false
}
```
