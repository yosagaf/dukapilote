import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { useErrorHandler } from '../hooks/useErrorHandler'
import Sidebar from '../components/Sidebar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { 
  AdminHeader, 
  AdminNavigation, 
  AdminContent 
} from '../components/admin'

export default function AdminDashboardRefactored() {
  const { userProfile, logout } = useAuth()
  const { sidebarWidth } = useSidebar()
  const { error, handleError, clearError } = useErrorHandler()
  
  // États principaux
  const [currentPage] = useState('admin')
  const [currentAdminPage, setCurrentAdminPage] = useState('users')
  const [isLoading, setIsLoading] = useState(true)
  
  // États des modales
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [showCreateShopModal, setShowCreateShopModal] = useState(false)
  const [showCreateDepotModal, setShowCreateDepotModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showEditShopModal, setShowEditShopModal] = useState(false)
  const [showEditDepotModal, setShowEditDepotModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // États des éléments sélectionnés
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedShop, setSelectedShop] = useState(null)
  const [selectedDepot, setSelectedDepot] = useState(null)
  const [deleteType, setDeleteType] = useState('')
  
  // États des notifications
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  useEffect(() => {
    if (userProfile?.uid) {
      loadData()
    }
  }, [userProfile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      clearError()
      
      // Charger les données d'administration
      await Promise.all([
        // TODO: Implémenter le chargement des données
      ])
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des données d\'administration')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentAdminPage(page)
  }

  const handleCreateUser = () => {
    setShowCreateUserModal(true)
  }

  const handleCreateShop = () => {
    setShowCreateShopModal(true)
  }

  const handleCreateDepot = () => {
    setShowCreateDepotModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowEditUserModal(true)
  }

  const handleEditShop = (shop) => {
    setSelectedShop(shop)
    setShowEditShopModal(true)
  }

  const handleEditDepot = (depot) => {
    setSelectedDepot(depot)
    setShowEditDepotModal(true)
  }

  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setDeleteType('user')
    setShowDeleteModal(true)
  }

  const handleDeleteShop = (shop) => {
    setSelectedShop(shop)
    setDeleteType('shop')
    setShowDeleteModal(true)
  }

  const handleDeleteDepot = (depot) => {
    setSelectedDepot(depot)
    setDeleteType('depot')
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      // TODO: Implémenter la suppression
      console.log('Suppression confirmée:', { deleteType, selectedUser, selectedShop, selectedDepot })
      
      setShowDeleteModal(false)
      setSelectedUser(null)
      setSelectedShop(null)
      setSelectedDepot(null)
      setDeleteType('')
      
      // Afficher notification de succès
      setNotificationMessage('Élément supprimé avec succès !')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
      
      // Recharger les données
      loadData()
    } catch (error) {
      handleError(error, 'Erreur lors de la suppression')
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setSelectedUser(null)
    setSelectedShop(null)
    setSelectedDepot(null)
    setDeleteType('')
  }

  const handleModalClose = () => {
    setShowCreateUserModal(false)
    setShowCreateShopModal(false)
    setShowCreateDepotModal(false)
    setShowEditUserModal(false)
    setShowEditShopModal(false)
    setShowEditDepotModal(false)
    setSelectedUser(null)
    setSelectedShop(null)
    setSelectedDepot(null)
  }

  const handleModalSuccess = (message) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
    
    // Recharger les données
    loadData()
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
          <AdminHeader
            currentPage={currentAdminPage}
            onLogout={logout}
          />
          
          <AdminNavigation
            currentPage={currentAdminPage}
            onPageChange={handlePageChange}
          />
          
          <AdminContent
            currentPage={currentAdminPage}
            userProfile={userProfile}
            onLogout={logout}
          />
        </div>
      </div>

      {/* Modales de création */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Créer un utilisateur</h2>
            <p className="text-gray-600 mb-4">Fonctionnalité en cours de développement...</p>
            <button
              onClick={handleModalClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {showCreateShopModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Créer un magasin</h2>
            <p className="text-gray-600 mb-4">Fonctionnalité en cours de développement...</p>
            <button
              onClick={handleModalClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {showCreateDepotModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Créer un dépôt</h2>
            <p className="text-gray-600 mb-4">Fonctionnalité en cours de développement...</p>
            <button
              onClick={handleModalClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
              <button
                onClick={handleDeleteCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notificationMessage}
        </div>
      )}
    </div>
  )
}
