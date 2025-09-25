import { db } from '../firebase'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'

const LOCAL_STORAGE_KEY = 'salesHistory'
const CACHE_EXPIRATION_MINUTES = 5

export const SalesStorage = {
  // Structure d'une vente
  createSaleRecord: (item, quantity, price, shopId, userId) => {
    const now = new Date()
    return {
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.category,
      quantity: quantity,
      unitPrice: price,
      totalPrice: quantity * price,
      shopId: shopId,
      userId: userId,
      saleDate: now,
      created_at: now,
      updated_at: now
    }
  },

  // Sauvegarder une vente
  async saveSale(saleRecord) {
    try {
      const now = new Date()
      const recordToSave = {
        ...saleRecord,
        saleDate: saleRecord.saleDate || now,
        created_at: saleRecord.created_at || now,
        updated_at: saleRecord.updated_at || now
      }

      // Sauvegarder dans Firestore
      await addDoc(collection(db, 'sales'), recordToSave)

      // Sauvegarder dans le cache local
      this._updateLocalCache(recordToSave)

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la vente:', error)
      return { success: false, error: error.message }
    }
  },

  // Récupérer les ventes
  async getSales(userId, isAdmin, limitCount = 50) {
    // Essayer de charger depuis le cache local d'abord
    const cachedData = this._loadLocalCache(userId, isAdmin)
    if (cachedData && cachedData.length > 0) {
      return cachedData.slice(0, limitCount)
    }

    // Si pas en cache ou expiré, récupérer depuis Firestore
    try {
      let q
      if (isAdmin) {
        q = query(collection(db, 'sales'), orderBy('created_at', 'desc'), limit(limitCount))
      } else {
        q = query(
          collection(db, 'sales'), 
          where('userId', '==', userId), 
          orderBy('created_at', 'desc'), 
          limit(limitCount)
        )
      }

      const querySnapshot = await getDocs(q)
      const sales = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at instanceof Timestamp 
          ? doc.data().created_at 
          : new Timestamp(doc.data().created_at.seconds, doc.data().created_at.nanoseconds),
        updated_at: doc.data().updated_at instanceof Timestamp 
          ? doc.data().updated_at 
          : new Timestamp(doc.data().updated_at.seconds, doc.data().updated_at.nanoseconds)
      }))

      // Mettre à jour le cache local avec les données fraîches
      this._updateLocalCache(sales, true)

      return sales
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes depuis Firestore:', error)
      return []
    }
  },

  // Récupérer les ventes par période
  async getSalesByPeriod(userId, isAdmin, startDate, endDate) {
    try {
      let q
      if (isAdmin) {
        q = query(
          collection(db, 'sales'),
          where('saleDate', '>=', startDate),
          where('saleDate', '<=', endDate),
          orderBy('saleDate', 'desc')
        )
      } else {
        q = query(
          collection(db, 'sales'),
          where('userId', '==', userId),
          where('saleDate', '>=', startDate),
          where('saleDate', '<=', endDate),
          orderBy('saleDate', 'desc')
        )
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes par période:', error)
      return []
    }
  },

  // Statistiques des ventes
  getSalesStats(userId, salesData) {
    const userSales = salesData.filter(sale => sale.userId === userId)
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    const thisYearStart = new Date(now.getFullYear(), 0, 1) // 1er janvier de l'année en cours
    

    const stats = {
      today: { count: 0, total: 0 },
      yesterday: { count: 0, total: 0 },
      thisWeek: { count: 0, total: 0 },
      thisMonth: { count: 0, total: 0 },
      thisYear: { count: 0, total: 0 },
      lastThreeMonths: { count: 0, total: 0 },
      allTime: { count: userSales.length, total: 0 }
    }

    userSales.forEach(sale => {
      // Gestion robuste des dates Firestore
      let saleDate
      try {
        if (sale.saleDate && typeof sale.saleDate.toDate === 'function') {
          // Timestamp Firestore
          saleDate = sale.saleDate.toDate()
        } else if (sale.saleDate && sale.saleDate.seconds) {
          // Timestamp Firestore en format objet
          saleDate = new Date(sale.saleDate.seconds * 1000)
        } else if (sale.saleDate) {
          // Date string ou autre format
          saleDate = new Date(sale.saleDate)
        } else {
          // Fallback sur created_at si saleDate n'existe pas
          if (sale.created_at && typeof sale.created_at.toDate === 'function') {
            saleDate = sale.created_at.toDate()
          } else if (sale.created_at && sale.created_at.seconds) {
            saleDate = new Date(sale.created_at.seconds * 1000)
          } else {
            saleDate = new Date(sale.created_at || new Date())
          }
        }
        
        // Vérifier que la date est valide
        if (isNaN(saleDate.getTime())) {
          console.warn('Invalid date for sale:', sale)
          saleDate = new Date() // Fallback sur la date actuelle
        }
      } catch (error) {
        console.warn('Error parsing sale date:', error, sale)
        saleDate = new Date() // Fallback sur la date actuelle
      }

      const total = sale.totalPrice || (sale.quantity * sale.unitPrice)

      stats.allTime.total += total

      if (saleDate >= today && saleDate < tomorrow) {
        stats.today.count++
        stats.today.total += total
      }
      if (saleDate >= yesterday && saleDate < today) {
        stats.yesterday.count++
        stats.yesterday.total += total
      }
      if (saleDate >= oneWeekAgo) {
        stats.thisWeek.count++
        stats.thisWeek.total += total
      }
      if (saleDate >= oneMonthAgo) {
        stats.thisMonth.count++
        stats.thisMonth.total += total
      }
      if (saleDate >= thisYearStart) {
        stats.thisYear.count++
        stats.thisYear.total += total
      }
      if (saleDate >= threeMonthsAgo) {
        stats.lastThreeMonths.count++
        stats.lastThreeMonths.total += total
      }
    })
    

    return stats
  },

  // Mettre à jour le cache local
  _updateLocalCache(newRecordOrRecords, overwrite = false) {
    let currentCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { data: [], timestamp: 0 }
    let sales = currentCache.data

    if (overwrite) {
      sales = Array.isArray(newRecordOrRecords) ? newRecordOrRecords : [newRecordOrRecords]
    } else {
      if (Array.isArray(newRecordOrRecords)) {
        sales = [...newRecordOrRecords, ...sales]
      } else {
        sales = [newRecordOrRecords, ...sales]
      }
    }

    // Garder seulement les 100 dernières ventes en cache
    sales = sales.slice(0, 100)

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      data: sales,
      timestamp: Date.now()
    }))
  },

  // Charger depuis le cache local
  _loadLocalCache(userId, isAdmin) {
    const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY))
    if (!cached || !cached.data || !cached.timestamp) return null

    const now = Date.now()
    const cacheAge = (now - cached.timestamp) / (1000 * 60) // en minutes

    if (cacheAge > CACHE_EXPIRATION_MINUTES) {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      return null
    }

    // Filtrer les données en cache par utilisateur si pas admin
    if (!isAdmin) {
      return cached.data.filter(s => s.userId === userId)
    }

    return cached.data
  },

  // Exporter les ventes en format pour Excel/PDF
  exportSalesData(salesData, format = 'excel') {
    const headers = [
      'Date de Vente',
      'Article',
      'Catégorie',
      'Quantité',
      'Prix Unitaire',
      'Prix Total'
    ]

    const rows = salesData.map(sale => [
      sale.saleDate.toDate ? sale.saleDate.toDate().toLocaleDateString('fr-FR') : new Date(sale.saleDate).toLocaleDateString('fr-FR'),
      sale.itemName,
      sale.itemCategory,
      sale.quantity,
      sale.unitPrice,
      sale.totalPrice
    ])

    return {
      headers,
      rows,
      format
    }
  }
}
