<script setup lang="ts">
import { ref } from 'vue'
import { uploadModelBlockchain } from '../composables/blockchain';
import { uploadToIPFS, unpinFromIPFS } from '../composables/ipfs';
import { useNotifications } from '../composables/useNotifications'
import { useBlockchainErrorHandler } from '../composables/useBlockchainErrorHandler'
import { parseEther } from 'ethers'

defineProps<{
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
  features: '',
  // Metadata fields requested
  model_id: '',
  version: '',
  // inference config
  // single JSON field for inference config
  inference_config_json: ''
})

const selectedFile = ref<File | null>(null)
const modelHash = ref<string>('')

const { notifyError, notifyTransactionSuccess } = useNotifications()
const { handleAsyncOperation } = useBlockchainErrorHandler()

// handleFileChange is implemented below with hash computation

// Compute SHA-256 hex digest of the uploaded file and store in modelHash
async function computeFileHash(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files && target.files[0]
  if (file) {
    selectedFile.value = file
    try {
      modelHash.value = await computeFileHash(file)
    } catch (err) {
      console.warn('No se pudo calcular el hash del archivo:', err)
      modelHash.value = ''
    }
  }
}

const handleSubmit = async () => {
  // Validación básica
  if (!formData.value.title || !formData.value.description || !formData.value.price) {
    notifyError('Campos requeridos', 'Por favor completa todos los campos obligatorios')
    return
  }

  if (!selectedFile.value) {
    notifyError('Archivo requerido', 'Por favor selecciona el archivo del modelo a subir')
    return
  }

  emit('submit', formData.value)

  // 1) Subir archivo del modelo a IPFS
  let modelIPFSHash: string
  try {
    modelIPFSHash = await uploadToIPFS(selectedFile.value as File)
  } catch (err) {
    handleAsyncOperation(
      () => Promise.reject(err),
      'subida del archivo del modelo a IPFS'
    )
    return
  }

  if (!modelIPFSHash) {
    notifyError('Error en IPFS', 'Error al subir el archivo del modelo a IPFS')
    return
  }

  // 2) Construir y subir metadatos (JSON) a IPFS
  // parse inference config JSON (user provides a JSON blob)
  let inferenceConfig: any
  if (formData.value.inference_config_json && String(formData.value.inference_config_json).trim() !== '') {
    try {
      inferenceConfig = JSON.parse(String(formData.value.inference_config_json))
    } catch (err) {
      notifyError('JSON inválido', 'El campo de configuración de inferencia contiene JSON inválido. Corrige antes de continuar.')
      return
    }
  } else {
    // fallback minimal inference config if the user left it empty
    inferenceConfig = { model_type: formData.value.modelType || 'unknown' }
  }
  const metadata = {
    model_id: formData.value.model_id || formData.value.title,
    version: formData.value.version || '1.0',
    model_cid: modelIPFSHash,
  model_hash: modelHash.value || '',
    metadata_cid: '',
    description: formData.value.description,
    inference_config: inferenceConfig
  }

  let metadataIPFSHash: string
  try {
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    metadataIPFSHash = await uploadToIPFS(blob)
  } catch (err) {
    handleAsyncOperation(
      () => Promise.reject(err),
      'subida de metadatos a IPFS'
    )
    return
  }

  if (!metadataIPFSHash) {
    notifyError('Error en IPFS', 'Error al subir los metadatos a IPFS')
    return
  }

  console.log('sigue subir a block')
  // 3) Subir modelo a la blockchain: convertir precio legible (AVAX) a wei
  let priceWei: bigint
  try {
    priceWei = parseEther(String(formData.value.price))
  } catch (err) {
    notifyError('Precio inválido', `El precio ingresado no es válido: ${String(err)}`)
    return
  }

  try {
    await uploadModelBlockchain(
      formData.value.title,
      modelIPFSHash,
      priceWei,
      metadataIPFSHash,
    )

    notifyTransactionSuccess(
      'Modelo Subido Exitosamente',
      `Tu modelo "${formData.value.title}" ha sido subido a la blockchain por ${formData.value.price} AVAX`
    )

    resetForm()
  } catch (err) {
    // Si la tx falla, deshacer los pins en Pinata para evitar residuos
    console.error('Error subiendo modelo a la blockchain:', err)
    try {
      await unpinFromIPFS(modelIPFSHash)
      console.info('Modelo unpinned:', modelIPFSHash)
    } catch (uerr) {
      console.warn('No se pudo unpin el archivo del modelo:', uerr)
    }
    try {
      await unpinFromIPFS(metadataIPFSHash)
      console.info('Metadata unpinned:', metadataIPFSHash)
    } catch (uerr) {
      console.warn('No se pudo unpin los metadatos:', uerr)
    }

    handleAsyncOperation(
      () => Promise.reject(err),
      'subida del modelo a la blockchain'
    )
    return
  }
}

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    category: '',
    price: '',
    modelType: '',
    features: '',
    model_id: '',
    version: '',
  // model_hash now computed from file
    inference_config_json: ''
  }
  selectedFile.value = null
  modelHash.value = ''
}

