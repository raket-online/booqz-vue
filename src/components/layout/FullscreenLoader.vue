<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useTranslator } from '@/composables/useTranslator'
import { isLoadingGlobal } from '@/composables/useGlobalLoader'

const editorStore = useEditorStore()
const { translating, improving } = useTranslator()

const isLoading = computed(() => translating.value || improving.value || isLoadingGlobal.value)

const loadingText = computed(() => {
  if (improving.value) return 'Improving text with AI...'
  if (translating.value) return 'Translating with AI...'
  return 'Processing...'
})

const progressTime = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

// Calculate which dots should be active (0-4 cycle)
const activeDotsCount = computed(() => {
  const cycle = Math.floor(progressTime.value / 500) % 4 // 4 steps, 500ms each step = 2 seconds total
  return cycle
})

onMounted(() => {
  intervalId = setInterval(() => {
    progressTime.value = Date.now()
  }, 100)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-all duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(2px);"
    >
      <!-- Loading Container -->
      <div
        class="bg-white rounded-2xl p-8 shadow-2xl animate-scale-in"
        style="max-width: 400px; width: 90%;"
      >
        <!-- Loading Animation -->
        <div class="flex flex-col items-center gap-6">
          <!-- Pulsing AI Icon -->
          <div class="relative">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center"
              style="background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);"
            >
              <svg
                class="w-8 h-8 text-white animate-spin-slow"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>

          <!-- Loading Text -->
          <div class="text-center">
            <h3
              class="font-display text-lg font-semibold mb-2"
              style="color: var(--color-text-primary);"
            >
              {{ loadingText }}
            </h3>
            <p
              class="text-sm"
              style="color: var(--color-text-tertiary);"
            >
              This may take a few moments...
            </p>
          </div>

          <!-- Progress Dots -->
          <div class="flex items-center justify-center gap-4 mt-6">
            <div
              v-for="i in 3"
              :key="i"
              class="w-2 h-2 rounded-full transition-all duration-300"
              :style="{
                background: i <= activeDotsCount ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                transform: i <= activeDotsCount ? 'scale(1.2)' : 'scale(1)',
                opacity: i <= activeDotsCount ? 1 : 0.4
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes wave {
  0%, 100% {
    opacity: 0.4;
    background: var(--color-text-tertiary);
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    background: var(--color-accent);
    transform: scale(1.2);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>