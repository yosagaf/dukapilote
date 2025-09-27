import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { CreditStorage } from '../utils/creditStorage'
import Button from './common/Button'
import LoadingSpinner from './common/LoadingSpinner'
import FormField from './forms/FormField'

export default function CreditModal({ isOpen, onClose, onSuccess }) {
  const { userProfile } = useAuth()
  const { sidebarWidth } = useSidebar()
  const [currentStep, setCurrentStep] = useState(1)
  const [items, setItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [clientInfo, setClientInfo] = useState({
    customerName: '',
    customerFirstName: '',
    customerPhone: '',
    customerAddress: ''
  })
  const [paymentInfo, setPaymentInfo] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    comments: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const totalSteps = 4

  const steps = [
    { number: 1, title: 'Informations Client', description: 'Renseignez les informations du client' },
    { number: 2, title: 'Sélection Articles', description: 'Choisissez les articles à inclure' },
    { number: 3, title: 'Configuration Prix', description: 'Définissez les prix et quantités' },
    { number: 4, title: 'Aperçu & Validation', description: 'Vérifiez et validez le crédit' }
  ]

  useEffect(() => {
    if (isOpen && userProfile?.shopId) {
      loadItems()
    }
  }, [isOpen, userProfile])

  const loadItems = async () => {
    try {
      setLoading(true)
      const itemsRef = collection(db, 'items')
      const q = query(itemsRef, where('shopId', '==', userProfile.shopId))
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setItems(itemsData)
        setLoading(false)
      })

      return unsubscribe
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error)
      setError('Erreur lors du chargement des articles')
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleItemSelect = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id)
    if (existingItem) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id))
    } else {
      setSelectedItems([...selectedItems, { ...item, selectedQuantity: 1 }])
    }
  }

  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === itemId ? { ...item, selectedQuantity: parseInt(quantity) || 1 } : item
    ))
  }

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.selectedQuantity * item.price)
    }, 0)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')

      const creditData = {
        customerName: clientInfo.customerName,
        customerFirstName: clientInfo.customerFirstName,
        customerPhone: clientInfo.customerPhone,
        customerAddress: clientInfo.customerAddress,
        items: selectedItems.map(item => ({
          name: item.name,
          quantity: item.selectedQuantity,
          price: item.price,
          totalPrice: item.selectedQuantity * item.price
        })),
        totalAmount: calculateTotal(),
        paidAmount: parseFloat(paymentInfo.amount) || 0,
        remainingAmount: calculateTotal() - (parseFloat(paymentInfo.amount) || 0),
        status: (parseFloat(paymentInfo.amount) || 0) >= calculateTotal() ? 'completed' : 'pending',
        shopId: userProfile.shopId,
        createdAt: new Date(),
        payments: (parseFloat(paymentInfo.amount) || 0) > 0 ? [{
          amount: parseFloat(paymentInfo.amount),
          date: paymentInfo.date,
          comments: paymentInfo.comments || 'Paiement initial'
        }] : []
      }

      await CreditStorage.createCredit(creditData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erreur lors de la création du crédit:', error)
      setError('Erreur lors de la création du crédit')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto" style={{ marginLeft: `${sidebarWidth}px` }}>
      <div className="w-full min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  title="Retour aux crédits"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Nouveau Crédit</h1>
                  <p className="text-gray-600 mt-2">
                    Créez un nouveau crédit client en {totalSteps} étapes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <div className="px-6 py-8">
          {/* Progress Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Étapes de création</h2>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Client</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Saisissez les informations du client pour ce crédit
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Nom du client"
                      type="text"
                      value={clientInfo.customerName}
                      onChange={(e) => setClientInfo({ ...clientInfo, customerName: e.target.value })}
                      required
                      placeholder="Entrez le nom du client"
                    />
                    <FormField
                      label="Prénom du client"
                      type="text"
                      value={clientInfo.customerFirstName}
                      onChange={(e) => setClientInfo({ ...clientInfo, customerFirstName: e.target.value })}
                      required
                      placeholder="Entrez le prénom du client"
                    />
                    <FormField
                      label="Téléphone"
                      type="tel"
                      value={clientInfo.customerPhone}
                      onChange={(e) => setClientInfo({ ...clientInfo, customerPhone: e.target.value })}
                      placeholder="Entrez le numéro de téléphone"
                    />
                    <FormField
                      label="Adresse"
                      type="text"
                      value={clientInfo.customerAddress}
                      onChange={(e) => setClientInfo({ ...clientInfo, customerAddress: e.target.value })}
                      placeholder="Entrez l'adresse du client"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélection des Articles</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Choisissez les articles à inclure dans ce crédit
                  </p>
                  
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Rechercher un article..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemSelect(item)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedItems.find(selected => selected.id === item.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">{item.price.toLocaleString('fr-FR')} KMF</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            selectedItems.find(selected => selected.id === item.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedItems.find(selected => selected.id === item.id) && (
                              <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration des Prix</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Ajustez les quantités pour chaque article sélectionné
                  </p>
                  
                  <div className="space-y-4">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">Prix unitaire: {item.price.toLocaleString('fr-FR')} KMF</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <label className="text-sm text-gray-600">Quantité:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.selectedQuantity}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="w-20 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {(item.selectedQuantity * item.price).toLocaleString('fr-FR')} KMF
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-green-800">Total du crédit:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {calculateTotal().toLocaleString('fr-FR')} KMF
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu et Validation</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Vérifiez les informations avant de créer le crédit
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Informations Client</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Nom:</span> {clientInfo.customerName}</p>
                          <p><span className="font-medium">Prénom:</span> {clientInfo.customerFirstName}</p>
                          {clientInfo.customerPhone && <p><span className="font-medium">Téléphone:</span> {clientInfo.customerPhone}</p>}
                          {clientInfo.customerAddress && <p><span className="font-medium">Adresse:</span> {clientInfo.customerAddress}</p>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Articles sélectionnés</h4>
                        <div className="space-y-2">
                          {selectedItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.name} x{item.selectedQuantity}</span>
                              <span>{(item.selectedQuantity * item.price).toLocaleString('fr-FR')} KMF</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>{calculateTotal().toLocaleString('fr-FR')} KMF</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">Paiement initial (optionnel)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        label="Montant (KMF)"
                        type="number"
                        value={paymentInfo.amount}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, amount: e.target.value })}
                        placeholder="0"
                        min="0"
                        max={calculateTotal()}
                      />
                      <FormField
                        label="Date"
                        type="date"
                        value={paymentInfo.date}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, date: e.target.value })}
                      />
                      <FormField
                        label="Commentaire"
                        type="text"
                        value={paymentInfo.comments}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, comments: e.target.value })}
                        placeholder="Commentaire optionnel"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div>
                {currentStep > 1 && (
                  <Button
                    onClick={handlePrevious}
                    variant="secondary"
                    disabled={loading}
                  >
                    Précédent
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    disabled={loading}
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Création...
                      </>
                    ) : (
                      'Créer le crédit'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
