import { useState } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { TransferStorage } from '../utils/transferStorage'

export default function WithdrawModal({ onClose, item, depotId, shopId }) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [withdrawType, setWithdrawType] = useState('transfer') // 'transfer' ou 'remove'
  const { userProfile } = useAuth()

  // Fonction pour nettoyer les objets avant de les envoyer à Firebase
  const cleanObject = (obj) => {
    const cleaned = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value
      }
    }
    return cleaned
  }

  const handleWithdraw = async () => {
    if (quantity <= 0 || quantity > item.quantity) {
      setError('Quantité invalide')
      return
    }

    if (withdrawType === 'transfer' && !shopId) {
      setError('ID du magasin manquant')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Si transfert vers le magasin
      if (withdrawType === 'transfer') {
        // 1. Vérifier si l'article existe dans le magasin
        const itemsQuery = query(
          collection(db, 'items'),
          where('shopId', '==', shopId),
          where('name', '==', item.name),
          where('category', '==', item.category)
        )
        const itemsSnapshot = await getDocs(itemsQuery)
        
        if (itemsSnapshot.empty) {
          // 2a. Article n'existe pas : Créer un nouvel article dans le magasin
          const newItem = {
            name: item.name,
            category: item.category,
            quantity: quantity,
            shopId: shopId,
            created_at: new Date(),
            updated_at: new Date()
          }
          
          // Ajouter les champs optionnels seulement s'ils existent
          if (item.description) {
            newItem.description = item.description
          }
          if (item.minThreshold !== undefined && item.minThreshold !== null) {
            newItem.minThreshold = item.minThreshold
          }
          if (item.unit) {
            newItem.unit = item.unit
          }
          
          // Nettoyer l'objet avant de l'envoyer à Firebase
          const cleanedItem = cleanObject(newItem)
          await setDoc(doc(collection(db, 'items')), cleanedItem)
        } else {
          // 2b. Article existe : Additionner les quantités
          const existingItem = itemsSnapshot.docs[0]
          const currentQuantity = existingItem.data().quantity
          
          const updateData = cleanObject({
            quantity: currentQuantity + quantity,
            updated_at: new Date()
          })
          await updateDoc(doc(db, 'items', existingItem.id), updateData)
        }
      }

      // 3. Retirer la quantité du dépôt (dans tous les cas)
      const newDepotQuantity = item.quantity - quantity
      const depotUpdateData = cleanObject({
        quantity: newDepotQuantity <= 0 ? 0 : newDepotQuantity,
        updated_at: new Date()
      })
      await updateDoc(doc(db, 'items', item.id), depotUpdateData)

      // 4. Enregistrer le transfert dans l'historique (Firestore + cache local)
      const transferRecord = {
        type: withdrawType,
        itemName: item.name,
        itemDescription: item.description || '',
        itemCategory: item.category || 'Non catégorisé',
        quantity: quantity,
        unit: item.unit || 'unité(s)',
        depotId: depotId,
        shopId: withdrawType === 'transfer' ? shopId : null,
        userId: userProfile?.uid,
        userName: userProfile?.displayName || userProfile?.email || 'Utilisateur inconnu'
      }

      await TransferStorage.saveTransfer(cleanObject(transferRecord))

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Erreur lors du retrait:', error)
      if (error.code === 'permission-denied') {
        setError('Permission refusée. Vérifiez vos droits d\'accès.')
      } else if (error.code === 'unavailable') {
        setError('Service temporairement indisponible. Veuillez réessayer.')
      } else {
        setError(`Erreur lors du retrait: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-green-100">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {withdrawType === 'transfer' ? 'Transfert réussi !' : 'Retrait réussi !'}
            </h3>
            <p className="text-gray-600 mb-4">
              {withdrawType === 'transfer' 
                ? `${quantity} ${item.unit || 'unité(s)'} de "${item.name}" ont été transférés vers votre magasin.`
                : `${quantity} ${item.unit || 'unité(s)'} de "${item.name}" ont été retirés du dépôt.`
              }
            </p>
            {withdrawType === 'transfer' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  L'article a été automatiquement ajouté à votre inventaire.
                </p>
              </div>
            )}
            {withdrawType === 'remove' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  L'article a été retiré du dépôt pour usage personnel.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-orange-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full mr-4 bg-gradient-to-r from-orange-600 to-orange-700">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Retirer du Dépôt</h3>
              <p className="text-sm text-gray-600">
                Transférer vers votre magasin
              </p>
            </div>
          </div>

          {/* Item Information */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-orange-800 mb-2">{item.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-orange-600">Stock actuel:</span>
                <span className="ml-2 font-medium text-orange-800">{item.quantity} {item.unit || 'unité(s)'}</span>
              </div>
              <div>
                <span className="text-orange-600">Catégorie:</span>
                <span className="ml-2 font-medium text-orange-800">{item.category}</span>
              </div>
            </div>
            {item.description && (
              <p className="text-sm text-orange-700 mt-2">{item.description}</p>
            )}
          </div>

          {/* Type de retrait */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Que voulez-vous faire avec cet article ?
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="withdrawType"
                  value="transfer"
                  checked={withdrawType === 'transfer'}
                  onChange={(e) => setWithdrawType(e.target.value)}
                  className="mr-3 text-orange-600 focus:ring-orange-500"
                />
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Transférer vers mon magasin</div>
                    <div className="text-sm text-gray-600">L'article sera ajouté à votre magasin</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="withdrawType"
                  value="remove"
                  checked={withdrawType === 'remove'}
                  onChange={(e) => setWithdrawType(e.target.value)}
                  className="mr-3 text-orange-600 focus:ring-orange-500"
                />
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Retirer sans transférer</div>
                    <div className="text-sm text-gray-600">L'article sera retiré du dépôt pour usage personnel</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité à retirer
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1)))}
                className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min="1"
                max={item.quantity}
              />
              <button
                onClick={() => setQuantity(Math.min(item.quantity, quantity + 1))}
                disabled={quantity >= item.quantity}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {item.quantity} {item.unit || 'unité(s)'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-3 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {withdrawType === 'transfer' ? 'Transfert en cours...' : 'Retrait en cours...'}
                </div>
              ) : (
                withdrawType === 'transfer' 
                  ? `Transférer ${quantity} ${item.unit || 'unité(s)'} vers le magasin`
                  : `Retirer ${quantity} ${item.unit || 'unité(s)'} du dépôt`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
