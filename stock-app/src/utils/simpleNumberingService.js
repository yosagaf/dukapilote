/**
 * Service de numérotation simplifié qui évite les problèmes de permissions
 * Utilise localStorage pour maintenir les compteurs
 * Format: 2025-001, 2025-002, etc.
 */

const INVOICE_COUNTER_KEY = 'dukapilote_invoice_counter_2025'
const QUOTE_COUNTER_KEY = 'dukapilote_quote_counter_2025'

/**
 * Récupère le prochain numéro de facture SANS l'incrémenter
 * @returns {Promise<string>} Le prochain numéro de facture (ex: "2025-001")
 */
export const previewNextInvoiceNumber = async () => {
  try {
    // Récupérer le compteur depuis localStorage
    let counter = parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || '0')
    counter++
    
    return `2025-${String(counter).padStart(3, '0')}`
  } catch (error) {
    console.warn('Erreur avec localStorage, utilisation du fallback:', error)
    // Fallback avec timestamp
    const timestamp = Date.now()
    const fallbackNumber = parseInt(String(timestamp).slice(-3))
    return `2025-${String(fallbackNumber).padStart(3, '0')}`
  }
}

/**
 * Récupère le prochain numéro de facture ET l'incrémente
 * @returns {Promise<string>} Le prochain numéro de facture (ex: "2025-001")
 */
export const generateNextInvoiceNumber = async () => {
  try {
    // Récupérer le compteur depuis localStorage
    let counter = parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || '0')
    counter++
    
    // Sauvegarder le nouveau compteur
    localStorage.setItem(INVOICE_COUNTER_KEY, counter.toString())
    
    return `2025-${String(counter).padStart(3, '0')}`
  } catch (error) {
    console.warn('Erreur avec localStorage, utilisation du fallback:', error)
    // Fallback avec timestamp
    const timestamp = Date.now()
    const fallbackNumber = parseInt(String(timestamp).slice(-3))
    return `2025-${String(fallbackNumber).padStart(3, '0')}`
  }
}

/**
 * Récupère le prochain numéro de devis SANS l'incrémenter
 * @returns {Promise<string>} Le prochain numéro de devis (ex: "2025-001")
 */
export const previewNextQuoteNumber = async () => {
  try {
    // Récupérer le compteur depuis localStorage
    let counter = parseInt(localStorage.getItem(QUOTE_COUNTER_KEY) || '0')
    counter++
    
    return `2025-${String(counter).padStart(3, '0')}`
  } catch (error) {
    console.warn('Erreur avec localStorage, utilisation du fallback:', error)
    // Fallback avec timestamp
    const timestamp = Date.now()
    const fallbackNumber = parseInt(String(timestamp).slice(-3))
    return `2025-${String(fallbackNumber).padStart(3, '0')}`
  }
}

/**
 * Récupère le prochain numéro de devis ET l'incrémente
 * @returns {Promise<string>} Le prochain numéro de devis (ex: "2025-001")
 */
export const generateNextQuoteNumber = async () => {
  try {
    // Récupérer le compteur depuis localStorage
    let counter = parseInt(localStorage.getItem(QUOTE_COUNTER_KEY) || '0')
    counter++
    
    // Sauvegarder le nouveau compteur
    localStorage.setItem(QUOTE_COUNTER_KEY, counter.toString())
    
    return `2025-${String(counter).padStart(3, '0')}`
  } catch (error) {
    console.warn('Erreur avec localStorage, utilisation du fallback:', error)
    // Fallback avec timestamp
    const timestamp = Date.now()
    const fallbackNumber = parseInt(String(timestamp).slice(-3))
    return `2025-${String(fallbackNumber).padStart(3, '0')}`
  }
}

/**
 * Génère un numéro de document (facture ou devis) ET l'incrémente
 * @param {string} type - 'invoice' ou 'quote'
 * @returns {Promise<string>} Le numéro généré
 */
export const generateDocumentNumber = async (type) => {
  if (type === 'invoice') {
    return await generateNextInvoiceNumber()
  } else if (type === 'quote') {
    return await generateNextQuoteNumber()
  } else {
    throw new Error('Type de document invalide. Utilisez "invoice" ou "quote".')
  }
}

/**
 * Prévisualise un numéro de document (facture ou devis) SANS l'incrémenter
 * @param {string} type - 'invoice' ou 'quote'
 * @returns {Promise<string>} Le numéro prévisualisé
 */
export const previewDocumentNumber = async (type) => {
  if (type === 'invoice') {
    return await previewNextInvoiceNumber()
  } else if (type === 'quote') {
    return await previewNextQuoteNumber()
  } else {
    throw new Error('Type de document invalide. Utilisez "invoice" ou "quote".')
  }
}

/**
 * Réinitialise les compteurs (utile pour les tests)
 */
export const resetCounters = () => {
  localStorage.removeItem(INVOICE_COUNTER_KEY)
  localStorage.removeItem(QUOTE_COUNTER_KEY)
}

/**
 * Obtient les compteurs actuels
 * @returns {Object} Objet avec invoiceCounter et quoteCounter
 */
export const getCurrentCounters = () => {
  return {
    invoiceCounter: parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || '0'),
    quoteCounter: parseInt(localStorage.getItem(QUOTE_COUNTER_KEY) || '0')
  }
}
