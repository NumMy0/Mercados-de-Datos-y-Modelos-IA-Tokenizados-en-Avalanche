<script setup lang="ts">
import { ref } from 'vue'
import { uploadModelBlockchain } from '../../composables/blockchain';
import { useNotifications } from '../../composables/useNotifications'
import { useMetadata } from '../../composables/useMetadata'
import { parseEther } from 'ethers'
import { useLabelsUpload } from '../../composables/useLabelsUpload';

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: any]
}>()

// Datos del formulario - separados por sección
const formData = ref({
  // Información básica
  title: '',
  description: '',
  version: '1.0.0',
  price: '',
  
  // Información adicional
  author: '',
  license: 'MIT',
  framework: 'PyTorch/ONNX',
  opset_version: '11',
  
  // Configuración de inferencia (JSON)
  inference_config_json: `{
  "model_type": "image_classification",
  "input_shape": [1, 3, 224, 224],
  "preprocessing": "imagenet",
  "color_format": "RGB",
  "output_config": {
    "type": "softmax",
    "topk": 5
  }
}`
})

const selectedFile = ref<File | null>(null)
const isSubmitting = ref(false) // Flag para prevenir múltiples envíos

const { notifyError, notifyTransactionSuccess, notifySuccess } = useNotifications()

// 🔧 Composable para manejo de metadatos
const {
  isGenerating,
  error: metadataError,
  processAndUploadMetadata,
  validateInferenceConfig,
  clearError
} = useMetadata()

// Función para validar JSON en tiempo real
const validateJsonConfig = () => {
  try {
    const parsed = JSON.parse(formData.value.inference_config_json)
    if (validateInferenceConfig(parsed)) {
      notifySuccess('JSON Válido', 'La configuración de inferencia es correcta')
    } else {
      notifyError('JSON Inválido', metadataError.value || 'Error en la validación')
    }
  } catch (err: any) {
    notifyError('JSON Inválido', `Error de sintaxis: ${err.message}`)
  }
}

// 🏷️ Composable para manejo de labels
const { 
  labelsData, 
  isProcessing: isProcessingLabels,
  error: labelsError,
  processLabelsFile,
  resetLabels
} = useLabelsUpload()

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files && target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleLabelsFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files && target.files[0]
  if (file) {
    const success = await processLabelsFile(file)
    if (!success && labelsError.value) {
      notifyError('Error en Labels', labelsError.value)
    }
  }
}

