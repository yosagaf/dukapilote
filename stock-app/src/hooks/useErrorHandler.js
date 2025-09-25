import { useState, useCallback } from 'react'

/**
 * Hook personnalisé pour la gestion d'erreurs
 * @returns {Object} { error, handleError, clearError, setError }
 */
export const useErrorHandler = () => {
  const [error, setError] = useState('')

  const handleError = useCallback((error, customMessage) => {
    console.error('Erreur:', error)
    setError(customMessage || error.message || 'Une erreur est survenue')
  }, [])

  const clearError = useCallback(() => {
    setError('')
  }, [])

  return { 
    error, 
    handleError, 
    clearError, 
    setError 
  }
}

/**
 * Hook pour la gestion des erreurs avec retry
 * @param {Function} retryFunction - Fonction à exécuter en cas de retry
 * @returns {Object} { error, handleError, clearError, retry }
 */
export const useErrorHandlerWithRetry = (retryFunction) => {
  const { error, handleError, clearError, setError } = useErrorHandler()

  const retry = useCallback(() => {
    clearError()
    if (retryFunction) {
      retryFunction()
    }
  }, [retryFunction, clearError])

  return { 
    error, 
    handleError, 
    clearError, 
    retry,
    setError 
  }
}
