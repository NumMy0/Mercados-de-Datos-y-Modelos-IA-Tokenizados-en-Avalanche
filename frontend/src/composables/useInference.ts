import { ref } from 'vue'
import { hasActiveLicense } from './blockchain'

const INFERENCE_API_URL = import.meta.env.VITE_INFERENCE_API_URL || 'http://localhost:3001/api'

export interface InferenceRequest {
  modelId: string
  ipfsHash: string
  input: any
  preprocessingConfig?: {
    imageSize?: [number, number]
    normalize?: boolean
    grayscale?: boolean
  }
}

export interface InferenceResult {
  predictions: any
  processingTime: number
  metadata?: {
    modelName?: string
    modelVersion?: string
  }
}

export function useInference() {
  const isInferring = ref(false)
  const error = ref<string | null>(null)
  const result = ref<InferenceResult | null>(null)

  /**
   * Ejecutar inferencia en un modelo
   */
  const runInference = async (request: InferenceRequest, userAddress?: string): Promise<InferenceResult | null> => {
    isInferring.value = true
    error.value = null
    result.value = null

    try {
      // 🔐 Verificar licencia activa antes de ejecutar inferencia
      if (userAddress) {
        console.log(`🔍 Verificando licencia para modelo ${request.modelId} y usuario ${userAddress}`)
        
        const hasLicense = await hasActiveLicense(request.modelId, userAddress)
        
        if (!hasLicense) {
          throw new Error('❌ No tienes una licencia activa para usar este modelo. Por favor, compra una licencia primero.')
        }
        
        console.log('✅ Licencia verificada correctamente')
      } else {
        console.warn('⚠️ No se proporcionó dirección de usuario. Se omitirá la verificación de licencia.')
      }

      // Determinar el formato de los datos de entrada
      let inputFormat = 'raw_text'
      let inputContent = request.input.data

      if (request.input.type === 'image') {
        if (request.input.data.startsWith('data:image/jpeg')) {
          inputFormat = 'base64_jpeg'
          inputContent = request.input.data.split(',')[1] // Remover el prefijo data:image/jpeg;base64,
      } else if (request.input.data.startsWith('data:image/png')) {
        inputFormat = 'base64_png'
        inputContent = request.input.data.split(',')[1] // Remover el prefijo data:image/png;base64,
        }
      }

      // Construir payload según el formato esperado por el servidor
      const payload = {
        model_id: `model_${request.modelId}_cache`, // Usar formato de cache key
        execution_mode: "sync",
        input_data: {
          format: inputFormat,
          content: inputContent
        },
        options: {
          top_k: 5,
          threshold: 0.5,
          // Incluir configuración de preprocesamiento si existe
          ...(request.preprocessingConfig && {
            image_size: request.preprocessingConfig.imageSize,
            normalize: request.preprocessingConfig.normalize,
            grayscale: request.preprocessingConfig.grayscale
          })
        }
      }

      console.log('🚀 Enviando payload de inferencia:', payload)

      const response = await fetch(`${INFERENCE_API_URL}/inference/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      result.value = data
      console.log('✅ Resultado de inferencia:', data)
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al ejecutar inferencia'
      console.error('❌ Error en inferencia:', err)
      return null
    } finally {
      isInferring.value = false
    }
  }

  /**
   * Cargar modelo desde IPFS
   */
  const loadModelFromIpfs = async (ipfsHash: string): Promise<any> => {
    try {
      const response = await fetch(`${INFERENCE_API_URL}/models/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ipfsHash }),
      })

      if (!response.ok) {
        throw new Error('Error al cargar modelo desde IPFS')
      }

      return await response.json()
    } catch (err: any) {
      error.value = err.message
      console.error('Error cargando modelo:', err)
      return null
    }
  }

  /**
   * Obtener metadatos de un modelo
   */
  const getModelMetadata = async (ipfsHash: string): Promise<any> => {
    try {
      const response = await fetch(`${INFERENCE_API_URL}/models/metadata/${ipfsHash}`)

      if (!response.ok) {
        throw new Error('Error al obtener metadata')
      }

      return await response.json()
    } catch (err: any) {
      error.value = err.message
      console.error('Error obteniendo metadata:', err)
      return null
    }
  }

  /**
   * Verificar salud del servicio de inferencia
   */
  const checkHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${INFERENCE_API_URL.replace('/api', '')}/health`)
      return response.ok
    } catch (err) {
      console.error('Inference engine no disponible:', err)
      return false
    }
  }

  return {
    // State
    isInferring,
    error,
    result,

    // Methods
    runInference,
    loadModelFromIpfs,
    getModelMetadata,
    checkHealth,
  }
}