const handleSubmit = async () => {
  // Prevenir múltiples envíos simultáneos
  if (isSubmitting.value || isGenerating.value) {
    console.log('⚠️ Envío ya en progreso, ignorando...')
    return
  }

  console.log('🚀 Iniciando proceso de subida de modelo...')
  isSubmitting.value = true

  try {
    // Limpiar errores previos
    clearError()
    
    // Validación básica del formulario
    if (!formData.value.title || !formData.value.description || !formData.value.price) {
      notifyError('Campos requeridos', 'Por favor completa todos los campos obligatorios')
      return
    }

    if (!selectedFile.value) {
      notifyError('Archivo requerido', 'Por favor selecciona el archivo del modelo a subir')
      return
    }

    // Validar y parsear configuración de inferencia
    let inferenceConfig: any
    try {
      console.log('🔍 Texto JSON a parsear:', formData.value.inference_config_json)
      inferenceConfig = JSON.parse(formData.value.inference_config_json)
      console.log('✅ JSON parseado correctamente:', inferenceConfig)
      
      // Validar que la configuración sea correcta
      if (!validateInferenceConfig(inferenceConfig)) {
        console.error('❌ Validación falló:', metadataError.value)
        notifyError('Configuración inválida', metadataError.value || 'La configuración de inferencia no es válida')
        return
      }
      console.log('✅ Validación de inference_config exitosa')
    } catch (err: any) {
      console.error('❌ Error parseando JSON:', err)
      notifyError('JSON inválido', `Error parseando JSON: ${err.message}`)
      return
    }

    // Procesar archivo de labels si existe
    let labelsFile: File | null = null
    if (labelsData.value.isValid && labelsData.value.file) {
      labelsFile = labelsData.value.file
    }

    // Generar y subir metadatos completos usando el nuevo composable
    const { metadata, metadataCid } = await processAndUploadMetadata(
      {
        name: formData.value.title,
        description: formData.value.description,
        version: formData.value.version,
        author: formData.value.author,
        license: formData.value.license,
        framework: formData.value.framework,
        opset_version: formData.value.opset_version
      },
      selectedFile.value,
      labelsFile,
      inferenceConfig
    )

    console.log('✅ Metadatos procesados:', metadata)
    console.log('✅ MetadataCID:', metadataCid)

    // Convertir precio a Wei
    let priceWei: bigint
    try {
      priceWei = parseEther(String(formData.value.price))
    } catch (err) {
      notifyError('Precio inválido', `El precio ingresado no es válido: ${String(err)}`)
      return
    }

    // Subir modelo a la blockchain
    await uploadModelBlockchain(
      formData.value.title,
      metadata.model_cid,  // CID del modelo desde los metadatos
      priceWei,
      metadataCid          // CID de los metadatos completos
    )

    notifyTransactionSuccess(
      'Modelo Subido Exitosamente',
      `Tu modelo "${formData.value.title}" ha sido subido a la blockchain por ${formData.value.price} AVAX`
    )

    console.log('✅ Proceso completado exitosamente')
    
    // Resetear formulario
    resetForm()
    
    // Emitir evento de éxito 
    emit('submit', formData.value)
    
    // Cerrar modal automáticamente después de éxito
    setTimeout(() => {
      emit('close')
    }, 1500)

  } catch (err: any) {
    console.error('❌ Error subiendo modelo:', err)
    
    const errorMessage = err.message || 'Error desconocido durante la subida'
    notifyError('Error en la Subida', errorMessage)
    
    // Si hay un error, los archivos ya subidos quedarán en IPFS
    // pero no se registrarán en la blockchain, lo cual está bien
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    version: '1.0.0',
    price: '',
    author: '',
    license: 'MIT',
    framework: 'PyTorch/ONNX',
    opset_version: '11',
    inference_config_json: `{
  "model_type": "image_classification",
  "input_shape": [1, 3, 224, 224],
  "preprocessing": "imagenet",
  "color_format": "RGB",
  "output_config": {
    "type": "softmax",
    "topk": 5
  }
}`
  }
  selectedFile.value = null
  resetLabels()
  clearError()
  isSubmitting.value = false
}
</script>

