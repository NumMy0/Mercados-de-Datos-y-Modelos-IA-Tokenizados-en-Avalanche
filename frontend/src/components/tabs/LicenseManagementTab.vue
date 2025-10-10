<!-- 
  LicenseManagementTab.vue
  
  Responsabilidad única: Gestionar todo lo relacionado con licencias
  
  Incluye:
  - Mostrar estado de licencia del usuario actual
  - Crear nuevos planes de licencia (solo propietario)
  - Listar planes disponibles
  - Comprar licencias
  - Activar/desactivar planes (solo propietario)
  
  Props:
  - isOwner: Boolean indicando si el usuario es propietario del modelo
  - userHasLicense: Boolean indicando si el usuario tiene licencia activa
  - licenseExpiryDate: Fecha de expiración de la licencia (string o null)
  - licensePlans: Array de planes de licencia disponibles
  - creatingPlan: Boolean indicando si se está creando un plan
  - buyingLicense: Boolean indicando si se está comprando una licencia
  
  Events:
  - createPlan: Emitido cuando se crea un nuevo plan { name, price, duration }
  - buyLicense: Emitido cuando se compra una licencia (planId)
  - togglePlanActive: Emitido cuando se activa/desactiva un plan { planId, currentActive }
-->

<script setup lang="ts">
import { ref } from 'vue'
import LicensePlanCard from '../LicensePlanCard.vue'

interface LicensePlan {
  id: number
  name: string | null
  price: string
  duration?: number | null
  active?: boolean | null
}

interface LicensePlanFormData {
  name: string
  price: string
  duration: number
}

// Props
defineProps<{
  isOwner: boolean
  userHasLicense: boolean
  licenseExpiryDate: string | null
  licensePlans: LicensePlan[]
  creatingPlan: boolean
  buyingLicense: boolean
}>()

// Emits
const emit = defineEmits<{
  createPlan: [formData: LicensePlanFormData]
  buyLicense: [planId: number]
  togglePlanActive: [planId: number, currentActive: boolean]
}>()

// Estado Local
const showLicenseForm = ref(false)
const licensePlanForm = ref<LicensePlanFormData>({
  name: '',
  price: '',
  duration: 30
})

// Métodos
const resetForm = () => {
  licensePlanForm.value = { name: '', price: '', duration: 30 }
  showLicenseForm.value = false
}

const validateForm = (): boolean => {
  const { name, price, duration } = licensePlanForm.value
  if (!name || !price || !duration) {
    alert('Por favor completa todos los campos')
    return false
  }
  return true
}

const handleCreatePlan = () => {
  if (!validateForm()) return
  
  // Emitir datos al componente padre para que maneje la lógica blockchain
  emit('createPlan', { ...licensePlanForm.value })
  resetForm()
}

const handleBuyLicense = (planId: number) => {
  emit('buyLicense', planId)
}

const handleTogglePlanActive = (planId: number, currentActive: boolean) => {
  emit('togglePlanActive', planId, currentActive)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Estado de Licencia del Usuario -->
    <div 
      v-if="userHasLicense" 
      class="p-4 bg-blue-50 app-dark:bg-blue-900/20 border border-blue-200 app-dark:border-blue-800 rounded-lg"
    >
      <h3 class="font-bold text-blue-900 app-dark:text-blue-100">
        ✓ Licencia Activa
      </h3>
      <p class="text-sm text-blue-700 app-dark:text-blue-300 mt-1">
        Expira: {{ licenseExpiryDate || 'No disponible' }}
      </p>
    </div>

    <!-- Crear Nuevo Plan de Licencia (Solo Propietario) -->
    <div 
      v-if="isOwner" 
      class="border border-gray-200 app-dark:border-gray-700 rounded-lg p-4"
    >
      <button 
        @click="showLicenseForm = !showLicenseForm"
        class="w-full flex justify-between items-center text-left font-medium text-gray-900 app-dark:text-white hover:text-blue-600 app-dark:hover:text-blue-400 transition-colors"
      >
        <span>+ Crear Nuevo Plan de Licencia</span>
        <svg 
          class="w-5 h-5 transition-transform" 
          :class="{ 'rotate-180': showLicenseForm }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Formulario para Crear Plan -->
      <form 
        v-if="showLicenseForm" 
        @submit.prevent="handleCreatePlan" 
        class="mt-4 space-y-3"
      >
        <input 
          v-model="licensePlanForm.name"
          placeholder="Nombre del plan"
          class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          required
        >
        <div class="grid grid-cols-2 gap-3">
          <input 
            v-model="licensePlanForm.price"
            placeholder="Precio en AVAX"
            class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number"
            step="0.01"
            required
          >
          <input 
            v-model.number="licensePlanForm.duration"
            placeholder="Duración (días)"
            class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number"
            min="1"
            required
          >
        </div>
        <button 
          type="submit"
          :disabled="creatingPlan"
          :class="[
            'w-full px-4 py-2 rounded-lg transition-colors font-medium',
            creatingPlan 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-blue-500 app-dark:bg-blue-600 text-white hover:bg-blue-600 app-dark:hover:bg-blue-700'
          ]"
        >
          <span v-if="!creatingPlan">Crear Plan</span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Creando...
          </span>
        </button>
      </form>
    </div>

    <!-- Lista de Planes Disponibles -->
    <div class="space-y-3">
      <h3 class="font-bold text-gray-900 app-dark:text-white text-lg">
        Planes Disponibles
      </h3>
      
      <!-- Mensaje si no hay planes -->
      <div 
        v-if="licensePlans.length === 0" 
        class="text-center py-8 text-gray-500 app-dark:text-gray-400"
      >
        No hay planes de licencia disponibles
      </div>
      
      <!-- Cards de Planes -->
      <LicensePlanCard
        v-for="plan in licensePlans"
        :key="plan.id"
        :plan="{ 
          id: plan.id, 
          name: plan.name ?? '', 
          price: plan.price ?? '0', 
          duration: plan.duration ?? 0, 
          active: !!plan.active 
        }"
        :is-owner="isOwner"
        @buy="handleBuyLicense"
        @toggle-active="handleTogglePlanActive"
      />
    </div>
  </div>
</template>

<style scoped>
/* Animación del spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
