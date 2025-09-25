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
      <Button
        variant="secondary"
        size="sm"
        disabled
        className="opacity-50"
      >
        Stock épuisé
      </Button>
    )
  }

  if (showConfirm) {
    return (
      <div key="confirm-buttons" className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleQuickSale}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Vente...
            </>
          ) : (
            'Confirmer'
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => setShowConfirm(true)}
      disabled={isLoading}
    >
      Vente Rapide
    </Button>
  )
}
