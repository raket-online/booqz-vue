<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useSidebarStore } from '@/stores/sidebar'
import { navigationItems } from '@/config/navigation'

const router = useRouter()
const sidebarStore = useSidebarStore()
const { signOut } = useAuth()

async function handleSignOut() {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <aside
    :class="[
      'h-screen bg-gray-900 text-white transition-all duration-300 flex flex-col',
      sidebarStore.isCollapsed ? 'w-16' : 'w-64'
    ]"
  >
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <span v-if="!sidebarStore.isCollapsed" class="text-xl font-semibold">App</span>
      <button
        @click="sidebarStore.toggle"
        class="p-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            :d="sidebarStore.isCollapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'"
          />
        </svg>
      </button>
    </div>

    <nav class="flex-1 p-4">
      <ul class="space-y-2">
        <li v-for="item in navigationItems" :key="item.path">
          <router-link
            :to="item.path"
            class="flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors"
            active-class="bg-gray-800"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            <span v-if="!sidebarStore.isCollapsed" class="ml-3">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="p-4 border-t border-gray-700">
      <button
        @click="handleSignOut"
        class="flex items-center w-full p-2 rounded-lg hover:bg-gray-800 transition-colors text-red-400 hover:text-red-300"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span v-if="!sidebarStore.isCollapsed" class="ml-3">Sign out</span>
      </button>
    </div>
  </aside>
</template>
