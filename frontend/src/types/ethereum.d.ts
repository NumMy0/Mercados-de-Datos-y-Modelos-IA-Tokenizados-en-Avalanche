// Tipos globales para ethereum/Core Wallet
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      selectedAddress: string | null
      isMetaMask?: boolean
      isAvalanche?: boolean
      isCoreWallet?: boolean
      isCore?: boolean
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
      chainId?: string
    }
  }
}

export {}