<template>
  <!-- Modal Overlay -->
  <Transition name="modal" appear>
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 app-dark:bg-black/20 backdrop-blur-lg modal-backdrop"
      @click.self="emit('close')"
    >
      <!-- Modal Content -->
      <div 
        class="w-full max-w-4xl bg-white/95 app-dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20 app-dark:border-gray-700/50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 app-dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 app-dark:text-white">
            🤖 Subir Nuevo Modelo
          </h2>
          <button
            @click="emit('close')"
            class="text-gray-500 hover:text-gray-700 app-dark:text-gray-400 app-dark:hover:text-gray-200 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form Content -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          
          <!-- ✨ Información Básica -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 app-dark:text-white border-b border-gray-200 app-dark:border-gray-700 pb-2">
              📝 Información Básica
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="title">
                  Nombre del Modelo *
                </label>
                <input 
                  v-model="formData.title"
                  id="title"
                  placeholder="Ej: MobileNet V2 - Clasificación de Fauna"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="version">
                  Versión *
                </label>
                <input 
                  v-model="formData.version"
                  id="version"
                  placeholder="1.0.0"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="description">
                Descripción *
              </label>
              <textarea 
                v-model="formData.description"
                id="description"
                rows="3"
                placeholder="Describe tu modelo, su propósito, datos de entrenamiento, precisión, etc."
                class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="price">
                  Precio (AVAX) *
                </label>
                <input 
                  v-model="formData.price"
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="10.5"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="author">
                  Autor
                </label>
                <input 
                  v-model="formData.author"
                  id="author"
                  placeholder="Tu nombre o organización"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          <!-- 🔧 Información Técnica -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 app-dark:text-white border-b border-gray-200 app-dark:border-gray-700 pb-2">
              🔧 Información Técnica
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="framework">
                  Framework
                </label>
                <select 
                  v-model="formData.framework"
                  id="framework"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PyTorch/ONNX">PyTorch/ONNX</option>
                  <option value="TensorFlow">TensorFlow</option>
                  <option value="Keras">Keras</option>
                  <option value="Scikit-learn">Scikit-learn</option>
                  <option value="Hugging Face">Hugging Face</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="license">
                  Licencia
                </label>
                <select 
                  v-model="formData.license"
                  id="license"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MIT">MIT</option>
                  <option value="Apache 2.0">Apache 2.0</option>
                  <option value="GPL v3">GPL v3</option>
                  <option value="BSD">BSD</option>
                  <option value="Creative Commons">Creative Commons</option>
                  <option value="Propietaria">Propietaria</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="opset_version">
                  ONNX Opset
                </label>
                <input 
                  v-model="formData.opset_version"
                  id="opset_version"
                  placeholder="11"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          <!-- 📁 Archivos -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 app-dark:text-white border-b border-gray-200 app-dark:border-gray-700 pb-2">
              📁 Archivos del Modelo
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Archivo del Modelo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1">
                  Archivo del Modelo * (.onnx, .pkl, .h5)
                </label>
                <input 
                  @change="handleFileChange"
                  type="file"
                  accept=".onnx,.pkl,.h5,.pt,.pth,.bin"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p class="text-xs text-gray-500 app-dark:text-gray-400 mt-1">
                  {{ selectedFile ? `Seleccionado: ${selectedFile.name} (${Math.round(selectedFile.size / 1024 / 1024)}MB)` : 'Ningún archivo seleccionado' }}
                </p>
              </div>

              <!-- Archivo de Labels (Opcional) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1">
                  Labels/Clases (Opcional) (.json, .txt)
                </label>
                <input 
                  @change="handleLabelsFileChange"
                  type="file"
                  accept=".json,.txt,.csv"
                  class="w-full px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p class="text-xs text-gray-500 app-dark:text-gray-400 mt-1">
                  {{ labelsData.isValid ? `✅ ${labelsData.file?.name} (${labelsData.preview})` : 'Ningún archivo seleccionado' }}
                </p>
              </div>
            </div>
          </section>

          <!-- ⚙️ Configuración de Inferencia -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 app-dark:text-white border-b border-gray-200 app-dark:border-gray-700 pb-2">
              ⚙️ Configuración de Inferencia
            </h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-1" for="inference_config">
                Configuración JSON *
              </label>
              <div class="flex space-x-2">
                <textarea 
                  v-model="formData.inference_config_json"
                  id="inference_config"
                  rows="8"
                  placeholder="Configuración de inferencia en formato JSON"
                  class="flex-1 px-3 py-2 border border-gray-300 app-dark:border-gray-600 rounded-md bg-white app-dark:bg-gray-800 text-gray-900 app-dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  required
                />
                <button
                  type="button"
                  @click="validateJsonConfig"
                  class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm whitespace-nowrap"
                >
                  ✓ Validar
                </button>
              </div>
              <p class="text-xs text-gray-500 app-dark:text-gray-400 mt-1">
                Esta configuración define cómo se debe procesar la entrada y salida del modelo.
              </p>
            </div>
          </section>

          <!-- 🚨 Errores -->
          <div v-if="metadataError" class="p-4 bg-red-50 app-dark:bg-red-900/20 border border-red-200 app-dark:border-red-800 rounded-md">
            <p class="text-red-800 app-dark:text-red-200 text-sm">
              ❌ {{ metadataError }}
            </p>
          </div>

          <!-- 📤 Estado de Carga -->
          <div v-if="isGenerating" class="p-4 bg-blue-50 app-dark:bg-blue-900/20 border border-blue-200 app-dark:border-blue-800 rounded-md">
            <p class="text-blue-800 app-dark:text-blue-200 text-sm flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando modelo y generando metadatos...
            </p>
          </div>

          <!-- Botones -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 app-dark:border-gray-700">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2 text-gray-700 app-dark:text-gray-300 bg-gray-100 app-dark:bg-gray-700 hover:bg-gray-200 app-dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isGenerating || isProcessingLabels || isSubmitting"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center space-x-2"
            >
              <span v-if="isGenerating || isProcessingLabels || isSubmitting">Procesando...</span>
              <span v-else>🚀 Subir Modelo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Transiciones del modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Mejoras de UX */
.modal-backdrop {
  backdrop-filter: blur(8px);
}

textarea {
  resize: vertical;
  min-height: 100px;
}

/* Scrollbar personalizado */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}
</style>