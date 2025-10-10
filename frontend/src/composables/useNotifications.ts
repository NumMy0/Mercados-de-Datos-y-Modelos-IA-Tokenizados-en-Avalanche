import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

const notifications = ref<Notification[]>([])

export function useNotifications() {
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 5000,
      persistent: false,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // Auto remove after duration (unless persistent)
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    notifications.value = []
  }

  // Helper methods for common notification types
  const notifySuccess = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'success', title, message, ...options })
  }

  const notifyError = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'error', title, message, duration: 7000, ...options })
  }

  const notifyWarning = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'warning', title, message, ...options })
  }

  const notifyInfo = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'info', title, message, ...options })
  }

  // Blockchain specific helpers
  const notifyTransactionCancelled = () => {
    return notifyWarning(
      'Transacción Cancelada',
      'Has cancelado la transacción en tu wallet',
      { duration: 4000 }
    )
  }

  const notifyTransactionError = (error: string) => {
    return notifyError(
      'Error en la Transacción',
      error,
      { duration: 8000 }
    )
  }

  const notifyTransactionSuccess = (title: string, message?: string) => {
    return notifySuccess(title, message, { duration: 6000 })
  }

  return {
    notifications: notifications,
    addNotification,
    removeNotification,
    clearAll,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyTransactionCancelled,
    notifyTransactionError,
    notifyTransactionSuccess
  }
}