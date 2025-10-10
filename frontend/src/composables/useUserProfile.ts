/**
 * Composable: useUserProfile
 * 
 * RESPONSABILIDAD ÚNICA: Gestión de datos del perfil del usuario
 * 
 * Proporciona:
 * - Balance de wallet
 * - Fondos pendientes de retiro
 * - Licencias del usuario (carga y gestión)
 * - Stats derivados (cantidad de modelos, licencias activas, etc.)
 */

import { ref, computed, type Ref } from 'vue'
import { 
  getPendingWithdrawal, 
  hasActiveLicense, 
  getLicenseExpiry,
  getAllModelIds,
  getModelById
} from './blockchain'

export interface UserLicense {
  id: string
  modelId: number
  modelName: string
  planName: string | null
  isActive: boolean
  expiryTimestamp: number
  expiryDate: string
  daysLeft?: number
}

export interface PendingWithdrawal {
  wei: string
  readable: string | null
}

export function useUserProfile(userAddress: Ref<string | null>) {
  // ========================================
  // ESTADO
  // ========================================
  
  const walletBalance = ref('0.00')
  const pendingWithdrawal = ref<PendingWithdrawal>({ wei: '0', readable: null })
  const licenses = ref<UserLicense[]>([])
  const loadingLicenses = ref(false)

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================
  
  /**
   * Dirección truncada del usuario para mostrar en UI
   */
  const truncatedAddress = computed(() => {
    if (!userAddress.value) return ''
    return `${userAddress.value.slice(0, 10)}...${userAddress.value.slice(-8)}`
  })

  /**
   * Cantidad de licencias activas
   */
  const activeLicensesCount = computed(() => {
    return licenses.value.filter(l => l.isActive).length
  })

  /**
   * Tiene fondos pendientes de retiro
   */
  const hasPendingWithdrawal = computed(() => {
    const amount = parseFloat(pendingWithdrawal.value.readable || '0')
    return amount > 0
  })

  // ========================================
  // FUNCIONES - BALANCE Y RETIROS
  // ========================================
  
  /**
   * Carga el balance de AVAX de la wallet del usuario
   */
  async function loadWalletBalance() {
    try {
      if (window.ethereum && userAddress.value) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [userAddress.value, 'latest']
        })
        // Convertir de Wei a AVAX
        const balanceInAvax = parseInt(balance, 16) / 1e18
        walletBalance.value = balanceInAvax.toFixed(4)
      }
    } catch (err) {
      console.error('Error obteniendo balance:', err)
      walletBalance.value = '0.00'
    }
  }

  /**
   * Carga los fondos pendientes de retiro del usuario desde el smart contract
   */
  async function loadPendingWithdrawal() {
    try {
      if (!userAddress.value) {
        pendingWithdrawal.value = { wei: '0', readable: '0' }
        return
      }
      
      const result = await getPendingWithdrawal(userAddress.value)
      pendingWithdrawal.value = result || { wei: '0', readable: '0' }
    } catch (err) {
      console.error('Error obteniendo pending withdrawal:', err)
      pendingWithdrawal.value = { wei: '0', readable: '0' }
    }
  }

  /**
   * Refresca balance y fondos pendientes después de un retiro exitoso
   */
  async function refreshAfterWithdrawal() {
    await Promise.all([
      loadWalletBalance(),
      loadPendingWithdrawal()
    ])
  }

  // ========================================
  // FUNCIONES - LICENCIAS
  // ========================================
  
  /**
   * Calcula los días restantes de una licencia
   */
  function calculateDaysLeft(expiryTimestamp: number): number {
    const now = Math.floor(Date.now() / 1000)
    const secondsLeft = expiryTimestamp - now
    const daysLeft = Math.max(0, Math.ceil(secondsLeft / (24 * 60 * 60)))
    return daysLeft
  }

  /**
   * Carga todas las licencias activas del usuario
   * Verifica en todos los modelos si el usuario tiene licencia activa
   */
  async function loadUserLicenses() {
    loadingLicenses.value = true
    licenses.value = []
    
    try {
      if (!userAddress.value) return

      // Obtener todos los modelos
      const ids = await getAllModelIds()
      if (!ids || ids.length === 0) {
        licenses.value = []
        return
      }

      // Revisar en paralelo si el usuario tiene licencia en cada modelo
      const checks = await Promise.all(
        ids.map(async (id: any) => {
          try {
            const active = await hasActiveLicense(id, userAddress.value as string)
            if (!active) return null

            const expiry = await getLicenseExpiry(id, userAddress.value as string)
            
            // Obtener nombre del modelo
            let modelName = `Model #${id}`
            try {
              const model = await getModelById(id)
              if (model && model.name) modelName = model.name
            } catch (e) {
              // Si falla, usar nombre por defecto
            }

            const expiryTimestamp = expiry || 0
            const daysLeft = calculateDaysLeft(expiryTimestamp)

            return {
              id: `${id}-${userAddress.value}`,
              modelId: Number(id),
              modelName,
              planName: null, // TODO: Obtener nombre del plan desde blockchain
              isActive: true,
              expiryTimestamp,
              expiryDate: expiryTimestamp 
                ? new Date(expiryTimestamp * 1000).toLocaleDateString() 
                : 'N/A',
              daysLeft
            }
          } catch (e) {
            console.debug('Error verificando licencia para modelo', id, e)
            return null
          }
        })
      )

      licenses.value = checks.filter(Boolean) as UserLicense[]
    } catch (err) {
      console.error('Error cargando licencias:', err)
      licenses.value = []
    } finally {
      loadingLicenses.value = false
    }
  }

  /**
   * Refresca las licencias del usuario
   */
  async function refreshLicenses() {
    await loadUserLicenses()
  }

  // ========================================
  // FUNCIONES - CLIPBOARD
  // ========================================
  
  /**
   * Copia la dirección completa del usuario al portapapeles
   */
  async function copyAddressToClipboard(): Promise<boolean> {
    if (!userAddress.value) return false
    
    try {
      await navigator.clipboard.writeText(userAddress.value)
      return true
    } catch (err) {
      console.error('Error copiando dirección:', err)
      return false
    }
  }

  // ========================================
  // RETURN
  // ========================================
  
  return {
    // Estado
    walletBalance,
    pendingWithdrawal,
    licenses,
    loadingLicenses,
    
    // Computed
    truncatedAddress,
    activeLicensesCount,
    hasPendingWithdrawal,
    
    // Métodos - Balance
    loadWalletBalance,
    loadPendingWithdrawal,
    refreshAfterWithdrawal,
    
    // Métodos - Licencias
    loadUserLicenses,
    refreshLicenses,
    
    // Métodos - Utils
    copyAddressToClipboard,
  }
}
