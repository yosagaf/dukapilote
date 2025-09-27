import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { generateDocumentNumber, previewDocumentNumber } from '../utils/simpleNumberingService.js'
import Button from './common/Button'
import LoadingSpinner from './common/LoadingSpinner'

export default function CreateQuoteInvoiceModal({ type, onClose, onSuccess }) {
  const { userProfile } = useAuth()
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
  const [stockWarnings, setStockWarnings] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const isQuote = type === 'quote'
  const title = isQuote ? 'Nouveau Devis' : 'Nouvelle Facture'

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
        console.log('Items loaded for quotes/invoices:', itemsData)
        setItems(itemsData)
      })

      return unsubscribe
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error)
    }
  }

  const handleItemSelect = (item) => {
    const existingIndex = selectedItems.findIndex(selected => selected.id === item.id)
    
    if (existingIndex >= 0) {
      // Retirer l'article
      setSelectedItems(selectedItems.filter((_, index) => index !== existingIndex))
    } else {
      // Ajouter l'article
      setSelectedItems([...selectedItems, {
        ...item,
        quantity: 1,
        unitPrice: item.price || 0,
        totalPrice: item.price || 0
      }])
    }
  }

  const handleQuantityChange = (itemId, quantity) => {
    const updatedItems = selectedItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, parseInt(quantity) || 1)
        const newTotal = newQuantity * item.unitPrice
        return { ...item, quantity: newQuantity, totalPrice: newTotal }
      }
      return item
    })
    setSelectedItems(updatedItems)
    updateTotalAmount(updatedItems)
  }

  const handleUnitPriceChange = (itemId, unitPrice) => {
    const updatedItems = selectedItems.map(item => {
      if (item.id === itemId) {
        const newUnitPrice = parseFloat(unitPrice) || 0
        const newTotal = item.quantity * newUnitPrice
        return { ...item, unitPrice: newUnitPrice, totalPrice: newTotal }
      }
      return item
    })
    setSelectedItems(updatedItems)
    updateTotalAmount(updatedItems)
  }

  const handleTotalPriceChange = (itemId, totalPrice) => {
    const updatedItems = selectedItems.map(item => {
      if (item.id === itemId) {
        const newTotalPrice = parseFloat(totalPrice) || 0
        const newUnitPrice = item.quantity > 0 ? newTotalPrice / item.quantity : 0
        return { ...item, unitPrice: newUnitPrice, totalPrice: newTotalPrice }
      }
      return item
    })
    setSelectedItems(updatedItems)
    updateTotalAmount(updatedItems)
  }

  const updateTotalAmount = (items) => {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0)
    setTotalAmount(total)
  }

  const checkStockAvailability = () => {
    const warnings = []
    
    selectedItems.forEach(item => {
      if (item.quantity > item.quantity) {
        warnings.push({
          item: item.name,
          requested: item.quantity,
          available: item.quantity,
          location: 'magasin',
          type: 'insufficient'
        })
      } else if (item.quantity > 0) {
        warnings.push({
          item: item.name,
          requested: item.quantity,
          available: item.quantity,
          location: 'magasin',
          type: 'sufficient'
        })
      }
    })
    
    setStockWarnings(warnings)
  }

  useEffect(() => {
    checkStockAvailability()
  }, [selectedItems])

  const generateNumber = async () => {
    return await generateDocumentNumber(isQuote ? 'quote' : 'invoice')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (selectedItems.length === 0) {
        setError('Veuillez sélectionner au moins un article')
        return
      }

      if (!clientInfo.name.trim()) {
        setError('Le nom du client est obligatoire')
        return
      }

      const documentData = {
        number: await generateNumber(),
        type: isQuote ? 'quote' : 'invoice',
        client: clientInfo,
        items: selectedItems,
        totalAmount: totalAmount,
        date: new Date(editableDate),
        status: isQuote ? 'pending' : 'pending',
        userId: userProfile.uid,
        created_at: new Date(),
        updated_at: new Date()
      }

      const collectionName = isQuote ? 'quotes' : 'invoices'
      await addDoc(collection(db, collectionName), documentData)
      
      onSuccess()
      onClose()
    } catch (error) {
      setError('Erreur lors de la création: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
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
                <p className="text-sm text-gray-600">Sélectionnez les articles et configurez les prix</p>
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations Client</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client *</label>
                  <input
                    type="text"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Numéro de téléphone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={clientInfo.address}
                    onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adresse du client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email du client"
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={editableDate}
                onChange={(e) => setEditableDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Items Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Sélection des Articles</h4>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                    {items.filter(item => 
                      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.category.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length} article(s)
                  </div>
                  {items.filter(item => 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length > 5 && (
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Défilez pour voir plus
                    </div>
                  )}
                </div>
              </div>
              
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
              
              <div className="relative">
                <div className="h-80 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                {items.filter(item => 
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm">Aucun article trouvé</p>
                    {searchTerm && (
                      <p className="text-xs text-gray-400 mt-1">Essayez avec un autre terme de recherche</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="grid grid-cols-1 gap-2">
                      {items
                        .filter(item => 
                          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((item) => {
                        const isSelected = selectedItems.some(selected => selected.id === item.id)
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemSelect(item)}
                            className={`p-3 bg-white rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                                    <span>Stock: {item.quantity}</span>
                                    <span className="font-medium text-green-600">{item.price?.toLocaleString('fr-FR')} KMF</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                </div>
                
                {/* Scroll indicator */}
                {items.filter(item => 
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchTerm.toLowerCase())
                ).length > 5 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 shadow-lg">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span>Défilez</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Articles Sélectionnés</h4>
                <div className="space-y-4">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{item.name}</h5>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleItemSelect(item)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prix Total</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.totalPrice}
                            onChange={(e) => handleTotalPriceChange(item.id, e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                            <div className="px-3 py-2 bg-gray-100 rounded text-sm font-medium">
                              {item.totalPrice.toLocaleString('fr-FR')} KMF
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Warnings */}
            {stockWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="font-medium text-yellow-800 mb-2">Avertissements de Stock</h5>
                <div className="space-y-2">
                  {stockWarnings.map((warning, index) => (
                    <div key={index} className="text-sm">
                      {warning.type === 'insufficient' ? (
                        <span className="text-red-600">
                          ⚠️ {warning.item}: Stock insuffisant ({warning.available} disponible, {warning.requested} demandé)
                        </span>
                      ) : (
                        <span className="text-green-600">
                          ✅ {warning.item}: Stock disponible ({warning.available} en stock)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {totalAmount.toLocaleString('fr-FR')} KMF
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Création...</span>
                  </div>
                ) : (
                  `Créer ${isQuote ? 'le devis' : 'la facture'}`
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
