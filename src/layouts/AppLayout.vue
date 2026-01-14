<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <Sidebar />
    <main class="flex-1 h-full overflow-hidden">
      <slot />
    </main>
  </div>
</template>
