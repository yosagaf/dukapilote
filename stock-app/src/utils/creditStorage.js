import { CreditServiceSimple } from '../services/creditServiceSimple'

export class CreditStorage {
  /**
   * Créer un nouveau crédit avec validation du stock
   */
  static async createCredit(creditData) {
    try {
      // Valider le stock avant de créer le crédit
      const stockValidation = await CreditServiceSimple.validateStock(creditData.items)
      if (!stockValidation.success) {
        return {
          success: false,
          error: 'Stock insuffisant pour certains articles',
          details: stockValidation.invalidItems
        }
      }

      // Créer le crédit
      const result = await CreditServiceSimple.createCredit(creditData)
      if (!result.success) {
        return result
      }

      // Réduire le stock après création du crédit
      const stockUpdate = await CreditServiceSimple.updateStock(creditData.items)
      if (!stockUpdate.success) {
        // Si la mise à jour du stock échoue, on pourrait annuler le crédit
        console.error('Erreur lors de la mise à jour du stock:', stockUpdate.error)
        return {
          success: false,
          error: 'Erreur lors de la mise à jour du stock'
        }
      }

      return {
        success: true,
        id: result.id,
        data: creditData
      }
    } catch (error) {
      console.error('Erreur lors de la création du crédit:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Récupérer tous les crédits avec cache local
   */
  static async getCredits(shopId, filters = {}) {
    try {
      const result = await CreditServiceSimple.getCredits(shopId, filters)
      
      if (result.success) {
        // Mettre en cache les données
        localStorage.setItem(`credits_${shopId}`, JSON.stringify({
          data: result.data,
          timestamp: Date.now()
        }))
      }

      return result
    } catch (error) {
      console.error('Erreur lors de la récupération des crédits:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Récupérer les crédits depuis le cache si disponible
   */
  static getCreditsFromCache(shopId) {
    try {
      const cached = localStorage.getItem(`credits_${shopId}`)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        // Cache valide pendant 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return {
            success: true,
            data: data,
            fromCache: true
          }
        }
      }
      return null
    } catch (error) {
      console.error('Erreur lors de la lecture du cache:', error)
      return null
    }
  }

  /**
   * Ajouter un paiement à un crédit
   */
  static async addPayment(creditId, paymentData) {
    try {
      const result = await CreditServiceSimple.addPayment(creditId, paymentData)
      
      if (result.success) {
        // Invalider le cache
        this.invalidateCache()
      }

      return result
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mettre à jour un crédit
   */
  static async updateCredit(creditId, updateData) {
    try {
      const result = await CreditServiceSimple.updateCredit(creditId, updateData)
      
      if (result.success) {
        // Invalider le cache
        this.invalidateCache()
      }

      return result
    } catch (error) {
      console.error('Erreur lors de la mise à jour du crédit:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Clôturer un crédit
   */
  static async closeCredit(creditId) {
    try {
      const result = await CreditServiceSimple.closeCredit(creditId)
      
      if (result.success) {
        // Invalider le cache
        this.invalidateCache()
      }

      return result
    } catch (error) {
      console.error('Erreur lors de la clôture du crédit:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Récupérer les statistiques des crédits
   */
  static async getCreditStats(shopId) {
    try {
      return await CreditServiceSimple.getCreditStats(shopId)
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Rechercher des crédits par nom de client
   */
  static async searchCredits(shopId, searchTerm) {
    try {
      const result = await CreditServiceSimple.getCredits(shopId)
      if (!result.success) {
        return result
      }

      const filteredCredits = result.data.filter(credit => 
        credit.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.customerFirstName.toLowerCase().includes(searchTerm.toLowerCase())
      )

      return {
        success: true,
        data: filteredCredits
      }
    } catch (error) {
      console.error('Erreur lors de la recherche des crédits:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Invalider le cache
   */
  static invalidateCache() {
    try {
      // Supprimer tous les caches de crédits
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('credits_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du cache:', error)
    }
  }

  /**
   * Exporter les crédits en format CSV
   */
  static exportCreditsToCSV(credits) {
    try {
      const headers = [
        'ID',
        'Client',
        'Date de rendez-vous',
        'Montant total',
        'Montant payé',
        'Reste à payer',
        'Statut',
        'Date de création'
      ]

      const csvContent = [
        headers.join(','),
        ...credits.map(credit => [
          credit.id,
          `"${credit.customerName} ${credit.customerFirstName}"`,
          new Date(credit.appointmentDate).toLocaleDateString('fr-FR'),
          credit.totalAmount,
          credit.paidAmount,
          credit.remainingAmount,
          credit.status,
          new Date(credit.createdAt).toLocaleDateString('fr-FR')
        ].join(','))
      ].join('\n')

      return csvContent
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      return null
    }
  }

  /**
   * Valider les données d'un crédit
   */
  static validateCreditData(creditData) {
    const errors = []

    if (!creditData.customerName || creditData.customerName.trim() === '') {
      errors.push('Le nom du client est requis')
    }

    if (!creditData.customerFirstName || creditData.customerFirstName.trim() === '') {
      errors.push('Le prénom du client est requis')
    }

    if (!creditData.birthPlace || creditData.birthPlace.trim() === '') {
      errors.push('Le lieu de naissance est requis')
    }

    if (!creditData.appointmentDate) {
      errors.push('La date de rendez-vous est requise')
    }

    if (!creditData.items || creditData.items.length === 0) {
      errors.push('Au moins un article est requis')
    }

    if (creditData.items) {
      creditData.items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Le nom de l'article ${index + 1} est requis`)
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`La quantité de l'article ${index + 1} doit être supérieure à 0`)
        }
        if (!item.price || item.price <= 0) {
          errors.push(`Le prix unitaire de l'article ${index + 1} doit être supérieur à 0`)
        }
      })
    }

    if (!creditData.totalAmount || creditData.totalAmount <= 0) {
      errors.push('Le montant total doit être supérieur à 0')
    }

    if (creditData.paidAmount < 0) {
      errors.push('Le montant payé ne peut pas être négatif')
    }

    if (creditData.paidAmount > creditData.totalAmount) {
      errors.push('Le montant payé ne peut pas dépasser le montant total')
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  /**
   * Supprimer un crédit
   */
  static async deleteCredit(creditId) {
    try {
      const result = await CreditServiceSimple.deleteCredit(creditId)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        id: creditId
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du crédit:', error)
      return {
        success: false,
        error: 'Erreur lors de la suppression du crédit'
      }
    }
  }
}
