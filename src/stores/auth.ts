import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  function setUser(newUser: User | null) {
    user.value = newUser
  }

  function setSession(newSession: Session | null) {
    session.value = newSession
    user.value = newSession?.user ?? null
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function clear() {
    user.value = null
    session.value = null
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    setUser,
    setSession,
    setLoading,
    clear
  }
})
