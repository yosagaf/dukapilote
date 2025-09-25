import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { addDefaultPasswordToExistingUsers, createMissingFirebaseAuthAccounts } from '../utils/fixExistingUsers'
import CreateShopModal from '../components/CreateShopModal'
import CreateUserModal from '../components/CreateUserModal'
import EditShopModal from '../components/EditShopModal'
import Button from '../components/common/Button'
import EditUserModal from '../components/EditUserModal'
import CreateDepotModal from '../components/CreateDepotModal'
import EditDepotModal from '../components/EditDepotModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import Sidebar from '../components/Sidebar'
import { StatCard } from '../components/common'

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [shops, setShops] = useState([])
  const [users, setUsers] = useState([])
  const [depots, setDepots] = useState([])
  const [showCreateShop, setShowCreateShop] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateDepot, setShowCreateDepot] = useState(false)
  const [showEditShop, setShowEditShop] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [showEditDepot, setShowEditDepot] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingShop, setEditingShop] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editingDepot, setEditingDepot] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [currentPage, setCurrentPage] = useState(searchParams.get('page') || 'dashboard')
  const [toolsLoading, setToolsLoading] = useState(false)
  const { logout } = useAuth()
  const { sidebarWidth } = useSidebar()

  useEffect(() => {
    const unsubscribeShops = onSnapshot(
      query(collection(db, 'shops'), orderBy('name')),
      (snapshot) => {
        setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }
    )

    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('email')),
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }
    )


    const unsubscribeDepots = onSnapshot(
      query(collection(db, 'depots'), orderBy('name')),
      (snapshot) => {
        setDepots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }
    )


    return () => {
      unsubscribeShops()
      unsubscribeUsers()
      unsubscribeDepots()
    }
  }, [])

  // Écouter les changements de paramètres URL
  useEffect(() => {
    const page = searchParams.get('page') || 'dashboard'
    setCurrentPage(page)
  }, [searchParams])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Mettre à jour l'URL avec le nouveau paramètre de page
    setSearchParams(page === 'dashboard' ? {} : { page })
  }

  // Shop CRUD operations
  const handleEditShop = (shop) => {
    setEditingShop(shop)
    setShowEditShop(true)
  }

  const handleDeleteShop = (shop) => {
    setDeletingItem({ type: 'shop', item: shop })
    setShowDeleteModal(true)
  }

  // User CRUD operations
  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowEditUser(true)
  }

  const handleDeleteUser = (user) => {
    setDeletingItem({ type: 'user', item: user })
    setShowDeleteModal(true)
  }


  // Depot CRUD operations
  const handleEditDepot = (depot) => {
    setEditingDepot(depot)
    setShowEditDepot(true)
  }

  const handleDeleteDepot = (depot) => {
    setDeletingItem({ type: 'depot', item: depot })
    setShowDeleteModal(true)
  }

  // Tools functions
  const handleFixExistingUsers = async () => {
    setToolsLoading(true)
    try {
      const result = await addDefaultPasswordToExistingUsers()
      if (result.success) {
        alert(`${result.updated} utilisateurs mis à jour avec succès`)
      } else {
        alert(`Erreur: ${result.error?.message || 'Erreur inconnue'}`)
      }
    } catch (error) {
      alert(`Erreur: ${error.message}`)
    }
    setToolsLoading(false)
  }

  const handleCheckMissingAuth = async () => {
    setToolsLoading(true)
    try {
      const result = await createMissingFirebaseAuthAccounts()
      if (result.success) {
        const missing = result.results.filter(r => r.status === 'auth_missing')
        const ok = result.results.filter(r => r.status === 'ok')

        let message = `Vérification terminée:\n`
        message += `- ${ok.length} comptes OK\n`
        message += `- ${missing.length} comptes Firebase Auth manquants\n\n`

        if (missing.length > 0) {
          message += `Comptes manquants (se connecteront automatiquement):\n`
          missing.forEach(user => {
            message += `- ${user.email} (mot de passe: ${user.password})\n`
          })
        }

        alert(message)
      } else {
        alert(`Erreur: ${result.error?.message || 'Erreur inconnue'}`)
      }
    } catch (error) {
      alert(`Erreur: ${error.message}`)
    }
    setToolsLoading(false)
  }

  // Generic delete handler
  const confirmDelete = async () => {
    if (!deletingItem) return

    setDeleteLoading(true)
    setDeleteError('')
    try {
      const { deleteDoc, doc, updateDoc, arrayRemove } = await import('firebase/firestore')
      const collectionName = deletingItem.type === 'shop' ? 'shops' : deletingItem.type === 'user' ? 'users' : 'depots'
      
      // Si c'est un dépôt, nettoyer les références dans les magasins liés
      if (deletingItem.type === 'depot' && deletingItem.item.linkedShopIds) {
        for (const shopId of deletingItem.item.linkedShopIds) {
          try {
            const shopRef = doc(db, 'shops', shopId)
            await updateDoc(shopRef, {
              linkedDepotIds: arrayRemove(deletingItem.item.id),
              updated_at: new Date()
            })
          } catch (error) {
            console.error('Erreur lors du nettoyage des références dans le magasin:', shopId, error)
          }
        }
      }
      
      // Si c'est un magasin, nettoyer les références dans les dépôts liés
      if (deletingItem.type === 'shop' && deletingItem.item.linkedDepotIds) {
        for (const depotId of deletingItem.item.linkedDepotIds) {
          try {
            const depotRef = doc(db, 'depots', depotId)
            await updateDoc(depotRef, {
              linkedShopIds: arrayRemove(deletingItem.item.id),
              updated_at: new Date()
            })
          } catch (error) {
            console.error('Erreur lors du nettoyage des références dans le dépôt:', depotId, error)
          }
        }
      }
      
      // Supprimer l'élément principal
      await deleteDoc(doc(db, collectionName, deletingItem.item.id))
      setShowDeleteModal(false)
      setDeletingItem(null)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setDeleteError(`Erreur lors de la suppression: ${error.message}`)
    }
    setDeleteLoading(false)
  }

  const closeModals = () => {
    setShowEditShop(false)
    setShowEditUser(false)
    setShowEditDepot(false)
    setShowDeleteModal(false)
    setEditingShop(null)
    setEditingUser(null)
    setEditingDepot(null)
    setDeletingItem(null)
    setDeleteError('')
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboardContent()
      case 'users':
        return renderUsersContent()
      case 'shops':
        return renderShopsContent()
      case 'depots':
        return renderDepotsContent()
      case 'tools':
        return renderToolsContent()
      default:
        return renderDashboardContent()
    }
  }

  const renderDashboardContent = () => {
    const totalDepots = depots.length
    const totalUsers = users.length

    // Calculer les dukanis et dépôts
    const dukanis = shops.filter(shop => shop.type !== 'depot')
    const totalMagasins = dukanis.length

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tableau de Bord - Statistiques du Système</h2>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <StatCard
            gradient="blue"
            title="Dépôts"
            value={totalDepots}
            icon={
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            }
          />

          <StatCard
            gradient="green"
            title="Magasins"
            value={totalMagasins}
            icon={
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <StatCard
            gradient="purple"
            title="Utilisateurs"
            value={totalUsers}
            icon={
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
          />

        </div>

      </div>
    )
  }

  const renderUsersContent = () => (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
        <button
          onClick={() => setShowCreateUser(true)}
          className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Créer Utilisateur
        </button>
      </div>
      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Aucun utilisateur créé</p>
          </div>
        ) : (
          users.map(user => {
            const userShop = shops.find(shop => shop.id === user.shopId)
            return (
              <div key={user.id} className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 p-4 rounded-xl hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className={`w-3 h-3 rounded-full mr-3 ${user.role === 'admin' ? 'bg-purple-500' : 'bg-teal-500'}`}></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {user.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : user.email}
                      </h4>
                      {user.prenom && (
                        <p className="text-xs text-gray-500">{user.email}</p>
                      )}
                      <p className="text-sm text-teal-700">
                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur Magasin'}
                        {userShop && ` • ${userShop.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  const renderShopsContent = () => (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Magasins</h2>
        <button
          onClick={() => setShowCreateShop(true)}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer Magasin
        </button>
      </div>
      <div className="space-y-4">
        {shops.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Aucun magasin créé</p>
          </div>
        ) : (
          shops.map(shop => (
            <div key={shop.id} className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 p-4 rounded-xl hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {shop.name}
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    {shop.location}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Créé le: {shop.created_at?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEditShop(shop)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                    title="Modifier"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteShop(shop)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )


  const renderDepotsContent = () => (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Dépôts</h2>
        <button
          onClick={() => setShowCreateDepot(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
          Créer Dépôt
        </button>
      </div>
      <div className="space-y-4">
        {depots.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Aucun dépôt créé</p>
          </div>
        ) : (
          depots.map(depot => (
            <div key={depot.id} className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-xl hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    {depot.name}
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    📍 {depot.location}
                  </p>
                  {depot.description && (
                    <p className="text-sm text-blue-600 mt-1">
                      {depot.description}
                    </p>
                  )}
                  <div className="flex items-center mt-2 space-x-4">
                    {depot.manager && (
                      <p className="text-xs text-blue-600">
                        Responsable: {depot.manager}
                      </p>
                    )}
                    <p className="text-xs text-blue-600">
                      Créé le: {depot.created_at?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                    title="Voir inventaire"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEditDepot(depot)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                    title="Éditer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setDeletingItem({ type: 'depot', item: depot })
                      setShowDeleteModal(true)
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )



  const renderReportsContent = () => (
    <div className="max-w-4xl mx-auto">
      {/* Under Construction Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-teal-100 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-8 text-white">
          <div className="flex items-center justify-center space-x-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold">Module Rapports</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center">
            {/* Construction Icon */}
            <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>

            {/* Main Message */}
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Page en Construction
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Nous travaillons actuellement sur le module de rapports qui vous permettra de générer des analyses détaillées de votre activité commerciale.
            </p>

            {/* Upcoming Features */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-lg p-6 border border-teal-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">Rapports de Vente</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Analyses des ventes par période, produit et catégorie avec graphiques interactifs.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">Gestion des Stocks</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Suivi des mouvements de stock, alertes de rupture et prévisions de réapprovisionnement.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">Analyses Financières</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Tableau de bord financier avec revenus, marges bénéficiaires et tendances.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">Rapports Personnalisés</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Création de rapports sur mesure selon vos besoins spécifiques d'analyse.
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-semibold text-gray-900">Calendrier de Développement</h4>
              </div>
              <p className="text-gray-600">
                <strong>Lancement prévu :</strong> Ce module sera disponible dans une prochaine mise à jour.
                Restez connecté pour être informé de sa disponibilité !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )



  const renderToolsContent = () => (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Outils d'Administration</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestion des Utilisateurs */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Gestion des Comptes</h3>
          </div>

          <p className="text-sm text-blue-700 mb-4">
            Outils pour synchroniser les comptes utilisateurs entre Firestore et Firebase Auth.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleFixExistingUsers}
              disabled={toolsLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
            >
              {toolsLoading ? 'Traitement...' : 'Ajouter mots de passe par défaut'}
            </button>

            <button
              onClick={handleCheckMissingAuth}
              disabled={toolsLoading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
            >
              {toolsLoading ? 'Vérification...' : 'Vérifier comptes Firebase Auth'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">
              <strong>Auto-connexion:</strong> Les utilisateurs manquant un compte Firebase Auth seront automatiquement créés lors de leur première connexion avec leur mot de passe par défaut.
            </p>
          </div>
        </div>

        {/* Informations */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 p-6 rounded-xl">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Comment ça marche</h3>
          </div>

          <div className="text-sm text-green-700 space-y-2">
            <p><strong>1. Création d'utilisateur:</strong></p>
            <p className="ml-4">• Le mot de passe est stocké comme defaultPassword dans Firestore</p>
            <p className="ml-4">• Le compte Firebase Auth est créé immédiatement</p>

            <p className="pt-2"><strong>2. Connexion automatique:</strong></p>
            <p className="ml-4">• Si le compte Firebase Auth manque, il est créé automatiquement</p>
            <p className="ml-4">• Utilise le defaultPassword stocké dans Firestore</p>

            <p className="pt-2"><strong>3. Mots de passe par défaut:</strong></p>
            <p className="ml-4">• Nouveaux utilisateurs: mot de passe choisi à la création</p>
            <p className="ml-4">• Utilisateurs existants: "123456" par défaut</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      {/* Main Content Area */}
      <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-teal-100">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentPage === 'dashboard' && 'Tableau de Bord Admin'}
                  {currentPage === 'users' && 'Gestion Utilisateurs'}
                  {currentPage === 'shops' && 'Gestion Magasins'}
                  {currentPage === 'depots' && 'Gestion Dépôts'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Administration DukaPilote
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {(currentPage === 'dashboard' || currentPage === 'shops') && (
                  <Button
                    onClick={() => setShowCreateShop(true)}
                    variant="success"
                    size="md"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    }
                  >
                    Créer Magasin
                  </Button>
                )}
                {(currentPage === 'dashboard' || currentPage === 'users') && (
                  <Button
                    onClick={() => setShowCreateUser(true)}
                    variant="purple"
                    size="md"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  >
                    Créer Utilisateur
                  </Button>
                )}
                {(currentPage === 'dashboard' || currentPage === 'depots') && (
                  <Button
                    onClick={() => setShowCreateDepot(true)}
                    variant="info"
                    size="md"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    }
                  >
                    Créer Dépôt
                  </Button>
                )}
                <Button
                  onClick={logout}
                  variant="outline"
                  size="md"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  }
                >
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>

      {showCreateShop && (
        <CreateShopModal onClose={() => setShowCreateShop(false)} />
      )}

      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          shops={shops}
        />
      )}

      {showEditShop && (
        <EditShopModal
          onClose={closeModals}
          shop={editingShop}
        />
      )}

      {showEditUser && (
        <EditUserModal
          onClose={closeModals}
          user={editingUser}
          shops={shops}
        />
      )}


      {showCreateDepot && (
        <CreateDepotModal onClose={() => setShowCreateDepot(false)} />
      )}


      {showEditDepot && editingDepot && (
        <EditDepotModal
          depot={editingDepot}
          onClose={() => {
            setShowEditDepot(false)
            setEditingDepot(null)
          }}
        />
      )}

      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-100">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {deletingItem.type === 'shop' ? 'Supprimer le Magasin' : deletingItem.type === 'user' ? 'Supprimer l\'Utilisateur' : 'Supprimer le Dépôt'}
                  </h3>
                  <p className="text-sm text-gray-600">DukaPilote - Confirmation</p>
                </div>
              </div>

              {/* Error Message */}
              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {deleteError}
                </div>
              )}

              {/* Content */}
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-800 font-medium">Action irréversible</p>
                  </div>
                </div>
                <p className="text-gray-700 text-center">
                  {deletingItem.type === 'shop'
                    ? 'Êtes-vous sûr de vouloir supprimer définitivement le magasin'
                    : deletingItem.type === 'user'
                    ? 'Êtes-vous sûr de vouloir supprimer définitivement l\'utilisateur'
                    : 'Êtes-vous sûr de vouloir supprimer définitivement le dépôt'
                  }
                  <br />
                  <span className="font-bold text-gray-900">"{deletingItem.type === 'shop'
                    ? deletingItem.item.name
                    : deletingItem.type === 'user'
                    ? (deletingItem.item.prenom ? `${deletingItem.item.prenom} ${deletingItem.item.nom || ''}`.trim() : deletingItem.item.email)
                    : deletingItem.item.name
                  }"</span> ?
                </p>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Cette action ne peut pas être annulée.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={closeModals}
                  disabled={deleteLoading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {deleteLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression...
                    </div>
                  ) : (
                    'Supprimer Définitivement'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
