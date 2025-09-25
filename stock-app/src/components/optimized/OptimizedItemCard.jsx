import React, { memo, useMemo } from 'react'
import { getStockStatus, getStockStatusText, getStockStatusColor } from '../../utils/calculations'

/**
 * Composant ItemCard optimisé avec React.memo
 * @param {Object} item - Article à afficher
 * @param {Function} onEdit - Fonction appelée lors de l'édition
 * @param {Function} onDelete - Fonction appelée lors de la suppression
 * @param {Function} onTransfer - Fonction appelée lors du transfert
 * @param {Function} onWithdraw - Fonction appelée lors du retrait
 * @param {Function} onQuickSale - Fonction appelée lors de la vente rapide
 */
const OptimizedItemCard = memo(({ 
  item, 
  onEdit, 
  onDelete, 
  onTransfer, 
  onWithdraw, 
  onQuickSale 
}) => {
  // Mémoriser les calculs coûteux
  const stockStatus = useMemo(() => 
    getStockStatus(item.quantity, item.minThreshold), 
    [item.quantity, item.minThreshold]
  )
  
  const stockStatusText = useMemo(() => 
    getStockStatusText(stockStatus), 
    [stockStatus]
  )
  
  const stockStatusColor = useMemo(() => 
    getStockStatusColor(stockStatus), 
    [stockStatus]
  )
  
  const totalValue = useMemo(() => 
    (item.quantity || 0) * (item.price || 0), 
    [item.quantity, item.price]
  )

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
            <span className="text-teal-600 font-semibold text-lg">
              {item.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.category || 'Sans catégorie'}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatusColor}`}>
          {stockStatusText}
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Quantité:</span>
          <span className="text-sm font-medium">{item.quantity || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Prix unitaire:</span>
          <span className="text-sm font-medium">{item.price ? `${item.price} FCFA` : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Valeur totale:</span>
          <span className="text-sm font-medium">{totalValue} FCFA</span>
        </div>
        {item.minThreshold && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Seuil minimum:</span>
            <span className="text-sm font-medium">{item.minThreshold}</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          Modifier
        </button>
        <button
          onClick={() => onDelete(item)}
          className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
        >
          Supprimer
        </button>
      </div>
      
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onTransfer(item)}
          className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-md hover:bg-green-100 transition-colors text-sm font-medium"
        >
          Transférer
        </button>
        <button
          onClick={() => onWithdraw(item)}
          className="flex-1 bg-orange-50 text-orange-600 px-3 py-2 rounded-md hover:bg-orange-100 transition-colors text-sm font-medium"
        >
          Retirer
        </button>
      </div>
      
      <button
        onClick={() => onQuickSale(item)}
        className="w-full mt-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-md hover:from-teal-700 hover:to-teal-800 transition-all duration-200 text-sm font-medium"
      >
        Vente Rapide
      </button>
    </div>
  )
})

OptimizedItemCard.displayName = 'OptimizedItemCard'

export default OptimizedItemCard
