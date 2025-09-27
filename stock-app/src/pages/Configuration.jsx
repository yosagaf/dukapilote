import { useState } from 'react'
import { useConfig } from '../contexts/ConfigContext'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import Sidebar from '../components/Sidebar'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Configuration() {
  const { userProfile } = useAuth()
  const { sidebarWidth } = useSidebar()
  const { config, updateConfig, loading, error, clearError } = useConfig()
  
  const [formData, setFormData] = useState({
    // Configuration des documents
    autoDeductStock: config.autoDeductStock || false,
    requirePaymentConfirmation: config.requirePaymentConfirmation || true,
    
    // Configuration de l'entreprise
    companyName: config.companyName || 'DUKAPILOTE',
    companyLocation: config.companyLocation || 'Moroni, Comores',
    companyPhone: config.companyPhone || '+269 XXX XX XX',
    companyPhone2: config.companyPhone2 || '',
    companyEmail: config.companyEmail || 'contact@dukapilote.com',
    
    // Configuration des documents
    defaultQuoteValidity: config.defaultQuoteValidity || 30,
    defaultPaymentTerms: config.defaultPaymentTerms || 30,
    
    // Configuration des notifications
    enableNotifications: config.enableNotifications || true,
    lowStock: config.notificationTypes?.lowStock || true,
    paymentReminders: config.notificationTypes?.paymentReminders || true,
    newOrders: config.notificationTypes?.newOrders || true
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    clearError()

    try {
      const configToSave = {
        ...formData,
        notificationTypes: {
          lowStock: formData.lowStock,
          paymentReminders: formData.paymentReminders,
          newOrders: formData.newOrders
        }
      }
      
      await updateConfig(configToSave)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar currentPage="configuration" />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar currentPage="configuration" />
      <div 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
                <p className="text-gray-600 mt-1">
                  Personnalisez les paramètres de votre application
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {saveSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-800">Configuration sauvegardée avec succès !</p>
                  </div>
                )}

                {/* Configuration des documents */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Configuration des Documents
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Déduire automatiquement le stock
                        </label>
                        <p className="text-xs text-gray-500">
                          Déduit le stock dès la création de la facture
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.autoDeductStock}
                        onChange={(e) => handleInputChange('autoDeductStock', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Exiger confirmation de paiement
                        </label>
                        <p className="text-xs text-gray-500">
                          Nécessite une confirmation manuelle pour marquer comme payé
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.requirePaymentConfirmation}
                        onChange={(e) => handleInputChange('requirePaymentConfirmation', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Configuration de l'entreprise */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Informations de l'Entreprise
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'entreprise
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Localisation
                      </label>
                      <input
                        type="text"
                        value={formData.companyLocation}
                        onChange={(e) => handleInputChange('companyLocation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone principal
                      </label>
                      <input
                        type="text"
                        value={formData.companyPhone}
                        onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone secondaire
                      </label>
                      <input
                        type="text"
                        value={formData.companyPhone2}
                        onChange={(e) => handleInputChange('companyPhone2', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.companyEmail}
                        onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Configuration des délais */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Délais par Défaut
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validité des devis (jours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.defaultQuoteValidity}
                        onChange={(e) => handleInputChange('defaultQuoteValidity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Délai de paiement (jours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.defaultPaymentTerms}
                        onChange={(e) => handleInputChange('defaultPaymentTerms', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Configuration des notifications */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Notifications
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Activer les notifications
                        </label>
                        <p className="text-xs text-gray-500">
                          Active ou désactive toutes les notifications
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.enableNotifications}
                        onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    {formData.enableNotifications && (
                      <div className="ml-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Stock faible
                          </label>
                          <input
                            type="checkbox"
                            checked={formData.lowStock}
                            onChange={(e) => handleInputChange('lowStock', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Rappels de paiement
                          </label>
                          <input
                            type="checkbox"
                            checked={formData.paymentReminders}
                            onChange={(e) => handleInputChange('paymentReminders', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Nouvelles commandes
                          </label>
                          <input
                            type="checkbox"
                            checked={formData.newOrders}
                            onChange={(e) => handleInputChange('newOrders', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2"
                  >
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
