import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { SalesStorage } from '../utils/salesStorage'
import { db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'
import Button from './common/Button'
import LoadingSpinner from './common/LoadingSpinner'

export default function QuickSaleButton({ item, onSaleComplete }) {
  const { userProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleQuickSale = async () => {
    if (!item || item.quantity <= 0) return

    setIsLoading(true)
    try {
      // Créer l'enregistrement de vente avec le prix de référence
      const saleRecord = SalesStorage.createSaleRecord(
        item,
        1, // Quantité par défaut
        item.price || 0, // Prix de référence
        userProfile.shopId,
        userProfile.uid
      )

      // Sauvegarder la vente
      const result = await SalesStorage.saveSale(saleRecord)
      if (!result.success) {
        throw new Error(result.error)
      }

      // Mettre à jour le stock
      const newQuantity = item.quantity - 1
      const itemRef = doc(db, 'items', item.id)
      await updateDoc(itemRef, {
        quantity: newQuantity,
        updated_at: new Date()
      })

      // Appeler le callback
      if (onSaleComplete) {
        onSaleComplete({
          ...item,
          quantity: newQuantity
        })
      }

    } catch (error) {
      console.error('Erreur lors de la vente rapide:', error)
      alert('Erreur lors de la vente: ' + error.message)
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  if (item.quantity <= 0) {
    return (
      <button
        disabled
        className="bg-gray-100 text-gray-400 px-3 py-1 rounded-md text-xs font-medium cursor-not-allowed"
      >
        Stock épuisé
      </button>
    )
  }

  if (showConfirm) {
    return (
      <div key="confirm-buttons" className="flex space-x-2">
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-1 rounded-md text-xs font-medium transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleQuickSale}
          disabled={isLoading}
          className="bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-1">Vente...</span>
            </>
          ) : (
            'Confirmer'
          )}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={isLoading}
      className="bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 px-3 py-1 rounded-md text-xs font-medium transition-colors"
    >
      Vente Rapide
    </button>
  )
}
