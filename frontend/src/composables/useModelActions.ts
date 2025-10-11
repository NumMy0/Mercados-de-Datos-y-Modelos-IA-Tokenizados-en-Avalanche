/**
 * Composable: useModelActions
 * 
 * RESPONSABILIDAD ÚNICA: Operaciones de blockchain sobre modelos
 * 
 * Proporciona:
 * - Comprar modelo (NFT transfer)
 * - Poner modelo en venta
 * - Cancelar venta
 * - Transferir modelo
 * - Crear planes de licencia
 * - Activar/desactivar planes
 * - Comprar licencias
 * - Conversión de precios (AVAX ↔ Wei)
 * - Manejo centralizado de errores
 */

import { ethers } from 'ethers'
import { 
  buyModel as buyModelBlockchain,
  setModelForSale as setForSaleBlockchain,
  cancelSale as cancelSaleBlockchain,
  transferModel as transferModelBlockchain,
  createLicensePlan as createLicensePlanBlockchain,
  setPlanActive as setPlanActiveBlockchain,
  buyLicense as buyLicenseBlockchain
} from './blockchain'
import type { Model } from './useModels'

export function useModelActions() {
  // ========================================
  // CONVERSIÓN DE PRECIOS
  // ========================================
  
  /**
   * Convierte un precio a Wei (BigInt) desde diferentes formatos
   * Soporta: string decimal en AVAX, string en wei, hex
   */
  function convertPriceToWei(model: Model): bigint {
    // 1. Intentar usar salePriceWei directamente (más preciso)
    if (model.salePriceWei) {
      const asWei = String(model.salePriceWei)
      return BigInt(asWei)
    }
    
    // 2. Fallback: convertir desde precio legible en AVAX
    const rawPrice = model.salePriceRaw ?? model.priceRaw
    if (!rawPrice) {
      throw new Error('No se pudo determinar el precio del modelo')
    }
    
    const asStr = String(rawPrice).trim()
    if (!asStr.match(/^[0-9]+(\.[0-9]+)?$/)) {
      throw new Error('Formato de precio inválido')
    }
    
    return ethers.parseEther(asStr)
  }

  // ========================================
  // OPERACIONES DE COMPRA
  // ========================================
  
  /**
   * Compra un modelo NFT en el marketplace
   * 
   * @param model - Modelo a comprar
   * @param currentAccount - Dirección del comprador
   * @returns Receipt de la transacción
   */
  async function buyModel(model: Model, currentAccount: string | null) {
    try {
      console.log('buyModel:', model.id)
      
      // Convertir precio a Wei
      const priceWei = convertPriceToWei(model)
      
      // Ejecutar compra on-chain
      const receipt = await buyModelBlockchain(Number(model.id), priceWei)
      console.log('Modelo comprado, receipt:', receipt)
      
      return {
        success: true,
        receipt,
        message: `Modelo "${model.name}" comprado exitosamente por ${model.price}!`,
        updates: {
          forSale: false,
          owner: currentAccount || model.owner,
        }
      }
    } catch (err) {
      console.error('Error al comprar modelo:', err)
      return {
        success: false,
        error: err,
        message: 'Error al comprar modelo. Revisa la consola.',
      }
    }
  }

  // ========================================
  // OPERACIONES DE VENTA
  // ========================================
  
  /**
   * Pone un modelo en venta en el marketplace
   * 
   * @param modelId - ID del modelo
   * @param price - Precio en AVAX (string)
   * @returns Resultado de la operación
   */
  async function setModelForSale(modelId: number, price: string) {
    try {
      console.log('setModelForSale:', { modelId, price })
      
      // Convertir precio a Wei (asegurar que sea string)
      const priceStr = String(price)
      const priceWei = ethers.parseEther(priceStr)
      
      // Ejecutar venta on-chain
      const receipt = await setForSaleBlockchain(modelId, priceWei)
      console.log('Modelo puesto en venta, receipt:', receipt)
      
      return {
        success: true,
        receipt,
        message: `Modelo puesto en venta por ${price} AVAX`,
        updates: {
          forSale: true,
          salePriceRaw: price,
        }
      }
    } catch (err) {
      console.error('Error al poner modelo en venta:', err)
      return {
        success: false,
        error: err,
        message: 'Error al poner modelo en venta. Revisa la consola.',
      }
    }
  }

  /**
   * Cancela la venta de un modelo
   * 
   * @param modelId - ID del modelo
   * @returns Resultado de la operación
   */
  async function cancelModelSale(modelId: number) {
    try {
      console.log('cancelSale:', modelId)
      
      // Ejecutar cancelación on-chain
      const receipt = await cancelSaleBlockchain(modelId)
      console.log('Venta cancelada, receipt:', receipt)
      
      return {
        success: true,
        receipt,
        message: 'Venta cancelada exitosamente!',
        updates: {
          forSale: false,
        }
      }
    } catch (err) {
      console.error('Error al cancelar venta:', err)
      return {
        success: false,
        error: err,
        message: 'Error al cancelar venta. Revisa la consola.',
      }
    }
  }

  // ========================================
  // OPERACIONES DE TRANSFERENCIA
  // ========================================
  
  /**
   * Transfiere la propiedad de un modelo a otra dirección
   * 
   * @param modelId - ID del modelo
   * @param toAddress - Dirección del destinatario
   * @returns Resultado de la operación
   */
  async function transferModel(modelId: number, toAddress: string) {
    try {
      console.log('transferModel:', { to: toAddress, modelId })
      
      // Validar dirección Ethereum
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Dirección Ethereum inválida')
      }
      
      // Ejecutar transferencia on-chain
      const receipt = await transferModelBlockchain(toAddress, modelId)
      console.log('Modelo transferido, receipt:', receipt)
      
      return {
        success: true,
        receipt,
        message: `Modelo transferido a ${toAddress}`,
        updates: {
          owner: toAddress,
        }
      }
    } catch (err) {
      console.error('Error al transferir modelo:', err)
      return {
        success: false,
        error: err,
        message: 'Error al transferir modelo. Revisa la consola.',
      }
    }
  }

  // ========================================
  // OPERACIONES DE LICENCIAS
  // ========================================
  
  /**
   * Crea un nuevo plan de licencia para un modelo
   * 
   * @param modelId - ID del modelo
   * @param planData - Datos del plan (nombre, precio, duración, etc.)
   * @returns Resultado de la operación
   */
  async function createLicensePlan(modelId: number, planData: any) {
    console.log('createLicensePlan:', planData)
    
    // Convertir precio a Wei (asegurar que sea string)
    const priceStr = String(planData.price)
    const priceWei = ethers.parseEther(priceStr)
    
    // Ejecutar creación de plan on-chain
    const receipt = await createLicensePlanBlockchain(
      modelId, 
      planData.name, 
      priceWei, 
      planData.duration
    )
    console.log('Plan de licencia creado, receipt:', receipt)
    
    return {
      success: true,
      receipt,
      message: `Plan de licencia "${planData.name}" creado exitosamente!`,
    }
  }

  /**
   * Activa o desactiva un plan de licencia
   * 
   * @param modelId - ID del modelo
   * @param planId - ID del plan
   * @param active - true para activar, false para desactivar
   * @returns Resultado de la operación
   */
  async function setPlanActive(modelId: number, planId: number, active: boolean) {
    try {
      console.log('setPlanActive:', { modelId, planId, active })
      
      // Ejecutar cambio de estado on-chain
      const receipt = await setPlanActiveBlockchain(modelId, planId, active)
      console.log('Plan actualizado, receipt:', receipt)
      
      return {
        success: true,
        receipt,
        message: `Plan ${active ? 'activado' : 'desactivado'} exitosamente!`,
      }
    } catch (err) {
      console.error('Error al cambiar estado del plan:', err)
      return {
        success: false,
        error: err,
        message: 'Error al cambiar estado del plan. Revisa la consola.',
      }
    }
  }

  /**
   * Compra una licencia de un modelo
   * 
   * @param modelId - ID del modelo
   * @param planId - ID del plan de licencia
   * @param price - Precio del plan (puede ser string en AVAX o BigInt en Wei). Si no se provee, solo retorna éxito sin llamar blockchain.
   * @returns Resultado de la operación
   */
  async function buyLicense(modelId: number, planId: number, price?: string | bigint) {
    try {
      console.log('buyLicense:', { modelId, planId, price })
      
      // Si no hay precio, asumir que la transacción ya fue ejecutada por otro componente
      if (!price) {
        return {
          success: true,
          message: 'Licencia comprada exitosamente!',
        }
      }
      
      // Convertir precio a Wei si es necesario
      let priceWei: bigint
      if (typeof price === 'string') {
        // Si es string, asumir que está en AVAX y convertir a Wei
        priceWei = ethers.parseEther(price)
      } else if (typeof price === 'number') {
        // Si es number, convertir a string primero
        const priceStr = String(price)
        priceWei = ethers.parseEther(priceStr)
      } else {
        // Si ya es bigint, usar directamente
        priceWei = price
      }
      
      // Ejecutar compra de licencia on-chain
      const receipt = await buyLicenseBlockchain(modelId, planId, priceWei)
      console.log('Licencia comprada, receipt:', receipt)
      
      return {
        success: true,
        receipt,
        message: 'Licencia comprada exitosamente!',
      }
    } catch (err) {
      console.error('Error al comprar licencia:', err)
      return {
        success: false,
        error: err,
        message: 'Error al comprar licencia. Revisa la consola.',
      }
    }
  }

  // ========================================
  // RETURN
  // ========================================
  
  return {
    // Compra/Venta
    buyModel,
    setModelForSale,
    cancelModelSale,
    
    // Transferencia
    transferModel,
    
    // Licencias
    createLicensePlan,
    setPlanActive,
    buyLicense,
    
    // Utils
    convertPriceToWei,
  }
}
