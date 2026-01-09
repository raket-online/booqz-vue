import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    authStore.setSession(data.session)
    return data
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    authStore.clear()
  }

  async function initialize() {
    authStore.setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    authStore.setSession(session)

    supabase.auth.onAuthStateChange((_event, session) => {
      authStore.setSession(session)
    })

    authStore.setLoading(false)
  }

  return {
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    initialize
  }
}
