<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-4">Home</h1>
    <p class="text-gray-600">
      Welcome, {{ authStore.user?.email }}
    </p>
  </div>
</template>
