import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { SalesStorage } from '../utils/salesStorage'
import { db } from '../firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import Modal from './common/Modal'
import Button from './common/Button'
import LoadingSpinner from './common/LoadingSpinner'
import FormField from './forms/FormField'

export default function SalesModal({ isOpen, onClose, selectedItem, onSaleComplete }) {
  const { userProfile } = useAuth()
  const [formData, setFormData] = useState({
    quantity: '',
    unitPrice: '',
    totalPrice: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (selectedItem && isOpen) {
      setFormData({
        quantity: '',
        unitPrice: selectedItem.price || '',
        totalPrice: 0
      })
      setError('')
      setSuccess(false)
    }
  }, [selectedItem, isOpen])

  useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0
    const unitPrice = parseFloat(formData.unitPrice) || 0
    const totalPrice = quantity * unitPrice
    setFormData(prev => ({ ...prev, totalPrice }))
  }, [formData.quantity, formData.unitPrice])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.quantity || formData.quantity <= 0) {
      setError('La quantité doit être supérieure à 0')
      return false
    }
    if (!formData.unitPrice || formData.unitPrice <= 0) {
      setError('Le prix unitaire doit être supérieur à 0')
      return false
    }
    if (parseFloat(formData.quantity) > selectedItem.quantity) {
      setError(`Quantité insuffisante. Stock disponible: ${selectedItem.quantity}`)
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const quantity = parseFloat(formData.quantity)
      const unitPrice = parseFloat(formData.unitPrice)
      const totalPrice = quantity * unitPrice

      // Créer l'enregistrement de vente
      const saleRecord = SalesStorage.createSaleRecord(
        selectedItem,
        quantity,
        unitPrice,
        userProfile.shopId,
        userProfile.uid
      )

      // Sauvegarder la vente
      const result = await SalesStorage.saveSale(saleRecord)
      if (!result.success) {
        throw new Error(result.error)
      }

      // Mettre à jour le stock de l'article
      const newQuantity = selectedItem.quantity - quantity
      const itemRef = doc(db, 'items', selectedItem.id)
      await updateDoc(itemRef, {
        quantity: newQuantity,
        updated_at: new Date()
      })

      setSuccess(true)
      
      // Appeler le callback pour rafraîchir les données
      if (onSaleComplete) {
        onSaleComplete({
          ...selectedItem,
          quantity: newQuantity
        })
      }

      // Fermer le modal après un délai
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vente:', error)
      setError(error.message || 'Erreur lors de l\'enregistrement de la vente')
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedItem) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer une Vente">
      <div className="p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vente enregistrée avec succès !</h3>
            <p className="text-gray-600">La vente a été enregistrée et le stock mis à jour.</p>
          </div>
        ) : (
          <>
            {/* Informations de l'article */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Article à vendre</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nom:</span>
                  <span className="ml-2 font-medium">{selectedItem.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Catégorie:</span>
                  <span className="ml-2 font-medium">{selectedItem.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">Stock disponible:</span>
                  <span className="ml-2 font-medium text-blue-600">{selectedItem.quantity} unité(s)</span>
                </div>
                <div>
                  <span className="text-gray-600">Prix de référence:</span>
                  <span className="ml-2 font-medium text-green-600">{selectedItem.price || 'Non défini'} KMF</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Quantité vendue"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  max={selectedItem.quantity}
                  required
                  placeholder="Ex: 5"
                />
                <FormField
                  label="Prix unitaire (KMF)"
                  name="unitPrice"
                  type="number"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="Ex: 1500"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total de la vente:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formData.totalPrice.toLocaleString('fr-FR')} KMF
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !formData.quantity || !formData.unitPrice}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer la vente'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}
