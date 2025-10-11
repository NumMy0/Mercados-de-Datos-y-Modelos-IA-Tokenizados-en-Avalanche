import { ref } from 'vue'
import { uploadToIPFS } from './ipfs'

export interface LabelsData {
  file: File | null
  content: string
  preview: string
  cid: string | null
  isValid: boolean
}

export function useLabelsUpload() {
  const labelsData = ref<LabelsData>({
    file: null,
    content: '',
    preview: '',
    cid: null,
    isValid: false
  })

  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  /**
   * Procesar archivo de labels
   */
  const processLabelsFile = async (file: File): Promise<boolean> => {
    try {
      error.value = null
      isProcessing.value = true

      // Validar tipo de archivo
      const validExtensions = ['.json', '.txt', '.csv']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!validExtensions.includes(fileExtension)) {
        error.value = 'Formato de archivo no válido. Use JSON, TXT o CSV.'
        return false
      }

      // Leer contenido del archivo
      const content = await readFileContent(file)
      
      // Procesar según el tipo
      const processedLabels = await processLabelsContent(content, fileExtension)
      
      // Actualizar estado
      labelsData.value = {
        file,
        content: JSON.stringify(processedLabels),
        preview: generatePreview(processedLabels),
        cid: null,
        isValid: true
      }

      return true
    } catch (err: any) {
      error.value = err.message || 'Error procesando archivo de labels'
      console.error('❌ Error procesando labels:', err)
      return false
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Subir labels a IPFS
   */
  const uploadLabelsToIPFS = async (): Promise<string | null> => {
    if (!labelsData.value.isValid || !labelsData.value.content) {
      return null
    }

    try {
      isProcessing.value = true
      
      // Crear blob con el contenido JSON
      const labelsBlob = new Blob([labelsData.value.content], { 
        type: 'application/json' 
      })
      
      // Subir a IPFS
      const cid = await uploadToIPFS(labelsBlob)
      
      // Actualizar estado
      labelsData.value.cid = cid
      
      console.log('✅ Labels subidas a IPFS:', cid)
      return cid
    } catch (err: any) {
      error.value = err.message || 'Error subiendo labels a IPFS'
      console.error('❌ Error subiendo labels:', err)
      return null
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Generar metadatos de labels para incluir en el modelo
   */
  const generateLabelsMetadata = () => {
    if (!labelsData.value.isValid) {
      return {}
    }

    const parsedLabels = JSON.parse(labelsData.value.content)
    
    return {
      labels_cid: labelsData.value.cid,
      labels_preview: Array.isArray(parsedLabels) 
        ? parsedLabels.slice(0, 10) 
        : Object.keys(parsedLabels).slice(0, 10),
      labels_count: Array.isArray(parsedLabels) 
        ? parsedLabels.length 
        : Object.keys(parsedLabels).length
    }
  }

  /**
   * Resetear estado
   */
  const resetLabels = () => {
    labelsData.value = {
      file: null,
      content: '',
      preview: '',
      cid: null,
      isValid: false
    }
    error.value = null
    isProcessing.value = false
  }

  /**
   * Leer contenido del archivo
   */
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.onerror = () => {
        reject(new Error('Error leyendo archivo'))
      }
      reader.readAsText(file)
    })
  }

  /**
   * Procesar contenido según el tipo de archivo
   */
  const processLabelsContent = async (content: string, extension: string): Promise<string[]> => {
    try {
      switch (extension) {
        case '.json':
          const jsonData = JSON.parse(content)
          if (Array.isArray(jsonData)) {
            return jsonData.map(String)
          } else if (typeof jsonData === 'object') {
            return Object.keys(jsonData)
          }
          throw new Error('JSON debe ser un array o objeto')

        case '.txt':
          return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)

        case '.csv':
          return content
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)

        default:
          throw new Error('Tipo de archivo no soportado')
      }
    } catch (err: any) {
      throw new Error(`Error procesando ${extension}: ${err.message}`)
    }
  }

  /**
   * Generar preview de las labels
   */
  const generatePreview = (labels: string[]): string => {
    if (labels.length === 0) return 'Sin labels'
    
    const preview = labels.slice(0, 5).join(', ')
    const remaining = labels.length - 5
    
    return remaining > 0 
      ? `${preview} y ${remaining} más...`
      : preview
  }

  return {
    // Estado
    labelsData,
    isProcessing,
    error,

    // Métodos
    processLabelsFile,
    uploadLabelsToIPFS,
    generateLabelsMetadata,
    resetLabels
  }
}