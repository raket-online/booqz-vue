<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const route = useRoute()
const { initialize } = useAuth()
const authStore = useAuthStore()

const layout = computed(() => {
  const layoutName = route.meta.layout as string | undefined
  if (layoutName === 'auth') return AuthLayout
  if (layoutName === 'app') return AppLayout
  return 'div'
})

onMounted(() => {
  initialize()
})
</script>

<template>
  <div v-if="authStore.loading" class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
  <component v-else :is="layout">
    <router-view />
  </component>
</template>
