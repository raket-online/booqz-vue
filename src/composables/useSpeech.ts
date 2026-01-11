import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { createDeepgramClient, type DeepgramClient } from '@/lib/deepgram'

export type RecordingState = 'idle' | 'connecting' | 'recording' | 'error'

export function useSpeech() {
  const settingsStore = useSettingsStore()

  const client = ref<DeepgramClient | null>(null)
  const state = ref<RecordingState>('idle')
  const transcript = ref('')
  const error = ref<string | null>(null)

  // Max recording time: 20 minutes
  const maxRecordingTime = 20 * 60 * 1000
  let recordingTimeout: ReturnType<typeof setTimeout> | null = null

  // Insert text callback - to be set by caller
  let insertTextCallback: ((text: string) => void) | null = null

  const isIdle = computed(() => state.value === 'idle')
  const isConnecting = computed(() => state.value === 'connecting')
  const isRecording = computed(() => state.value === 'recording')
  const hasError = computed(() => state.value === 'error')

  /**
   * Set the callback for inserting text at cursor position
   */
  function setInsertTextCallback(callback: (text: string) => void) {
    insertTextCallback = callback
  }

  /**
   * Toggle recording on/off
   */
  async function toggleRecording(): Promise<void> {
    if (isRecording.value) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  /**
   * Start recording
   */
  async function startRecording(): Promise<void> {
    const apiKey = settingsStore.getApiKey('deepgram')
    if (!apiKey) {
      error.value = 'Deepgram API key not configured. Please add your API key in Settings.'
      state.value = 'error'
      throw new Error(error.value)
    }

    // Check for microphone support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      error.value = 'Microphone not supported in this browser'
      state.value = 'error'
      throw new Error(error.value)
    }

    try {
      state.value = 'connecting'
      error.value = null
      transcript.value = ''

      client.value = createDeepgramClient({
        apiKey,
        language: settingsStore.settings.speechSettings.language,
        onConnecting: () => {
          state.value = 'connecting'
        },
        onConnected: () => {
          state.value = 'recording'
          // Set max recording timeout
          recordingTimeout = setTimeout(() => {
            stopRecording()
            error.value = 'Maximum recording time reached (20 minutes)'
          }, maxRecordingTime)
        },
        onDisconnected: () => {
          if (state.value === 'recording') {
            state.value = 'idle'
          }
        },
        onError: (err) => {
          error.value = err.message
          state.value = 'error'
        },
        onTranscript: (text, _isFinal) => {
          // Insert text in real-time
          if (insertTextCallback && text) {
            insertTextCallback(text + ' ')
          }
        }
      })

      await client.value.startRecording()

    } catch (err: any) {
      error.value = err.message
      state.value = 'error'
      throw err
    }
  }

  /**
   * Stop recording
   */
  function stopRecording(): void {
    if (recordingTimeout) {
      clearTimeout(recordingTimeout)
      recordingTimeout = null
    }

    if (client.value) {
      client.value.stopRecording()
      client.value.dispose()
      client.value = null
    }

    state.value = 'idle'
  }

  /**
   * Clear current error and reset state
   */
  function clearError(): void {
    error.value = null
    state.value = 'idle'
  }

  return {
    // State
    state,
    transcript,
    error,

    // Computed
    isIdle,
    isConnecting,
    isRecording,
    hasError,

    // Methods
    setInsertTextCallback,
    toggleRecording,
    startRecording,
    stopRecording,
    clearError
  }
}
