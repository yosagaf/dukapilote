/**
 * Utilitaires de calculs pour l'application
 */

/**
 * Calcule la valeur totale du stock
 * @param {Array} items - Liste des articles
 * @returns {number} Valeur totale
 */
export const calculateTotalValue = (items) => {
  return items.reduce((total, item) => 
    total + ((item.quantity || 0) * (item.price || 0)), 0)
}

/**
 * Calcule la quantité totale des articles
 * @param {Array} items - Liste des articles
 * @returns {number} Quantité totale
 */
export const calculateTotalQuantity = (items) => {
  return items.reduce((total, item) => total + (item.quantity || 0), 0)
}

/**
 * Détermine le statut du stock d'un article
 * @param {number} quantity - Quantité actuelle
 * @param {number} minThreshold - Seuil minimum
 * @returns {string} Statut du stock ('out', 'low', 'good')
 */
export const getStockStatus = (quantity, minThreshold) => {
  if (quantity === 0) return 'out'
  if (quantity <= minThreshold) return 'low'
  return 'good'
}

/**
 * Obtient le texte du statut du stock
 * @param {string} status - Statut du stock
 * @returns {string} Texte du statut
 */
export const getStockStatusText = (status) => {
  switch (status) {
    case 'out': return 'Rupture'
    case 'low': return 'Stock faible'
    case 'good': return 'En stock'
    default: return 'N/A'
  }
}

/**
 * Obtient la couleur du statut du stock
 * @param {string} status - Statut du stock
 * @returns {string} Classes CSS pour la couleur
 */
export const getStockStatusColor = (status) => {
  switch (status) {
    case 'out': return 'text-red-600 bg-red-50'
    case 'low': return 'text-orange-600 bg-orange-50'
    case 'good': return 'text-green-600 bg-green-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Calcule les statistiques du stock
 * @param {Array} items - Liste des articles
 * @returns {Object} Statistiques du stock
 */
export const calculateStockStats = (items) => {
  const totalItems = items.length
  const stockOut = items.filter(item => item.quantity === 0).length
  const stockLow = items.filter(item => 
    item.quantity <= item.minThreshold && item.quantity > 0
  ).length
  const stockNormal = items.filter(item => 
    item.quantity > item.minThreshold
  ).length
  const totalQuantity = calculateTotalQuantity(items)
  const totalValue = calculateTotalValue(items)

  return {
    totalItems,
    stockOut,
    stockLow,
    stockNormal,
    totalQuantity,
    totalValue
  }
}

/**
 * Calcule les statistiques des ventes
 * @param {Array} sales - Liste des ventes
 * @returns {Object} Statistiques des ventes
 */
export const calculateSalesStats = (sales) => {
  const totalSales = sales.length
  const totalRevenue = sales.reduce((total, sale) => 
    total + (sale.totalPrice || 0), 0)
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

  return {
    totalSales,
    totalRevenue,
    averageSale
  }
}

/**
 * Filtre les articles par statut
 * @param {Array} items - Liste des articles
 * @param {string} status - Statut à filtrer ('all', 'good', 'low', 'out')
 * @returns {Array} Articles filtrés
 */
export const filterItemsByStatus = (items, status) => {
  if (status === 'all') return items
  
  return items.filter(item => {
    const itemStatus = getStockStatus(item.quantity, item.minThreshold)
    return itemStatus === status
  })
}

/**
 * Trie les articles par champ
 * @param {Array} items - Liste des articles
 * @param {string} field - Champ de tri
 * @param {string} direction - Direction du tri ('asc', 'desc')
 * @returns {Array} Articles triés
 */
export const sortItems = (items, field, direction = 'asc') => {
  return [...items].sort((a, b) => {
    let aVal = a[field]
    let bVal = b[field]

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
}
