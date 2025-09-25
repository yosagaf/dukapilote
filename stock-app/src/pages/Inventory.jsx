import React, { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { db } from '../firebase'
import AddItemModal from '../components/AddItemModal'
import EditItemModal from '../components/EditItemModal'
import SearchBar from '../components/SearchBar'
import Sidebar from '../components/Sidebar'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [groupByStatus, setGroupByStatus] = useState(false)
  const { logout, userProfile, isAdmin } = useAuth()
  const { sidebarWidth } = useSidebar()

  useEffect(() => {
    if (!userProfile) return

    let q
    if (isAdmin) {
      q = query(collection(db, 'items'), orderBy('name'))

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setItems(itemsData)
        setLoading(false)
      })

      return unsubscribe
    } else {
      // Pour les utilisateurs shop, charger les articles du magasin ET des dépôts liés
      let unsubscribeItems = null

      const loadShopAndDepotItems = async () => {
        try {
          // Récupérer les informations du magasin pour obtenir les dépôts liés
          const shopDoc = await getDoc(doc(db, 'shops', userProfile.shopId))
          const shopData = shopDoc.exists() ? shopDoc.data() : null

          let shopIds = [userProfile.shopId] // Inclure le magasin de l'utilisateur

          // Ajouter les dépôts liés s'ils existent
          if (shopData?.linkedDepotIds && shopData.linkedDepotIds.length > 0) {
            const linkedDepotIds = shopData.linkedDepotIds
            shopIds = [...shopIds, ...linkedDepotIds]
          }

          // Écouter les changements pour tous les shopIds (magasin + dépôts liés)
          unsubscribeItems = onSnapshot(
            query(collection(db, 'items'), orderBy('name')),
            (snapshot) => {
              const allItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }))

              // Filtrer pour inclure les articles du magasin et des dépôts liés
              const filteredItems = allItems.filter(item =>
                shopIds.includes(item.shopId)
              )

              setItems(filteredItems)
              setLoading(false)
            }
          )
        } catch (error) {
          console.error('Erreur lors du chargement des articles:', error)
          setLoading(false)
        }
      }

      loadShopAndDepotItems()

      return () => {
        if (unsubscribeItems) {
          unsubscribeItems()
        }
      }
    }
  }, [userProfile, isAdmin])

  // Charger les locations (shops et depots)
  useEffect(() => {
    // Charger les shops
    const shopsQuery = query(collection(db, 'shops'), orderBy('name'))
    const unsubscribeShops = onSnapshot(shopsQuery, (snapshot) => {
      const shops = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'shop'
      }))

      // Charger les depots
      const depotsQuery = query(collection(db, 'depots'), orderBy('name'))
      const unsubscribeDepots = onSnapshot(depotsQuery, (snapshot) => {
        const depots = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'depot'
        }))

        setLocations([...shops, ...depots])
      })

      return unsubscribeDepots
    })

    return unsubscribeShops
  }, [])


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

  // Fonction pour obtenir le type et le nom de la localisation d'un article
  const getItemLocationInfo = (item) => {
    const location = locations.find(loc => loc.id === item.shopId)
    if (location) {
      return {
        type: location.type,
        name: location.name,
        isCurrentShop: item.shopId === userProfile?.shopId
      }
    }
    return { type: 'unknown', name: 'Inconnu', isCurrentShop: false }
  }

  const handleSort = (field) => {
    if (field === 'status') {
      setGroupByStatus(!groupByStatus)
      return
    }

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

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingItem(null)
  }

  const handleSearchItemSelect = (item) => {
    // Quand un utilisateur sélectionne un item dans la recherche, on l'édite
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
      // Si groupé par statut, trier d'abord par statut
      if (groupByStatus) {
        const statusA = getStockStatus(a.quantity, a.minThreshold)
        const statusB = getStockStatus(b.quantity, b.minThreshold)

        // Ordre de priorité : out (rupture) > low (faible) > good (bon)
        const statusOrder = { out: 0, low: 1, good: 2 }
        const statusComparison = statusOrder[statusA] - statusOrder[statusB]

        if (statusComparison !== 0) {
          return statusComparison
        }
      }

      // Puis trier par le champ sélectionné
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

  // Grouper par statut pour l'affichage si activé
  const groupedItems = groupByStatus ?
    filteredAndSortedItems.reduce((groups, item) => {
      const status = getStockStatus(item.quantity, item.minThreshold)
      if (!groups[status]) {
        groups[status] = []
      }
      groups[status].push(item)
      return groups
    }, {}) : null

  const SortIcon = ({ field }) => {
    if (field === 'status') {
      return groupByStatus ? (
        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }

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
      <Sidebar currentPage="inventory" onPageChange={() => {}} />

      <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-teal-100">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Inventaire</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gestion complète de votre stock
                </p>
              </div>

              {/* Barre de recherche */}
              <div className="flex-1 max-w-lg mx-6">
                <SearchBar onItemSelect={handleSearchItemSelect} />
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
        <main className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Chargement de l'inventaire...</p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-teal-100">
              {/* Filters and Stats */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Stats */}
                  <div className="flex items-center space-x-6">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{items.length}</span>
                      <span className="text-gray-600 ml-1">articles total</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-red-600">
                        {items.filter(item => item.quantity === 0).length}
                      </span>
                      <span className="text-gray-600 ml-1">en rupture</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-orange-600">
                        {items.filter(item => item.quantity <= item.minThreshold && item.quantity > 0).length}
                      </span>
                      <span className="text-gray-600 ml-1">stock faible</span>
                    </div>
                  </div>

                  {/* Filter */}
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
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Statut</span>
                          <SortIcon field="status" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localisation
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
                                ? 'Commencez par ajouter des articles à votre inventaire.'
                                : 'Aucun article ne correspond aux filtres sélectionnés.'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : groupByStatus ? (
                      // Affichage groupé par statut
                      ['out', 'low', 'good'].map(statusGroup => {
                        const groupItems = groupedItems[statusGroup] || []
                        if (groupItems.length === 0) return null

                        return (
                          <React.Fragment key={statusGroup}>
                            {/* Header de groupe */}
                            <tr className="bg-gray-100">
                              <td colSpan="8" className="px-4 py-2">
                                <div className="flex items-center space-x-3">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(statusGroup)}`}>
                                    {getStockStatusText(statusGroup)}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {groupItems.length} article{groupItems.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {/* Articles du groupe */}
                            {groupItems.map((item) => {
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
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(status)}`}>
                                      {getStockStatusText(status)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {(() => {
                                      const locationInfo = getItemLocationInfo(item)
                                      return (
                                        <div className="flex items-center space-x-2">
                                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                            locationInfo.isCurrentShop
                                              ? 'bg-blue-50 text-blue-700'
                                              : 'bg-purple-50 text-purple-700'
                                          }`}>
                                            {locationInfo.name}
                                          </span>
                                        </div>
                                      )
                                    })()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                            })}
                          </React.Fragment>
                        )
                      })
                    ) : (
                      // Affichage normal (liste)
                      filteredAndSortedItems.map((item) => {
                        const status = getStockStatus(item.quantity, item.minThreshold)
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-500">{item.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.category || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.quantity}</div>
                              <div className="text-xs text-gray-500">{item.unit || 'unité(s)'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.minThreshold || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(status)}`}>
                                {getStockStatusText(status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const locationInfo = getItemLocationInfo(item)
                                return (
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      locationInfo.isCurrentShop
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-purple-50 text-purple-700'
                                    }`}>
                                      {locationInfo.name}
                                    </span>
                                  </div>
                                )
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
        </main>
      </div>

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          shopId={userProfile?.shopId}
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