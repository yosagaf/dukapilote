import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy, getDoc, doc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { db } from '../firebase'
import ItemCard from '../components/ItemCard'
import AddItemModal from '../components/AddItemModal'
import EditItemModal from '../components/EditItemModal'
import Sidebar from '../components/Sidebar'
import TransferHistory from '../components/TransferHistory'
import SalesDashboard from '../components/SalesDashboard'
import { StatCard } from '../components/common'
import { SalesStorage } from '../utils/salesStorage'

export default function Dashboard() {
  const [items, setItems] = useState([])
  const [shops, setShops] = useState([])
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [depots, setDepots] = useState([])
  const [linkedDepots, setLinkedDepots] = useState([])
  const [userShop, setUserShop] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [salesData, setSalesData] = useState([])
  const [salesStats, setSalesStats] = useState(null)
  const { logout, userProfile, isAdmin } = useAuth()
  const { sidebarWidth } = useSidebar()

  useEffect(() => {
    if (!userProfile) return

    let q
    if (isAdmin) {
      q = query(collection(db, 'items'), orderBy('name'))
    } else {
      q = query(
        collection(db, 'items'),
        where('shopId', '==', userProfile.shopId),
        orderBy('name')
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setItems(itemsData)
      setLoading(false)
    })

    return unsubscribe
  }, [userProfile, isAdmin])

  // Récupérer les informations du magasin de l'utilisateur
  useEffect(() => {
    if (!userProfile || !userProfile.shopId || isAdmin) return

    const fetchUserShop = async () => {
      try {
        const shopDoc = await getDoc(doc(db, 'shops', userProfile.shopId))
        if (shopDoc.exists()) {
          setUserShop({
            id: shopDoc.id,
            ...shopDoc.data()
          })
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du magasin:', error)
      }
    }

    fetchUserShop()
  }, [userProfile, isAdmin])

  // Load admin data for administrators
  useEffect(() => {
    if (!isAdmin) return

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

    const unsubscribeCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        cats.sort((a, b) => (a.order || 0) - (b.order || 0))
        setCategories(cats)
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
      unsubscribeCategories()
      unsubscribeDepots()
    }
  }, [isAdmin])

  // Load linked depots for shop users
  useEffect(() => {
    if (isAdmin || !userProfile?.shopId) return

    const loadLinkedDepots = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const shopDoc = await getDoc(doc(db, 'shops', userProfile.shopId))
        if (shopDoc.exists()) {
          const shopData = shopDoc.data()
          if (shopData.linkedDepotIds && shopData.linkedDepotIds.length > 0) {
            const depots = []
            for (const depotId of shopData.linkedDepotIds) {
              try {
                const depotDoc = await getDoc(doc(db, 'depots', depotId))
                if (depotDoc.exists()) {
                  depots.push({
                    id: depotDoc.id,
                    ...depotDoc.data()
                  })
                }
              } catch (error) {
                console.error('Erreur lors du chargement du dépôt:', depotId, error)
              }
            }
            setLinkedDepots(depots)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des dépôts liés:', error)
      }
    }

    loadLinkedDepots()
  }, [userProfile, isAdmin])

  // Load sales data for shop users
  useEffect(() => {
    if (isAdmin || !userProfile?.uid) return

    const loadSalesData = async () => {
      try {
        const sales = await SalesStorage.getSales(userProfile.uid, false, 50)
        setSalesData(sales)
        
        const stats = SalesStorage.getSalesStats(userProfile.uid, sales)
        setSalesStats(stats)
      } catch (error) {
        console.error('Erreur lors du chargement des données de vente:', error)
      }
    }

    loadSalesData()
  }, [userProfile?.uid, isAdmin])

  const getStockStatus = (quantity, minThreshold) => {
    if (quantity === 0) return 'red'
    if (quantity <= minThreshold) return 'orange'
    return 'green'
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleDeleteItem = (itemId) => {
    // Item will be automatically removed from the list via the onSnapshot listener
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingItem(null)
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboardContent()
      case 'inventory':
        return renderInventoryContent()
      case 'reports':
        return renderReportsContent()
      case 'users':
        return isAdmin ? renderUsersContent() : renderDashboardContent()
      case 'shops':
        return isAdmin ? renderShopsContent() : renderDashboardContent()
      default:
        return renderDashboardContent()
    }
  }

  const renderDashboardContent = () => {
    // For administrators, show admin statistics
    if (isAdmin) {
      const totalDepots = depots.length
      const totalUsers = users.length
      const totalCategories = categories.length
      const dukanis = shops.filter(shop => shop.type !== 'depot')
      const totalMagasins = dukanis.length

      return (
        <div className="space-y-8">
          {/* Actions Rapides Admin */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Actions Rapides - Administration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => window.location.href = '/admin'}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Panel Admin</h3>
                    <p className="text-blue-100 text-sm">Gestion complète</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => window.location.href = '/inventaire'}
                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Inventaire</h3>
                    <p className="text-teal-100 text-sm">Gérer les stocks</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => window.location.href = '/devis-factures'}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Documents</h3>
                    <p className="text-green-100 text-sm">Devis & Factures</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => window.location.href = '/rapports'}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Rapports</h3>
                    <p className="text-purple-100 text-sm">Analyses & Stats</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Statistiques du Système</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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

            <StatCard
              gradient="orange"
              title="Catégories"
              value={totalCategories}
              icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
            </div>
          </div>
        </div>
      )
    }

    // For regular users, show enhanced item statistics
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Chargement des articles...</p>
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-teal-100">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun article en stock</h3>
            <p className="text-gray-600">Commencez par ajouter votre premier article au stock.</p>
          </div>
        </div>
      )
    }

    // Calculate enhanced statistics
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentItems = items.filter(item => {
      const createdAt = item.created_at?.toDate?.() || new Date(item.created_at)
      return createdAt >= sevenDaysAgo
    })

    const recentlyUpdatedItems = items.filter(item => {
      const updatedAt = item.updated_at?.toDate?.() || new Date(item.updated_at)
      return updatedAt >= sevenDaysAgo
    })

    const itemsWithoutThreshold = items.filter(item => !item.minThreshold || item.minThreshold === 0).length
    const stockOut = items.filter(item => item.quantity === 0).length
    const stockLow = items.filter(item => item.quantity <= item.minThreshold && item.quantity > 0).length
    const stockNormal = items.filter(item => item.quantity > item.minThreshold).length

    const totalQuantity = items.reduce((total, item) => total + (item.quantity || 0), 0)
    const totalValue = items.reduce((total, item) => total + ((item.quantity || 0) * (item.price || 0)), 0)

    // Category distribution
    const categoryStats = items.reduce((acc, item) => {
      const category = item.category || 'Non catégorisé'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    // Top categories
    const topCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))

    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-teal-400 to-green-400 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Bienvenue dans {userShop ? userShop.name : 'votre magasin'} !
              </h1>
              <p className="text-teal-50 text-lg">
                Gérez votre stock en toute simplicité
              </p>
            </div>
            <div className="hidden md:block">
              <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Ajouter Article</h3>
                  <p className="text-teal-100 text-sm">Nouvel article au stock</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/devis-factures'}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Nouveau Devis</h3>
                  <p className="text-blue-100 text-sm">Créer un devis</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/devis-factures'}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Nouvelle Facture</h3>
                  <p className="text-green-100 text-sm">Émettre une facture</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/inventaire'}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Gérer Stock</h3>
                  <p className="text-purple-100 text-sm">Voir l'inventaire</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Statistics */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Statistiques - {userShop ? userShop.name : 'Mon Magasin'}
              </h2>
              {userShop && (
                <p className="text-sm text-gray-600 mt-1">
                  {userShop.location && `📍 ${userShop.location}`}
                  {userShop.description && ` • ${userShop.description}`}
                </p>
              )}
            </div>
            {userShop && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>En ligne</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              gradient="teal"
              title="Total Articles"
              value={items.length}
              icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              }
            />

            <StatCard
              gradient="orange"
              title="Stock Faible"
              value={stockLow}
              icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              }
            />

            <StatCard
              gradient="blue"
              title="Quantité Totale"
              value={totalQuantity}
              icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              }
            />

            <StatCard
              gradient="purple"
              title="Nouveaux (7j)"
              value={recentItems.length}
              icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Alertes et Notifications */}
        {!isAdmin && (stockLow > 0 || stockOut > 0) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Alertes Stock</h2>
            <div className="space-y-4">
              {stockOut > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">Rupture de stock</h3>
                    <p className="text-red-600 text-sm">{stockOut} article{stockOut > 1 ? 's' : ''} en rupture de stock</p>
                  </div>
                </div>
              )}
              
              {stockLow > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Stock faible</h3>
                    <p className="text-yellow-600 text-sm">{stockLow} article{stockLow > 1 ? 's' : ''} avec stock faible</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sales Dashboard Section */}
        {!isAdmin && salesStats && (
          <div className="space-y-6">
            <SalesDashboard />
          </div>
        )}

        {/* Transfer History Section */}
        <div className="space-y-6">
          <TransferHistory />
        </div>

      </div>
    )
  }

  const renderInventoryContent = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-teal-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion de l'Inventaire</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            stockStatus={getStockStatus(item.quantity, item.minThreshold)}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    </div>
  )

  const renderReportsContent = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-teal-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Rapports & Analyses</h2>
      <div className="text-center py-12">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapports bientôt disponibles</h3>
        <p className="text-gray-600">Cette fonctionnalité sera ajoutée prochainement.</p>
      </div>
    </div>
  )


  const renderUsersContent = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-teal-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion des Utilisateurs</h2>
      <div className="text-center py-12">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion des utilisateurs</h3>
        <p className="text-gray-600">Utilisez le tableau de bord admin pour gérer les utilisateurs.</p>
      </div>
    </div>
  )

  const renderShopsContent = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-teal-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion des Magasins</h2>
      <div className="text-center py-12">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion des magasins</h3>
        <p className="text-gray-600">Utilisez le tableau de bord admin pour gérer les magasins.</p>
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
                  {currentPage === 'dashboard' && 'Tableau de Bord'}
                  {currentPage === 'inventory' && 'Inventaire'}
                  {currentPage === 'reports' && 'Rapports'}
                  {currentPage === 'documents' && 'Documents'}
                  {currentPage === 'users' && 'Utilisateurs'}
                  {currentPage === 'shops' && 'Magasins'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isAdmin ? 'Administration DukaPilote' : 'Gestion de stock'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
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

        {/* Main Content */}
        <div className="px-6 py-6">
          {renderContent()}
        </div>
      </div>

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          shopId={userProfile?.shopId}
          contextInfo={{
            type: 'shop',
            name: 'votre magasin',
            location: 'Votre emplacement'
          }}
        />
      )}

      {showEditModal && (
        <EditItemModal
          onClose={closeEditModal}
          item={editingItem}
        />
      )}
    </div>
  )
}