import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { useItemsWithLinkedDepots } from '../hooks/useItems'
import { useErrorHandler } from '../hooks/useErrorHandler'
import Sidebar from '../components/Sidebar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { 
  QuotesHeader, 
  QuotesTabs, 
  QuotesList, 
  InvoicesList, 
  DraftsList 
} from '../components/quotes'
import QuoteInvoiceWizard from '../components/QuoteInvoiceWizard'
import { downloadPDF } from '../utils/pdfGeneratorModern.jsx'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF, InvoicePDF } from '../utils/pdfGeneratorModern.jsx'

export default function QuotesInvoicesRefactored() {
  const { userProfile, logout } = useAuth()
  const { sidebarWidth } = useSidebar()
  const { error, handleError, clearError } = useErrorHandler()
  
  // États principaux
  const [currentPage] = useState('quotes-invoices')
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('quotes')
  
  // États du wizard
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [wizardType, setWizardType] = useState('quote')
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState({
    clientInfo: { name: '', address: '', phone: '', email: '' },
    selectedItems: [],
    pricingMode: 'unit',
    totalAmount: 0,
    editableDate: new Date().toISOString().split('T')[0]
  })
  
  // États des notifications
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  
  // Hook personnalisé pour les articles
  const { items, loading: itemsLoading, error: itemsError } = useItemsWithLinkedDepots(userProfile)
  
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
    }
  }, [userProfile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      clearError()
      
      // Charger les devis, factures et brouillons
      await Promise.all([
        loadQuotes(),
        loadInvoices(),
        loadDrafts()
      ])
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  const loadQuotes = async () => {
    // TODO: Implémenter le chargement des devis
    setQuotes([])
  }

  const loadInvoices = async () => {
    // TODO: Implémenter le chargement des factures
    setInvoices([])
  }

  const loadDrafts = async () => {
    // TODO: Implémenter le chargement des brouillons
    setDrafts([])
  }

  const handleNewQuote = () => {
    setWizardType('quote')
    setShowCreateWizard(true)
    setCurrentStep(1)
    setWizardData({
      clientInfo: { name: '', address: '', phone: '', email: '' },
      selectedItems: [],
      pricingMode: 'unit',
      totalAmount: 0,
      editableDate: new Date().toISOString().split('T')[0]
    })
  }

  const handleNewInvoice = () => {
    setWizardType('invoice')
    setShowCreateWizard(true)
    setCurrentStep(1)
    setWizardData({
      clientInfo: { name: '', address: '', phone: '', email: '' },
      selectedItems: [],
      pricingMode: 'unit',
      totalAmount: 0,
      editableDate: new Date().toISOString().split('T')[0]
    })
  }

  const handleShowDrafts = () => {
    setActiveTab('drafts')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleEditDocument = (document) => {
    // TODO: Implémenter l'édition de document
    console.log('Édition de document:', document)
  }

  const handleDeleteDocument = (document) => {
    // TODO: Implémenter la suppression de document
    console.log('Suppression de document:', document)
  }

  const handleDownloadDocument = async (document) => {
    try {
      if (document.type === 'quote') {
        const pdfDoc = pdf(QuotePDF({ document, shopInfo: userProfile }))
        const blob = await pdfDoc.toBlob()
        downloadPDF(blob, `devis-${document.id}.pdf`)
      } else if (document.type === 'invoice') {
        const pdfDoc = pdf(InvoicePDF({ document, shopInfo: userProfile }))
        const blob = await pdfDoc.toBlob()
        downloadPDF(blob, `facture-${document.id}.pdf`)
      }
    } catch (error) {
      handleError(error, 'Erreur lors du téléchargement du document')
    }
  }

  const handleWizardClose = () => {
    setShowCreateWizard(false)
    setCurrentStep(1)
    setWizardData({
      clientInfo: { name: '', address: '', phone: '', email: '' },
      selectedItems: [],
      pricingMode: 'unit',
      totalAmount: 0,
      editableDate: new Date().toISOString().split('T')[0]
    })
  }

  const handleWizardComplete = (documentData) => {
    setShowCreateWizard(false)
    setCurrentStep(1)
    setWizardData({
      clientInfo: { name: '', address: '', phone: '', email: '' },
      selectedItems: [],
      pricingMode: 'unit',
      totalAmount: 0,
      editableDate: new Date().toISOString().split('T')[0]
    })
    
    // Afficher notification de succès
    setNotificationMessage('Document créé avec succès !')
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
    
    // Recharger les données
    loadData()
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'quotes':
        return (
          <QuotesList
            quotes={quotes}
            onEdit={handleEditDocument}
            onDelete={handleDeleteDocument}
            onDownload={handleDownloadDocument}
          />
        )
      case 'invoices':
        return (
          <InvoicesList
            invoices={invoices}
            onEdit={handleEditDocument}
            onDelete={handleDeleteDocument}
            onDownload={handleDownloadDocument}
          />
        )
      case 'drafts':
        return (
          <DraftsList
            drafts={drafts}
            onEdit={handleEditDocument}
            onDelete={handleDeleteDocument}
            onDownload={handleDownloadDocument}
          />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
      <Sidebar />
      
      <div 
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">
          <QuotesHeader
            currentTab={activeTab}
            onNewQuote={handleNewQuote}
            onNewInvoice={handleNewInvoice}
            onShowDrafts={handleShowDrafts}
            onLogout={logout}
          />
          
          <QuotesTabs
            currentTab={activeTab}
            onTabChange={handleTabChange}
          />
          
          {renderContent()}
        </div>
      </div>

      {showCreateWizard && (
        <QuoteInvoiceWizard
          isOpen={showCreateWizard}
          onClose={handleWizardClose}
          onComplete={handleWizardComplete}
          type={wizardType}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          wizardData={wizardData}
          setWizardData={setWizardData}
          items={items}
          steps={steps}
          totalSteps={totalSteps}
        />
      )}

      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notificationMessage}
        </div>
      )}
    </div>
  )
}
