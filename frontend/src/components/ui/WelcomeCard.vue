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
    return `${baseClasses} bg-blue-500 hover:bg-blue-600 border-blue-500 text-white hover:shadow-lg`
  }
  
  return `${baseClasses} text-gray-900 app-dark:text-gray-100 bg-white app-dark:bg-gray-700 border-gray-200 app-dark:border-gray-600 hover:border-blue-500 hover:bg-blue-500 hover:text-white`
}
</script>

<template>
  <div class="w-full max-w-[55vh] min-h-[45vh] flex flex-col items-center justify-around rounded-[20px]
         bg-white app-dark:bg-gray-800 text-center shadow-lg transition-colors duration-200">
    <!-- Header -->
    <h3 class="text-gray-900 app-dark:text-gray-100 text-xl font-bold sm:text-3xl transition-colors duration-200">
      {{ title }}
    </h3>
    
    
    <!-- Description -->
    <div class="w-[70%]">
        <p class="text-gray-500 app-dark:text-gray-400 mb-10 text-base leading-relaxed transition-colors duration-200 px-4">
        {{ description }}
        </p>
    </div>

    <!-- Error Message -->
    <div 
      v-if="error" 
      class="mb-6 p-2 bg-red-50 app-dark:bg-red-900/20 border border-red-200 app-dark:border-red-800 rounded-lg w-[40%]"
    >
      <p class="text-red-600 app-dark:text-red-400 text-sm">{{ error }}</p>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap justify-center gap-8 w-full min-h-[40px] px-4">
        <button
            v-for="(button, index) in buttons"
            :key="index"
            @click="button.onClick"
            :disabled="button.disabled || button.loading"
            :class="[
            getButtonClasses(button.variant),
            'flex-1 min-w-[150px] max-w-[200px] text-center py-3'
            ]"
        >
        {{ button.loading ? 'Cargando...' : button.label }}
        </button>
    </div>
    

    <!-- Optional slot for additional content -->
    <slot />
  </div>
</template>



<style scoped>
/* Smooth transitions for theme changes */
h3, p, span, div {
  transition-property: background-color, border-color, color;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
</style>
