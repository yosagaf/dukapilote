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
 * Service pour la gestion des utilisateurs
 */
export class UserService {
  /**
   * Créer un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<string>} ID de l'utilisateur créé
   */
  static async createUser(userData) {
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error)
      throw new Error('Impossible de créer l\'utilisateur')
    }
  }

  /**
   * Mettre à jour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<void>}
   */
  static async updateUser(userId, updateData) {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
      throw new Error('Impossible de mettre à jour l\'utilisateur')
    }
  }

  /**
   * Supprimer un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<void>}
   */
  static async deleteUser(userId) {
    try {
      const userRef = doc(db, 'users', userId)
      await deleteDoc(userRef)
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error)
      throw new Error('Impossible de supprimer l\'utilisateur')
    }
  }

  /**
   * Récupérer un utilisateur par ID
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object|null>} Utilisateur ou null si non trouvé
   */
  static async getUserById(userId) {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        return {
          id: userSnap.id,
          ...userSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      throw new Error('Impossible de récupérer l\'utilisateur')
    }
  }

  /**
   * Récupérer les utilisateurs d'un magasin
   * @param {string} shopId - ID du magasin
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  static async getUsersByShop(shopId) {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('shopId', '==', shopId),
        orderBy('email')
      )
      
      // Note: Cette fonction nécessite un listener onSnapshot dans le composant
      return usersQuery
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
      throw new Error('Impossible de récupérer les utilisateurs')
    }
  }

  /**
   * Vérifier si un utilisateur existe
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} True si l'utilisateur existe
   */
  static async userExists(userId) {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      return userSnap.exists()
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error)
      return false
    }
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} newRole - Nouveau rôle
   * @returns {Promise<void>}
   */
  static async updateUserRole(userId, newRole) {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error)
      throw new Error('Impossible de mettre à jour le rôle')
    }
  }

  /**
   * Mettre à jour le magasin d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} shopId - ID du magasin
   * @returns {Promise<void>}
   */
  static async updateUserShop(userId, shopId) {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        shopId: shopId,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du magasin:', error)
      throw new Error('Impossible de mettre à jour le magasin')
    }
  }
}
