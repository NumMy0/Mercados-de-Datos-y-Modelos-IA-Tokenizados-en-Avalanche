import { ref, computed } from 'vue'
import { uploadToIPFS } from './ipfs'
import { useNotifications } from './useNotifications'

interface InferenceConfig {
  model_type: string
  input_shape: number[]
  preprocessing: string
  color_format?: string
  output_config: {
    type: string
    topk?: number
  }
}

interface ModelMetadata {
  model_id: string
  version: string
  model_cid: string
  model_hash: string
  labels_cid: string
  description: string
  inference_config: InferenceConfig
  // Campos adicionales opcionales
  name?: string
  author?: string
  license?: string
  created_at?: string
  size_bytes?: number
  framework?: string
  opset_version?: string
}

interface FormData {
  name: string
  description: string
  version: string
  author?: string
  license?: string
  framework?: string
  opset_version?: string
}

export function useMetadata() {
  const { addNotification } = useNotifications()
  
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  /**
   * Calcula el hash SHA-256 de un archivo
   */
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return `sha256:${hashHex}`
  }

  /**
   * Genera un model_id único basado en el nombre y timestamp
   */
  const generateModelId = (name: string): string => {
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    
    const timestamp = Date.now().toString(36)
    return `${cleanName}_${timestamp}`
  }

  /**
   * Genera metadatos completos combinando formulario, archivos e inferencia config
   */
  const generateMetadata = async (
    formData: FormData,
    modelFile: File,
    labelsFile: File | null,
    inferenceConfig: InferenceConfig
  ): Promise<ModelMetadata> => {
    try {
      isGenerating.value = true
      error.value = null

      console.log('🔄 Generando metadatos completos...')

      // 1. Generar model_id único
      const modelId = generateModelId(formData.name)
      console.log(`📝 Model ID generado: ${modelId}`)

      // 2. Subir archivo del modelo a IPFS y obtener CID
      console.log('📤 Subiendo modelo a IPFS...')
      const modelCid = await uploadToIPFS(modelFile)
      console.log(`✅ Modelo subido con CID: ${modelCid}`)

      // 3. Calcular hash del modelo
      console.log('🔒 Calculando hash del modelo...')
      const modelHash = await calculateFileHash(modelFile)
      console.log(`✅ Hash calculado: ${modelHash}`)

      // 4. Subir labels si existe
      let labelsCid = ''
      if (labelsFile) {
        console.log('📤 Subiendo archivo de labels a IPFS...')
        labelsCid = await uploadToIPFS(labelsFile)
        console.log(`✅ Labels subidas con CID: ${labelsCid}`)
      }

      // 5. Construir metadatos completos
      const metadata: ModelMetadata = {
        model_id: modelId,
        version: formData.version,
        model_cid: modelCid,
        model_hash: modelHash,
        labels_cid: labelsCid,
        description: formData.description,
        inference_config: inferenceConfig,
        // Campos adicionales del formulario
        name: formData.name,
        author: formData.author || 'Anónimo',
        license: formData.license || 'MIT',
        created_at: new Date().toISOString(),
        size_bytes: modelFile.size,
        framework: formData.framework || 'PyTorch/ONNX',
        opset_version: formData.opset_version || '11'
      }

      console.log('📋 Metadatos generados:', metadata)
      return metadata

    } catch (err: any) {
      const errorMessage = `Error generando metadatos: ${err.message}`
      console.error('❌', errorMessage, err)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Sube metadatos completos a IPFS como archivo JSON
   */
  const uploadMetadata = async (metadata: ModelMetadata): Promise<string> => {
    try {
      console.log('📤 Subiendo metadatos a IPFS...')
      
      // Convertir metadatos a JSON con formato bonito
      const metadataJson = JSON.stringify(metadata, null, 2)
      
      // Crear blob con el JSON
      const metadataBlob = new Blob([metadataJson], { 
        type: 'application/json' 
      })
      
      // Crear archivo con nombre descriptivo
      const metadataFile = new File(
        [metadataBlob], 
        `${metadata.model_id}_metadata.json`, 
        { type: 'application/json' }
      )
      
      // Subir a IPFS
      const metadataCid = await uploadToIPFS(metadataFile)
      
      console.log(`✅ Metadatos subidos con CID: ${metadataCid}`)
      
      addNotification({
        type: 'success',
        title: 'Metadatos subidos',
        message: `Metadatos subidos exitosamente a IPFS: ${metadataCid}`
      })
      
      return metadataCid
      
    } catch (err: any) {
      const errorMessage = `Error subiendo metadatos: ${err.message}`
      console.error('❌', errorMessage, err)
      error.value = errorMessage
      
      addNotification({
        type: 'error',
        title: 'Error subiendo metadatos',
        message: errorMessage
      })
      
      throw new Error(errorMessage)
    }
  }

  /**
   * Proceso completo: genera y sube metadatos
   */
  const processAndUploadMetadata = async (
    formData: FormData,
    modelFile: File,
    labelsFile: File | null,
    inferenceConfig: InferenceConfig
  ): Promise<{ metadata: ModelMetadata; metadataCid: string }> => {
    try {
      // 1. Generar metadatos completos
      const metadata = await generateMetadata(
        formData, 
        modelFile, 
        labelsFile, 
        inferenceConfig
      )

      // 2. Subir metadatos a IPFS
      const metadataCid = await uploadMetadata(metadata)

      return { metadata, metadataCid }

    } catch (err: any) {
      console.error('❌ Error en proceso completo de metadatos:', err)
      throw err
    }
  }

  /**
   * Valida configuración de inferencia
   */
  const validateInferenceConfig = (config: any): boolean => {
    try {
      console.log('🔍 Validando inference_config:', config)
      
      // Verificar que es un objeto
      if (!config || typeof config !== 'object') {
        error.value = 'La configuración debe ser un objeto JSON válido'
        return false
      }

      const requiredFields = ['model_type', 'input_shape', 'preprocessing']
      
      for (const field of requiredFields) {
        if (!(field in config) || config[field] === null || config[field] === undefined || config[field] === '') {
          error.value = `Campo requerido faltante en inference_config: ${field}`
          console.error(`❌ Campo faltante: ${field}`)
          return false
        }
      }

      // Validar input_shape
      if (!Array.isArray(config.input_shape)) {
        error.value = 'input_shape debe ser un array'
        return false
      }

      if (config.input_shape.length < 3 || config.input_shape.length > 4) {
        error.value = 'input_shape debe tener 3 o 4 elementos (ej: [3, 224, 224] o [1, 3, 224, 224])'
        return false
      }

      // Validar que todos los elementos sean números
      if (!config.input_shape.every((dim: any) => typeof dim === 'number' && dim > 0)) {
        error.value = 'Todos los elementos de input_shape deben ser números positivos'
        return false
      }

      // Validar model_type
      if (typeof config.model_type !== 'string') {
        error.value = 'model_type debe ser una cadena de texto'
        return false
      }

      // Validar preprocessing
      if (typeof config.preprocessing !== 'string') {
        error.value = 'preprocessing debe ser una cadena de texto'
        return false
      }

      console.log('✅ Validación exitosa de inference_config')
      return true
      
    } catch (err: any) {
      error.value = `Error validando configuración: ${err.message}`
      console.error('❌ Error en validación:', err)
      return false
    }
  }

  return {
    // Estado
    isGenerating: computed(() => isGenerating.value),
    error: computed(() => error.value),
    
    // Métodos
    generateModelId,
    calculateFileHash,
    generateMetadata,
    uploadMetadata,
    processAndUploadMetadata,
    validateInferenceConfig,
    
    // Helpers
    clearError: () => { error.value = null }
  }
}