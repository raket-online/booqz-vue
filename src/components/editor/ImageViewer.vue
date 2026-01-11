<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useBookStore } from '@/stores/book'
import { useEditorStore } from '@/stores/editor'
import { useImageUpload } from '@/composables/useImageUpload'

interface Props {
  itemId: number
  url: string
  alt?: string
}

const props = defineProps<Props>()

const bookStore = useBookStore()
const editorStore = useEditorStore()

const { uploading, uploadImage, uploadImageUrl, error } = useImageUpload()

const imageUrl = ref(props.url)
const altText = ref(props.alt || '')
const imageName = ref('Image 01')
const uploadMode = ref<'file' | 'url'>('file')
const fileInput = ref<HTMLInputElement | null>(null)
const urlInput = ref(props.url)
const isEditing = ref(false)

// Load image name on mount
onMounted(() => {
  const result = bookStore.findContentItem(props.itemId)
  if (result && result.item.type === 'image') {
    imageName.value = result.item.name
  }
})

// Computed: Check if this is a placeholder image
const isPlaceholder = computed(() => {
  return !imageUrl.value || imageUrl.value === 'https://via.placeholder.com/800x600' || imageUrl.value === ''
})

// Sync with props changes
watch(() => props.url, (newUrl) => {
  imageUrl.value = newUrl
  urlInput.value = newUrl
})

watch(() => props.alt, (newAlt) => {
  altText.value = newAlt || ''
})

// Save image name with debounce
let saveNameTimeout: ReturnType<typeof setTimeout> | null = null
watch(imageName, async (newName) => {
  if (!editorStore.selectedItemId) return

  if (saveNameTimeout) clearTimeout(saveNameTimeout)
  saveNameTimeout = setTimeout(async () => {
    bookStore.updateImageName(editorStore.selectedItemId!, newName)
    await bookStore.saveBook()
  }, 500)
})

// Save changes
async function saveChanges() {
  if (!editorStore.selectedItemId) return

  bookStore.updateContent(editorStore.selectedItemId, `<img src="${imageUrl.value}" alt="${altText.value}" />`)
  await bookStore.saveBook()
}

// Handle file upload
async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    const result = await uploadImage(file)
    imageUrl.value = result.data.url
    urlInput.value = result.data.url
    // Auto-save after upload
    await saveChanges()
  } catch (err: any) {
    console.error('Upload failed:', err)
  }
}

// Handle URL upload
async function handleUrlUpload() {
  if (!urlInput.value.trim()) return

  try {
    if (urlInput.value.startsWith('http://') || urlInput.value.startsWith('https://')) {
      imageUrl.value = urlInput.value
    } else {
      const result = await uploadImageUrl(urlInput.value)
      imageUrl.value = result.data.url
      urlInput.value = result.data.url
    }
    // Auto-save after upload
    await saveChanges()
  } catch (err: any) {
    console.error('URL upload failed:', err)
  }
}

// Trigger file input
function triggerFileInput() {
  fileInput.value?.click()
}

// Open image in new tab
function openInNewTab() {
  if (imageUrl.value && !isPlaceholder.value) {
    window.open(imageUrl.value, '_blank')
  }
}

// Delete image
async function deleteImage() {
  if (!props.itemId) return
  if (!confirm('Are you sure you want to delete this image?')) return

  bookStore.deleteItem(props.itemId, 'content')
  await bookStore.saveBook()

  // Clear selection
  editorStore.selectedItemId = null
  editorStore.selectedItemType = null
}

// Computed: Check if we can open the image
const canOpen = computed(() => imageUrl.value && !isPlaceholder.value)
</script>

