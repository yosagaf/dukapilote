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
 * Service pour la gestion des articles
 */
export class ItemService {
  /**
   * Créer un nouvel article
   * @param {Object} itemData - Données de l'article
   * @returns {Promise<string>} ID de l'article créé
   */
  static async createItem(itemData) {
    try {
      const docRef = await addDoc(collection(db, 'items'), {
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (error) {
      console.error('Erreur lors de la création de l\'article:', error)
      throw new Error('Impossible de créer l\'article')
    }
  }

  /**
   * Mettre à jour un article
   * @param {string} itemId - ID de l'article
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<void>}
   */
  static async updateItem(itemId, updateData) {
    try {
      const itemRef = doc(db, 'items', itemId)
      await updateDoc(itemRef, {
        ...updateData,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error)
      throw new Error('Impossible de mettre à jour l\'article')
    }
  }

  /**
   * Supprimer un article
   * @param {string} itemId - ID de l'article
   * @returns {Promise<void>}
   */
  static async deleteItem(itemId) {
    try {
      const itemRef = doc(db, 'items', itemId)
      await deleteDoc(itemRef)
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error)
      throw new Error('Impossible de supprimer l\'article')
    }
  }

  /**
   * Récupérer un article par ID
   * @param {string} itemId - ID de l'article
   * @returns {Promise<Object|null>} Article ou null si non trouvé
   */
  static async getItemById(itemId) {
    try {
      const itemRef = doc(db, 'items', itemId)
      const itemSnap = await getDoc(itemRef)
      
      if (itemSnap.exists()) {
        return {
          id: itemSnap.id,
          ...itemSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article:', error)
      throw new Error('Impossible de récupérer l\'article')
    }
  }

  /**
   * Récupérer les articles d'un magasin
   * @param {string} shopId - ID du magasin
   * @returns {Promise<Array>} Liste des articles
   */
  static async getItemsByShop(shopId) {
    try {
      const itemsQuery = query(
        collection(db, 'items'),
        where('shopId', '==', shopId),
        orderBy('name')
      )
      
      // Note: Cette fonction nécessite un listener onSnapshot dans le composant
      // car elle retourne une query, pas les données directement
      return itemsQuery
    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error)
      throw new Error('Impossible de récupérer les articles')
    }
  }

  /**
   * Rechercher des articles par nom
   * @param {string} searchTerm - Terme de recherche
   * @param {string} shopId - ID du magasin (optionnel)
   * @returns {Promise<Array>} Liste des articles correspondants
   */
  static async searchItems(searchTerm, shopId = null) {
    try {
      let itemsQuery = query(collection(db, 'items'))
      
      if (shopId) {
        itemsQuery = query(
          collection(db, 'items'),
          where('shopId', '==', shopId),
          orderBy('name')
        )
      }
      
      // Note: Cette fonction nécessite un listener onSnapshot dans le composant
      // car elle retourne une query, pas les données directement
      return itemsQuery
    } catch (error) {
      console.error('Erreur lors de la recherche d\'articles:', error)
      throw new Error('Impossible de rechercher les articles')
    }
  }

  /**
   * Mettre à jour la quantité d'un article
   * @param {string} itemId - ID de l'article
   * @param {number} newQuantity - Nouvelle quantité
   * @returns {Promise<void>}
   */
  static async updateItemQuantity(itemId, newQuantity) {
    try {
      const itemRef = doc(db, 'items', itemId)
      await updateDoc(itemRef, {
        quantity: newQuantity,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error)
      throw new Error('Impossible de mettre à jour la quantité')
    }
  }

  /**
   * Mettre à jour le prix d'un article
   * @param {string} itemId - ID de l'article
   * @param {number} newPrice - Nouveau prix
   * @returns {Promise<void>}
   */
  static async updateItemPrice(itemId, newPrice) {
    try {
      const itemRef = doc(db, 'items', itemId)
      await updateDoc(itemRef, {
        price: newPrice,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prix:', error)
      throw new Error('Impossible de mettre à jour le prix')
    }
  }

  /**
   * Vérifier si un article existe
   * @param {string} itemId - ID de l'article
   * @returns {Promise<boolean>} True si l'article existe
   */
  static async itemExists(itemId) {
    try {
      const itemRef = doc(db, 'items', itemId)
      const itemSnap = await getDoc(itemRef)
      return itemSnap.exists()
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'article:', error)
      return false
    }
  }
}
