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

// Type-safe event handlers
function handleToggleMouseEnter(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(255,255,255,0.1)'
}

function handleToggleMouseLeave(event: Event) {
  const target = event.currentTarget as HTMLElement
  target.style.background = 'rgba(255,255,255,0.05)'
}
</script>

<template>
  <aside
    :class="[
      'h-screen flex flex-col transition-all duration-500 ease-out border-r',
      sidebarStore.isCollapsed ? 'w-16' : 'w-64'
    ]"
    style="background: linear-gradient(180deg, #2C3E50 0%, #1A2633 100%); border-right-color: rgba(255,255,255,0.06);"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-6" style="border-bottom-color: rgba(255,255,255,0.08);">
      <div v-if="!sidebarStore.isCollapsed" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #B76E4E 0%, #8F4A31 100%); box-shadow: 0 4px 12px rgba(183, 110, 78, 0.3);">
          <span class="text-white text-sm font-semibold" style="font-family: 'Playfair Display', Georgia, serif;">B</span>
        </div>
        <span class="text-lg tracking-tight" style="color: rgba(255,255,255,0.95); font-weight: 500;">BOOQZ</span>
      </div>
      <button
        @click="sidebarStore.toggle"
        @mouseenter="handleToggleMouseEnter"
        @mouseleave="handleToggleMouseLeave"
        class="p-2 rounded-lg transition-all duration-200 hover:scale-105"
        style="color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.05);"
        :class="sidebarStore.isCollapsed ? 'mx-auto' : ''"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="sidebarStore.isCollapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6">
      <ul class="space-y-1">
        <li v-for="item in navigationItems" :key="item.path">
          <router-link
            :to="item.path"
            class="group relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden"
            style="color: rgba(255,255,255,0.6);"
            active-class="nav-active"
          >
            <!-- Active indicator bar -->
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full transition-all duration-300 group-hover:h-8"
                 style="background: linear-gradient(180deg, #B76E4E 0%, #D4A088 100%);"></div>

            <!-- Background glow on hover -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                 style="background: rgba(183, 110, 78, 0.1);"></div>

            <svg class="w-5 h-5 flex-shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            <span v-if="!sidebarStore.isCollapsed" class="ml-3 relative z-10 text-sm font-medium tracking-wide">
              {{ item.name }}
            </span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Sign Out -->
    <div class="p-4" style="border-top-color: rgba(255,255,255,0.08);">
      <button
        @click="handleSignOut"
        class="group relative flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden"
        style="color: rgba(255,255,255,0.5);"
      >
        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
             style="background: rgba(198, 93, 93, 0.15);"></div>

        <svg class="w-5 h-5 flex-shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span v-if="!sidebarStore.isCollapsed" class="ml-3 relative z-10 text-sm font-medium tracking-wide">
          Sign out
        </span>
      </button>
    </div>

    <!-- Footer -->
    <div v-if="!sidebarStore.isCollapsed" class="px-6 pb-4">
      <p class="text-xs" style="color: rgba(255,255,255,0.25);">© 2026 BOOQZ</p>
    </div>
  </aside>
</template>

<style scoped>
.nav-active {
  color: rgba(255,255,255,0.95) !important;
}

.nav-active .w-1 {
  height: 32px !important;
}

.nav-active div:last-child {
  opacity: 1 !important;
  background: rgba(183, 110, 78, 0.15) !important;
}
</style>