<template>
  <div class="h-full flex flex-col" style="background: var(--color-surface);">
    <!-- No Image Placeholder State -->
    <div v-if="isPlaceholder" class="flex-1 flex flex-col items-center justify-center p-6">
      <div class="w-full max-w-md">
        <!-- SVG Placeholder -->
        <svg
          class="w-full h-auto"
          viewBox="0 0 400 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Background -->
          <rect width="400" height="300" fill="var(--color-canvas)" rx="8"/>
          <!-- Dashed Border -->
          <rect x="8" y="8" width="384" height="284" stroke="var(--color-elevated)" stroke-width="2" stroke-dasharray="8 8" rx="4" fill="none"/>
          <!-- Icon Circle -->
          <circle cx="200" cy="120" r="40" fill="var(--color-rose-subtle)"/>
          <!-- Image Icon -->
          <rect x="180" y="100" width="40" height="32" rx="2" fill="#A48B7E"/>
          <circle cx="188" cy="108" r="4" fill="white"/>
          <path d="M180 124 L188 116 L196 122 L204 114 L220 128 L220 128 L180 128 Z" fill="white"/>
          <!-- Text -->
          <text x="200" y="190" text-anchor="middle" font-family="system-ui" font-size="14" fill="var(--color-text-secondary)" font-weight="500">
            Upload an image
          </text>
          <text x="200" y="210" text-anchor="middle" font-family="system-ui" font-size="12" fill="var(--color-text-tertiary)">
            or paste a URL below
          </text>
          <!-- Corner Decorations -->
          <rect x="20" y="20" width="8" height="8" fill="var(--color-accent-light)" rx="1"/>
          <rect x="372" y="20" width="8" height="8" fill="var(--color-accent-light)" rx="1"/>
          <rect x="20" y="272" width="8" height="8" fill="var(--color-accent-light)" rx="1"/>
          <rect x="372" y="272" width="8" height="8" fill="var(--color-accent-light)" rx="1"/>
        </svg>

        <!-- Upload Controls -->
        <div class="mt-6 space-y-3">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileUpload"
          />
          <button
            @click="triggerFileInput"
            :disabled="uploading"
            class="btn-upload"
          >
            <svg v-if="!uploading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ uploading ? 'Uploading...' : 'Choose File' }}
          </button>
          <div class="flex gap-2">
            <input
              v-model="urlInput"
              type="text"
              class="input-url"
              placeholder="https://..."
              @keyup.enter="handleUrlUpload"
            />
            <button
              @click="handleUrlUpload"
              :disabled="uploading || !urlInput.trim()"
              class="btn-add"
            >
              <svg v-if="!uploading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
        </div>
        <p v-if="error" class="text-sm mt-3 text-center" style="color: var(--color-error);">{{ error }}</p>
      </div>
    </div>

    <!-- Image Display State -->
    <div v-else class="h-full flex flex-col">
      <!-- Main Image Area -->
      <div class="flex-1 overflow-y-auto p-4 min-h-0">
        <div class="max-w-2xl mx-auto">
          <img
            :src="imageUrl"
            :alt="altText"
            class="w-full rounded-lg max-h-[calc(100vh-220px)] object-contain"
            style="box-shadow: var(--shadow-lg); background: var(--color-canvas);"
          />
          <p v-if="altText" class="text-sm mt-3 text-center italic" style="color: var(--color-text-tertiary);">
            {{ altText }}
          </p>
        </div>
      </div>

      <!-- Action Bar - Always visible at bottom -->
      <div class="flex-shrink-0 border-t" style="border-color: var(--color-elevated); background: var(--color-surface);">
        <!-- Image Name Row -->
        <div class="px-4 py-2 border-b" style="border-color: var(--color-elevated);">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-text-tertiary);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            <input
              v-model="imageName"
              type="text"
              class="input-name"
              placeholder="Image name..."
            />
          </div>
        </div>

        <!-- Buttons Row -->
        <div class="px-4 py-2 flex items-center justify-between gap-2">
          <!-- Left Buttons -->
          <div class="flex items-center gap-1.5">
            <button
              @click="openInNewTab"
              :disabled="!canOpen"
              class="btn-action"
              title="Open in new tab"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Open
            </button>

            <button
              @click="deleteImage"
              class="btn-action btn-action-danger"
              title="Delete image"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete
            </button>
          </div>

          <!-- Alt Text Hint -->
          <span v-if="altText" class="text-xs truncate max-w-[120px]" :title="altText" style="color: var(--color-text-tertiary);">
            {{ altText.substring(0, 15) }}{{ altText.length > 15 ? '...' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Edit Panel (shown when editing) -->
    <div v-if="isEditing" class="absolute inset-0 z-10 flex flex-col" style="background: var(--color-surface);">
      <!-- Edit Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-elevated); background: var(--color-canvas);">
        <h3 class="text-sm font-semibold" style="color: var(--color-text-primary);">Edit Image</h3>
        <button
          @click="isEditing = false"
          class="btn-icon"
          title="Close"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Edit Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Preview -->
        <div>
          <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-primary);">Preview</label>
          <img
            :src="imageUrl"
            :alt="altText"
            class="w-full rounded-lg max-h-48 object-contain"
            style="border: 1px solid var(--color-elevated); background: var(--color-canvas);"
          />
        </div>

        <!-- Alt Text -->
        <div>
          <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-primary);">Alt Text</label>
          <input
            v-model="altText"
            type="text"
            class="input-edit"
            placeholder="Image description"
          />
        </div>

        <!-- Upload Options -->
        <div>
          <label class="text-xs font-medium mb-2 block" style="color: var(--color-text-primary);">Change Image</label>

          <!-- Upload Mode Toggle -->
          <div class="flex gap-2 mb-3">
            <button
              @click="uploadMode = 'file'"
              class="btn-toggle"
              :class="{ 'btn-toggle-active': uploadMode === 'file' }"
            >
              Upload File
            </button>
            <button
              @click="uploadMode = 'url'"
              class="btn-toggle"
              :class="{ 'btn-toggle-active': uploadMode === 'url' }"
            >
              From URL
            </button>
          </div>

          <!-- File Upload -->
          <div v-if="uploadMode === 'file'">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload"
            />
            <button
              @click="triggerFileInput"
              :disabled="uploading"
              class="btn-upload-dashed"
            >
              <svg v-if="!uploading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ uploading ? 'Uploading...' : 'Choose File' }}
            </button>
          </div>

          <!-- URL Input -->
          <div v-else class="flex gap-2">
            <input
              v-model="urlInput"
              type="text"
              class="input-edit"
              placeholder="https://example.com/image.jpg"
              @keyup.enter="handleUrlUpload"
            />
            <button
              @click="handleUrlUpload"
              :disabled="uploading || !urlInput.trim()"
              class="btn-upload-small"
            >
              <svg v-if="!uploading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <p v-if="error" class="text-xs" style="color: var(--color-error);">{{ error }}</p>
      </div>

      <!-- Edit Footer -->
      <div class="flex items-center justify-between px-4 py-3 border-t" style="border-color: var(--color-elevated); background: var(--color-canvas);">
        <button
          @click="isEditing = false"
          class="btn-secondary"
        >
          Cancel
        </button>
        <button
          @click="saveChanges(); isEditing = false"
          class="btn-primary"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-upload {
  @apply w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200;
  background: var(--color-accent);
  color: white;
}

