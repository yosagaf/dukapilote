import { useState } from 'react'
import { CreditStorage } from '../utils/creditStorage'
import Modal from './common/Modal'
import Button from './common/Button'
import LoadingSpinner from './common/LoadingSpinner'
import PaymentModal from './PaymentModal'

export default function CreditDetailsModal({ isOpen, onClose, credit, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Vérifier que credit existe avant de rendre le composant
  if (!credit) {
    return null
  }

  const handleCloseCredit = async () => {
    if (!confirm('Êtes-vous sûr de vouloir clôturer ce crédit ? Cette action est irréversible.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await CreditStorage.closeCredit(credit.id)
      if (!result.success) {
        setError(result.error)
        return
      }

      if (onUpdate) {
        onUpdate()
      }

      onClose()
    } catch (error) {
      console.error('Erreur lors de la clôture du crédit:', error)
      setError('Erreur lors de la clôture du crédit')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCredit = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await CreditStorage.deleteCredit(credit.id)
      if (!result.success) {
        setError(result.error)
        return
      }

      if (onUpdate) {
        onUpdate()
      }

      setShowDeleteModal(false)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la suppression du crédit:', error)
      setError('Erreur lors de la suppression du crédit')
    } finally {
      setLoading(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'partial':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'partial':
        return 'Partiel'
      case 'completed':
        return 'Terminé'
      default:
        return status
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Détails du Crédit">
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Informations client */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Client</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nom complet:</span>
                  <p className="font-medium text-gray-900">{credit.customerName} {credit.customerFirstName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Lieu de naissance:</span>
                  <p className="font-medium text-gray-900">{credit.birthPlace}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Date de rendez-vous:</span>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      if (!credit.appointmentDate) return 'Non défini'
                      
                      try {
                        // Si c'est déjà un objet Date
                        if (credit.appointmentDate instanceof Date) {
                          return credit.appointmentDate.toLocaleDateString('fr-FR')
                        }
                        
                        // Si c'est un timestamp Firestore
                        if (credit.appointmentDate.toDate && typeof credit.appointmentDate.toDate === 'function') {
                          return credit.appointmentDate.toDate().toLocaleDateString('fr-FR')
                        }
                        
                        // Si c'est une chaîne ou un nombre
                        const date = new Date(credit.appointmentDate)
                        if (isNaN(date.getTime())) {
                          return 'Date invalide'
                        }
                        
                        return date.toLocaleDateString('fr-FR')
                      } catch (error) {
                        console.error('Erreur lors du formatage de la date:', error)
                        return 'Date invalide'
                      }
                    })()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Statut:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(credit.status)}`}>
                    {getStatusLabel(credit.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {credit.items.map((item, index) => {
                    // Handle different possible property names and ensure values exist
                    const itemName = item.name || item.itemName || 'Article inconnu'
                    const quantity = item.quantity || 0
                    const price = item.price || item.unitPrice || 0
                    const totalPrice = item.totalPrice || (quantity * price)
                    
                    return (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{itemName}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">{quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">{price.toLocaleString('fr-FR')} KMF</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{totalPrice.toLocaleString('fr-FR')} KMF</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Résumé financier */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé Financier</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Montant total</p>
                  <p className="text-2xl font-bold text-gray-900">{credit.totalAmount.toLocaleString('fr-FR')} KMF</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Montant payé</p>
                  <p className="text-2xl font-bold text-green-600">{credit.paidAmount.toLocaleString('fr-FR')} KMF</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Reste à payer</p>
                  <p className="text-2xl font-bold text-red-600">{credit.remainingAmount.toLocaleString('fr-FR')} KMF</p>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des paiements */}
          {credit.payments && credit.payments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des Paiements</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commentaires</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {credit.payments.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {(() => {
                            if (!payment.date) return 'Date inconnue'
                            try {
                              if (payment.date instanceof Date) {
                                return payment.date.toLocaleDateString('fr-FR')
                              }
                              if (payment.date.toDate && typeof payment.date.toDate === 'function') {
                                return payment.date.toDate().toLocaleDateString('fr-FR')
                              }
                              const date = new Date(payment.date)
                              if (isNaN(date.getTime())) {
                                return 'Date invalide'
                              }
                              return date.toLocaleDateString('fr-FR')
                            } catch (error) {
                              console.error('Erreur lors du formatage de la date:', error)
                              return 'Date invalide'
                            }
                          })()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {(payment.amount || 0).toLocaleString('fr-FR')} KMF
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {payment.comments || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              {credit.remainingAmount > 0 && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  variant="primary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Ajouter un paiement
                </Button>
              )}
              
              {credit.remainingAmount <= 0 && credit.status !== 'completed' && (
                <Button
                  onClick={handleCloseCredit}
                  disabled={loading}
                  variant="secondary"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Clôture...
                    </>
                  ) : (
                    'Clôturer le crédit'
                  )}
                </Button>
              )}
              
              <Button
                onClick={handleDeleteCredit}
                disabled={loading}
                variant="danger"
              >
                Supprimer le crédit
              </Button>
            </div>

            <Button
              onClick={onClose}
              variant="secondary"
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        credit={credit}
        onSuccess={() => {
          setShowPaymentModal(false)
          if (onUpdate) {
            onUpdate()
          }
        }}
      />

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Supprimer le crédit</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-4">
                Êtes-vous sûr de vouloir supprimer ce crédit ? Cette action est irréversible.
              </p>
              
              {credit && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Détails du crédit :</h4>
                  <p className="text-sm text-gray-600">
                    <strong>Client :</strong> {credit.customerName} {credit.customerFirstName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Montant total :</strong> {credit.totalAmount.toLocaleString('fr-FR')} KMF
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Statut :</strong> {getStatusLabel(credit.status)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={loading}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Suppression...</span>
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
