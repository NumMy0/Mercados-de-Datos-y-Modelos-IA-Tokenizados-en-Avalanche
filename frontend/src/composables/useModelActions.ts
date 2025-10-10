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
import { buyModel as buyModelBlockchain } from './blockchain'
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
      
      // TODO: Implementar llamada real al smart contract
      // await setForSaleBlockchain(modelId, ethers.parseEther(price))
      
      return {
        success: true,
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
      
      // TODO: Implementar llamada real al smart contract
      // await cancelSaleBlockchain(modelId)
      
      return {
        success: true,
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
      
      // TODO: Implementar llamada real al smart contract
      // await transferModelBlockchain(modelId, toAddress)
      
      return {
        success: true,
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
  async function createLicensePlan(_modelId: number, planData: any) {
    try {
      console.log('createLicensePlan:', planData)
      
      // TODO: Implementar llamada real al smart contract
      // await createLicensePlanBlockchain(_modelId, planData)
      
      return {
        success: true,
        message: `Plan de licencia "${planData.name}" creado exitosamente!`,
      }
    } catch (err) {
      console.error('Error al crear plan de licencia:', err)
      return {
        success: false,
        error: err,
        message: 'Error al crear plan de licencia. Revisa la consola.',
      }
    }
  }

  /**
   * Activa o desactiva un plan de licencia
   * 
   * @param planId - ID del plan
   * @param active - true para activar, false para desactivar
   * @returns Resultado de la operación
   */
  async function setPlanActive(planId: number, active: boolean) {
    try {
      console.log('setPlanActive:', { planId, active })
      
      // TODO: Implementar llamada real al smart contract
      // await setPlanActiveBlockchain(planId, active)
      
      return {
        success: true,
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
   * @returns Resultado de la operación
   */
  async function buyLicense(modelId: number, planId: number) {
    try {
      console.log('buyLicense:', { modelId, planId })
      
      // TODO: Implementar llamada real al smart contract
      // await buyLicenseBlockchain(modelId, planId)
      
      return {
        success: true,
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
