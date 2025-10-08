<template>
  <div class="p-6">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground">
          Bienvenido al mercado de datos y modelos IA tokenizados en Avalanche
        </p>
      </div>
      
      <!-- Botón para subir modelo -->
      <button 
        @click="showUploadModal = true"
        class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm"
      >
        📤 Subir Modelo
      </button>
    </div>
    
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="text-sm font-medium tracking-tight">Total de Modelos</h3>
        </div>
        <div class="text-2xl font-bold">{{ totalModels }}</div>
        <p class="text-xs text-muted-foreground">
          +20.1% desde el mes pasado
        </p>
      </div>
      
      <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="text-sm font-medium tracking-tight">Transacciones</h3>
        </div>
        <div class="text-2xl font-bold">+2,350</div>
        <p class="text-xs text-muted-foreground">
          +180.1% desde el mes pasado
        </p>
      </div>
      
      <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="text-sm font-medium tracking-tight">Volumen</h3>
        </div>
        <div class="text-2xl font-bold">+12,234</div>
        <p class="text-xs text-muted-foreground">
          +19% desde el mes pasado
        </p>
      </div>
      
      <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="text-sm font-medium tracking-tight">Usuarios Activos</h3>
        </div>
        <div class="text-2xl font-bold">+573</div>
        <p class="text-xs text-muted-foreground">
          +201 desde la semana pasada
        </p>
      </div>
    </div>

    <!-- Modal para subir modelo -->
    <div 
      v-if="showUploadModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModalOnOverlay"
    >
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">📤 Subir Nuevo Modelo</h2>
          <button 
            @click="showUploadModal = false"
            class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form @submit.prevent="uploadModel" class="space-y-6">
          <!-- Nombre del modelo -->
          <div>
            <label for="modelName" class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Modelo *
            </label>
            <input
              id="modelName"
              v-model="modelForm.name"
              type="text"
              required
              placeholder="Ej: GPT-4 Custom, Análisis Predictivo..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Descripción del modelo -->
          <div>
            <label for="modelDescription" class="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="modelDescription"
              v-model="modelForm.description"
              rows="3"
              placeholder="Describe las capacidades y uso del modelo..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            ></textarea>
          </div>

          <!-- Archivo del modelo -->
          <div>
            <label for="modelFile" class="block text-sm font-medium text-gray-700 mb-2">
              Archivo del Modelo *
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="modelFile"
                ref="fileInput"
                type="file"
                @change="handleFileUpload"
                accept=".pkl,.h5,.onnx,.pt,.pth,.pb,.json,.zip"
                class="hidden"
                required
              />
              <div v-if="!selectedFile">
                <p class="text-gray-500 mb-2">📁 Arrastra tu archivo aquí o</p>
                <button
                  type="button"
                  @click="$refs.fileInput.click()"
                  class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  Seleccionar Archivo
                </button>
                <p class="text-xs text-gray-400 mt-2">
                  Formatos soportados: .pkl, .h5, .onnx, .pt, .json, .zip (Max: 100MB)
                </p>
              </div>
              <div v-else class="text-green-600">
                <p class="font-medium">✅ {{ selectedFile.name }}</p>
                <p class="text-sm">{{ formatFileSize(selectedFile.size) }}</p>
                <button
                  type="button"
                  @click="removeFile"
                  class="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  Remover archivo
                </button>
        </div>
      </div>
    </div>

    <!-- Sección de modelos subidos -->
    <div v-if="uploadedModels.length > 0" class="mt-8">
      <h2 class="text-2xl font-bold mb-4">🤖 Mis Modelos Subidos</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="model in uploadedModels" 
          :key="model.id"
          class="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-gray-900 truncate">{{ model.name }}</h3>
            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{{ model.status }}</span>
          </div>
          
          <p v-if="model.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
            {{ model.description }}
          </p>
          
          <div class="space-y-1 text-xs text-gray-500">
            <div class="flex justify-between">
              <span>Precio:</span>
              <span class="font-medium">{{ model.price }} AVAX</span>
            </div>
            <div class="flex justify-between">
              <span>Archivo:</span>
              <span>{{ model.fileName }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tamaño:</span>
              <span>{{ formatFileSize(model.fileSize) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Subido:</span>
              <span>{{ formatDate(model.uploadDate) }}</span>
            </div>
          </div>
          
          <div class="mt-3 flex gap-2">
            <button 
              @click="editModel(model)"
              class="flex-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            >
              Editar
            </button>
            <button 
              @click="deleteModel(model.id)"
              class="flex-1 px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>          <!-- Precio base -->
          <div>
            <label for="modelPrice" class="block text-sm font-medium text-gray-700 mb-2">
              Precio Base (AVAX) *
            </label>
            <div class="relative">
              <input
                id="modelPrice"
                v-model="modelForm.price"
                type="number"
                step="0.001"
                min="0"
                required
                placeholder="0.1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <span class="absolute right-3 top-2 text-gray-500 text-sm">AVAX</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Precio que los usuarios pagarán para acceder al modelo
            </p>
          </div>

          <!-- Categoría -->
          <div>
            <label for="modelCategory" class="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              id="modelCategory"
              v-model="modelForm.category"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona una categoría</option>
              <option value="nlp">Procesamiento de Lenguaje Natural</option>
              <option value="vision">Visión por Computadora</option>
              <option value="prediction">Análisis Predictivo</option>
              <option value="finance">Finanzas</option>
              <option value="healthcare">Salud</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <!-- Botones -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showUploadModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isUploading"
              :class="isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'"
              class="flex-1 px-4 py-2 text-white rounded-md transition-colors font-medium"
            >
              {{ isUploading ? 'Subiendo...' : 'Subir Modelo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { uploadModelBlockchain , uploadToIPFS } from '@/lib/blockchain'
import { parseEther } from 'ethers'

// Estados reactivos
const showUploadModal = ref(false)
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const uploadedModels = ref<any[]>([])

// Formulario del modelo
const modelForm = ref({
  name: '',
  description: '',
  price: '',
  category: ''
})

// Datos del dashboard
const totalModels = ref(3) // Modelos actuales + nuevos subidos

// Cargar modelos subidos al iniciar
onMounted(() => {
  loadUploadedModels()
})

// Cargar modelos subidos desde localStorage
const loadUploadedModels = () => {
  const saved = localStorage.getItem('uploadedModels')
  if (saved) {
    uploadedModels.value = JSON.parse(saved)
    totalModels.value = 3 + uploadedModels.value.length
  }
}

// Cerrar modal al hacer clic en el overlay
const closeModalOnOverlay = (event: Event) => {
  if (event.target === event.currentTarget) {
    showUploadModal.value = false
  }
}

// Manejar selección de archivo
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    
    // Validar tamaño del archivo (100MB máximo)
    if (file.size > 100 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 100MB.')
      return
    }
    
    selectedFile.value = file
  }
}

// Remover archivo seleccionado
const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Formatear tamaño del archivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Formatear fecha
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Editar modelo
const editModel = (model: any) => {
  // Llenar el formulario con los datos del modelo
  modelForm.value = {
    name: model.name,
    description: model.description,
    price: model.price,
    category: model.category
  }
  
  // Mostrar modal
  showUploadModal.value = true
  
  // Eliminar el modelo actual (será reemplazado)
  deleteModel(model.id, false)
}

// Eliminar modelo
const deleteModel = (modelId: string, showConfirm: boolean = true) => {
  if (showConfirm) {
    const confirmed = confirm('¿Estás seguro de que quieres eliminar este modelo?')
    if (!confirmed) return
  }
  
  uploadedModels.value = uploadedModels.value.filter(model => model.id !== modelId)
  localStorage.setItem('uploadedModels', JSON.stringify(uploadedModels.value))
  totalModels.value = 3 + uploadedModels.value.length
  
  if (showConfirm) {
    alert('✅ Modelo eliminado exitosamente')
  }
}

// Subir modelo
const uploadModel = async () => {
  try {
    isUploading.value = true

    // Validaciones
    if (!modelForm.value.name.trim()) {
      alert('Por favor ingresa un nombre para el modelo')
      return
    }
    
    if (!selectedFile.value) {
      alert('Por favor selecciona un archivo para subir')
      return
    }
    
    if (!modelForm.value.price || parseFloat(modelForm.value.price) <= 0) {
      alert('Por favor ingresa un precio válido')
      return
    }

    const ipfsHashModel = await uploadToIPFS(selectedFile.value);
    const ipfsHashModelMetaData = {};

    // convertir precio AVAX (por ejemplo "0.001") a wei (BigInt)
    const priceWei = parseEther(String(modelForm.value.price)) // devuelve bigint

    const newModel = {
      name: modelForm.value.name,
      description: modelForm.value.description || '',
      model: ipfsHashModel,
      priceWei: priceWei.toString(),         // valor que se enviará al contrato
      modelMetadata: ipfsHashModelMetaData,
    }

    // pasar price en wei (string o bigint) al contrato
    await uploadModelBlockchain(
      newModel.name,
      newModel.model,
      newModel.priceWei,                // ahora en wei, no en AVAX decimal
      JSON.stringify(newModel.modelMetadata)
    );

    
    // Agregar a la lista de modelos subidos
    uploadedModels.value.push(newModel)
    localStorage.setItem('uploadedModels', JSON.stringify(uploadedModels.value))

    // Actualizar contador de modelos
    totalModels.value = 3 + uploadedModels.value.length

    // Limpiar formulario
    modelForm.value = {
      name: '',
      description: '',
      price: '',
      category: ''
    }
    removeFile()

    // Cerrar modal
    showUploadModal.value = false

    alert(`✅ Modelo "${newModel.name}" subido exitosamente!\n\nPrecio: ${newModel.price} AVAX\nArchivo: ${newModel.fileName}`)

  } catch (error) {
    console.error('Error subiendo modelo:', error)
    alert('❌ Error al subir el modelo. Inténtalo de nuevo.')
  } finally {
    isUploading.value = false
  }
}
</script>