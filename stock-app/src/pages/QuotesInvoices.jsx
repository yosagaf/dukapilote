import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Sidebar from '../components/Sidebar'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import QuoteInvoiceCard from '../components/QuoteInvoiceCard'
import { downloadPDF } from '../utils/pdfGeneratorModern.jsx'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF, InvoicePDF } from '../utils/pdfGeneratorModern.jsx'
import { generateDocumentNumber, previewDocumentNumber } from '../utils/simpleNumberingService.js'

export default function QuotesInvoicesIntegrated() {
  const { userProfile, logout } = useAuth()
  const { sidebarWidth } = useSidebar()
  const [currentPage] = useState('quotes-invoices')
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [wizardType, setWizardType] = useState('quote') // 'quote' or 'invoice'
  const [activeTab, setActiveTab] = useState('quotes') // 'quotes' or 'invoices'
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState({
    clientInfo: { name: '', address: '', phone: '', email: '' },
    selectedItems: [],
    pricingMode: 'unit',
    totalAmount: 0,
    customAmount: 0,
    showCalculatedAmount: true,
    editableDate: new Date().toISOString().split('T')[0],
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: 0,
    discountAmount: 0,
    showDiscountInPDF: true
  })
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [shopInfo, setShopInfo] = useState(null)
  const [drafts, setDrafts] = useState([]) // Brouillons sauvegardés
  const [showDrafts, setShowDrafts] = useState(false) // Afficher l'historique des Brouillons
  const [showNotification, setShowNotification] = useState(false) // Afficher la notification
  const [notificationMessage, setNotificationMessage] = useState('') // Message de notification

  const totalSteps = 4
  const steps = [
    { number: 1, title: 'Informations Client', description: 'Renseignez les informations du client' },
    { number: 2, title: 'Sélection Articles', description: 'Choisissez les articles à inclure' },
    { number: 3, title: 'Configuration Prix', description: 'Définissez les prix et quantités' },
    { number: 4, title: 'Aperçu & Validation', description: 'Vérifiez et validez le document' }
  ]

  useEffect(() => {
    if (userProfile?.uid) {
      loadData()
      loadShopInfo()
      loadDrafts()
    }
  }, [userProfile])

  const loadShopInfo = async () => {
    if (!userProfile?.shopId) return
    
    try {
      const { getDoc, doc, updateDoc } = await import('firebase/firestore')
      const shopDoc = await getDoc(doc(db, 'shops', userProfile.shopId))
      if (shopDoc.exists()) {
        const shopData = {
          id: shopDoc.id,
          ...shopDoc.data()
        }
        
        // Vérifier si les champs phone et phone2 existent, sinon les ajouter
        const needsUpdate = !shopData.phone || !shopData.phone2 || !shopData.email
        if (needsUpdate) {
          await updateDoc(doc(db, 'shops', userProfile.shopId), {
            phone: shopData.phone || '+269 123 45 67',
            phone2: shopData.phone2 || '+269 987 65 43',
            email: shopData.email || 'contact@magasin.com',
            updated_at: new Date()
          })
          
          // Recharger les données mises à jour
          const updatedShopDoc = await getDoc(doc(db, 'shops', userProfile.shopId))
          if (updatedShopDoc.exists()) {
            const updatedShopData = {
              id: updatedShopDoc.id,
              ...updatedShopDoc.data()
            }
            setShopInfo(updatedShopData)
            return
          }
        }
        setShopInfo(shopData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des informations du magasin:', error)
    }
  }

  // Charger les Brouillons depuis le localStorage
  const loadDrafts = () => {
    try {
      const savedDrafts = localStorage.getItem(`drafts_${userProfile?.uid}`)
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des Brouillons:', error)
    }
  }

  // Sauvegarder un Brouillon
  const saveDraft = () => {
    const draft = {
      id: Date.now().toString(),
      type: wizardType,
      data: { ...wizardData },
      createdAt: new Date().toISOString(),
      title: `${wizardType === 'quote' ? 'Devis' : 'Facture'} - ${wizardData.clientInfo.name || 'Sans nom'}`
    }
    
    const newDrafts = [draft, ...drafts.filter(d => d.id !== draft.id)]
    setDrafts(newDrafts)
    localStorage.setItem(`drafts_${userProfile?.uid}`, JSON.stringify(newDrafts))
    
    // Afficher une notification stylée
    showStyledNotification('Brouillon sauvegardé avec succès !')
  }

  // Charger un Brouillon
  const loadDraft = (draft) => {
    setWizardData(draft.data)
    setWizardType(draft.type)
    setCurrentStep(1)
    setShowCreateWizard(true)
    setShowDrafts(false)
  }

  // Supprimer un Brouillon
  const deleteDraft = (draftId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce Brouillon ?')) {
      const newDrafts = drafts.filter(d => d.id !== draftId)
      setDrafts(newDrafts)
      localStorage.setItem(`drafts_${userProfile?.uid}`, JSON.stringify(newDrafts))
    }
  }

  // Fonction pour afficher une notification stylée
  const showStyledNotification = (message) => {
    setNotificationMessage(message)
    setShowNotification(true)
    
    // Auto-hide après 3 secondes
    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Charger les articles
      const itemsQuery = query(
        collection(db, 'items'),
        where('shopId', '==', userProfile.shopId)
      )
      
      const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setItems(itemsData)
      })

      // Pour l'instant, initialiser avec des tableaux vides
      setQuotes([])
      setInvoices([])
      
      return () => {
        unsubscribeItems()
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      setQuotes([])
      setInvoices([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateQuote = () => {
    setWizardType('quote')
    setShowCreateWizard(true)
    setCurrentStep(1)
    setWizardData({
      clientInfo: { name: '', address: '', phone: '', email: '' },
      selectedItems: [],
      pricingMode: 'unit',
      totalAmount: 0,
      customAmount: 0,
      showCalculatedAmount: true,
      editableDate: new Date().toISOString().split('T')[0],
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      showDiscountInPDF: true
    })
  }

  const handleCreateInvoice = () => {
    setWizardType('invoice')
    setShowCreateWizard(true)
    setCurrentStep(1)
    setWizardData({
      clientInfo: { name: '', address: '', phone: '', email: '' },
      selectedItems: [],
      pricingMode: 'unit',
      totalAmount: 0,
      customAmount: 0,
      showCalculatedAmount: true,
      editableDate: new Date().toISOString().split('T')[0],
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      showDiscountInPDF: true
    })
  }

  const handleCloseWizard = () => {
    setShowCreateWizard(false)
    setCurrentStep(1)
  }

  const handleWizardSuccess = () => {
    setShowCreateWizard(false)
    setCurrentStep(1)
    loadData()
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
    const existingIndex = wizardData.selectedItems.findIndex(selected => selected.id === item.id)
    
    if (existingIndex >= 0) {
      // Retirer l'article
      setWizardData(prev => ({
        ...prev,
        selectedItems: prev.selectedItems.filter((_, index) => index !== existingIndex)
      }))
    } else {
      // Ajouter l'article
      setWizardData(prev => ({
        ...prev,
        selectedItems: [...prev.selectedItems, {
          ...item,
          quantity: 1,
          unitPrice: item.price || 0,
          totalPrice: item.price || 0
        }]
      }))
    }
  }

  const handleItemChange = (itemId, field, value) => {
    setWizardData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const handleRemoveItem = (itemId) => {
    setWizardData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(item => item.id !== itemId)
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const calculatedTotal = wizardData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
      
      // Calculer la remise
      let discountAmount = 0
      if (wizardData.discountType === 'percentage' && wizardData.discountValue > 0) {
        discountAmount = (calculatedTotal * wizardData.discountValue) / 100
      } else if (wizardData.discountType === 'fixed' && wizardData.discountValue > 0) {
        discountAmount = wizardData.discountValue
      }
      
      const subtotalAfterDiscount = calculatedTotal - discountAmount
      const finalAmount = wizardData.customAmount > 0 ? wizardData.customAmount : subtotalAfterDiscount
      
      // Générer le numéro avec le nouveau système (incrémente le compteur)
      const documentNumber = await generateDocumentNumber(wizardType)
      
      const documentData = {
        type: wizardType,
        number: documentNumber,
        clientInfo: wizardData.clientInfo,
        selectedItems: wizardData.selectedItems,
        totalAmount: finalAmount,
        calculatedAmount: calculatedTotal,
        customAmount: wizardData.customAmount,
        showCalculatedAmount: wizardData.showCalculatedAmount,
        discountType: wizardData.discountType,
        discountValue: wizardData.discountValue,
        discountAmount: discountAmount,
        subtotalAfterDiscount: subtotalAfterDiscount,
        showDiscountInPDF: wizardData.showDiscountInPDF,
        date: wizardData.editableDate,
        userId: userProfile.uid,
        shopId: userProfile.shopId,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      }

      // Sauvegarder dans la base de données
      await addDoc(collection(db, wizardType === 'quote' ? 'quotes' : 'invoices'), documentData)
      
      // Générer et télécharger le PDF
      downloadPDF(documentData, wizardType, shopInfo)
      
      handleWizardSuccess()
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ClientInfoStep 
          clientInfo={wizardData.clientInfo} 
          setClientInfo={(clientInfo) => setWizardData(prev => ({ ...prev, clientInfo }))} 
        />
      case 2:
        return <ArticleSelectionStep 
          items={items} 
          selectedItems={wizardData.selectedItems}
          onItemSelect={handleItemSelect}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      case 3:
        return <PricingStep 
          selectedItems={wizardData.selectedItems}
          onItemChange={handleItemChange}
          onRemoveItem={handleRemoveItem}
          pricingMode={wizardData.pricingMode}
          setPricingMode={(pricingMode) => setWizardData(prev => ({ ...prev, pricingMode }))}
          customAmount={wizardData.customAmount}
          setCustomAmount={(customAmount) => setWizardData(prev => ({ ...prev, customAmount }))}
          showCalculatedAmount={wizardData.showCalculatedAmount}
          setShowCalculatedAmount={(showCalculatedAmount) => setWizardData(prev => ({ ...prev, showCalculatedAmount }))}
          discountType={wizardData.discountType}
          setDiscountType={(discountType) => setWizardData(prev => ({ ...prev, discountType }))}
          discountValue={wizardData.discountValue}
          setDiscountValue={(discountValue) => setWizardData(prev => ({ ...prev, discountValue }))}
          showDiscountInPDF={wizardData.showDiscountInPDF}
          setShowDiscountInPDF={(showDiscountInPDF) => setWizardData(prev => ({ ...prev, showDiscountInPDF }))}
        />
      case 4:
        return <PreviewStep 
          clientInfo={wizardData.clientInfo}
          selectedItems={wizardData.selectedItems}
          totalAmount={wizardData.customAmount > 0 ? wizardData.customAmount : wizardData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)}
          calculatedAmount={wizardData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)}
          customAmount={wizardData.customAmount}
          showCalculatedAmount={wizardData.showCalculatedAmount}
          discountType={wizardData.discountType}
          discountValue={wizardData.discountValue}
          showDiscountInPDF={wizardData.showDiscountInPDF}
          date={wizardData.editableDate}
          isQuote={wizardType === 'quote'}
          shopInfo={shopInfo}
        />
      default:
        return null
    }
  }

  const currentData = activeTab === 'quotes' ? quotes : invoices
  const currentType = activeTab === 'quotes' ? 'devis' : 'factures'

  if (showDrafts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
        <Sidebar currentPage={currentPage} />
        <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-teal-100">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">Brouillons Sauvegardés</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Reprenez vos Brouillons de devis et factures
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setShowDrafts(false)}
                    variant="secondary"
                    size="md"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Fermer
                  </Button>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="md"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="px-6 py-6">
            <div className="max-w-7xl mx-auto">

              {drafts.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun Brouillon sauvegardé</h3>
                  <p className="text-gray-500">Commencez par créer un devis ou une facture</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="group bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                      {/* Header avec gradient */}
                      <div className={`relative overflow-hidden rounded-lg mb-4 ${draft.type === 'quote' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
                        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                        <div className="relative p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                {draft.type === 'quote' ? (
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h3 className="text-white font-semibold text-sm">{draft.title}</h3>
                                <p className="text-white text-opacity-80 text-xs">
                                  {draft.type === 'quote' ? 'Devis' : 'Facture'}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => loadDraft(draft)}
                                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200 group-hover:scale-110"
                                title="Reprendre ce Brouillon"
                              >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteDraft(draft.id)}
                                className="p-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200 group-hover:scale-110"
                                title="Supprimer ce Brouillon"
                              >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenu avec icônes */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Client</p>
                            <p className="text-sm font-medium text-gray-900">{draft.data.clientInfo.name || 'Non renseigné'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Articles</p>
                            <p className="text-sm font-medium text-gray-900">{draft.data.selectedItems.length} article(s)</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-sm font-bold text-gray-900">{draft.data.totalAmount.toLocaleString('fr-FR')} KMF</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Créé le</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(draft.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer avec bouton d'action principal */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => loadDraft(draft)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Reprendre ce Brouillon</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (showCreateWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
        <Sidebar currentPage={currentPage} />
        
        <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-teal-100">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full mr-4 flex items-center justify-center ${
                    wizardType === 'quote' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <svg className={`w-6 h-6 ${wizardType === 'quote' ? 'text-blue-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {wizardType === 'quote' ? 'Nouveau Devis' : 'Nouvelle Facture'}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Processus en {totalSteps} étapes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleCloseWizard}
                    variant="secondary"
                    size="md"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Annuler
                  </Button>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="md"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="px-6 py-6">
            <div className="max-w-6xl mx-auto">

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

              {/* Step Content */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-8 min-h-96">
                {renderStepContent()}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  variant="secondary"
                  size="md"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      size="md"
                    >
                      Suivant
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={saveDraft}
                        variant="secondary"
                        size="md"
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Sauvegarder Brouillon
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        variant="primary"
                        size="md"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Création...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Créer {wizardType === 'quote' ? 'Devis' : 'Facture'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
      <Sidebar currentPage={currentPage} />
      
      <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-teal-100">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Devis & Factures</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gérez vos devis et factures
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCreateQuote}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nouveau Devis
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Nouvelle Facture
                </button>
                <button
                  onClick={() => setShowDrafts(!showDrafts)}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Brouillons ({drafts.length})
                </button>
                <button
                  onClick={logout}
                  className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-6">
          <div className="max-w-7xl mx-auto">

            {/* Tabs */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 overflow-hidden mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('quotes')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'quotes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Devis ({quotes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'invoices'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Factures ({invoices.length})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : currentData.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun {currentType} trouvé</h3>
                    <p className="text-gray-500 mb-6">Commencez par créer votre premier {currentType}</p>
                    <Button
                      onClick={activeTab === 'quotes' ? handleCreateQuote : handleCreateInvoice}
                      variant="primary"
                      size="md"
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Créer un {currentType}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentData.map((item) => (
                      <QuoteInvoiceCard
                        key={item.id}
                        item={item}
                        type={activeTab}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Succès !</p>
                <p className="text-sm text-gray-600">{notificationMessage}</p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composants pour chaque étape
function ClientInfoStep({ clientInfo, setClientInfo }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h4 className="text-2xl font-bold text-gray-900 mb-2">Informations Client</h4>
        <p className="text-gray-600">Renseignez les informations du client pour ce document</p>
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h4 className="text-2xl font-bold text-gray-900 mb-2">Sélection des Articles</h4>
        <p className="text-gray-600">Choisissez les articles à inclure dans ce document</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredItems.map((item) => {
            const isSelected = selectedItems.some(selected => selected.id === item.id)
            return (
              <div
                key={item.id}
                onClick={() => onItemSelect(item)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 truncate">{item.name}</h5>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{item.category}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Stock: {item.quantity}</span>
                  <span className="font-medium text-green-600">{item.price?.toLocaleString('fr-FR')} KMF</span>
                </div>
              </div>
            )
          })}
        </div>

        {selectedItems.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedItems.length}</strong> article(s) sélectionné(s)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function PricingStep({ selectedItems, onItemChange, onRemoveItem, pricingMode, setPricingMode, customAmount, setCustomAmount, showCalculatedAmount, setShowCalculatedAmount, discountType, setDiscountType, discountValue, setDiscountValue, showDiscountInPDF, setShowDiscountInPDF }) {
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
                <span className="text-lg font-semibold text-gray-900">Total calculé:</span>
                <span className="text-2xl font-bold text-green-600">
                  {selectedItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('fr-FR')} KMF
                </span>
              </div>
            </div>

            {/* Section Remise */}
            <div className="mt-6 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">Remise</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de remise
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (KMF)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {discountType === 'percentage' ? 'Pourcentage de remise' : 'Montant de remise (KMF)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={discountType === 'percentage' ? '0.01' : '1'}
                    max={discountType === 'percentage' ? '100' : undefined}
                    value={discountValue === 0 ? '' : discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={discountType === 'percentage' ? 'Ex: 10' : 'Ex: 5000'}
                  />
                </div>
              </div>
              
              {discountValue > 0 && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-yellow-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sous-total:</span>
                      <span className="text-sm font-medium">{selectedItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('fr-FR')} KMF</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Remise ({discountType === 'percentage' ? `${discountValue}%` : 'Montant fixe'}):
                      </span>
                      <span className="text-sm font-medium text-red-600">
                        -{discountType === 'percentage' 
                          ? ((selectedItems.reduce((sum, item) => sum + item.totalPrice, 0) * discountValue) / 100).toLocaleString('fr-FR')
                          : discountValue.toLocaleString('fr-FR')
                        } KMF
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total après remise:</span>
                        <span className="text-xl font-bold text-green-600">
                          {(selectedItems.reduce((sum, item) => sum + item.totalPrice, 0) - 
                            (discountType === 'percentage' 
                              ? (selectedItems.reduce((sum, item) => sum + item.totalPrice, 0) * discountValue) / 100
                              : discountValue
                            )
                          ).toLocaleString('fr-FR')} KMF
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section Montant Personnalisé */}
            <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">Montant Personnalisé</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant personnalisé (KMF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Saisissez le montant souhaité"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showCalculatedAmount}
                      onChange={(e) => setShowCalculatedAmount(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Afficher le montant calculé dans le PDF
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Option pour afficher la remise dans le PDF */}
              {discountValue > 0 && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showDiscountInPDF}
                      onChange={(e) => setShowDiscountInPDF(e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Afficher la remise dans le PDF (décoché = montant final seulement)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Si décoché, seul le montant final sera affiché dans le PDF
                  </p>
                </div>
              )}
              
              {customAmount > 0 && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Montant final:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {customAmount.toLocaleString('fr-FR')} KMF
                    </span>
                  </div>
                  {showCalculatedAmount && (
                    <div className="mt-2 text-sm text-gray-600">
                      (Montant calculé: {selectedItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('fr-FR')} KMF)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PreviewStep({ clientInfo, selectedItems, totalAmount, calculatedAmount, customAmount, showCalculatedAmount, discountType, discountValue, showDiscountInPDF, date, isQuote, shopInfo }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Générer automatiquement le PDF au chargement
  useEffect(() => {
    const generatePDF = async () => {
      // Générer le numéro avec le nouveau système
      const documentNumber = await generateDocumentNumber(isQuote ? 'quote' : 'invoice')
      
      // Calculer la remise pour l'aperçu
      let discountAmount = 0
      if (discountType === 'percentage' && discountValue > 0) {
        discountAmount = (calculatedAmount * discountValue) / 100
      } else if (discountType === 'fixed' && discountValue > 0) {
        discountAmount = discountValue
      }
      
      const subtotalAfterDiscount = calculatedAmount - discountAmount
      const finalAmount = customAmount > 0 ? customAmount : subtotalAfterDiscount
      
      const documentData = {
        type: isQuote ? 'quote' : 'invoice',
        number: documentNumber,
        clientInfo,
        selectedItems: selectedItems,
        totalAmount: finalAmount,
        calculatedAmount,
        customAmount,
        showCalculatedAmount,
        discountType,
        discountValue,
        discountAmount,
        subtotalAfterDiscount,
        showDiscountInPDF,
        date
      }
      
      setIsGenerating(true)
      try {
        // Générer le PDF directement avec les composants
        const blob = isQuote 
          ? await pdf(<QuotePDF documentData={documentData} shopInfo={shopInfo} />).toBlob()
          : await pdf(<InvoicePDF documentData={documentData} shopInfo={shopInfo} />).toBlob()
        
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error)
      } finally {
        setIsGenerating(false)
      }
    }

    generatePDF()
  }, [clientInfo, selectedItems, totalAmount, date, isQuote, shopInfo])

  const handleDownloadPDF = async () => {
    // Prévisualiser le numéro SANS l'incrémenter
    const documentNumber = await previewDocumentNumber(isQuote ? 'quote' : 'invoice')
    
    // Calculer la remise pour le téléchargement
    let discountAmount = 0
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = (calculatedAmount * discountValue) / 100
    } else if (discountType === 'fixed' && discountValue > 0) {
      discountAmount = discountValue
    }
    
    const subtotalAfterDiscount = calculatedAmount - discountAmount
    const finalAmount = customAmount > 0 ? customAmount : subtotalAfterDiscount
    
    const documentData = {
      type: isQuote ? 'quote' : 'invoice',
      number: documentNumber,
      clientInfo,
      selectedItems: selectedItems,
      totalAmount: finalAmount,
      calculatedAmount,
      customAmount,
      showCalculatedAmount,
      discountType,
      discountValue,
      discountAmount,
      subtotalAfterDiscount,
      showDiscountInPDF,
      date
    }
    
    downloadPDF(documentData, isQuote ? 'quote' : 'invoice', shopInfo)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h4 className="text-2xl font-bold text-gray-900 mb-2">Aperçu du Document</h4>
        <p className="text-gray-600">Vérifiez les informations avant de créer le {isQuote ? 'devis' : 'facture'}</p>
        <div className="mt-4">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Télécharger le PDF
          </button>
        </div>
      </div>

      {/* Affichage du PDF */}
      {isGenerating ? (
        <div className="w-full h-full bg-gray-100 border border-gray-300 shadow-lg flex items-center justify-center" style={{ minHeight: '80vh' }}>
          <div className="text-center text-gray-500">
            <svg className="animate-spin w-16 h-16 mx-auto mb-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium">Génération du PDF en cours...</p>
            <p className="text-sm text-gray-400 mt-2">Veuillez patienter</p>
          </div>
        </div>
      ) : pdfUrl ? (
        <div className="w-full bg-white border-2 border-gray-400 shadow-2xl rounded-lg overflow-hidden" style={{ minHeight: '80vh' }}>
          <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Aperçu PDF - {isQuote ? 'Devis' : 'Facture'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Ouvrir dans un nouvel onglet"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Télécharger le PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
          <iframe
            src={pdfUrl}
            className="w-full border-0 bg-white"
            style={{ minHeight: '75vh', height: '75vh' }}
            title="Aperçu PDF"
          />
        </div>
      ) : (
        <div className="w-full h-full bg-gray-100 border border-gray-300 shadow-lg flex items-center justify-center" style={{ minHeight: '80vh' }}>
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Erreur lors de la génération du PDF</p>
            <p className="text-sm text-gray-400 mt-2">Veuillez réessayer</p>
          </div>
        </div>
      )}
    </div>
  )
}
