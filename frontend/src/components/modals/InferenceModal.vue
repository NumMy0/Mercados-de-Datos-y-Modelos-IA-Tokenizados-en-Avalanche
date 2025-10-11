<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useInference } from '../../composables/useInference'
import { useWallet } from '../../composables/useWallet'
import { hasActiveLicense } from '../../composables/blockchain'

interface Props {
  isOpen: boolean
  model: {
    id: number
    name: string
    ipfsHash: string
    category: string
  } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { isInferring, error, result, runInference } = useInference()
const { account, connectWallet, isConnected } = useWallet()

const inputType = ref<'text' | 'image'>('image')
const textInput = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const hasLicense = ref<boolean | null>(null)
const checkingLicense = ref(false)

const canSubmit = computed(() => {
  if (inputType.value === 'text') {
    return textInput.value.trim().length > 0
  }
  return imageFile.value !== null
})

// 🔐 Verificar licencia cuando se abre el modal o cambia la cuenta
const checkLicense = async () => {
  if (!props.model || !account.value) {
    hasLicense.value = null
    return
  }

  checkingLicense.value = true
  try {
    const result = await hasActiveLicense(props.model.id.toString(), account.value)
    hasLicense.value = result
    console.log(`🔍 Licencia verificada para modelo ${props.model.id}:`, result)
  } catch (err) {
    console.error('Error al verificar licencia:', err)
    hasLicense.value = null
  } finally {
    checkingLicense.value = false
  }
}

// Verificar licencia cuando se abre el modal o cambia la cuenta
watch([() => props.isOpen, account], () => {
  if (props.isOpen && account.value) {
    checkLicense()
  }
}, { immediate: true })


// Función para manejar la selección de imagen
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmit = async () => {
  if (!props.model || !canSubmit.value) return

  try {
    // 🔐 Verificar que la wallet esté conectada
    if (!isConnected.value) {
      const confirmed = confirm('⚠️ Necesitas conectar tu wallet para ejecutar inferencias. ¿Deseas conectarla ahora?')
      if (confirmed) {
        await connectWallet()
      }
      return
    }

    let input: any

    if (inputType.value === 'image' && imageFile.value) {
      // Convertir imagen a base64
      const reader = new FileReader()
      input = await new Promise((resolve) => {
        reader.onload = (e) => {
          resolve({
            type: 'image',
            data: e.target?.result as string
          })
        }
        reader.readAsDataURL(imageFile.value!)
      })
    } else {
      input = {
        type: 'text',
        data: textInput.value
      }
    }

    // 🔐 Pasar la dirección del usuario para verificar licencia
    await runInference({
      modelId: props.model.id.toString(),
      ipfsHash: props.model.ipfsHash,
      input
    }, account.value || undefined)
  } catch (err) {
    console.error('Error ejecutando inferencia:', err)
  }
}

const handleClose = () => {
  textInput.value = ''
  imageFile.value = null
  imagePreview.value = null
  emit('close')
}
</script>

<template>
  <Transition name="modal" appear>
    <div
      v-if="isOpen && model"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 app-dark:bg-black/20 backdrop-blur-lg modal-backdrop"
      @click.self="handleClose"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 300 } }"
      :leave="{ opacity: 0, transition: { duration: 200 } }"
    >
      <div 
        class="bg-white/95 app-dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 app-dark:border-gray-700/50"
        v-motion
        :initial="{ scale: 0.9, y: 50 }"
        :enter="{ scale: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
        :leave="{ scale: 0.9, y: 50, transition: { duration: 200, ease: 'easeIn' } }"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold">⚡ Ejecutar Inferencia</h2>
              <p class="text-purple-100 mt-1">{{ model.name }}</p>
            </div>
            <button
              @click="handleClose"
              :disabled="isInferring"
              class="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors disabled:opacity-50"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- License Status Banner -->
        <div v-if="isConnected && !checkingLicense" class="mx-6 mt-6 -mb-2">
          <div v-if="hasLicense === true" class="bg-green-50 app-dark:bg-green-900/20 border border-green-200 app-dark:border-green-800 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-600 app-dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span class="text-green-800 app-dark:text-green-300 font-medium">✅ Licencia activa - Puedes ejecutar inferencias</span>
            </div>
          </div>
          <div v-else-if="hasLicense === false" class="bg-amber-50 app-dark:bg-amber-900/20 border border-amber-200 app-dark:border-amber-800 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-amber-600 app-dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div>
                <h4 class="font-semibold text-amber-800 app-dark:text-amber-400">⚠️ Sin licencia activa</h4>
                <p class="text-amber-700 app-dark:text-amber-300 text-sm mt-1">Necesitas comprar una licencia para usar este modelo. Ve a los detalles del modelo para adquirir una.</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!isConnected" class="mx-6 mt-6 -mb-2">
          <div class="bg-blue-50 app-dark:bg-blue-900/20 border border-blue-200 app-dark:border-blue-800 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-blue-600 app-dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-blue-800 app-dark:text-blue-300 font-medium">💼 Conecta tu wallet para verificar tu licencia</span>
            </div>
          </div>
        </div>
        <div v-else-if="checkingLicense" class="mx-6 mt-6 -mb-2">
          <div class="bg-gray-50 app-dark:bg-gray-800 border border-gray-200 app-dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-gray-300 app-dark:border-gray-600 border-t-purple-600 rounded-full animate-spin"></div>
              <span class="text-gray-600 app-dark:text-gray-400 font-medium">🔍 Verificando licencia...</span>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Input Type Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-3">
              Tipo de Entrada
            </label>
            <div class="grid grid-cols-2 gap-4">
              <button
                @click="inputType = 'image'"
                :disabled="isInferring"
                :class="[
                  'py-3 px-4 rounded-lg font-medium transition-all',
                  inputType === 'image'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 app-dark:bg-gray-800 text-gray-700 app-dark:text-gray-300 hover:bg-gray-200 app-dark:hover:bg-gray-700'
                ]"
              >
                <span class="text-2xl mb-1 block">📸</span>
                Imagen
              </button>
              <button
                @click="inputType = 'text'"
                :disabled="isInferring"
                :class="[
                  'py-3 px-4 rounded-lg font-medium transition-all',
                  inputType === 'text'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 app-dark:bg-gray-800 text-gray-700 app-dark:text-gray-300 hover:bg-gray-200 app-dark:hover:bg-gray-700'
                ]"
              >
                <span class="text-2xl mb-1 block">📝</span>
                Texto
              </button>
            </div>
          </div>

          <!-- Image Input -->
          <div v-if="inputType === 'image'" class="space-y-4">
            <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300">
              Seleccionar Imagen
            </label>
            <div class="border-2 border-dashed border-gray-300 app-dark:border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                @change="handleImageSelect"
                :disabled="isInferring"
                class="hidden"
                id="image-upload"
              />
              <label
                for="image-upload"
                :class="['cursor-pointer block', { 'opacity-50 cursor-not-allowed': isInferring }]"
              >
                <div v-if="imagePreview" class="mb-4">
                  <img :src="imagePreview" alt="Preview" class="max-h-64 mx-auto rounded-lg shadow-lg" />
                </div>
                <div v-else class="text-gray-500 app-dark:text-gray-400">
                  <svg class="w-16 h-16 mx-auto mb-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p class="font-medium">Click para seleccionar una imagen</p>
                  <p class="text-sm mt-1">PNG, JPG, GIF hasta 10MB</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Text Input -->
          <div v-if="inputType === 'text'" class="space-y-4">
            <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300">
              Texto de Entrada
            </label>
            <textarea
              v-model="textInput"
              :disabled="isInferring"
              rows="6"
              class="w-full px-4 py-3 border border-gray-300 app-dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 app-dark:bg-gray-800 app-dark:text-white disabled:opacity-50"
              placeholder="Ingresa el texto para procesar..."
            ></textarea>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 app-dark:bg-red-900/20 border border-red-200 app-dark:border-red-800 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-600 app-dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <h4 class="font-semibold text-red-800 app-dark:text-red-400">Error</h4>
                <p class="text-red-700 app-dark:text-red-300 text-sm mt-1">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Result -->
          <div v-if="result && !isInferring" class="bg-gradient-to-br from-green-50 to-emerald-50 app-dark:from-green-900/20 app-dark:to-emerald-900/20 border border-green-200 app-dark:border-green-800 rounded-lg p-6">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-6 h-6 text-green-600 app-dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h3 class="font-bold text-green-800 app-dark:text-green-400 text-lg">Resultado de Inferencia</h3>
            </div>
            
            <div class="bg-white app-dark:bg-gray-800 p-4 rounded-lg mb-4 max-h-96 overflow-y-auto">
              <pre class="text-sm text-gray-800 app-dark:text-gray-200 whitespace-pre-wrap">{{ JSON.stringify(result.predictions, null, 2) }}</pre>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-600 app-dark:text-gray-400">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Tiempo: {{ result.processingTime }}ms
              </span>
              <span v-if="result.metadata?.modelName" class="font-medium">
                {{ result.metadata.modelName }}
              </span>
            </div>
          </div>

          <!-- Processing Indicator -->
          <div v-if="isInferring" class="bg-blue-50 app-dark:bg-blue-900/20 border border-blue-200 app-dark:border-blue-800 rounded-lg p-6">
            <div class="flex items-center gap-4">
              <div class="relative">
                <div class="w-12 h-12 border-4 border-blue-200 app-dark:border-blue-900 rounded-full animate-spin border-t-blue-600"></div>
              </div>
              <div>
                <h4 class="font-semibold text-blue-800 app-dark:text-blue-400">Procesando...</h4>
                <p class="text-blue-600 app-dark:text-blue-300 text-sm mt-1">El modelo está analizando tu entrada</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 app-dark:bg-gray-800 px-6 py-4 rounded-b-xl flex justify-end gap-3 border-t border-gray-200 app-dark:border-gray-700">
          <button
            @click="handleClose"
            :disabled="isInferring"
            class="px-6 py-2.5 border border-gray-300 app-dark:border-gray-600 text-gray-700 app-dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 app-dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {{ result ? 'Cerrar' : 'Cancelar' }}
          </button>
          <button
            v-if="!result"
            @click="handleSubmit"
            :disabled="!canSubmit || isInferring || !isConnected || hasLicense === false"
            :title="!isConnected ? 'Conecta tu wallet primero' : hasLicense === false ? 'Necesitas una licencia activa' : ''"
            class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="isInferring" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <svg v-else-if="!isConnected" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <svg v-else-if="hasLicense === false" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            {{ 
              isInferring ? 'Procesando...' : 
              !isConnected ? 'Conecta Wallet' :
              hasLicense === false ? 'Sin Licencia' :
              'Ejecutar Inferencia' 
            }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
