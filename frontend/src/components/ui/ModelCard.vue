<script setup lang="ts">
interface Model {
  id: number
  name: string
  description: string
  price: string
  category: string
}

const props = defineProps<{
  model: Model
  isConnected: boolean
}>()

const emit = defineEmits<{
  viewDetails: [modelId: number]
}>()

const handleViewDetails = () => {
  emit('viewDetails', props.model.id)
}
</script>

<template>
  <div 
    class="bg-white app-dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-200 app-dark:border-gray-700 w-full max-w-full"
  >
    <div class="p-5 flex flex-col h-[280px]">
      <!-- Category Badge -->
      <div class="mb-3">
        <span class="inline-block px-3 py-1 text-xs font-semibold text-blue-600 app-dark:text-blue-400 bg-blue-50 app-dark:bg-blue-900/20 rounded-full border border-blue-200 app-dark:border-blue-800">
          {{ model.category }}
        </span>
      </div>

      <!-- Model Name -->
      <h3 class="text-xl font-bold text-gray-900 app-dark:text-gray-100 mb-3">
        {{ model.name }}
      </h3>

      <!-- Description -->
      <p class="text-gray-600 app-dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-grow">
        {{ model.description }}
      </p>
      
      <!-- Price -->
      <div class="mb-4">
        <span class="text-2xl font-bold text-gray-900 app-dark:text-gray-100">
          {{ model.price }}
        </span>
      </div>

      <!-- Action Button -->
      <button 
        @click="handleViewDetails"
        class="w-full py-2.5 px-4 bg-blue-500 app-dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-600 app-dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!isConnected"
      >
        {{ isConnected ? 'Ver Detalles' : 'Conecta tu Wallet' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
