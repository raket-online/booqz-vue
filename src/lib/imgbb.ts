/**
 * ImgBB API Client
 * Uploads images to ImgBB hosting service
 */

export interface ImgBBUploadResponse {
  data: {
    id: string
    title?: string
    url: string
    display_url: string
    size: number
    width: number
    height: number
    mime: string
    extension: string
    delete_url: string
  }
  success: boolean
  status: number
}

export interface ImgBBUploadError {
  error: {
    message: string
    code: number
  }
  status: number
}

export interface ImgBBUploadOptions {
  name?: string
  expiration?: number  // Seconds until expiration (optional)
}

/**
 * Upload an image to ImgBB
 * @param apiKey ImgBB API key
 * @param imageFile File object to upload
 * @param options Optional upload options
 * @returns Promise with upload response
 */
export async function uploadToImgBB(
  apiKey: string,
  imageFile: File,
  options: ImgBBUploadOptions = {}
): Promise<ImgBBUploadResponse> {
  // Validate file type
  if (!imageFile.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  // Validate file size (max 32MB for ImgBB free tier)
  const maxSize = 32 * 1024 * 1024
  if (imageFile.size > maxSize) {
    throw new Error('Image size must be less than 32MB')
  }

  // Prepare form data
  const formData = new FormData()
  formData.append('image', imageFile)

  if (options.name) {
    formData.append('name', options.name)
  }

  if (options.expiration) {
    formData.append('expiration', options.expiration.toString())
  }

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error: ImgBBUploadError = await response.json()
      throw new Error(error.error?.message || `Upload failed with status ${response.status}`)
    }

    const data: ImgBBUploadResponse = await response.json()

    if (!data.success) {
      throw new Error('Upload failed')
    }

    return data

  } catch (error: any) {
    console.error('ImgBB upload error:', error)
    throw error
  }
}

/**
 * Upload multiple images to ImgBB
 * @param apiKey ImgBB API key
 * @param files Array of files to upload
 * @param options Optional upload options
 * @returns Promise with array of upload responses
 */
export async function uploadMultipleToImgBB(
  apiKey: string,
  files: File[],
  options: ImgBBUploadOptions = {}
): Promise<ImgBBUploadResponse[]> {
  const uploads = files.map(file => uploadToImgBB(apiKey, file, options))
  return Promise.all(uploads)
}

/**
 * Upload image from URL
 * @param apiKey ImgBB API key
 * @param imageUrl URL of the image to upload
 * @param options Optional upload options
 * @returns Promise with upload response
 */
export async function uploadUrlToImgBB(
  apiKey: string,
  imageUrl: string,
  options: ImgBBUploadOptions = {}
): Promise<ImgBBUploadResponse> {
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        image: imageUrl,
        ...(options.name && { name: options.name }),
        ...(options.expiration && { expiration: options.expiration.toString() })
      })
    })

    if (!response.ok) {
      const error: ImgBBUploadError = await response.json()
      throw new Error(error.error?.message || `Upload failed with status ${response.status}`)
    }

    const data: ImgBBUploadResponse = await response.json()

    if (!data.success) {
      throw new Error('Upload failed')
    }

    return data

  } catch (error: any) {
    console.error('ImgBB URL upload error:', error)
    throw error
  }
}
