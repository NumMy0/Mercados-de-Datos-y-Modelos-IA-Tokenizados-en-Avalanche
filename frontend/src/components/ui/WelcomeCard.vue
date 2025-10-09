<script setup lang="ts">
interface Button {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  loading?: boolean
}

const props = defineProps<{
  title: string
  subtitle: string
  description: string
  buttons: Button[]
  error?: string | null
}>()

const getButtonClasses = (variant: Button['variant'] = 'secondary') => {
  const baseClasses = 'block w-full rounded-lg border p-3 text-center text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  if (variant === 'primary') {
    return `${baseClasses} bg-blue-500 hover:bg-blue-600 border-blue-500 text-white hover:bg-opacity-90`
  }
  
  return `${baseClasses} text-gray-900 app-dark:text-gray-100 bg-white app-dark:bg-gray-700 border-gray-200 app-dark:border-gray-600 hover:border-blue-500 hover:bg-blue-500 hover:text-white`
}
</script>

<template>
  <div class="w-full max-w-[570px] rounded-[20px] bg-white app-dark:bg-gray-800 py-8 px-6 sm:py-12 sm:px-8 md:py-[60px] md:px-[70px] text-center shadow-lg transition-colors duration-200">
    <!-- Header -->
    <h3 class="text-gray-900 app-dark:text-gray-100 pb-2 text-lg font-bold sm:text-xl md:text-2xl transition-colors duration-200">
      {{ title }}
    </h3>
    
    <!-- Decorative Line -->
    <span class="bg-blue-500 app-dark:bg-blue-600 mx-auto mb-4 sm:mb-6 inline-block h-1 w-[70px] sm:w-[90px] rounded transition-colors duration-200"></span>
    
    <!-- Description -->
    <p class="text-gray-500 app-dark:text-gray-400 mb-6 sm:mb-10 text-sm sm:text-base leading-relaxed transition-colors duration-200 px-2">
      {{ description }}
    </p>

    <!-- Error Message -->
    <div 
      v-if="error" 
      class="mb-4 sm:mb-6 p-2.5 sm:p-3 bg-red-50 app-dark:bg-red-900/20 border border-red-200 app-dark:border-red-800 rounded-lg"
    >
      <p class="text-red-600 app-dark:text-red-400 text-xs sm:text-sm">{{ error }}</p>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
      <div 
        v-for="(button, index) in buttons"
        :key="index"
        class="flex-1 min-w-[140px]"
      >
        <button
          @click="button.onClick"
          :disabled="button.disabled || button.loading"
          :class="getButtonClasses(button.variant)"
          class="text-sm sm:text-base"
        >
          {{ button.loading ? 'Cargando...' : button.label }}
        </button>
      </div>
    </div>

    <!-- Optional slot for additional content -->
    <slot />
  </div>
</template>

<style scoped>
/* Smooth transitions for theme changes */
h3, p, span, div, button {
  transition-property: background-color, border-color, color;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
</style>
