import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { uploadToImgBB, uploadUrlToImgBB, type ImgBBUploadResponse } from '@/lib/imgbb'

export interface UploadProgress {
  current: number
  total: number
  fileName: string
}

export function useImageUpload() {
  const settingsStore = useSettingsStore()

  const uploading = ref(false)
  const progress = ref<UploadProgress | null>(null)
  const error = ref<string | null>(null)

  /**
   * Upload a single image file
   */
  async function uploadImage(file: File): Promise<ImgBBUploadResponse> {
    const apiKey = settingsStore.getApiKey('imgbb')
    if (!apiKey) {
      throw new Error('ImgBB API key not configured. Please add your API key in Settings.')
    }

    uploading.value = true
    error.value = null
    progress.value = { current: 0, total: 1, fileName: file.name }

    try {
      const result = await uploadToImgBB(apiKey, file)
      progress.value.current = 1
      return result
    } catch (err: any) {
      error.value = err.message || 'Upload failed'
      throw err
    } finally {
      uploading.value = false
      progress.value = null
    }
  }

  /**
   * Upload multiple image files
   */
  async function uploadImages(files: File[]): Promise<ImgBBUploadResponse[]> {
    const apiKey = settingsStore.getApiKey('imgbb')
    if (!apiKey) {
      throw new Error('ImgBB API key not configured. Please add your API key in Settings.')
    }

    uploading.value = true
    error.value = null
    progress.value = { current: 0, total: files.length, fileName: '' }

    try {
      const results: ImgBBUploadResponse[] = []

      for (let i = 0; i < files.length; i++) {
        progress.value = { current: i, total: files.length, fileName: files[i].name }
        const result = await uploadToImgBB(apiKey, files[i])
        results.push(result)
      }

      progress.value.current = files.length
      return results
    } catch (err: any) {
      error.value = err.message || 'Upload failed'
      throw err
    } finally {
      uploading.value = false
      progress.value = null
    }
  }

  /**
   * Upload image from URL
   */
  async function uploadImageUrl(url: string): Promise<ImgBBUploadResponse> {
    const apiKey = settingsStore.getApiKey('imgbb')
    if (!apiKey) {
      throw new Error('ImgBB API key not configured. Please add your API key in Settings.')
    }

    uploading.value = true
    error.value = null
    progress.value = { current: 0, total: 1, fileName: url }

    try {
      const result = await uploadUrlToImgBB(apiKey, url)
      progress.value.current = 1
      return result
    } catch (err: any) {
      error.value = err.message || 'Upload failed'
      throw err
    } finally {
      uploading.value = false
      progress.value = null
    }
  }

  /**
   * Clear error state
   */
  function clearError() {
    error.value = null
  }

  return {
    // State
    uploading,
    progress,
    error,

    // Methods
    uploadImage,
    uploadImages,
    uploadImageUrl,
    clearError
  }
}
