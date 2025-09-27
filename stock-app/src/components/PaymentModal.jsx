import { useState } from 'react'
import { CreditStorage } from '../utils/creditStorage'
import Modal from './common/Modal'
import Button from './common/Button'
import LoadingSpinner from './common/LoadingSpinner'
import FormField from './forms/FormField'

export default function PaymentModal({ isOpen, onClose, credit, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    comments: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Vérifier que credit existe avant de rendre le composant
  if (!credit) {
    return null
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Le montant doit être supérieur à 0')
      return false
    }

    const amount = parseFloat(formData.amount)
    if (amount > credit.remainingAmount) {
      setError(`Le montant ne peut pas dépasser le reste à payer (${credit.remainingAmount.toLocaleString('fr-FR')} KMF)`)
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        comments: formData.comments.trim()
      }

      const result = await CreditStorage.addPayment(credit.id, paymentData)
      if (!result.success) {
        setError(result.error)
        return
      }

      setSuccess(true)
      
      if (onSuccess) {
        onSuccess(result.data)
      }

      // Fermer le modal après un délai
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setFormData({
          amount: '',
          date: new Date().toISOString().split('T')[0],
          comments: ''
        })
      }, 2000)

    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error)
      setError('Erreur lors de l\'ajout du paiement')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      comments: ''
    })
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajouter un Paiement">
      <div className="p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Paiement enregistré avec succès !</h3>
            <p className="text-gray-600">Le paiement a été ajouté au crédit.</p>
          </div>
        ) : (
          <>
            {/* Informations du crédit */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Informations du crédit</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Client:</span>
                  <span className="ml-2 font-medium">{credit.customerName} {credit.customerFirstName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Montant total:</span>
                  <span className="ml-2 font-medium text-blue-600">{credit.totalAmount.toLocaleString('fr-FR')} KMF</span>
                </div>
                <div>
                  <span className="text-gray-600">Montant payé:</span>
                  <span className="ml-2 font-medium text-green-600">{credit.paidAmount.toLocaleString('fr-FR')} KMF</span>
                </div>
                <div>
                  <span className="text-gray-600">Reste à payer:</span>
                  <span className="ml-2 font-medium text-red-600">{credit.remainingAmount.toLocaleString('fr-FR')} KMF</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Montant du paiement (KMF) *"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
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
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <FormField
                label="Commentaires (optionnel)"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                placeholder="Notes sur ce paiement..."
                multiline
                rows={3}
              />

              {/* Aperçu du paiement */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Aperçu du paiement:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant du paiement:</span>
                      <span className="font-medium">{parseFloat(formData.amount || 0).toLocaleString('fr-FR')} KMF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nouveau montant payé:</span>
                      <span className="font-medium text-green-600">
                        {(credit.paidAmount + parseFloat(formData.amount || 0)).toLocaleString('fr-FR')} KMF
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1">
                      <span className="text-gray-600">Nouveau reste à payer:</span>
                      <span className="font-medium text-red-600">
                        {(credit.remainingAmount - parseFloat(formData.amount || 0)).toLocaleString('fr-FR')} KMF
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer le paiement'
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
