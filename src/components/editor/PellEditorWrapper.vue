<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount, computed } from 'vue'
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
  placeholder: 'Begin writing your masterpiece...',
  disabled: false
})

const emit = defineEmits<Emits>()

const editorElement = ref<HTMLElement>()
const { isIdle, isConnecting, isRecording, hasError, setInsertTextCallback, toggleRecording } = useSpeech()
let pellInstance: any = null

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
    onChange: (html: string) => emit('update:modelValue', html),
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
      { name: 'olist', icon: '<span style="font-size:15px">1.</span>' },
      { name: 'ulist', icon: '<span style="font-size:15px">•</span>' },
      'link',
      {
        name: 'dictate',
        icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>',
        title: 'Dictate (Ctrl+M)',
        result: () => toggleRecording()
      },
      { name: 'removeFormat', icon: '✕' }
    ]
  })

  if (pellInstance && props.modelValue) {
    pellInstance.content.innerHTML = props.modelValue
  }
  if (pellInstance && props.disabled) {
    pellInstance.content.contentEditable = 'false'
  }

  setInsertTextCallback((text: string) => {
    if (pellInstance && pellInstance.content) {
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
        pellInstance.content.innerHTML += text
      }
      pellInstance.content.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
})

watch(() => props.modelValue, (newVal) => {
  if (pellInstance && pellInstance.content.innerHTML !== newVal) {
    pellInstance.content.innerHTML = newVal
  }
})

watch(() => props.disabled, (disabled) => {
  if (pellInstance) {
    pellInstance.content.contentEditable = !disabled
  }
})

// Update dictate button state
const dictateButtonClass = computed(() => {
  if (hasError.value) return 'mic-error'
  if (isRecording.value) return 'mic-recording'
  if (isConnecting.value) return 'mic-connecting'
  return 'mic-idle'
})

watch([isIdle, isConnecting, isRecording, hasError], () => {
  if (!pellInstance) return
  const buttons = pellInstance.element.querySelectorAll('.pell-button[data-action="dictate"]')
  buttons.forEach((button: HTMLElement) => {
    button.className = `pell-button ${dictateButtonClass.value}`
  })
})

onBeforeUnmount(() => {
  pellInstance = null
})

defineExpose({
  focus: () => pellInstance?.content?.focus(),
  getContent: () => pellInstance?.content?.innerHTML || '',
  setContent: (html: string) => { if (pellInstance) pellInstance.content.innerHTML = html },
  execCommand: (command: string, value?: string) => { if (pellInstance) pellInstance.exec(command, value) }
})
</script>

<template>
  <div class="pell-editor-wrapper">
    <!-- Recording Status Indicator (small, above actionbar when recording) -->
    <div v-if="isRecording || isConnecting" class="px-3 py-1.5 text-xs flex items-center justify-between animate-fade-in" :class="{ 'bg-red-50': isRecording, 'bg-yellow-50': isConnecting }">
      <span class="flex items-center gap-2" :class="{ 'text-red-600': isRecording, 'text-yellow-600': isConnecting }">
        <span v-if="isRecording" class="flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        {{ isRecording ? 'Recording...' : 'Connecting...' }}
      </span>
      <span class="text-xs font-mono text-gray-500">
        {{ props.modelValue.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length }} words
      </span>
    </div>

    <div ref="editorElement" class="pell" :class="{ 'pell-disabled': disabled }"></div>
  </div>
</template>

<style scoped>
.pell-editor-wrapper {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  overflow: hidden;
}

.pell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-elevated);
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.pell-content) {
  padding: 2rem;
  font-family: var(--font-sans);
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-text-primary);
  outline: none;
  overflow-y: auto;
  height: 100%;
}

:deep(.pell-content::-webkit-scrollbar) {
  width: 8px;
}

:deep(.pell-content::-webkit-scrollbar-track) {
  background: var(--color-canvas);
  border-radius: 4px;
}

:deep(.pell-content::-webkit-scrollbar-thumb) {
  background: var(--color-elevated);
  border-radius: 4px;
}

:deep(.pell-content::-webkit-scrollbar-thumb:hover) {
  background: var(--color-border);
}

:deep(.pell-content:focus) {
  outline: none;
}

.pell-disabled {
  opacity: 0.6;
  pointer-events: none;
}

:deep(.pell-content) p {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.pell-content) h1 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

:deep(.pell-content) h2 {
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
}

:deep(.pell-content) h3 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}

:deep(.pell-content) h4 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
}

:deep(.pell-content) h5 {
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}

:deep(.pell-actionbar) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-elevated);
  background: var(--color-canvas);
}

:deep(.pell-button) {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 150ms;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.pell-button:hover) {
  color: var(--color-text-primary);
  background: var(--color-elevated);
}

:deep(.pell-button[data-action='dictate']) {
  position: relative;
}

:deep(.pell-button[data-action='dictate'].mic-idle) {
  color: var(--color-text-secondary);
}

:deep(.pell-button[data-action='dictate'].mic-idle:hover) {
  color: var(--color-accent);
  background: rgba(124, 156, 108, 0.1);
}

:deep(.pell-button[data-action='dictate'].mic-connecting) {
  color: var(--color-warning);
  background: rgba(212, 165, 116, 0.15);
  animation: pulse-subtle 1.5s infinite;
}

:deep(.pell-button[data-action='dictate'].mic-recording) {
  color: white;
  background: var(--color-error);
  animation: pulse-recording 1.5s infinite;
}

:deep(.pell-button[data-action='dictate'].mic-error) {
  color: var(--color-error);
  background: rgba(198, 93, 93, 0.15);
}

:deep(.pell-button:focus) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

:deep(.pell-button-selected) {
  background: var(--color-elevated);
  color: var(--color-text-primary);
  font-weight: 600;
}

:deep(.pell-content a) {
  color: var(--color-accent);
  text-decoration: underline;
}

:deep(.pell-content a:hover) {
  color: var(--color-accent-dark);
}

:deep(.pell-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

/* Microphone states */
.mic-idle {
  background: var(--color-elevated);
  color: var(--color-text-secondary);
}

.mic-idle:hover {
  background: rgba(124, 156, 108, 0.1);
  color: var(--color-accent);
}

.mic-connecting {
  background: rgba(212, 165, 116, 0.15);
  color: var(--color-warning);
  animation: pulse-subtle 1.5s infinite;
}

.mic-recording {
  background: var(--color-error);
  color: white;
  animation: pulse-recording 1.5s infinite;
}

.mic-error {
  background: rgba(198, 93, 93, 0.15);
  color: var(--color-error);
}

@keyframes pulse-recording {
  0%, 100% { box-shadow: 0 0 0 0 rgba(198, 93, 93, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(198, 93, 93, 0); }
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