const handleClose = () => {
  resetForm()
  emit('close')
}
</script>

<template>
  <!-- Modal Overlay -->
  <Transition name="modal" appear>
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 app-dark:bg-black/20 backdrop-blur-lg modal-backdrop"
      @click.self="handleClose"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 300 } }"
      :leave="{ opacity: 0, transition: { duration: 200 } }"
    >
      <!-- Modal Content -->
      <div 
        class="w-full max-w-2xl bg-white/95 app-dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20 app-dark:border-gray-700/50"
        v-motion
        :initial="{ scale: 0.9, y: 50 }"
        :enter="{ scale: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
        :leave="{ scale: 0.9, y: 50, transition: { duration: 200, ease: 'easeIn' } }"
      >
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white app-dark:bg-gray-900 border-b border-gray-200 app-dark:border-gray-700 px-6 py-3.5 flex justify-between items-center">
          <h2 class="text-gray-900 app-dark:text-white font-bold text-2xl">
            Subir Modelo de IA
          </h2>
          <button 
            @click="handleClose"
            class="text-gray-500 hover:text-gray-700 app-dark:text-gray-400 app-dark:hover:text-gray-200 transition-colors p-1"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-5">
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

            <!-- Metadata fields (model_id, version) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-gray-900 app-dark:text-white font-medium" for="model_id">Model ID</label>
                <input v-model="formData.model_id" id="model_id" placeholder="resnet18" class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2" type="text">
              </div>
              <div>
                <label class="text-gray-900 app-dark:text-white font-medium" for="version">Version</label>
                <input v-model="formData.version" id="version" placeholder="2.7" class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2" type="text">
              </div>
            </div>

            <!-- Inference config (JSON) -->
            <div class="mt-4">
              <label class="text-gray-900 app-dark:text-white font-medium" for="inference_config_json">Inference config (JSON)</label>
              <textarea v-model="formData.inference_config_json" id="inference_config_json" placeholder='{"model_type":"image_classification","input_shape":[1,3,224,224],"preprocessing":"imagenet","color_format":"RGB"}' class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              <p class="text-sm text-gray-500 mt-1">Introduce la configuración de inferencia como JSON válido. Ej: {"model_type":"image_classification","input_shape":[1,3,224,224],"preprocessing":"imagenet","color_format":"RGB"}</p>
            </div>

            <!-- Submit Buttons -->
            <!-- File upload -->
            <div>
              <label class="text-gray-900 app-dark:text-white font-medium" for="modelFile">
                Archivo del Modelo *
              </label>
              <input
                id="modelFile"
                type="file"
                @change="handleFileChange"
                accept="*/*"
                class="mt-1 w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2"
                required
              />
            </div>

            <div class="flex justify-end gap-3 pt-4 mt-2">
              <button 
                @click="handleClose"
                type="button"
                class="px-5 py-2.5 bg-gray-200 app-dark:bg-gray-700 text-gray-900 app-dark:text-white rounded-md hover:bg-gray-300 app-dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                class="px-5 py-2.5 bg-green-500 app-dark:bg-green-600 text-white rounded-md hover:bg-green-600 app-dark:hover:bg-green-700 transition-colors"
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
