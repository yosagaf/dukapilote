import React, { useState, useEffect } from 'react'
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { db } from '../firebase'
import Sidebar from '../components/Sidebar'
import EditItemModal from '../components/EditItemModal'
import AddItemModal from '../components/AddItemModal'
import CategoryManager from '../components/CategoryManager'

export default function MyShop() {
  const [shopInfo, setShopInfo] = useState(null)
  const [linkedDepots, setLinkedDepots] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterStatus, setFilterStatus] = useState('all')
  const { userProfile, logout } = useAuth()
  const { sidebarWidth } = useSidebar()

  useEffect(() => {
    if (!userProfile?.shopId) return

    const loadShopInfo = async () => {
      try {
        const shopDoc = await getDoc(doc(db, 'shops', userProfile.shopId))
        if (shopDoc.exists()) {
          const shopData = shopDoc.data()
          setShopInfo({
            id: shopDoc.id,
            ...shopData
          })

          // Charger les dépôts liés
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
        console.error('Erreur lors du chargement des informations du magasin:', error)
      }
    }

    loadShopInfo()
  }, [userProfile])

  useEffect(() => {
    if (!userProfile?.shopId) return

    const q = query(
      collection(db, 'items'),
      where('shopId', '==', userProfile.shopId),
      orderBy('name')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setItems(itemsData)
      setLoading(false)
    })

    return unsubscribe
  }, [userProfile])

  const getStockStatus = (quantity, minThreshold) => {
    if (quantity === 0) return 'out'
    if (quantity <= minThreshold) return 'low'
    return 'good'
  }

  const getStockStatusText = (status) => {
    switch (status) {
      case 'out': return 'Rupture'
      case 'low': return 'Stock faible'
      case 'good': return 'En stock'
      default: return 'N/A'
    }
  }

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out': return 'text-red-600 bg-red-50'
      case 'low': return 'text-orange-600 bg-orange-50'
      case 'good': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setShowEditModal(true)
  }


  const filteredAndSortedItems = items
    .filter(item => {
      if (filterStatus === 'all') return true
      const status = getStockStatus(item.quantity, item.minThreshold)
      return status === filterStatus
    })
    .sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
      <Sidebar currentPage="shops" />

      <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-teal-100">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Mon Magasin</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Informations et inventaire de votre magasin
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter Article au Magasin
                </button>
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Gérer Catégories
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

        <div className="px-6 py-6 space-y-6">
          {/* Shop Information Card */}
          {shopInfo && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Informations du Magasin
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-1">Nom</h3>
                  <p className="text-lg text-gray-900">{shopInfo.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-1">Adresse</h3>
                  <p className="text-lg text-gray-900">{shopInfo.location || 'Non renseignée'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-1">Articles</h3>
                  <p className="text-lg text-gray-900">{items.length} articles</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-1">En rupture</h3>
                  <p className="text-lg text-red-600 font-semibold">{items.filter(item => item.quantity === 0).length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-1">Stock faible</h3>
                  <p className="text-lg text-orange-600 font-semibold">{items.filter(item => item.quantity <= item.minThreshold && item.quantity > 0).length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-1">Dépôts liés</h3>
                  <p className="text-lg text-purple-600 font-semibold">{linkedDepots.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linked Depots Information */}
          {linkedDepots.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                Dépôts Liés à Votre Magasin
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedDepots.map((depot) => (
                  <div
                    key={depot.id}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{depot.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{depot.location || 'Adresse non renseignée'}</p>
                        {depot.description && (
                          <p className="text-xs text-gray-500 mb-2">{depot.description}</p>
                        )}
                        {depot.manager && (
                          <p className="text-xs text-gray-500">Responsable: {depot.manager}</p>
                        )}
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-200 text-purple-800">
                        Dépôt
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Linked Depots Message */}
          {linkedDepots.length === 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun dépôt lié</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Votre magasin n'a pas de dépôts liés. Contactez votre administrateur pour lier des dépôts à votre magasin.
                </p>
              </div>
            </div>
          )}

          {/* Items Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Chargement des articles...</p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-teal-100">
              {/* Filters and Stats */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Articles du Magasin</h2>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Filtrer:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="all">Tous</option>
                      <option value="good">En stock</option>
                      <option value="low">Stock faible</option>
                      <option value="out">Rupture</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Article</span>
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Catégorie</span>
                          <SortIcon field="category" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('quantity')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Quantité</span>
                          <SortIcon field="quantity" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('minThreshold')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Seuil min.</span>
                          <SortIcon field="minThreshold" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Prix de Référence</span>
                          <SortIcon field="price" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedItems.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun article trouvé</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {filterStatus === 'all'
                                ? 'Commencez par ajouter des articles à votre magasin.'
                                : 'Aucun article ne correspond aux filtres sélectionnés.'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedItems.map((item) => {
                        const status = getStockStatus(item.quantity, item.minThreshold)
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500">{item.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.category || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.quantity}</div>
                              <div className="text-xs text-gray-500">{item.unit || 'unité(s)'}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.minThreshold || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.price ? `${Number(item.price).toLocaleString()} KMF` : 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(status)}`}>
                                {getStockStatusText(status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="text-teal-600 hover:text-teal-900 transition-colors"
                                >
                                  Modifier
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Gestion des Catégories</h2>
                <button
                  onClick={() => setShowCategoryManager(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CategoryManager />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          shopId={userProfile?.shopId}
          contextInfo={{
            type: 'shop',
            name: shopInfo?.name || 'votre magasin',
            location: shopInfo?.location
          }}
        />
      )}

      {showEditModal && (
        <EditItemModal
          onClose={() => {
            setShowEditModal(false)
            setEditingItem(null)
          }}
          item={editingItem}
        />
      )}

    </div>
  )
}