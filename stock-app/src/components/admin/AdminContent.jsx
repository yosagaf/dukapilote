import React from 'react'
import { useUsers } from '../../hooks/useUsers'
import { useShops } from '../../hooks/useShops'
import { useDepots } from '../../hooks/useDepots'
import CreateUserModal from '../CreateUserModal'
import CreateShopModal from '../CreateShopModal'
import CreateDepotModal from '../CreateDepotModal'
import EditUserModal from '../EditUserModal'
import EditShopModal from '../EditShopModal'
import EditDepotModal from '../EditDepotModal'
import DeleteConfirmModal from '../DeleteConfirmModal'

/**
 * Composant pour le contenu de l'administration
 * @param {string} currentPage - Page actuelle
 * @param {Object} userProfile - Profil utilisateur
 * @param {Function} onLogout - Fonction pour se déconnecter
 */
export default function AdminContent({ currentPage, userProfile, onLogout }) {
  const { users, loading: usersLoading, error: usersError } = useUsers()
  const { shops, loading: shopsLoading, error: shopsError } = useShops()
  const { depots, loading: depotsLoading, error: depotsError } = useDepots()

  const renderUsersContent = () => {
    if (usersLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )
    }

    if (usersError) {
      return (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">Erreur lors du chargement des utilisateurs</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel Utilisateur
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600 font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{user.email}</h3>
                    <p className="text-sm text-gray-600">{user.role || 'Utilisateur'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Magasin:</span> {user.shopName || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Créé:</span> {new Date(user.createdAt?.toDate()).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditUser(user)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteUser(user)}
                  className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderShopsContent = () => {
    if (shopsLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )
    }

    if (shopsError) {
      return (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">Erreur lors du chargement des magasins</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Magasins</h2>
          <button
            onClick={() => setShowCreateShopModal(true)}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau Magasin
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">
                      {shop.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
                    <p className="text-sm text-gray-600">{shop.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Téléphone:</span> {shop.phone || 'N/A'}
                </p>
                {shop.phone2 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Téléphone 2:</span> {shop.phone2}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {shop.email || 'N/A'}
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditShop(shop)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteShop(shop)}
                  className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDepotsContent = () => {
    if (depotsLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )
    }

    if (depotsError) {
      return (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">Erreur lors du chargement des dépôts</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Dépôts</h2>
          <button
            onClick={() => setShowCreateDepotModal(true)}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau Dépôt
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {depots.map((depot) => (
            <div key={depot.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {depot.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{depot.name}</h3>
                    <p className="text-sm text-gray-600">{depot.address}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Téléphone:</span> {depot.phone || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {depot.email || 'N/A'}
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditDepot(depot)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteDepot(depot)}
                  className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderToolsContent = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Outils d'Administration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">🔧</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Maintenance</h3>
            </div>
            <p className="text-gray-600 mb-4">Outils de maintenance du système</p>
            <button className="w-full bg-purple-50 text-purple-600 px-4 py-2 rounded-md hover:bg-purple-100 transition-colors text-sm font-medium">
              Accéder
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Statistiques</h3>
            </div>
            <p className="text-gray-600 mb-4">Statistiques et rapports système</p>
            <button className="w-full bg-orange-50 text-orange-600 px-4 py-2 rounded-md hover:bg-orange-100 transition-colors text-sm font-medium">
              Accéder
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Alertes</h3>
            </div>
            <p className="text-gray-600 mb-4">Gestion des alertes système</p>
            <button className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors text-sm font-medium">
              Accéder
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fonctions de gestion (à implémenter)
  const handleEditUser = (user) => {
    // TODO: Implémenter l'édition d'utilisateur
  }

  const handleDeleteUser = (user) => {
    // TODO: Implémenter la suppression d'utilisateur
  }

  const handleEditShop = (shop) => {
    // TODO: Implémenter l'édition de magasin
  }

  const handleDeleteShop = (shop) => {
    // TODO: Implémenter la suppression de magasin
  }

  const handleEditDepot = (depot) => {
    // TODO: Implémenter l'édition de dépôt
  }

  const handleDeleteDepot = (depot) => {
    // TODO: Implémenter la suppression de dépôt
  }

  // États des modales (à implémenter)
  const [showCreateUserModal, setShowCreateUserModal] = React.useState(false)
  const [showCreateShopModal, setShowCreateShopModal] = React.useState(false)
  const [showCreateDepotModal, setShowCreateDepotModal] = React.useState(false)

  switch (currentPage) {
    case 'users':
      return renderUsersContent()
    case 'shops':
      return renderShopsContent()
    case 'depots':
      return renderDepotsContent()
    case 'tools':
      return renderToolsContent()
    default:
      return (
        <div className="text-center py-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-teal-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Page non trouvée</h3>
            <p className="text-gray-600">La page demandée n'existe pas.</p>
          </div>
        </div>
      )
  }
}
