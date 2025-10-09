<script setup lang="ts">
import { ref } from 'vue'
import { uploadModelBlockchain , uploadToIPFS } from '../composables/blockchain';

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: any]
}>()

const formData = ref({
  title: '',
  description: '',
  category: '',
  price: '',
  modelType: '',
  features: ''
})

const handleSubmit = async () => {
  // Validación básica
  if (!formData.value.title || !formData.value.description || !formData.value.price) {
    alert('Por favor completa todos los campos obligatorios')
    return
  }

  emit('submit', formData.value)

  const metadata = {
    name: formData.value.title,
    description: formData.value.description,
    category: formData.value.category,
    features: formData.value.features
  }

  const modelIPFSHash = await uploadToIPFS(metadata)
  if (!modelIPFSHash) {
    alert('Error al subir los metadatos a IPFS')
    return
  }

  const metadataIPFSHash = await uploadToIPFS(metadata);

  if (!metadataIPFSHash) {
    alert('Error al subir los metadatos a IPFS')
    return
  }

  // Subir modelo a la blockchain
  await uploadModelBlockchain(
    formData.value.title,
    modelIPFSHash,
    formData.value.price,
    metadataIPFSHash,
  )

  resetForm()
}

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    category: '',
    price: '',
    modelType: '',
    features: ''
  }
}

const handleClose = () => {
  resetForm()
  emit('close')
}
</script>

<template>
  <!-- Modal Overlay -->
  <Transition name="modal">
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <!-- Modal Content -->
      <div class="w-full max-w-2xl bg-white app-dark:bg-gray-900 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white app-dark:bg-gray-900 border-b border-gray-200 app-dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 class="text-gray-900 app-dark:text-white font-bold text-2xl">
            Subir Modelo de IA
          </h2>
          <button 
            @click="handleClose"
            class="text-gray-500 hover:text-gray-700 app-dark:text-gray-400 app-dark:hover:text-gray-200 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Title -->
            <div>
              <label class="text-gray-900 app-dark:text-white font-medium" for="title">
                Nombre del Modelo *
              </label>
              <input 
                v-model="formData.title"
                placeholder="Ej: GPT-Style Language Model"
                class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                id="title"
                required
              >
            </div>

            <!-- Description -->
            <div>
              <label class="text-gray-900 app-dark:text-white font-medium" for="description">
                Descripción *
              </label>
              <textarea 
                v-model="formData.description"
                placeholder="Describe tu modelo de IA en detalle"
                class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="description"
                required
              ></textarea>
            </div>

            <!-- Category and Price Row -->
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <label class="text-gray-900 app-dark:text-white font-medium" for="category">
                  Categoría *
                </label>
                <select
                  v-model="formData.category"
                  class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="category"
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  <option value="NLP">NLP (Procesamiento de Lenguaje Natural)</option>
                  <option value="Computer Vision">Computer Vision</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Deep Learning">Deep Learning</option>
                  <option value="Reinforcement Learning">Reinforcement Learning</option>
                </select>
              </div>

              <div class="flex-1">
                <label class="text-gray-900 app-dark:text-white font-medium" for="price">
                  Precio (AVAX) *
                </label>
                <input 
                  v-model="formData.price"
                  placeholder="100"
                  class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                >
              </div>
            </div>

            <!-- Model Type and Features -->
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <label class="text-gray-900 app-dark:text-white font-medium" for="modelType">
                  Tipo de Modelo
                </label>
                <input 
                  v-model="formData.modelType"
                  placeholder="Ej: Transformer, CNN, RNN"
                  class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="modelType"
                  type="text"
                >
              </div>

              <div class="flex-1">
                <label class="text-gray-900 app-dark:text-white font-medium" for="features">
                  Características Principales
                </label>
                <input 
                  v-model="formData.features"
                  placeholder="Ej: Alta precisión, Rápido, Escalable"
                  class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="features"
                  type="text"
                >
              </div>
            </div>

            <!-- Submit Buttons -->
            <div class="flex justify-end gap-3 pt-4">
              <button 
                @click="handleClose"
                type="button"
                class="px-6 py-2 bg-gray-200 app-dark:bg-gray-700 text-gray-900 app-dark:text-white rounded-md hover:bg-gray-300 app-dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                class="px-6 py-2 bg-green-500 app-dark:bg-green-600 text-white rounded-md hover:bg-green-600 app-dark:hover:bg-green-700 transition-colors"
              >
                Subir Modelo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Modal animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
