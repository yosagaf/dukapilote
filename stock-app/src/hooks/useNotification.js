import { useState, useCallback, useEffect } from 'react'

/**
 * Hook personnalisé pour la gestion des notifications
 * @param {number} defaultDuration - Durée par défaut en millisecondes
 * @returns {Object} { notification, showNotification, hideNotification, setNotification }
 */
export const useNotification = (defaultDuration = 3000) => {
  const [notification, setNotification] = useState(null)
  const [timeoutId, setTimeoutId] = useState(null)

  const showNotification = useCallback((message, type = 'info', duration = defaultDuration) => {
    // Annuler le timeout précédent s'il existe
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }

    setNotification(newNotification)

    // Auto-hide après la durée spécifiée
    if (duration > 0) {
      const id = setTimeout(() => {
        setNotification(null)
        setTimeoutId(null)
      }, duration)
      setTimeoutId(id)
    }
  }, [defaultDuration, timeoutId])

  const hideNotification = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setNotification(null)
  }, [timeoutId])

  const showSuccess = useCallback((message, duration = defaultDuration) => {
    showNotification(message, 'success', duration)
  }, [showNotification, defaultDuration])

  const showError = useCallback((message, duration = defaultDuration) => {
    showNotification(message, 'error', duration)
  }, [showNotification, defaultDuration])

  const showWarning = useCallback((message, duration = defaultDuration) => {
    showNotification(message, 'warning', duration)
  }, [showNotification, defaultDuration])

  const showInfo = useCallback((message, duration = defaultDuration) => {
    showNotification(message, 'info', duration)
  }, [showNotification, defaultDuration])

  // Nettoyage du timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    setNotification
  }
}

/**
 * Hook pour la gestion de plusieurs notifications
 * @param {number} maxNotifications - Nombre maximum de notifications simultanées
 * @returns {Object} { notifications, addNotification, removeNotification, clearAll }
 */
export const useNotificationQueue = (maxNotifications = 5) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      duration,
      timestamp: new Date()
    }

    setNotifications(prev => {
      const updated = [...prev, newNotification]
      // Garder seulement le nombre maximum de notifications
      return updated.slice(-maxNotifications)
    })

    // Auto-remove après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, duration)
    }
  }, [maxNotifications])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const showSuccess = useCallback((message, duration = 3000) => {
    addNotification(message, 'success', duration)
  }, [addNotification])

  const showError = useCallback((message, duration = 3000) => {
    addNotification(message, 'error', duration)
  }, [addNotification])

  const showWarning = useCallback((message, duration = 3000) => {
    addNotification(message, 'warning', duration)
  }, [addNotification])

  const showInfo = useCallback((message, duration = 3000) => {
    addNotification(message, 'info', duration)
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
