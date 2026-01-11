/**
 * Deepgram Nova-3 Speech-to-Text WebSocket Client
 * Provides real-time transcription with streaming results
 */

export interface DeepgramConfig {
  apiKey: string
  language?: string
  onTranscript: (text: string, isFinal: boolean) => void
  onError?: (error: Error) => void
  onConnecting?: () => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export class DeepgramClient {
  private ws: WebSocket | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private config: DeepgramConfig
  private isRecording = false
  private stream: MediaStream | null = null

  constructor(config: DeepgramConfig) {
    this.config = config
  }

  /**
   * Start recording and transcribing
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording')
    }

    // Check HTTPS or localhost
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      throw new Error('Speech recognition requires HTTPS or localhost')
    }

    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // Create WebSocket connection
      this.connectWebSocket()

      // Setup MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm'
      })

      // Connect audio processor
      await this.setupAudioProcessor()

      this.mediaRecorder.start(100) // Send data every 100ms
      this.isRecording = true

    } catch (error: any) {
      this.stopRecording()
      throw new Error(`Failed to start recording: ${error.message}`)
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    this.isRecording = false

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.mediaRecorder = null

    // Close WebSocket after a short delay to receive final results
    setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close()
      }
    }, 500)
  }

  /**
   * Check if currently recording
   */
  getRecording(): boolean {
    return this.isRecording
  }

  /**
   * Connect to Deepgram WebSocket
   */
  private connectWebSocket(): void {
    const language = this.config.language || 'en-US'

    this.config.onConnecting?.()

    this.ws = new WebSocket(
      `wss://api.deepgram.com/v1/listen?model=nova-2&language=${language}&smart_format=true&interim_results=true`
    )

    this.ws.onopen = () => {
      this.config.onConnected?.()
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.channel && data.channel.alternatives) {
          const transcript = data.channel.alternatives[0]?.transcript || ''

          if (transcript) {
            const isFinal = data.is_final === true
            this.config.onTranscript(transcript, isFinal)
          }
        }
      } catch (error) {
        console.error('Failed to parse Deepgram response:', error)
      }
    }

    this.ws.onerror = () => {
      const error = new Error('WebSocket connection error')
      this.config.onError?.(error)
    }

    this.ws.onclose = () => {
      this.config.onDisconnected?.()
      if (this.isRecording) {
        this.stopRecording()
      }
    }

    // Set API key in protocol
    if (this.ws.readyState === WebSocket.OPEN) {
      // Deepgram uses Authorization header for WebSocket
      // We need to recreate with auth
      this.ws.close()
      this.ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&language=${language}&smart_format=true&interim_results=true`,
        ['token', this.config.apiKey]
      )

      this.ws.onopen = () => {
        this.config.onConnected?.()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.channel && data.channel.alternatives) {
            const transcript = data.channel.alternatives[0]?.transcript || ''

            if (transcript) {
              const isFinal = data.is_final === true
              this.config.onTranscript(transcript, isFinal)
            }
          }
        } catch (error) {
          console.error('Failed to parse Deepgram response:', error)
        }
      }

      this.ws.onerror = () => {
        const error = new Error('WebSocket connection error')
        this.config.onError?.(error)
      }

      this.ws.onclose = () => {
        this.config.onDisconnected?.()
        if (this.isRecording) {
          this.stopRecording()
        }
      }
    }
  }

  /**
   * Setup audio processor to send data to WebSocket
   */
  private async setupAudioProcessor(): Promise<void> {
    if (!this.stream) {
      throw new Error('No audio stream available')
    }

    this.audioContext = new AudioContext({ sampleRate: 16000 })

    const source = this.audioContext.createMediaStreamSource(this.stream)
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1)

    processor.onaudioprocess = (event) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isRecording) {
        const audioData = event.inputBuffer.getChannelData(0)
        const pcmData = this.floatTo16BitPCM(audioData)
        this.ws.send(pcmData)
      }
    }

    source.connect(processor)
    processor.connect(this.audioContext.destination)
  }

  /**
   * Convert float audio data to 16-bit PCM
   */
  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2)
    const view = new DataView(buffer)

    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }

    return buffer
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopRecording()
    this.ws = null
  }
}

/**
 * Create a Deepgram client instance
 */
export function createDeepgramClient(config: DeepgramConfig): DeepgramClient {
  return new DeepgramClient(config)
}
