import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Service de numérotation centralisé pour les factures et devis
 * Format: 2025-001, 2025-002, etc.
 */

// Cache pour éviter les appels répétés à la base de données
let lastInvoiceNumber = null
let lastQuoteNumber = null

/**
 * Récupère le dernier numéro de facture de l'année 2025
 */
const getLastInvoiceNumber = async () => {
  try {
    const q = query(
      collection(db, 'invoices'),
      where('number', '>=', '2025-'),
      where('number', '<', '2026-'),
      orderBy('number', 'desc'),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0]
      const lastNumber = lastDoc.data().number
      const numberPart = lastNumber.split('-')[1]
      return parseInt(numberPart) || 0
    }
    return 0
  } catch (error) {
    console.warn('Impossible de récupérer le dernier numéro de facture (permissions insuffisantes), utilisation du fallback:', error.message)
    return 0
  }
}

/**
 * Récupère le dernier numéro de devis de l'année 2025
 */
const getLastQuoteNumber = async () => {
  try {
    const q = query(
      collection(db, 'quotes'),
      where('number', '>=', '2025-'),
      where('number', '<', '2026-'),
      orderBy('number', 'desc'),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0]
      const lastNumber = lastDoc.data().number
      const numberPart = lastNumber.split('-')[1]
      return parseInt(numberPart) || 0
    }
    return 0
  } catch (error) {
    console.warn('Impossible de récupérer le dernier numéro de devis (permissions insuffisantes), utilisation du fallback:', error.message)
    return 0
  }
}

/**
 * Génère le prochain numéro de facture
 * @returns {Promise<string>} Le prochain numéro de facture (ex: "2025-001")
 */
export const generateNextInvoiceNumber = async () => {
  try {
    // Utiliser le cache si disponible
    if (lastInvoiceNumber !== null) {
      lastInvoiceNumber++
      return `2025-${String(lastInvoiceNumber).padStart(3, '0')}`
    }
    
    // Récupérer le dernier numéro depuis la base de données
    const lastNumber = await getLastInvoiceNumber()
    lastInvoiceNumber = lastNumber + 1
    
    return `2025-${String(lastInvoiceNumber).padStart(3, '0')}`
  } catch (error) {
    console.warn('Erreur lors de la génération du numéro de facture, utilisation du fallback:', error)
    // Fallback avec timestamp pour éviter les doublons
    const timestamp = Date.now()
    const fallbackNumber = parseInt(String(timestamp).slice(-3))
    return `2025-${String(fallbackNumber).padStart(3, '0')}`
  }
}

/**
 * Génère le prochain numéro de devis
 * @returns {Promise<string>} Le prochain numéro de devis (ex: "2025-001")
 */
export const generateNextQuoteNumber = async () => {
  try {
    // Utiliser le cache si disponible
    if (lastQuoteNumber !== null) {
      lastQuoteNumber++
      return `2025-${String(lastQuoteNumber).padStart(3, '0')}`
    }
    
    // Récupérer le dernier numéro depuis la base de données
    const lastNumber = await getLastQuoteNumber()
    lastQuoteNumber = lastNumber + 1
    
    return `2025-${String(lastQuoteNumber).padStart(3, '0')}`
  } catch (error) {
    console.warn('Erreur lors de la génération du numéro de devis, utilisation du fallback:', error)
    // Fallback avec timestamp pour éviter les doublons
    const timestamp = Date.now()
    const fallbackNumber = parseInt(String(timestamp).slice(-3))
    return `2025-${String(fallbackNumber).padStart(3, '0')}`
  }
}

/**
 * Génère un numéro de document (facture ou devis)
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
 * Réinitialise le cache des numéros (utile pour les tests)
 */
export const resetNumberCache = () => {
  lastInvoiceNumber = null
  lastQuoteNumber = null
}
