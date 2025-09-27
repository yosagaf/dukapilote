import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { CreditStorage } from '../utils/creditStorage'
import Sidebar from '../components/Sidebar'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import FormField from '../components/forms/FormField'

export default function CreditDetails() {
  const { creditId } = useParams()
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const { sidebarWidth } = useSidebar()
  const [credit, setCredit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    comments: ''
  })
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (creditId) {
      loadCredit()
    }
  }, [creditId])

  const loadCredit = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Pour l'instant, on va récupérer tous les crédits et filtrer
      // TODO: Créer une méthode getCreditById dans CreditStorage
      const result = await CreditStorage.getCredits(userProfile.shopId)
      if (!result.success) {
        setError(result.error)
        return
      }

      const foundCredit = result.data.find(c => c.id === creditId)
      if (!foundCredit) {
        setError('Crédit non trouvé')
        return
      }

      setCredit(foundCredit)
    } catch (error) {
      console.error('Erreur lors du chargement du crédit:', error)
      setError('Erreur lors du chargement du crédit')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseCredit = async () => {
    if (!confirm('Êtes-vous sûr de vouloir clôturer ce crédit ? Cette action est irréversible.')) {
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const result = await CreditStorage.closeCredit(credit.id)
      if (!result.success) {
        setError(result.error)
        return
      }

      // Recharger les données
      await loadCredit()
    } catch (error) {
      console.error('Erreur lors de la clôture du crédit:', error)
      setError('Erreur lors de la clôture du crédit')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCredit = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setActionLoading(true)
    setError('')

    try {
      const result = await CreditStorage.deleteCredit(credit.id)
      if (!result.success) {
        setError(result.error)
        return
      }

      // Rediriger vers la page des crédits
      navigate('/credits')
    } catch (error) {
      console.error('Erreur lors de la suppression du crédit:', error)
      setError('Erreur lors de la suppression du crédit')
    } finally {
      setActionLoading(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
  }

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target
    setPaymentData(prev => ({ ...prev, [name]: value }))
    setPaymentError('')
  }

  const validatePaymentForm = () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setPaymentError('Le montant doit être supérieur à 0')
      return false
    }

    const amount = parseFloat(paymentData.amount)
    if (amount > credit.remainingAmount) {
      setPaymentError(`Le montant ne peut pas dépasser le reste à payer (${credit.remainingAmount.toLocaleString('fr-FR')} KMF)`)
      return false
    }

    return true
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!validatePaymentForm()) return

    setPaymentLoading(true)
    setPaymentError('')

    try {
      const paymentDataToSubmit = {
        amount: parseFloat(paymentData.amount),
        date: new Date(paymentData.date),
        comments: paymentData.comments.trim()
      }

      const result = await CreditStorage.addPayment(credit.id, paymentDataToSubmit)
      if (!result.success) {
        setPaymentError(result.error)
        return
      }

      setPaymentSuccess(true)
      
      // Recharger les données du crédit
      await loadCredit()
      
      // Réinitialiser le formulaire
      setPaymentData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        comments: ''
      })
      setShowPaymentForm(false)

      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setPaymentSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error)
      setPaymentError('Erreur lors de l\'ajout du paiement')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleCancelPayment = () => {
    setPaymentData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      comments: ''
    })
    setPaymentError('')
    setShowPaymentForm(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
        <Sidebar currentPage="credits" />
        <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="flex items-center justify-center h-screen">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
        <Sidebar currentPage="credits" />
        <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate('/credits')} variant="primary">
                Retour aux crédits
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!credit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
        <Sidebar currentPage="credits" />
        <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Crédit non trouvé</h3>
              <p className="text-gray-600 mb-4">Le crédit demandé n'existe pas.</p>
              <Button onClick={() => navigate('/credits')} variant="primary">
                Retour aux crédits
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPage="credits" />
      <div className="transition-all duration-300" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Titre et navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/credits')}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  title="Retour aux crédits"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Détails du Crédit</h1>
                  <p className="text-gray-600 mt-2">
                    {credit.customerName} {credit.customerFirstName} • {getStatusLabel(credit.status)}
                  </p>
                </div>
              </div>

              {/* Boutons d'action - tous au même niveau */}
              <div className="flex items-center space-x-3">
                {credit.remainingAmount <= 0 && credit.status !== 'completed' && (
                  <Button
                    onClick={handleCloseCredit}
                    disabled={actionLoading}
                    variant="secondary"
                  >
                    {actionLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Clôture...
                      </>
                    ) : (
                      'Clôturer le crédit'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <div className="px-6 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Informations client */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Informations Client</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDeleteCredit}
                  disabled={actionLoading}
                  className="text-red-600 hover:text-red-800 disabled:text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer le crédit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      if (credit.appointmentDate instanceof Date) {
                        return credit.appointmentDate.toLocaleDateString('fr-FR')
                      }
                      
                      if (credit.appointmentDate.toDate && typeof credit.appointmentDate.toDate === 'function') {
                        return credit.appointmentDate.toDate().toLocaleDateString('fr-FR')
                      }
                      
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

          {/* Résumé financier */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé Financier</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Montant total du crédit</p>
                <p className="text-3xl font-bold text-gray-900">{credit.totalAmount.toLocaleString('fr-FR')} KMF</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Montant payé</p>
                <p className="text-3xl font-bold text-green-600">{credit.paidAmount.toLocaleString('fr-FR')} KMF</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Reste à payer</p>
                <p className="text-3xl font-bold text-red-600">{credit.remainingAmount.toLocaleString('fr-FR')} KMF</p>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles</h3>
            <div className="overflow-x-auto">
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

          {/* Section de paiement */}
          {credit.remainingAmount > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ajouter un Paiement</h3>
                {!showPaymentForm && (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
                    <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="relative">Nouveau Paiement</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  </button>
                )}
              </div>

              {paymentSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-green-800 font-medium">Paiement enregistré avec succès !</p>
                  </div>
                </div>
              )}

              {showPaymentForm && (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      label="Montant du paiement (KMF) *"
                      name="amount"
                      type="number"
                      value={paymentData.amount}
                      onChange={handlePaymentInputChange}
                      min="0.01"
                      step="0.01"
                      max={credit.remainingAmount}
                      required
                      placeholder={`Maximum: ${credit.remainingAmount.toLocaleString('fr-FR')}`}
                    />
                    <FormField
                      label="Date du paiement *"
                      name="date"
                      type="date"
                      value={paymentData.date}
                      onChange={handlePaymentInputChange}
                      required
                    />
                    <div className="flex items-end">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reste à payer
                        </label>
                        <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 font-semibold">
                          {credit.remainingAmount.toLocaleString('fr-FR')} KMF
                        </div>
                      </div>
                    </div>
                  </div>

                  <FormField
                    label="Commentaires (optionnel)"
                    name="comments"
                    value={paymentData.comments}
                    onChange={handlePaymentInputChange}
                    placeholder="Notes sur ce paiement..."
                    multiline
                    rows={3}
                  />

                  {/* Aperçu du paiement */}
                  {paymentData.amount && parseFloat(paymentData.amount) > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Aperçu du paiement:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Montant du paiement:</span>
                          <span className="font-medium">{parseFloat(paymentData.amount || 0).toLocaleString('fr-FR')} KMF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nouveau montant payé:</span>
                          <span className="font-medium text-green-600">
                            {(credit.paidAmount + parseFloat(paymentData.amount || 0)).toLocaleString('fr-FR')} KMF
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-1">
                          <span className="text-gray-600">Nouveau reste à payer:</span>
                          <span className="font-medium text-red-600">
                            {(credit.remainingAmount - parseFloat(paymentData.amount || 0)).toLocaleString('fr-FR')} KMF
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm">{paymentError}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancelPayment}
                      disabled={paymentLoading}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={paymentLoading || !paymentData.amount || parseFloat(paymentData.amount) <= 0}
                    >
                      {paymentLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Enregistrement...</span>
                        </>
                      ) : (
                        'Enregistrer le paiement'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Historique des paiements */}
          {credit.payments && credit.payments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des Paiements</h3>
              <div className="overflow-x-auto">
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
        </div>


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
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  disabled={actionLoading}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoading}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  {actionLoading ? (
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
      </div>
    </div>
  )
}
