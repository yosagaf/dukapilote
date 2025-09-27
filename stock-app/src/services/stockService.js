import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export class StockService {
  /**
   * Déduit le stock pour une facture payée
   * @param {Object} invoice - La facture payée
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deductStockForInvoice(invoice) {
    try {
      if (!invoice.selectedItems || invoice.selectedItems.length === 0) {
        return { success: true, message: 'Aucun article à déduire' }
      }

      const stockUpdates = []
      const errors = []

      // Traiter chaque article de la facture
      for (const item of invoice.selectedItems) {
        try {
          // Récupérer l'article actuel
          const itemRef = doc(db, 'items', item.id)
          const itemSnap = await getDoc(itemRef)
          
          if (!itemSnap.exists()) {
            errors.push(`Article ${item.name} non trouvé`)
            continue
          }

          const currentItem = itemSnap.data()
          const currentQuantity = currentItem.quantity || 0
          const requestedQuantity = item.quantity || 0

          // Vérifier si le stock est suffisant
          if (currentQuantity < requestedQuantity) {
            errors.push(`Stock insuffisant pour ${item.name}. Disponible: ${currentQuantity}, Demandé: ${requestedQuantity}`)
            continue
          }

          // Calculer la nouvelle quantité
          const newQuantity = currentQuantity - requestedQuantity

          // Ajouter à la liste des mises à jour
          stockUpdates.push({
            itemId: item.id,
            itemName: item.name,
            oldQuantity: currentQuantity,
            newQuantity: newQuantity,
            deductedQuantity: requestedQuantity
          })

          // Mettre à jour le stock
          await updateDoc(itemRef, {
            quantity: newQuantity,
            updated_at: new Date()
          })

        } catch (itemError) {
          console.error(`Erreur lors de la déduction du stock pour ${item.name}:`, itemError)
          errors.push(`Erreur pour ${item.name}: ${itemError.message}`)
        }
      }

      // Créer un résumé des opérations
      const summary = {
        totalItems: invoice.selectedItems.length,
        successfulUpdates: stockUpdates.length,
        errors: errors.length,
        stockUpdates: stockUpdates,
        errors: errors
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: `Erreurs lors de la déduction du stock: ${errors.join(', ')}`,
          summary
        }
      }

      return {
        success: true,
        message: `Stock déduit avec succès pour ${stockUpdates.length} articles`,
        summary
      }

    } catch (error) {
      console.error('Erreur lors de la déduction du stock:', error)
      return {
        success: false,
        error: `Erreur lors de la déduction du stock: ${error.message}`
      }
    }
  }

  /**
   * Restaure le stock pour une facture annulée
   * @param {Object} invoice - La facture à annuler
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async restoreStockForInvoice(invoice) {
    try {
      if (!invoice.selectedItems || invoice.selectedItems.length === 0) {
        return { success: true, message: 'Aucun article à restaurer' }
      }

      const stockUpdates = []
      const errors = []

      // Traiter chaque article de la facture
      for (const item of invoice.selectedItems) {
        try {
          // Récupérer l'article actuel
          const itemRef = doc(db, 'items', item.id)
          const itemSnap = await getDoc(itemRef)
          
          if (!itemSnap.exists()) {
            errors.push(`Article ${item.name} non trouvé`)
            continue
          }

          const currentItem = itemSnap.data()
          const currentQuantity = currentItem.quantity || 0
          const restoredQuantity = item.quantity || 0

          // Calculer la nouvelle quantité
          const newQuantity = currentQuantity + restoredQuantity

          // Ajouter à la liste des mises à jour
          stockUpdates.push({
            itemId: item.id,
            itemName: item.name,
            oldQuantity: currentQuantity,
            newQuantity: newQuantity,
            restoredQuantity: restoredQuantity
          })

          // Mettre à jour le stock
          await updateDoc(itemRef, {
            quantity: newQuantity,
            updated_at: new Date()
          })

        } catch (itemError) {
          console.error(`Erreur lors de la restauration du stock pour ${item.name}:`, itemError)
          errors.push(`Erreur pour ${item.name}: ${itemError.message}`)
        }
      }

      // Créer un résumé des opérations
      const summary = {
        totalItems: invoice.selectedItems.length,
        successfulUpdates: stockUpdates.length,
        errors: errors.length,
        stockUpdates: stockUpdates,
        errors: errors
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: `Erreurs lors de la restauration du stock: ${errors.join(', ')}`,
          summary
        }
      }

      return {
        success: true,
        message: `Stock restauré avec succès pour ${stockUpdates.length} articles`,
        summary
      }

    } catch (error) {
      console.error('Erreur lors de la restauration du stock:', error)
      return {
        success: false,
        error: `Erreur lors de la restauration du stock: ${error.message}`
      }
    }
  }

  /**
   * Vérifie la disponibilité du stock pour une facture
   * @param {Object} invoice - La facture à vérifier
   * @returns {Promise<{available: boolean, warnings: Array}>}
   */
  static async checkStockAvailability(invoice) {
    try {
      if (!invoice.selectedItems || invoice.selectedItems.length === 0) {
        return { available: true, warnings: [] }
      }

      const warnings = []

      for (const item of invoice.selectedItems) {
        try {
          const itemRef = doc(db, 'items', item.id)
          const itemSnap = await getDoc(itemRef)
          
          if (!itemSnap.exists()) {
            warnings.push({
              itemName: item.name,
              type: 'error',
              message: 'Article non trouvé'
            })
            continue
          }

          const currentItem = itemSnap.data()
          const currentQuantity = currentItem.quantity || 0
          const requestedQuantity = item.quantity || 0

          if (currentQuantity < requestedQuantity) {
            warnings.push({
              itemName: item.name,
              type: 'warning',
              message: `Stock insuffisant. Disponible: ${currentQuantity}, Demandé: ${requestedQuantity}`,
              available: currentQuantity,
              requested: requestedQuantity
            })
          }
        } catch (itemError) {
          warnings.push({
            itemName: item.name,
            type: 'error',
            message: `Erreur lors de la vérification: ${itemError.message}`
          })
        }
      }

      const hasErrors = warnings.some(w => w.type === 'error')
      const hasWarnings = warnings.some(w => w.type === 'warning')

      return {
        available: !hasErrors && !hasWarnings,
        warnings: warnings,
        hasErrors,
        hasWarnings
      }

    } catch (error) {
      console.error('Erreur lors de la vérification du stock:', error)
      return {
        available: false,
        warnings: [{
          type: 'error',
          message: `Erreur lors de la vérification: ${error.message}`
        }]
      }
    }
  }
}
