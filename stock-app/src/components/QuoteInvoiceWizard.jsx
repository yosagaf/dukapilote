import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { generateDocumentNumber, previewDocumentNumber } from '../utils/simpleNumberingService.js'
import Button from './common/Button'
import LoadingSpinner from './common/LoadingSpinner'

export default function QuoteInvoiceWizard({ type, onClose, onSuccess }) {
  const { userProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [items, setItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [clientInfo, setClientInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })
  const [pricingMode, setPricingMode] = useState('unit') // 'unit' or 'total'
  const [totalAmount, setTotalAmount] = useState(0)
  const [editableDate, setEditableDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const isQuote = type === 'quote'
  const title = isQuote ? 'Nouveau Devis' : 'Nouvelle Facture'
  const totalSteps = 4

  const steps = [
    { number: 1, title: 'Informations Client', description: 'Renseignez les informations du client' },
    { number: 2, title: 'Sélection Articles', description: 'Choisissez les articles à inclure' },
    { number: 3, title: 'Configuration Prix', description: 'Définissez les prix et quantités' },
    { number: 4, title: 'Aperçu & Validation', description: 'Vérifiez et validez le document' }
  ]

  useEffect(() => {
    if (userProfile?.uid) {
      loadItems()
    }
  }, [userProfile])

  const loadItems = async () => {
    try {
      const itemsQuery = query(
        collection(db, 'items'),
        where('shopId', '==', userProfile.shopId)
      )
      
      const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setItems(itemsData)
      })

      return unsubscribe
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error)
      setError('Erreur lors du chargement des articles')
    }
  }

  const handleItemSelect = (item) => {
    const existingIndex = selectedItems.findIndex(selected => selected.id === item.id)
    
    if (existingIndex >= 0) {
      // Retirer l'article
      setSelectedItems(prev => prev.filter((_, index) => index !== existingIndex))
    } else {
      // Ajouter l'article
      setSelectedItems(prev => [...prev, {
        ...item,
        quantity: 1,
        unitPrice: item.price || 0,
        totalPrice: item.price || 0
      }])
    }
  }

  const handleItemChange = (itemId, field, value) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    }))
  }

  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId))
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

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Calculer le montant total
      const total = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
      
      const documentData = {
        type: isQuote ? 'quote' : 'invoice',
        number: await generateDocumentNumber(isQuote ? 'quote' : 'invoice'),
        clientInfo,
        items: selectedItems,
        totalAmount: total,
        date: editableDate,
        userId: userProfile.uid,
        shopId: userProfile.shopId,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      }

      await addDoc(collection(db, isQuote ? 'quotes' : 'invoices'), documentData)
      
      if (onSuccess) {
        onSuccess(documentData)
      }
      
      onClose()
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      setError('Erreur lors de la création du document')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ClientInfoStep clientInfo={clientInfo} setClientInfo={setClientInfo} />
      case 2:
        return <ArticleSelectionStep 
          items={items} 
          selectedItems={selectedItems}
          onItemSelect={handleItemSelect}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      case 3:
        return <PricingStep 
          selectedItems={selectedItems}
          onItemChange={handleItemChange}
          onRemoveItem={handleRemoveItem}
          pricingMode={pricingMode}
          setPricingMode={setPricingMode}
        />
      case 4:
        return <PreviewStep 
          clientInfo={clientInfo}
          selectedItems={selectedItems}
          totalAmount={selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)}
          date={editableDate}
          isQuote={isQuote}
        />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full mr-4 flex items-center justify-center ${
                isQuote ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <svg className={`w-6 h-6 ${isQuote ? 'text-blue-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">Processus en {totalSteps} étapes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
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
          <div className="min-h-96">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="secondary"
              size="lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </Button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Étape {currentStep} sur {totalSteps}
              </span>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  variant="primary"
                  size="lg"
                >
                  Suivant
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  variant="primary"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Créer {isQuote ? 'Devis' : 'Facture'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composants pour chaque étape
function ClientInfoStep({ clientInfo, setClientInfo }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h4 className="text-2xl font-bold text-gray-900 mb-2">Informations Client</h4>
        <p className="text-gray-600">Renseignez les informations du client pour ce {clientInfo.name ? 'devis' : 'document'}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client *</label>
            <input
              type="text"
              value={clientInfo.name}
              onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nom complet du client"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <input
              type="tel"
              value={clientInfo.phone}
              onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Numéro de téléphone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
            <input
              type="text"
              value={clientInfo.address}
              onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adresse du client"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={clientInfo.email}
              onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email du client"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ArticleSelectionStep({ items, selectedItems, onItemSelect, searchTerm, setSearchTerm }) {
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-gray-900 mb-1">Sélection des Articles</h4>
        <p className="text-sm text-gray-600">Choisissez les articles à inclure dans ce document</p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Compact Articles Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && filteredItems.every(item => selectedItems.some(selected => selected.id === item.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          filteredItems.forEach(item => {
                            if (!selectedItems.some(selected => selected.id === item.id)) {
                              onItemSelect(item)
                            }
                          })
                        } else {
                          filteredItems.forEach(item => {
                            if (selectedItems.some(selected => selected.id === item.id)) {
                              onItemSelect(item)
                            }
                          })
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id)
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onItemSelect(item)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected 
                          ? 'bg-blue-50 hover:bg-blue-100' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onItemSelect(item)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-sm font-medium ${
                          item.quantity > 10 ? 'text-green-600' : 
                          item.quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-sm font-medium text-gray-900">
                          {item.price?.toLocaleString('fr-FR')} KMF
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} article(s) sélectionné(s)
              </span>
              <span className="text-sm text-blue-700">
                Total: {selectedItems.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString('fr-FR')} KMF
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PricingStep({ selectedItems, onItemChange, onRemoveItem, pricingMode, setPricingMode }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h4 className="text-2xl font-bold text-gray-900 mb-2">Configuration des Prix</h4>
        <p className="text-gray-600">Définissez les quantités et prix pour chaque article</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {selectedItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500">Aucun article sélectionné</p>
            <p className="text-sm text-gray-400">Retournez à l'étape précédente pour sélectionner des articles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedItems.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-medium text-gray-900">{item.name}</h5>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prix unitaire (KMF)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => onItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total (KMF)</label>
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700">
                      {item.totalPrice.toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total général:</span>
                <span className="text-2xl font-bold text-green-600">
                  {selectedItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('fr-FR')} KMF
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PreviewStep({ clientInfo, selectedItems, totalAmount, date, isQuote }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h4 className="text-2xl font-bold text-gray-900 mb-2">Aperçu du Document</h4>
        <p className="text-gray-600">Vérifiez les informations avant de créer le {isQuote ? 'devis' : 'facture'}</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {isQuote ? 'DEVIS' : 'FACTURE'}
              </h3>
              <p className="text-sm text-gray-600">Date: {new Date(date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">N°: {isQuote ? 'DEV' : 'FAC'}-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Client:</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{clientInfo.name}</p>
              {clientInfo.address && <p className="text-sm text-gray-600">{clientInfo.address}</p>}
              {clientInfo.phone && <p className="text-sm text-gray-600">Tél: {clientInfo.phone}</p>}
              {clientInfo.email && <p className="text-sm text-gray-600">Email: {clientInfo.email}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Articles:</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-700">Article</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-700">Qté</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700">Prix unit.</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                      </td>
                      <td className="text-center py-3 text-sm text-gray-700">{item.quantity}</td>
                      <td className="text-right py-3 text-sm text-gray-700">{item.unitPrice.toLocaleString('fr-FR')} KMF</td>
                      <td className="text-right py-3 text-sm font-medium text-gray-900">{item.totalPrice.toLocaleString('fr-FR')} KMF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  Total: {totalAmount.toLocaleString('fr-FR')} KMF
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
