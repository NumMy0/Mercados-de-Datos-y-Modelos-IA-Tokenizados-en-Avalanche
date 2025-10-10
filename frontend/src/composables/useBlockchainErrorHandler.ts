import { useNotifications } from './useNotifications'

export function useBlockchainErrorHandler() {
  const { notifyTransactionCancelled, notifyTransactionError } = useNotifications()

  const handleBlockchainError = (error: any, operation: string = 'operación') => {
    console.error(`Error en ${operation}:`, error)
    
    // Check if user cancelled the transaction
    if (isUserCancellation(error)) {
      notifyTransactionCancelled()
      return 'cancelled'
    }
    
    // Check for specific blockchain errors
    const errorMessage = getErrorMessage(error, operation)
    notifyTransactionError(errorMessage)
    
    return 'error'
  }

  const isUserCancellation = (error: any): boolean => {
    if (!error) return false
    
    const errorString = error.toString().toLowerCase()
    const message = error.message?.toLowerCase() || ''
    const code = error.code
    
    // Common patterns for user cancellation
    const cancellationPatterns = [
      'user rejected',
      'user denied',
      'user cancelled',
      'user canceled',
      'action rejected',
      'transaction rejected',
      'metamask tx signature: user denied',
      'user rejected the request',
      'transaction was rejected'
    ]
    
    // Error codes for user cancellation
    const cancellationCodes = [
      4001, // User rejected the request
      -32603, // Internal error (sometimes used for cancellation)
    ]
    
    return cancellationPatterns.some(pattern => 
      errorString.includes(pattern) || message.includes(pattern)
    ) || cancellationCodes.includes(code)
  }

  const getErrorMessage = (error: any, operation: string): string => {
    if (!error) return `Error desconocido en ${operation}`
    
    // Try to extract meaningful error message
    const message = error.message || error.toString()
    
    // Common blockchain error patterns
    if (message.includes('insufficient funds')) {
      return 'Fondos insuficientes en tu wallet para completar la transacción'
    }
    
    if (message.includes('gas')) {
      return 'Error relacionado con el gas de la transacción. Verifica tus configuraciones'
    }
    
    if (message.includes('network')) {
      return 'Error de red. Verifica tu conexión a la blockchain'
    }
    
    if (message.includes('nonce')) {
      return 'Error de nonce. Intenta reiniciar tu wallet'
    }
    
    if (message.includes('revert')) {
      return 'La transacción fue revertida por el contrato inteligente'
    }
    
    if (message.includes('timeout')) {
      return 'La transacción tardó demasiado tiempo. Intenta nuevamente'
    }
    
    if (message.includes('not found')) {
      return 'Recurso no encontrado en la blockchain'
    }
    
    // Generic error with truncated message
    const cleanMessage = message
      .replace(/^Error: /, '')
      .replace(/execution reverted: /, '')
      .replace(/MetaMask.*?: /, '')
      .trim()
    
    const maxLength = 120
    const truncatedMessage = cleanMessage.length > maxLength 
      ? cleanMessage.substring(0, maxLength) + '...'
      : cleanMessage
    
    return truncatedMessage || `Error en ${operation}`
  }

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operación'
  ): Promise<{ success: boolean; data?: T; status: 'success' | 'cancelled' | 'error' }> => {
    try {
      const result = await operation()
      return { success: true, data: result, status: 'success' }
    } catch (error) {
      const status = handleBlockchainError(error, operationName)
      return { success: false, status: status as 'cancelled' | 'error' }
    }
  }

  return {
    handleBlockchainError,
    handleAsyncOperation,
    isUserCancellation,
    getErrorMessage
  }
}