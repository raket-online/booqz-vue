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
  <!-- Collapsed Sidebar Strip (when collapsed) -->
  <div v-if="sidebarStore.isCollapsed"
       @click="sidebarStore.toggle"
       class="fixed left-0 top-0 h-12 w-8 z-50 flex items-center justify-center cursor-pointer hover-lift"
       style="background: var(--color-surface); border-right: 1px solid var(--color-elevated); box-shadow: var(--shadow-sm);">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-accent);">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M15 19l-7-7 7-7"/>
    </svg>
  </div>

  <aside
    :class="[
      'h-full flex flex-col border-r transition-all duration-300 ease-spring',
      sidebarStore.isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-72 opacity-100'
    ]"
    style="background: var(--color-surface); border-color: var(--color-elevated);"
  >
    <!-- Logo & Toggle -->
    <div class="flex items-center justify-between px-5 py-6 border-b" style="border-color: var(--color-elevated);">
      <transition name="fade">
        <div v-if="!sidebarStore.isCollapsed" class="flex items-center gap-3 animate-fade-in">
          <!-- Branded Logo -->
          <div class="relative">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                 style="background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%); box-shadow: var(--shadow-md);">
              <span class="text-white font-display text-xl font-semibold">B</span>
            </div>
            <div class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                 style="background: var(--color-success); box-shadow: 0 0 0 2px var(--color-surface);"></div>
          </div>
          <div class="flex flex-col">
            <span class="font-heading text-base" style="color: var(--color-text-primary);">BOOQZ</span>
            <span class="text-xs" style="color: var(--color-text-tertiary);">Editorial Canvas</span>
          </div>
        </div>
        <!-- Collapsed Logo -->
        <div v-else class="mx-auto animate-fade-in">
          <div class="relative">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
                 style="background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%); box-shadow: var(--shadow-md);">
              <span class="text-white font-display text-xl font-semibold">B</span>
            </div>
            <div class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                 style="background: var(--color-success); box-shadow: 0 0 0 2px var(--color-surface);"></div>
          </div>
        </div>
      </transition>

      <!-- Toggle Button -->
      <button
        @click="sidebarStore.toggle"
        class="btn btn-icon hover-lift"
        :class="sidebarStore.isCollapsed ? 'mx-auto' : ''"
        style="color: var(--color-text-tertiary);"
        :title="sidebarStore.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <svg class="w-5 h-5 transition-transform duration-300" :class="{ 'rotate-180': sidebarStore.isCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-6 overflow-y-auto">
      <ul class="space-y-1">
        <li v-for="(item, index) in navigationItems" :key="item.path" class="animate-slide-in" :style="{ animationDelay: `${index * 50}ms` }">
          <router-link
            :to="item.path"
            class="group relative flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 hover-lift"
            :class="sidebarStore.isCollapsed ? 'justify-center' : 'gap-3'"
            active-class="nav-active"
          >
            <!-- Active indicator -->
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-full transition-all duration-300 group-hover:h-8 nav-indicator"
                 style="background: var(--color-accent);"></div>

            <!-- Icon -->
            <div class="relative z-10 flex-shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110 icon-wrapper"
                 style="width: 40px; height: 40px;">
              <svg class="w-5 h-5 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon"/>
              </svg>
            </div>

            <!-- Label -->
            <transition name="fade">
              <span v-if="!sidebarStore.isCollapsed" class="relative z-10 font-medium text-sm transition-all duration-200 nav-label"
                    style="color: var(--color-text-secondary);">
                {{ item.name }}
              </span>
            </transition>

            <!-- Keyboard shortcut (optional) -->
            <transition name="fade">
              <span v-if="!sidebarStore.isCollapsed" class="ml-auto text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style="color: var(--color-text-tertiary);">
                {{ ['⌘K', '⌘E', '⌘S', '⌘,'][index] }}
              </span>
            </transition>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Sign Out -->
    <div class="p-3 border-t" style="border-color: var(--color-elevated);">
      <button
        @click="handleSignOut"
        class="group relative flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 hover-lift"
        :class="sidebarStore.isCollapsed ? 'justify-center' : 'gap-3'"
        style="color: var(--color-text-secondary);"
      >
        <div class="flex-shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
             style="width: 40px; height: 40px;">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </div>
        <transition name="fade">
          <span v-if="!sidebarStore.isCollapsed" class="font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
            Sign out
          </span>
        </transition>
      </button>
    </div>

    <!-- Footer -->
    <transition name="fade">
      <div v-if="!sidebarStore.isCollapsed" class="px-6 pb-6 text-center">
        <p class="text-xs" style="color: var(--color-text-tertiary);">© 2026 BOOQZ</p>
      </div>
    </transition>
  </aside>
</template>

<style scoped>
.nav-active {
  background: var(--color-rose-subtle);
}

.nav-active .nav-indicator {
  height: 32px !important;
}

.nav-active .icon-wrapper {
  color: var(--color-accent);
}

.nav-active .nav-label {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* Fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms var(--ease-smooth);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Hover effect for nav items */
.nav-active:hover {
  background: var(--color-rose-subtle);
}

/* Ensure smooth icon scaling */
svg {
  transform-origin: center;
}
</style>
