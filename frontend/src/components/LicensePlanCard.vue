<script setup lang="ts">
interface LicensePlan {
  id: number
  name: string
  price: string
  duration: number
  active: boolean
}

const props = defineProps<{
  plan: LicensePlan
  isOwner: boolean
}>()

const emit = defineEmits<{
  buy: [planId: number]
  toggleActive: [planId: number, currentActive: boolean]
}>()
</script>

<template>
  <div 
    class="border border-gray-200 app-dark:border-gray-700 rounded-lg p-4 transition-opacity"
    :class="{ 'opacity-50': !plan.active }"
  >
    <div class="flex justify-between items-start gap-4">
      <div class="flex-1">
        <h4 class="font-bold text-gray-900 app-dark:text-white">{{ plan.name }}</h4>
        <p class="text-sm text-gray-600 app-dark:text-gray-400 mt-1">{{ plan.duration }} días</p>
        <p class="text-2xl font-bold text-blue-600 app-dark:text-blue-400 mt-2">{{ plan.price }} AVAX</p>
      </div>
      
      <div class="flex flex-col gap-2 items-end">
        <span 
          class="px-2 py-1 text-xs font-semibold rounded whitespace-nowrap"
          :class="plan.active 
            ? 'bg-green-100 app-dark:bg-green-900/20 text-green-800 app-dark:text-green-400' 
            : 'bg-gray-100 app-dark:bg-gray-800 text-gray-800 app-dark:text-gray-400'"
        >
          {{ plan.active ? 'Activo' : 'Inactivo' }}
        </span>
        
        <button 
          v-if="!isOwner && plan.active"
          @click="emit('buy', plan.id)"
          class="px-4 py-2 bg-blue-500 app-dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 app-dark:hover:bg-blue-700 transition-colors"
        >
          Comprar
        </button>
        
        <button 
          v-if="isOwner"
          @click="emit('toggleActive', plan.id, plan.active)"
          class="px-4 py-2 bg-gray-200 app-dark:bg-gray-700 text-gray-900 app-dark:text-white rounded-lg text-sm hover:bg-gray-300 app-dark:hover:bg-gray-600 transition-colors"
        >
          {{ plan.active ? 'Desactivar' : 'Activar' }}
        </button>
      </div>
    </div>
  </div>
</template>
