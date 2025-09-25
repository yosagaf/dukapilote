import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Service pour la gestion des magasins
 */
export class ShopService {
  /**
   * Créer un nouveau magasin
   * @param {Object} shopData - Données du magasin
   * @returns {Promise<string>} ID du magasin créé
   */
  static async createShop(shopData) {
    try {
      const docRef = await addDoc(collection(db, 'shops'), {
        ...shopData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (error) {
      console.error('Erreur lors de la création du magasin:', error)
      throw new Error('Impossible de créer le magasin')
    }
  }

  /**
   * Mettre à jour un magasin
   * @param {string} shopId - ID du magasin
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<void>}
   */
  static async updateShop(shopId, updateData) {
    try {
      const shopRef = doc(db, 'shops', shopId)
      await updateDoc(shopRef, {
        ...updateData,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du magasin:', error)
      throw new Error('Impossible de mettre à jour le magasin')
    }
  }

  /**
   * Supprimer un magasin
   * @param {string} shopId - ID du magasin
   * @returns {Promise<void>}
   */
  static async deleteShop(shopId) {
    try {
      const shopRef = doc(db, 'shops', shopId)
      await deleteDoc(shopRef)
    } catch (error) {
      console.error('Erreur lors de la suppression du magasin:', error)
      throw new Error('Impossible de supprimer le magasin')
    }
  }

  /**
   * Récupérer un magasin par ID
   * @param {string} shopId - ID du magasin
   * @returns {Promise<Object|null>} Magasin ou null si non trouvé
   */
  static async getShopById(shopId) {
    try {
      const shopRef = doc(db, 'shops', shopId)
      const shopSnap = await getDoc(shopRef)
      
      if (shopSnap.exists()) {
        return {
          id: shopSnap.id,
          ...shopSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Erreur lors de la récupération du magasin:', error)
      throw new Error('Impossible de récupérer le magasin')
    }
  }

  /**
   * Vérifier si un magasin existe
   * @param {string} shopId - ID du magasin
   * @returns {Promise<boolean>} True si le magasin existe
   */
  static async shopExists(shopId) {
    try {
      const shopRef = doc(db, 'shops', shopId)
      const shopSnap = await getDoc(shopRef)
      return shopSnap.exists()
    } catch (error) {
      console.error('Erreur lors de la vérification du magasin:', error)
      return false
    }
  }

  /**
   * Mettre à jour les informations de contact d'un magasin
   * @param {string} shopId - ID du magasin
   * @param {Object} contactInfo - Informations de contact
   * @returns {Promise<void>}
   */
  static async updateShopContact(shopId, contactInfo) {
    try {
      const shopRef = doc(db, 'shops', shopId)
      await updateDoc(shopRef, {
        ...contactInfo,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations de contact:', error)
      throw new Error('Impossible de mettre à jour les informations de contact')
    }
  }

  /**
   * Ajouter un dépôt lié à un magasin
   * @param {string} shopId - ID du magasin
   * @param {string} depotId - ID du dépôt
   * @returns {Promise<void>}
   */
  static async linkDepotToShop(shopId, depotId) {
    try {
      const shopRef = doc(db, 'shops', shopId)
      const shopSnap = await getDoc(shopRef)
      
      if (shopSnap.exists()) {
        const shopData = shopSnap.data()
        const linkedDepotIds = shopData.linkedDepotIds || []
        
        if (!linkedDepotIds.includes(depotId)) {
          linkedDepotIds.push(depotId)
          await updateDoc(shopRef, {
            linkedDepotIds: linkedDepotIds,
            updatedAt: new Date()
          })
        }
      }
    } catch (error) {
      console.error('Erreur lors de la liaison du dépôt:', error)
      throw new Error('Impossible de lier le dépôt au magasin')
    }
  }

  /**
   * Retirer un dépôt lié d'un magasin
   * @param {string} shopId - ID du magasin
   * @param {string} depotId - ID du dépôt
   * @returns {Promise<void>}
   */
  static async unlinkDepotFromShop(shopId, depotId) {
    try {
      const shopRef = doc(db, 'shops', shopId)
      const shopSnap = await getDoc(shopRef)
      
      if (shopSnap.exists()) {
        const shopData = shopSnap.data()
        const linkedDepotIds = shopData.linkedDepotIds || []
        const updatedLinkedDepotIds = linkedDepotIds.filter(id => id !== depotId)
        
        await updateDoc(shopRef, {
          linkedDepotIds: updatedLinkedDepotIds,
          updatedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la liaison du dépôt:', error)
      throw new Error('Impossible de supprimer la liaison du dépôt')
    }
  }
}
