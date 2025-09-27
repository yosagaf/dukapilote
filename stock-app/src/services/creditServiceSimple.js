import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase'

export class CreditServiceSimple {
  /**
   * Créer un nouveau crédit
   */
  static async createCredit(creditData) {
    try {
      const creditRef = await addDoc(collection(db, 'credits'), {
        ...creditData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return {
        success: true,
        id: creditRef.id,
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
   * Récupérer tous les crédits d'un magasin (version simple sans tri Firestore)
   */
  static async getCredits(shopId, filters = {}) {
    try {
      // Requête simple sans tri Firestore pour éviter les problèmes d'index
      const q = query(
        collection(db, 'credits'),
        where('shopId', '==', shopId)
      )

      const snapshot = await getDocs(q)
      let credits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Filtrer côté client si nécessaire
      if (filters.status) {
        credits = credits.filter(credit => credit.status === filters.status)
      }

      // Trier côté client par date de création (plus récent en premier)
      credits = credits.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
        return dateB - dateA
      })

      return {
        success: true,
        data: credits
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des crédits:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Récupérer un crédit par ID
   */
  static async getCreditById(creditId) {
    try {
      const creditRef = doc(db, 'credits', creditId)
      const creditSnap = await getDoc(creditRef)
      
      if (creditSnap.exists()) {
        return {
          success: true,
          data: {
            id: creditSnap.id,
            ...creditSnap.data()
          }
        }
      } else {
        return {
          success: false,
          error: 'Crédit non trouvé'
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du crédit:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Ajouter un paiement à un crédit
   */
  static async addPayment(creditId, paymentData) {
    try {
      // Récupérer le crédit actuel
      const creditResult = await this.getCreditById(creditId)
      if (!creditResult.success) {
        return creditResult
      }

      const credit = creditResult.data
      const newPaidAmount = credit.paidAmount + paymentData.amount
      const newRemainingAmount = credit.totalAmount - newPaidAmount
      
      // Déterminer le nouveau statut
      let newStatus = credit.status
      if (newRemainingAmount <= 0) {
        newStatus = 'completed'
      } else if (newPaidAmount > 0) {
        newStatus = 'partial'
      }

      // Mettre à jour le crédit
      const creditRef = doc(db, 'credits', creditId)
      await updateDoc(creditRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        updatedAt: serverTimestamp(),
        // Ajouter le paiement à l'historique
        payments: [
          ...(credit.payments || []),
          {
            ...paymentData,
            date: new Date(),
            id: Date.now().toString()
          }
        ]
      })

      return {
        success: true,
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus
        }
      }
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
      const creditRef = doc(db, 'credits', creditId)
      await updateDoc(creditRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      })

      return {
        success: true
      }
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
      const creditRef = doc(db, 'credits', creditId)
      await updateDoc(creditRef, {
        status: 'completed',
        updatedAt: serverTimestamp()
      })

      return {
        success: true
      }
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
      const creditsResult = await this.getCredits(shopId)
      if (!creditsResult.success) {
        return creditsResult
      }

      const credits = creditsResult.data
      
      // Fonction pour valider et nettoyer les montants
      const cleanAmount = (amount) => {
        if (typeof amount === 'string') {
          const cleaned = amount.replace(/[^\d.-]/g, '')
          const parsed = parseFloat(cleaned)
          return isNaN(parsed) ? 0 : parsed
        }
        return typeof amount === 'number' && !isNaN(amount) ? amount : 0
      }
      
      const stats = {
        totalCredits: credits.length,
        pendingCredits: credits.filter(c => c.status === 'pending').length,
        partialCredits: credits.filter(c => c.status === 'partial').length,
        completedCredits: credits.filter(c => c.status === 'completed').length,
        totalAmount: credits.reduce((sum, c) => sum + cleanAmount(c.totalAmount), 0),
        paidAmount: credits.reduce((sum, c) => sum + cleanAmount(c.paidAmount), 0),
        remainingAmount: credits.reduce((sum, c) => sum + cleanAmount(c.remainingAmount), 0)
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Vérifier le stock disponible pour les articles
   */
  static async validateStock(items) {
    try {
      const stockChecks = await Promise.all(
        items.map(async (item) => {
          const itemRef = doc(db, 'items', item.itemId)
          const itemSnap = await getDoc(itemRef)
          
          if (!itemSnap.exists()) {
            return {
              itemId: item.itemId,
              valid: false,
              error: 'Article non trouvé'
            }
          }

          const itemData = itemSnap.data()
          if (itemData.quantity < item.quantity) {
            return {
              itemId: item.itemId,
              valid: false,
              error: `Stock insuffisant. Disponible: ${itemData.quantity}, Demandé: ${item.quantity}`
            }
          }

          return {
            itemId: item.itemId,
            valid: true
          }
        })
      )

      const invalidItems = stockChecks.filter(check => !check.valid)
      
      return {
        success: invalidItems.length === 0,
        validItems: stockChecks.filter(check => check.valid),
        invalidItems: invalidItems
      }
    } catch (error) {
      console.error('Erreur lors de la validation du stock:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Réduire le stock après validation d'un crédit
   */
  static async updateStock(items) {
    try {
      const updatePromises = items.map(async (item) => {
        const itemRef = doc(db, 'items', item.itemId)
        const itemSnap = await getDoc(itemRef)
        
        if (itemSnap.exists()) {
          const currentQuantity = itemSnap.data().quantity
          const newQuantity = currentQuantity - item.quantity
          
          await updateDoc(itemRef, {
            quantity: newQuantity,
            updated_at: serverTimestamp()
          })
        }
      })

      await Promise.all(updatePromises)

      return {
        success: true
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Supprimer un crédit
   */
  static async deleteCredit(creditId) {
    try {
      const creditRef = doc(db, 'credits', creditId)
      await deleteDoc(creditRef)
      
      return {
        success: true,
        id: creditId
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du crédit:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
