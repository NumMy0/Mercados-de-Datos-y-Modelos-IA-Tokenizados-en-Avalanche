import { ref, watch } from 'vue'

const isDark = ref(false)

// Cargar tema desde localStorage
const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
  isDark.value = savedTheme === 'dark'
} else {
  // Detectar preferencia del sistema
  isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Aplicar tema inicial
document.documentElement.classList.toggle('app-dark', isDark.value)

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  // Watcher para aplicar cambios
  watch(isDark, (newValue) => {
    document.documentElement.classList.toggle('app-dark', newValue)
    localStorage.setItem('theme', newValue ? 'dark' : 'light')
  }, { immediate: true })

  return {
    isDark,
    toggleTheme
  }
}