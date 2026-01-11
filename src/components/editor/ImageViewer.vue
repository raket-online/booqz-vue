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
  <div class="h-full flex flex-col bg-white">
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
          <rect width="400" height="300" fill="#F3F4F6" rx="8"/>
          <!-- Dashed Border -->
          <rect x="8" y="8" width="384" height="284" stroke="#D1D5DB" stroke-width="2" stroke-dasharray="8 8" rx="4" fill="none"/>
          <!-- Icon Circle -->
          <circle cx="200" cy="120" r="40" fill="#E9D5FF"/>
          <!-- Image Icon -->
          <rect x="180" y="100" width="40" height="32" rx="2" fill="#9333EA"/>
          <circle cx="188" cy="108" r="4" fill="white"/>
          <path d="M180 124 L188 116 L196 122 L204 114 L220 128 L220 128 L180 128 Z" fill="white"/>
          <!-- Text -->
          <text x="200" y="190" text-anchor="middle" font-family="system-ui" font-size="14" fill="#6B7280" font-weight="500">
            Upload an image
          </text>
          <text x="200" y="210" text-anchor="middle" font-family="system-ui" font-size="12" fill="#9CA3AF">
            or paste a URL below
          </text>
          <!-- Corner Decorations -->
          <rect x="20" y="20" width="8" height="8" fill="#C4B5FD" rx="1"/>
          <rect x="372" y="20" width="8" height="8" fill="#C4B5FD" rx="1"/>
          <rect x="20" y="272" width="8" height="8" fill="#C4B5FD" rx="1"/>
          <rect x="372" y="272" width="8" height="8" fill="#C4B5FD" rx="1"/>
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
            class="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-cloud-upload-alt"></i>
            {{ uploading ? 'Uploading...' : 'Choose File' }}
          </button>
          <div class="flex gap-2">
            <input
              v-model="urlInput"
              type="text"
              class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="https://..."
              @keyup.enter="handleUrlUpload"
            />
            <button
              @click="handleUrlUpload"
              :disabled="uploading || !urlInput.trim()"
              class="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <p v-if="error" class="text-red-600 text-sm mt-3 text-center">{{ error }}</p>
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
            class="w-full rounded-lg shadow-lg max-h-[calc(100vh-220px)] object-contain bg-gray-50"
          />
          <p v-if="altText" class="text-sm text-gray-600 mt-3 text-center italic">
            {{ altText }}
          </p>
        </div>
      </div>

      <!-- Action Bar - Always visible at bottom -->
      <div class="flex-shrink-0 border-t border-gray-200 bg-white">
        <!-- Image Name Row -->
        <div class="px-4 py-2 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <i class="fas fa-tag text-gray-400 text-xs"></i>
            <input
              v-model="imageName"
              type="text"
              class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              class="px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Open in new tab"
            >
              <i class="fas fa-external-link-alt mr-1"></i>Open
            </button>

            <button
              @click="deleteImage"
              class="px-2 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              title="Delete image"
            >
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          </div>

          <!-- Alt Text Hint -->
          <span v-if="altText" class="text-xs text-gray-400 truncate max-w-[120px]" :title="altText">
            {{ altText.substring(0, 15) }}{{ altText.length > 15 ? '...' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Edit Panel (shown when editing) -->
    <div v-if="isEditing" class="absolute inset-0 bg-white z-10 flex flex-col">
      <!-- Edit Header -->
      <div class="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <h3 class="text-sm font-semibold text-gray-700">Edit Image</h3>
        <button
          @click="isEditing = false"
          class="p-1 hover:bg-gray-200 rounded"
          title="Close"
        >
          <i class="fas fa-times text-gray-500"></i>
        </button>
      </div>

      <!-- Edit Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Preview -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Preview</label>
          <img
            :src="imageUrl"
            :alt="altText"
            class="w-full rounded-lg border max-h-48 object-contain bg-gray-50"
          />
        </div>

        <!-- Alt Text -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Alt Text</label>
          <input
            v-model="altText"
            type="text"
            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Image description"
          />
        </div>

        <!-- Upload Options -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Change Image</label>

          <!-- Upload Mode Toggle -->
          <div class="flex gap-2 mb-3">
            <button
              @click="uploadMode = 'file'"
              :class="uploadMode === 'file' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'"
              class="px-3 py-1.5 text-xs rounded-lg transition-colors"
            >
              Upload File
            </button>
            <button
              @click="uploadMode = 'url'"
              :class="uploadMode === 'url' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'"
              class="px-3 py-1.5 text-xs rounded-lg transition-colors"
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
              class="w-full px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-cloud-upload-alt text-gray-400"></i>
              {{ uploading ? 'Uploading...' : 'Choose File' }}
            </button>
          </div>

          <!-- URL Input -->
          <div v-else class="flex gap-2">
            <input
              v-model="urlInput"
              type="text"
              class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="https://example.com/image.jpg"
              @keyup.enter="handleUrlUpload"
            />
            <button
              @click="handleUrlUpload"
              :disabled="uploading || !urlInput.trim()"
              class="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-upload"></i>
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <p v-if="error" class="text-red-600 text-xs">{{ error }}</p>
      </div>

      <!-- Edit Footer -->
      <div class="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
        <button
          @click="isEditing = false"
          class="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="saveChanges; isEditing = false"
          class="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          <i class="fas fa-save mr-1"></i>
          Save
        </button>
      </div>
    </div>
  </div>
</template>
