import { ref } from 'vue'

export const isLoadingGlobal = ref(false)
export const translatingGlobal = ref(false)
export const improvingGlobal = ref(false)

export function useGlobalLoader() {
  const showLoader = (show: boolean) => {
    isLoadingGlobal.value = show
    console.log('Global loader state:', isLoadingGlobal.value)
  }

  return {
    isLoadingGlobal,
    showLoader
  }
}