.btn-upload:hover:not(:disabled) {
  background: var(--color-accent-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-upload:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-url {
  @apply flex-1 px-3 py-2 text-sm rounded-lg border;
  background: var(--color-surface);
  border-color: var(--color-elevated);
  color: var(--color-text-primary);
}

.input-url:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(124, 156, 108, 0.1);
}

.btn-add {
  @apply px-3 py-2 rounded-lg transition-all duration-200;
  background: var(--color-text-secondary);
  color: white;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add:hover:not(:disabled) {
  background: var(--color-text-primary);
}

.input-name {
  @apply flex-1 px-3 py-1.5 text-sm rounded-lg border;
  background: var(--color-surface);
  border-color: var(--color-elevated);
  color: var(--color-text-primary);
}

.input-name:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(124, 156, 108, 0.1);
}

.btn-action {
  @apply flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg font-medium transition-all duration-200;
  background: var(--color-accent);
  color: white;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action:hover:not(:disabled) {
  background: var(--color-accent-dark);
}

.btn-action-danger {
  background: var(--color-error);
}

.btn-action-danger:hover {
  background: #B91C1C;
}

.btn-icon {
  @apply w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200;
  color: var(--color-text-tertiary);
}

.btn-icon:hover {
  background: var(--color-elevated);
  color: var(--color-text-primary);
}

.input-edit {
  @apply w-full px-3 py-2 text-sm rounded-lg border;
  background: var(--color-surface);
  border-color: var(--color-elevated);
  color: var(--color-text-primary);
}

.input-edit:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(124, 156, 108, 0.1);
}

.btn-toggle {
  @apply px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200;
  background: var(--color-elevated);
  color: var(--color-text-secondary);
}

.btn-toggle:hover {
  background: var(--color-canvas);
  color: var(--color-text-primary);
}

.btn-toggle-active {
  background: #A48B7E !important;
  color: white !important;
}

.btn-upload-dashed {
  @apply w-full px-3 py-2 text-sm rounded-lg border-2 border-dashed font-medium transition-all duration-200 flex items-center justify-center gap-2;
  border-color: var(--color-elevated);
  color: var(--color-text-secondary);
}

.btn-upload-dashed:hover {
  border-color: #A48B7E;
  color: #A48B7E;
}

.btn-upload-small {
  @apply px-3 py-1.5 rounded-lg font-medium transition-all duration-200;
  background: #A48B7E;
  color: white;
}

.btn-upload-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-upload-small:hover:not(:disabled) {
  background: #8B7366;
}

.btn-secondary {
  @apply px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200;
  background: transparent;
  border: 1px solid var(--color-elevated);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-elevated);
  color: var(--color-text-primary);
}

.btn-primary {
  @apply flex items-center px-3 py-1.5 text-xs rounded-lg font-semibold transition-all duration-200;
  background: #A48B7E;
  color: white;
}

.btn-primary:hover {
  background: #8B7366;
}
</style>
