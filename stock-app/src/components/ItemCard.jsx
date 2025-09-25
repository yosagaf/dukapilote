import { useState } from 'react'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Button from './common/Button.jsx'

export default function ItemCard({ item, stockStatus, onEdit, onDelete }) {
  const [updating, setUpdating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const updateQuantity = async (change) => {
    setUpdating(true)
    try {
      const newQuantity = Math.max(0, item.quantity + change)
      await updateDoc(doc(db, 'items', item.id), {
        quantity: newQuantity
      })
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
    setUpdating(false)
  }

  const handleDelete = async () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setUpdating(true)
    try {
      await deleteDoc(doc(db, 'items', item.id))
      if (onDelete) onDelete(item.id)
    } catch (error) {
      console.error('Error deleting item:', error)
    }
    setUpdating(false)
    setShowDeleteModal(false)
  }

  const handleEdit = () => {
    if (onEdit) onEdit(item)
  }

  const getBorderColor = (status) => {
    switch (status) {
      case 'green': return 'border-green-500'
      case 'orange': return 'border-orange-500'
      case 'red': return 'border-red-500'
      default: return 'border-gray-300'
    }
  }

  const getBackgroundColor = (status) => {
    switch (status) {
      case 'green': return 'bg-green-50'
      case 'orange': return 'bg-orange-50'
      case 'red': return 'bg-red-50'
      default: return 'bg-white'
    }
  }

  return (
    <div className={`border-2 ${getBorderColor(stockStatus)} ${getBackgroundColor(stockStatus)} rounded-lg p-4 shadow-sm`}>
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-32 object-cover rounded-md mb-3"
        />
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>

      {item.category && (
        <p className="text-sm text-gray-600 mb-2">{item.category}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold text-gray-900">{item.quantity}</span>
        <span className="text-sm text-gray-500">Min: {item.minThreshold}</span>
      </div>

      {/* Action Buttons Row 1: Edit and Delete */}
      <div className="flex space-x-2 mb-2">
        <Button
          onClick={handleEdit}
          disabled={updating}
          variant="info"
          size="sm"
          fullWidth
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        >
          Modifier
        </Button>
        <Button
          onClick={handleDelete}
          disabled={updating}
          variant="danger"
          size="sm"
          fullWidth
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
        >
          Supprimer
        </Button>
      </div>

      {/* Action Buttons Row 2: Quantity Controls */}
      <div className="flex space-x-2">
        <Button
          onClick={() => updateQuantity(-1)}
          disabled={updating || item.quantity === 0}
          variant="warning"
          size="md"
          fullWidth
        >
          -
        </Button>
        <Button
          onClick={() => updateQuantity(1)}
          disabled={updating}
          variant="success"
          size="md"
          fullWidth
        >
          +
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-100">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Supprimer l'Article</h3>
                  <p className="text-sm text-gray-600">DukaPilote - Confirmation</p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-800 font-medium">Action irréversible</p>
                  </div>
                </div>
                <p className="text-gray-700 text-center">
                  Êtes-vous sûr de vouloir supprimer définitivement l'article
                  <br />
                  <span className="font-bold text-gray-900">"{item.name}"</span> ?
                </p>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Cette action ne peut pas être annulée.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={updating}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {updating ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression...
                    </div>
                  ) : (
                    'Supprimer Définitivement'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}