import React, { useState, useCallback } from 'react'
import { useModal, useForm, useNotification, useErrorHandler } from '../../hooks'
import { ItemService, UserService, ShopService } from '../../services'
import { globalErrorHandler, errorUtils } from '../../utils/errorHandler'
import { OptimizedItemCard, OptimizedStatCard } from '../optimized'

/**
 * Exemple d'utilisation des nouveaux hooks et services
 */
export default function ExampleUsage() {
  // Hooks personnalisés
  const { isOpen, openModal, closeModal } = useModal()
  const { showSuccess, showError, showWarning } = useNotification()
  const { error, handleError, clearError } = useErrorHandler()
  
  // État local
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Configuration du formulaire avec validation
  const formConfig = {
    initialValues: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    validationSchema: {
      name: (value) => !value ? 'Le nom est requis' : null,
      email: (value) => !value ? 'L\'email est requis' : !/\S+@\S+\.\S+/.test(value) ? 'Email invalide' : null,
      phone: (value) => !value ? 'Le téléphone est requis' : null,
      address: (value) => !value ? 'L\'adresse est requise' : null
    },
    onSubmit: async (values) => {
      try {
        setLoading(true)
        clearError()
        
        // Utiliser le service pour créer un utilisateur
        const userId = await UserService.createUser(values)
        
        showSuccess('Utilisateur créé avec succès !')
        closeModal()
        
        // Recharger les données
        await loadItems()
      } catch (error) {
        handleError(error, 'Erreur lors de la création de l\'utilisateur')
      } finally {
        setLoading(false)
      }
    }
  }

  const { values, errors, handleChange, handleSubmit, reset, isValid } = useForm(formConfig)

  // Fonction pour charger les articles
  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      clearError()
      
      // Utiliser le service pour récupérer les articles
      const itemsQuery = await ItemService.getItemsByShop('shop-id')
      // Note: Dans un vrai composant, vous utiliseriez onSnapshot ici
      
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des articles')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fonction pour créer un article
  const createItem = useCallback(async (itemData) => {
    try {
      setLoading(true)
      clearError()
      
      const itemId = await ItemService.createItem(itemData)
      showSuccess('Article créé avec succès !')
      
      // Recharger les articles
      await loadItems()
    } catch (error) {
      handleError(error, 'Erreur lors de la création de l\'article')
    } finally {
      setLoading(false)
    }
  }, [loadItems, showSuccess, handleError, clearError])

  // Fonction pour mettre à jour un article
  const updateItem = useCallback(async (itemId, updateData) => {
    try {
      setLoading(true)
      clearError()
      
      await ItemService.updateItem(itemId, updateData)
      showSuccess('Article mis à jour avec succès !')
      
      // Recharger les articles
      await loadItems()
    } catch (error) {
      handleError(error, 'Erreur lors de la mise à jour de l\'article')
    } finally {
      setLoading(false)
    }
  }, [loadItems, showSuccess, handleError, clearError])

  // Fonction pour supprimer un article
  const deleteItem = useCallback(async (itemId) => {
    try {
      setLoading(true)
      clearError()
      
      await ItemService.deleteItem(itemId)
      showSuccess('Article supprimé avec succès !')
      
      // Recharger les articles
      await loadItems()
    } catch (error) {
      handleError(error, 'Erreur lors de la suppression de l\'article')
    } finally {
      setLoading(false)
    }
  }, [loadItems, showSuccess, handleError, clearError])

  // Fonction pour gérer les erreurs globales
  const handleGlobalError = useCallback((error) => {
    console.error('Erreur globale capturée:', error)
    showError(`Erreur: ${error.message}`)
  }, [showError])

  // Ajouter le listener d'erreur global
  React.useEffect(() => {
    globalErrorHandler.addErrorListener(handleGlobalError)
    
    return () => {
      globalErrorHandler.removeErrorListener(handleGlobalError)
    }
  }, [handleGlobalError])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Exemple d'utilisation des hooks et services</h1>
      
      {/* Statistiques optimisées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OptimizedStatCard
          title="Total Articles"
          value={items.length}
          icon="📦"
          color="teal"
          description="Articles en stock"
        />
        <OptimizedStatCard
          title="Valeur Totale"
          value="0 FCFA"
          icon="💰"
          color="green"
          description="Valeur du stock"
        />
        <OptimizedStatCard
          title="Alertes"
          value="0"
          icon="⚠️"
          color="red"
          description="Articles en rupture"
        />
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-4">
        <button
          onClick={openModal}
          className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
        >
          Créer Utilisateur
        </button>
        
        <button
          onClick={() => showSuccess('Test de notification de succès !')}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Test Succès
        </button>
        
        <button
          onClick={() => showError('Test de notification d\'erreur !')}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Test Erreur
        </button>
        
        <button
          onClick={() => showWarning('Test de notification d\'avertissement !')}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Test Avertissement
        </button>
      </div>

      {/* Formulaire de création d'utilisateur */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Créer un utilisateur</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={values.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <textarea
                  value={values.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!isValid || loading}
                  className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
