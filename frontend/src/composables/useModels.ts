/**
 * Composable: useModels
 * 
 * RESPONSABILIDAD ÚNICA: Gestión de estado y lógica de carga de modelos
 * 
 * Proporciona:
 * - Carga de modelos desde blockchain e IPFS
 * - Transformación y enriquecimiento de datos
 * - Filtrado de modelos
 * - Estado de carga
 * - Modelo seleccionado
 */

import { ref, computed, type Ref } from 'vue'
import { getAllModelIds, getModelById } from './blockchain'
import { fetchMetadata } from './ipfs'

export interface Model {
  id: number
  author: string
  owner: string
  name: string
  description: string
  price: string
  priceRaw: string | null
  category: string
  ipfsHash: string
  tokenURI: string
  forSale: boolean
  salePriceRaw: string | null
  salePriceWei: string | null
}

export function useModels(userAddress?: Ref<string | null>) {
  // ========================================
  // ESTADO
  // ========================================
  
  const models = ref<Model[]>([])
  const loadingModels = ref(false)
  const selectedModelId = ref<number | null>(null)

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================
  
  /**
   * Obtiene el modelo actualmente seleccionado
   */
  const selectedModel = computed(() => {
    if (!selectedModelId.value) return null
    return models.value.find(m => m.id === selectedModelId.value) || null
  })

  /**
   * Filtra modelos excluyendo los del usuario conectado
   * Solo muestra modelos de otros usuarios en el marketplace
   */
  const filteredModels = computed(() => {
    if (!userAddress?.value) return models.value
    
    return models.value.filter(model => {
      const ownerAddr = model.author || model.owner
      if (!ownerAddr) return true
      
      try {
        // Excluir modelos donde el usuario conectado es el propietario
        return ownerAddr.toLowerCase() !== userAddress.value!.toLowerCase()
      } catch (e) {
        return true // En caso de error, mostrar el modelo
      }
    })
  })

  // ========================================
  // FUNCIONES
  // ========================================
  
  /**
   * Transforma un modelo raw de blockchain + metadata IPFS
   * en un objeto Model enriquecido con datos legibles
   */
  async function enrichModelWithMetadata(rawModel: any): Promise<Model | null> {
    if (!rawModel) return null
    
    let metadata: any = null
    try {
      metadata = await fetchMetadata(rawModel.id)
    } catch (err) {
      console.debug('No se pudo obtener metadata para', rawModel.id, err)
    }

    // Preferencias: metadata.name > onchain.name
    const displayName = metadata?.name ?? rawModel.name ?? `Model #${rawModel.id}`
    const description = metadata?.description ?? 'Sin descripción'
    const category = metadata?.category ?? 'General'
    
    // Precio legible (ya convertido en getModelById a string en AVAX si existe)
    const priceReadable = (
      rawModel.forSale 
        ? (rawModel.salePrice ?? rawModel.salePriceWei) 
        : (rawModel.basePrice ?? rawModel.basePriceWei)
    ) ?? null
    
    const priceText = priceReadable ? `${priceReadable} AVAX` : 'No disponible'

    return {
      id: rawModel.id,
      author: rawModel.author,
      owner: rawModel.owner,
      name: displayName,
      description,
      price: priceText,
      priceRaw: priceReadable,
      category,
      ipfsHash: rawModel.ipfsHash,
      tokenURI: rawModel.tokenURI,
      forSale: Boolean(rawModel.forSale),
      salePriceRaw: rawModel.salePrice ?? rawModel.salePriceWei ?? null,
      salePriceWei: rawModel.salePriceWei ?? null,
    }
  }

  /**
   * Carga todos los modelos desde la blockchain
   * Enriquece cada modelo con metadata de IPFS en paralelo
   */
  async function loadModels() {
    loadingModels.value = true
    
    try {
      // 1. Obtener IDs de todos los modelos
      const ids = await getAllModelIds()
      if (!ids || ids.length === 0) {
        models.value = []
        return
      }

      // 2. Cargar datos on-chain en paralelo
      const rawModels = await Promise.all(
        ids.map(async (id: any) => {
          try {
            return await getModelById(id)
          } catch (err) {
            console.warn('No se pudo leer model on-chain', id, err)
            return null
          }
        })
      )

      console.log(rawModels);
      

      // 3. Enriquecer con metadata IPFS en paralelo
      const enriched = await Promise.all(
        rawModels.map(m => enrichModelWithMetadata(m))
      )

      // 4. Filtrar nulos y asignar
      models.value = enriched.filter(Boolean) as Model[]
      
      console.log('Modelos cargados:', models.value.length)
    } catch (err) {
      console.error('Error cargando modelos desde la blockchain:', err)
      models.value = []
    } finally {
      loadingModels.value = false
    }
  }

  /**
   * Selecciona un modelo por ID
   */
  function selectModel(modelId: number | null) {
    selectedModelId.value = modelId
  }

  /**
   * Actualiza un modelo específico en el estado local
   * Útil después de operaciones blockchain (compra, venta, etc.)
   */
  function updateModel(modelId: number, updates: Partial<Model>) {
    const index = models.value.findIndex(m => m.id === modelId)
    if (index !== -1) {
      models.value[index] = { ...models.value[index], ...updates } as Model
    }
  }

  /**
   * Agrega un nuevo modelo al estado local
   * Útil después de subir un modelo
   */
  function addModel(model: Model) {
    models.value.push(model)
  }

  // ========================================
  // RETURN
  // ========================================
  
  return {
    // Estado
    models,
    loadingModels,
    selectedModelId,
    
    // Computed
    selectedModel,
    filteredModels,
    
    // Métodos
    loadModels,
    selectModel,
    updateModel,
    addModel,
  }
}
