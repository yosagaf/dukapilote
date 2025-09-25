// Utilitaires pour la gestion des transferts avec persistance hybride
import { collection, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const TRANSFERS_CACHE_KEY = 'transfers_cache'
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

export class TransferStorage {
  static getCacheKey(userId) {
    return `${TRANSFERS_CACHE_KEY}_${userId}`
  }

  // Sauvegarder un transfert dans Firestore ET le cache local
  static async saveTransfer(transferData) {
    try {
      // 1. Sauvegarder dans Firestore
      const docRef = await addDoc(collection(db, 'transfers'), {
        ...transferData,
        created_at: new Date(),
        updated_at: new Date()
      })

      // 2. Mettre à jour le cache local
      this.updateLocalCache(transferData.userId, {
        id: docRef.id,
        ...transferData,
        created_at: new Date(),
        updated_at: new Date()
      })

      return docRef.id
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du transfert:', error)
      throw error
    }
  }

  // Mettre à jour le cache local
  static updateLocalCache(userId, transfer) {
    try {
      const cacheKey = this.getCacheKey(userId)
      const existingCache = this.getLocalCache(userId)
      
      const updatedCache = {
        transfers: [transfer, ...(existingCache?.transfers || [])].slice(0, 50), // Garder seulement les 50 derniers
        lastUpdated: Date.now()
      }

      localStorage.setItem(cacheKey, JSON.stringify(updatedCache))
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache local:', error)
    }
  }

  // Récupérer le cache local
  static getLocalCache(userId) {
    try {
      const cacheKey = this.getCacheKey(userId)
      const cached = localStorage.getItem(cacheKey)
      
      if (!cached) return null

      const parsed = JSON.parse(cached)
      
      // Vérifier si le cache n'est pas expiré
      if (Date.now() - parsed.lastUpdated > CACHE_EXPIRY_MS) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return parsed
    } catch (error) {
      console.error('Erreur lors de la récupération du cache local:', error)
      return null
    }
  }

  // Récupérer les transferts (Firestore + cache local)
  static async getTransfers(userId, isAdmin = false, limitCount = 5) {
    try {
      // 1. Essayer d'abord le cache local pour une réponse rapide
      const localCache = this.getLocalCache(userId)
      if (localCache && localCache.transfers.length > 0) {
        return localCache.transfers.slice(0, limitCount)
      }

      // 2. Si pas de cache, récupérer depuis Firestore
      return await this.getTransfersFromFirestore(userId, isAdmin, limitCount)
    } catch (error) {
      console.error('Erreur lors de la récupération des transferts:', error)
      return []
    }
  }

  // Récupérer depuis Firestore
  static async getTransfersFromFirestore(userId, isAdmin, limitCount) {
    return new Promise((resolve, reject) => {
      let q
      
      if (isAdmin) {
        q = query(
          collection(db, 'transfers'),
          orderBy('created_at', 'desc'),
          limit(limitCount)
        )
      } else {
        q = query(
          collection(db, 'transfers'),
          where('userId', '==', userId),
          orderBy('created_at', 'desc'),
          limit(limitCount)
        )
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const transfers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Mettre à jour le cache local
        if (transfers.length > 0) {
          this.updateLocalCache(userId, transfers[0])
        }

        resolve(transfers)
        unsubscribe()
      }, (error) => {
        console.error('Erreur Firestore:', error)
        reject(error)
      })
    })
  }

  // Nettoyer le cache expiré
  static cleanExpiredCache() {
    try {
      const keys = Object.keys(localStorage)
      const transferKeys = keys.filter(key => key.startsWith(TRANSFERS_CACHE_KEY))
      
      transferKeys.forEach(key => {
        const cached = localStorage.getItem(key)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.lastUpdated > CACHE_EXPIRY_MS) {
            localStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache:', error)
    }
  }

  // Obtenir les statistiques des transferts
  static getTransferStats(userId) {
    const cache = this.getLocalCache(userId)
    if (!cache) return null

    const transfers = cache.transfers
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const stats = {
      total: transfers.length,
      today: transfers.filter(t => {
        const transferDate = t.created_at?.toDate?.() || new Date(t.created_at)
        return transferDate >= todayStart
      }).length,
      thisWeek: transfers.filter(t => {
        const transferDate = t.created_at?.toDate?.() || new Date(t.created_at)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return transferDate >= weekAgo
      }).length,
      byType: {
        transfer: transfers.filter(t => t.type === 'transfer').length,
        remove: transfers.filter(t => t.type === 'remove').length
      }
    }

    return stats
  }

  // Exporter les transferts en format pour Excel/PDF
  static exportTransferData(transferData, format = 'excel') {
    const headers = [
      'Date de Transfert',
      'Article',
      'Quantité',
      'Dépôt Source',
      'Magasin Destination',
      'Type',
      'Utilisateur'
    ]

    const rows = transferData.map(transfer => {
      const date = transfer.created_at?.toDate ? 
        transfer.created_at.toDate() : 
        new Date(transfer.created_at)
      
      return [
        date.toLocaleDateString('fr-FR'),
        transfer.itemName || 'N/A',
        transfer.quantity || 0,
        transfer.fromDepotName || 'N/A',
        transfer.toShopName || 'N/A',
        transfer.type === 'transfer' ? 'Transfert' : 'Retrait',
        transfer.userName || 'N/A'
      ]
    })

    return {
      headers,
      rows,
      totalRecords: transferData.length
    }
  }
}

// Nettoyer le cache au démarrage de l'application
TransferStorage.cleanExpiredCache()
