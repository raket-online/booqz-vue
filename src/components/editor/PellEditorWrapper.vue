<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { useSpeech } from '@/composables/useSpeech'

interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Start writing...',
  disabled: false
})

const emit = defineEmits<Emits>()

const editorElement = ref<HTMLElement>()
const { isIdle, isConnecting, isRecording, hasError, setInsertTextCallback, toggleRecording } = useSpeech()
let pellInstance: any = null

// Load Pell from CDN
function loadPell(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).pell) {
      resolve((window as any).pell)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/pell@1.0.6/dist/pell.min.js'
    script.onload = () => resolve((window as any).pell)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (!editorElement.value) return

  const Pell = await loadPell()

  pellInstance = Pell.init({
    element: editorElement.value,
    onChange: (html: string) => {
      emit('update:modelValue', html)
    },
    defaultParagraphSeparator: 'p',
    styleWithCSS: true,
    classes: {
      actionbar: 'pell-actionbar',
      button: 'pell-button',
      content: 'pell-content',
      selected: 'pell-button-selected'
    },
    actions: [
      'bold',
      'italic',
      'underline',
      {
        name: 'olist',
        icon: '<span style="font-size:16px">1.</span>'
      },
      {
        name: 'ulist',
        icon: '<span style="font-size:16px">•</span>'
      },
      'link',
      {
        name: 'removeFormat',
        icon: '✕'
      }
    ]
  })

  // Set initial content
  if (pellInstance && props.modelValue) {
    pellInstance.content.innerHTML = props.modelValue
  }

  // Apply disabled state
  if (pellInstance && props.disabled) {
    pellInstance.content.contentEditable = 'false'
  }

  // Setup speech-to-text insertion
  setInsertTextCallback((text: string) => {
    if (pellInstance && pellInstance.content) {
      // Insert text at cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // No cursor, append to end
        pellInstance.content.innerHTML += text
      }

      // Trigger change event
      pellInstance.content.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
})

// Watch for external content changes
watch(() => props.modelValue, (newVal) => {
  if (pellInstance && pellInstance.content.innerHTML !== newVal) {
    pellInstance.content.innerHTML = newVal
  }
})

// Watch for disabled state changes
watch(() => props.disabled, (disabled) => {
  if (pellInstance) {
    pellInstance.content.contentEditable = !disabled
  }
})

onBeforeUnmount(() => {
  if (pellInstance) {
    pellInstance = null
  }
})

// Expose methods
defineExpose({
  focus: () => {
    pellInstance?.content?.focus()
  },
  getContent: () => {
    return pellInstance?.content?.innerHTML || ''
  },
  setContent: (html: string) => {
    if (pellInstance) {
      pellInstance.content.innerHTML = html
    }
  },
  execCommand: (command: string, value?: string) => {
    if (pellInstance) {
      pellInstance.exec(command, value)
    }
  }
})
</script>

<template>
  <div class="pell-editor-wrapper h-full flex flex-col">
    <!-- Microphone Button -->
    <div class="flex items-center gap-2 px-3 py-2 border-b transition-all duration-200"
         style="border-bottom-color: rgba(26, 26, 26, 0.06); background: var(--color-bg-secondary);">
      <button
        @click="toggleRecording"
        :disabled="disabled"
        class="mic-button relative p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
        :class="{
          'mic-idle': isIdle,
          'mic-connecting': isConnecting,
          'mic-recording': isRecording,
          'mic-error': hasError
        }"
        :title="isRecording ? 'Stop recording (Ctrl+M)' : 'Start dictation (Ctrl+M)'"
      >
        <i class="fas fa-microphone text-lg"></i>
        <span v-if="isRecording" class="absolute -top-1 -right-1 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3"></span>
        </span>
      </button>
      <span class="text-xs transition-colors duration-200" style="color: var(--color-text-tertiary);">
        {{ isIdle ? 'Click to dictate' : isConnecting ? 'Connecting...' : isRecording ? 'Recording...' : 'Error' }}
      </span>
    </div>

    <div
      ref="editorElement"
      class="pell flex-1"
      :class="{ 'pell-disabled': disabled }"
    ></div>
  </div>
</template>

<style scoped>
.pell-editor-wrapper {
  @apply relative w-full;
}

.pell {
  @apply rounded-lg flex flex-col;
  background: var(--color-bg-primary);
  border: 1px solid rgba(26, 26, 26, 0.06);
  overflow: hidden;
}

.pell-content {
  @apply p-4 flex-1 outline-none overflow-y-auto;
  color: var(--color-text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
}

.pell-content:focus {
  @apply outline-none;
}

.pell-disabled {
  @apply opacity-60 pointer-events-none;
}

:deep(.pell-actionbar) {
  @apply flex flex-wrap gap-1 p-2;
  border-bottom: 1px solid rgba(26, 26, 26, 0.06);
  background: var(--color-bg-secondary);
}

:deep(.pell-button) {
  @apply px-3 py-1.5 rounded transition-all duration-150 text-sm font-medium;
  color: var(--color-text-secondary);
}

:deep(.pell-button:hover) {
  color: var(--color-text-primary);
  background: rgba(26, 26, 26, 0.06);
}

:deep(.pell-button:focus) {
  outline: 2px solid var(--color-primary-light);
  outline-offset: 2px;
}

:deep(.pell-button-selected) {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

:deep(.pell-content p) {
  @apply mb-2;
}

:deep(.pell-content ul),
:deep(.pell-content ol) {
  @apply ml-6 mb-2;
}

:deep(.pell-content ul) {
  @apply list-disc;
}

:deep(.pell-content ol) {
  @apply list-decimal;
}

:deep(.pell-content a) {
  color: var(--color-primary);
  text-decoration: underline;
}

:deep(.pell-content a:hover) {
  color: var(--color-primary-dark);
}

:deep(.pell-content img) {
  @apply max-w-full h-auto rounded;
}

/* Microphone states */
.mic-idle {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.mic-idle:hover {
  background: var(--color-bg-secondary);
}

.mic-connecting {
  background: rgba(212, 165, 116, 0.15);
  color: var(--color-warning);
  animation: pulse-subtle 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.mic-recording {
  background: var(--color-error);
  color: white;
  animation: pulse-recording 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.mic-recording .animate-ping {
  background: rgba(255, 255, 255, 0.4);
}

.mic-recording .relative inline-flex {
  background: white;
}

.mic-error {
  background: rgba(198, 93, 93, 0.15);
  color: var(--color-error);
}

/* Custom animations */
@keyframes pulse-recording {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(198, 93, 93, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(198, 93, 93, 0);
  }
}

@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
