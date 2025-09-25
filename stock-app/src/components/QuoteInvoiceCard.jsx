import { useState } from 'react'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Button from './common/Button'

export default function QuoteInvoiceCard({ item, type, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isQuote = type === 'quotes'
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    paid: 'bg-blue-100 text-blue-800'
  }

  const statusLabels = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    paid: 'Payé'
  }

  const handleStatusChange = async (newStatus) => {
    setLoading(true)
    try {
      const collectionName = isQuote ? 'quotes' : 'invoices'
      await updateDoc(doc(db, collectionName, item.id), {
        status: newStatus,
        updated_at: new Date()
      })
      onUpdate()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const collectionName = isQuote ? 'quotes' : 'invoices'
      await deleteDoc(doc(db, collectionName, item.id))
      onUpdate()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (date) => {
    if (date && date.toDate) {
      return date.toDate().toLocaleDateString('fr-FR')
    }
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{item.number}</h3>
            <p className="text-sm text-gray-600">{item.client.name}</p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
            {statusLabels[item.status]}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{formatDate(item.date)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Articles:</span>
            <span className="font-medium">{item.items.length}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-lg text-blue-600">
              {item.totalAmount.toLocaleString('fr-FR')} KMF
            </span>
          </div>

          {item.client.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Téléphone:</span>
              <span className="font-medium">{item.client.phone}</span>
            </div>
          )}
        </div>

        {/* Items Preview */}
        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Articles:</h5>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {item.items.slice(0, 3).map((item, index) => (
              <div key={index} className="text-xs text-gray-600">
                {item.name} x{item.quantity} - {item.totalPrice.toLocaleString('fr-FR')} KMF
              </div>
            ))}
            {item.items.length > 3 && (
              <div className="text-xs text-gray-500">
                +{item.items.length - 3} autres articles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => {/* TODO: Implement view/print */}}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Voir
          </Button>
          
          {isQuote && item.status === 'pending' && (
            <Button
              size="sm"
              variant="success"
              className="flex-1"
              onClick={() => handleStatusChange('approved')}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approuver
            </Button>
          )}
          
          {!isQuote && item.status === 'pending' && (
            <Button
              size="sm"
              variant="success"
              className="flex-1"
              onClick={() => handleStatusChange('paid')}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Marquer Payé
            </Button>
          )}
          
          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Supprimer {isQuote ? 'le devis' : 'la facture'}</h3>
                  <p className="text-sm text-gray-600">Action irréversible</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-800 font-medium">Attention</p>
                  </div>
                </div>
                <p className="text-gray-700 text-center">
                  Êtes-vous sûr de vouloir supprimer définitivement {isQuote ? 'le devis' : 'la facture'}
                  <br />
                  <span className="font-bold text-gray-900">"{item.number}"</span> ?
                </p>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Cette action ne peut pas être annulée.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {loading ? (
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
