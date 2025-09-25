/**
 * Gestionnaire d'erreurs global pour l'application
 */

/**
 * Types d'erreurs
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
}

/**
 * Messages d'erreur par type
 */
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Problème de connexion. Vérifiez votre connexion internet.',
  [ERROR_TYPES.VALIDATION]: 'Les données saisies ne sont pas valides.',
  [ERROR_TYPES.AUTHENTICATION]: 'Vous devez être connecté pour effectuer cette action.',
  [ERROR_TYPES.AUTHORIZATION]: 'Vous n\'avez pas les permissions nécessaires.',
  [ERROR_TYPES.NOT_FOUND]: 'L\'élément demandé n\'a pas été trouvé.',
  [ERROR_TYPES.SERVER]: 'Une erreur serveur est survenue. Veuillez réessayer.',
  [ERROR_TYPES.UNKNOWN]: 'Une erreur inattendue est survenue.'
}

/**
 * Classe pour la gestion des erreurs
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, code = null, details = null) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = code
    this.details = details
    this.timestamp = new Date()
  }
}

/**
 * Gestionnaire d'erreurs global
 */
export class GlobalErrorHandler {
  constructor() {
    this.errorListeners = []
    this.setupGlobalErrorHandling()
  }

  /**
   * Configurer la gestion d'erreurs globale
   */
  setupGlobalErrorHandling() {
    // Gestion des erreurs JavaScript non capturées
    window.addEventListener('error', (event) => {
      this.handleError(new AppError(
        event.error?.message || 'Erreur JavaScript',
        ERROR_TYPES.UNKNOWN,
        null,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      ))
    })

    // Gestion des promesses rejetées non capturées
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new AppError(
        event.reason?.message || 'Promesse rejetée',
        ERROR_TYPES.UNKNOWN,
        null,
        event.reason
      ))
    })
  }

  /**
   * Ajouter un listener d'erreur
   * @param {Function} listener - Fonction à appeler en cas d'erreur
   */
  addErrorListener(listener) {
    this.errorListeners.push(listener)
  }

  /**
   * Supprimer un listener d'erreur
   * @param {Function} listener - Fonction à supprimer
   */
  removeErrorListener(listener) {
    this.errorListeners = this.errorListeners.filter(l => l !== listener)
  }

  /**
   * Gérer une erreur
   * @param {Error|AppError} error - Erreur à gérer
   */
  handleError(error) {
    // Normaliser l'erreur
    const normalizedError = this.normalizeError(error)
    
    // Logger l'erreur
    this.logError(normalizedError)
    
    // Notifier les listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(normalizedError)
      } catch (listenerError) {
        console.error('Erreur dans le listener d\'erreur:', listenerError)
      }
    })
  }

  /**
   * Normaliser une erreur
   * @param {Error|AppError} error - Erreur à normaliser
   * @returns {AppError} Erreur normalisée
   */
  normalizeError(error) {
    if (error instanceof AppError) {
      return error
    }

    // Déterminer le type d'erreur
    let type = ERROR_TYPES.UNKNOWN
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      type = ERROR_TYPES.NETWORK
    } else if (error.name === 'ValidationError' || error.message.includes('validation')) {
      type = ERROR_TYPES.VALIDATION
    } else if (error.name === 'AuthError' || error.message.includes('auth')) {
      type = ERROR_TYPES.AUTHENTICATION
    } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
      type = ERROR_TYPES.NOT_FOUND
    }

    return new AppError(
      error.message || ERROR_MESSAGES[type],
      type,
      error.code,
      error.stack
    )
  }

  /**
   * Logger une erreur
   * @param {AppError} error - Erreur à logger
   */
  logError(error) {
    console.error('Erreur globale:', {
      message: error.message,
      type: error.type,
      code: error.code,
      timestamp: error.timestamp,
      details: error.details
    })
  }

  /**
   * Créer une erreur personnalisée
   * @param {string} message - Message d'erreur
   * @param {string} type - Type d'erreur
   * @param {string} code - Code d'erreur
   * @param {any} details - Détails supplémentaires
   * @returns {AppError} Erreur créée
   */
  createError(message, type = ERROR_TYPES.UNKNOWN, code = null, details = null) {
    return new AppError(message, type, code, details)
  }
}

/**
 * Instance globale du gestionnaire d'erreurs
 */
export const globalErrorHandler = new GlobalErrorHandler()

/**
 * Fonctions utilitaires pour la gestion d'erreurs
 */
export const errorUtils = {
  /**
   * Créer une erreur de validation
   * @param {string} message - Message d'erreur
   * @param {any} details - Détails de l'erreur
   * @returns {AppError} Erreur de validation
   */
  createValidationError(message, details = null) {
    return new AppError(message, ERROR_TYPES.VALIDATION, 'VALIDATION_ERROR', details)
  },

  /**
   * Créer une erreur d'authentification
   * @param {string} message - Message d'erreur
   * @param {any} details - Détails de l'erreur
   * @returns {AppError} Erreur d'authentification
   */
  createAuthError(message, details = null) {
    return new AppError(message, ERROR_TYPES.AUTHENTICATION, 'AUTH_ERROR', details)
  },

  /**
   * Créer une erreur de réseau
   * @param {string} message - Message d'erreur
   * @param {any} details - Détails de l'erreur
   * @returns {AppError} Erreur de réseau
   */
  createNetworkError(message, details = null) {
    return new AppError(message, ERROR_TYPES.NETWORK, 'NETWORK_ERROR', details)
  },

  /**
   * Créer une erreur de serveur
   * @param {string} message - Message d'erreur
   * @param {any} details - Détails de l'erreur
   * @returns {AppError} Erreur de serveur
   */
  createServerError(message, details = null) {
    return new AppError(message, ERROR_TYPES.SERVER, 'SERVER_ERROR', details)
  },

  /**
   * Créer une erreur de ressource non trouvée
   * @param {string} message - Message d'erreur
   * @param {any} details - Détails de l'erreur
   * @returns {AppError} Erreur de ressource non trouvée
   */
  createNotFoundError(message, details = null) {
    return new AppError(message, ERROR_TYPES.NOT_FOUND, 'NOT_FOUND_ERROR', details)
  }
}
