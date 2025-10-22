import { ref, computed } from 'vue'
import { BrowserProvider } from 'ethers'

// Estado global de la wallet
const account = ref<string | null>(null)
const chainId = ref<string | null>(null)
const provider = ref<BrowserProvider | null>(null)
const isConnecting = ref(false)
const error = ref<string | null>(null)

// Configuración de Avalanche C-Chain
const AVALANCHE_MAINNET_PARAMS = {
  chainId: '0xa86a', // 43114 en hexadecimal
  chainName: 'Avalanche C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io/']
}

const AVALANCHE_FUJI_PARAMS = {
  chainId: '0xa869', // 43113 en hexadecimal
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/']
}

export function useWallet() {
  // Computed properties
  const isConnected = computed(() => !!account.value)
  const shortAddress = computed(() => {
    if (!account.value) return ''
    return `${account.value.slice(0, 6)}...${account.value.slice(-4)}`
  })

  // Verificar si Core Wallet está instalado
  const isCoreWalletInstalled = computed(() => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' &&
           (window.ethereum.isAvalanche || window.ethereum.isCore || window.ethereum.isCoreWallet)
  })

  // Conectar wallet
  const connectWallet = async () => {
    error.value = null
    isConnecting.value = true

    try {
      // Verificar si hay un proveedor de wallet
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Por favor instala Core Wallet para continuar')
      }

      // Solicitar cuentas
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No se encontraron cuentas')
      }

      // Obtener el chainId actual
      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId'
      })

      // Crear el provider de ethers
      provider.value = new BrowserProvider(window.ethereum)

      // Actualizar estado
  account.value = accounts[0] ?? null
      chainId.value = currentChainId

      console.log('Wallet conectada:', {
        account: account.value,
        chainId: chainId.value,
        isCoreWallet: isCoreWalletInstalled.value
      })

      // Configurar listeners para cambios
      setupListeners()

      return account.value
    } catch (err: any) {
      console.error('Error al conectar wallet:', err)
      error.value = err.message || 'Error al conectar la wallet'
      throw err
    } finally {
      isConnecting.value = false
    }
  }

  // Desconectar wallet
  const disconnectWallet = () => {
    account.value = null
    chainId.value = null
    provider.value = null
    error.value = null
    removeListeners()
  }

  // Cambiar a Avalanche C-Chain
  const switchToAvalanche = async (testnet = false) => {
    error.value = null

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Core Wallet no está instalado')
      }

      const params = testnet ? AVALANCHE_FUJI_PARAMS : AVALANCHE_MAINNET_PARAMS

      try {
        // Intentar cambiar a la red
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: params.chainId }]
        })
      } catch (switchError: any) {
        // Si la red no está agregada, agregarla
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [params]
          })
        } else {
          throw switchError
        }
      }

      // Actualizar chainId
      chainId.value = params.chainId
      
      console.log(`Cambiado a ${params.chainName}`)
    } catch (err: any) {
      console.error('Error al cambiar de red:', err)
      error.value = err.message || 'Error al cambiar de red'
      throw err
    }
  }

  // Configurar listeners para eventos de la wallet
  const setupListeners = () => {
    if (typeof window.ethereum === 'undefined') return

    // Evento cuando cambia la cuenta
    window.ethereum.on('accountsChanged', handleAccountsChanged)

    // Evento cuando cambia la red
    window.ethereum.on('chainChanged', handleChainChanged)

    // Evento cuando se desconecta
    window.ethereum.on('disconnect', handleDisconnect)
  }

  // Remover listeners
  const removeListeners = () => {
    if (typeof window.ethereum === 'undefined') return

    window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
    window.ethereum.removeListener('chainChanged', handleChainChanged)
    window.ethereum.removeListener('disconnect', handleDisconnect)
  }

  // Handlers de eventos
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      account.value = accounts[0] ?? null
      console.log('Cuenta cambiada:', account.value)
    }
  }

  const handleChainChanged = (newChainId: string) => {
    chainId.value = newChainId
    console.log('Red cambiada:', newChainId)
    // Recargar la página para evitar inconsistencias
    window.location.reload()
  }

  const handleDisconnect = () => {
    console.log('Wallet desconectada')
    disconnectWallet()
  }

  // Verificar si ya está conectado al cargar
  const checkConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        })

        if (accounts.length > 0 && accounts[0]) {
          account.value = accounts[0] ?? null
          
          const currentChainId = await window.ethereum.request({
            method: 'eth_chainId'
          })
          chainId.value = currentChainId

          provider.value = new BrowserProvider(window.ethereum)
          setupListeners()
        }
      }
    } catch (err) {
      console.error('Error al verificar conexión:', err)
    }
  }

  // Obtener balance de AVAX
  const getBalance = async () => {
    if (!account.value || !provider.value) {
      throw new Error('Wallet no conectada')
    }

    const balance = await provider.value.getBalance(account.value)
    return balance
  }

  return {
    // Estado
    account,
    chainId,
    provider,
    isConnecting,
    error,

    // Computed
    isConnected,
    shortAddress,
    isCoreWalletInstalled,

    // Métodos
    connectWallet,
    disconnectWallet,
    switchToAvalanche,
    checkConnection,
    getBalance
  }
}
