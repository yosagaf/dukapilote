import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { db } from '../firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { SalesStorage } from '../utils/salesStorage'
import { ReportGenerator } from '../utils/reportGenerator'
import SalesModal from '../components/SalesModal'
import QuickSaleButton from '../components/QuickSaleButton'
import Sidebar from '../components/Sidebar'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import StatCard from '../components/common/StatCard'

export default function Sales() {
  const { userProfile, isAdmin, logout } = useAuth()
  const { sidebarWidth } = useSidebar()
  const [items, setItems] = useState([])
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState('sales')

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile?.shopId) return

    setIsLoading(true)
    setError('')

    try {
      // Charger les articles du magasin
      const itemsQuery = query(
        collection(db, 'items'),
        where('shopId', '==', userProfile.shopId)
      )
      const itemsSnapshot = await getDocs(itemsQuery)
      const itemsData = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Filtrer les articles avec quantité > 0 et trier par quantité décroissante côté client
      const filteredItems = itemsData
        .filter(item => item.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
      setItems(filteredItems)

      // Charger les ventes récentes
      const salesData = await SalesStorage.getSales(userProfile.uid, false, 20)
      setSales(salesData)

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaleItem = (item) => {
    setSelectedItem(item)
    setShowSalesModal(true)
  }

  const handleSaleComplete = (updatedItem) => {
    // Mettre à jour la liste des articles
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
    
    // Recharger les ventes
    loadSales()
  }

  const handleExportExcel = () => {
    try {
      ReportGenerator.generateExcelReport(sales, 'all')
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
      alert('Erreur lors de l\'export Excel')
    }
  }

  const handleExportPDF = () => {
    try {
      ReportGenerator.generatePDFReport(sales, 'all', userProfile?.shopName || '')
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      alert('Erreur lors de l\'export PDF')
    }
  }

  const loadSales = async () => {
    try {
      const salesData = await SalesStorage.getSales(userProfile.uid, false, 20)
      setSales(salesData)
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(items.map(item => item.category))]

  const todaySales = sales.filter(sale => {
    const saleDate = sale.saleDate.toDate ? sale.saleDate.toDate() : new Date(sale.saleDate)
    const today = new Date()
    return saleDate.toDateString() === today.toDateString()
  })

  const todayTotal = todaySales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
                <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Enregistrez vos ventes quotidiennes et suivez vos performances
                </p>
              </div>
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

        <div className="px-6 py-6 space-y-6">
          {/* Statistiques du jour */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Ventes d'aujourd'hui"
              value={todaySales.length}
              subtitle="Nombre de ventes"
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
            />
            <StatCard
              title="Chiffre d'affaires"
              value={`${todayTotal.toLocaleString('fr-FR')} KMF`}
              subtitle="Total des ventes"
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
            <StatCard
              title="Articles en stock"
              value={items.length}
              subtitle="Articles disponibles"
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
          </div>

          {/* Filtres */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher un article
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom de l'article..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Liste des articles */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Articles disponibles pour la vente</h2>
            </div>
            
            {error && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article trouvé</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory 
                    ? 'Aucun article ne correspond à vos critères de recherche.'
                    : 'Aucun article en stock disponible pour la vente.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <div key={item.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-gray-900 truncate">{item.name}</h3>
                            <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
                              <span className="truncate">Catégorie: {item.category}</span>
                              <span>Stock: {item.quantity}</span>
                              {item.price && <span>Prix: {item.price} KMF</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Stock</div>
                          <div className="text-base font-semibold text-blue-600">{item.quantity}</div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleSaleItem(item)}
                            disabled={item.quantity <= 0}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                          >
                            Vendre
                          </button>
                          <QuickSaleButton
                            key={`quick-sale-${item.id}`}
                            item={item}
                            onSaleComplete={handleSaleComplete}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de vente */}
        <SalesModal
          isOpen={showSalesModal}
          onClose={() => setShowSalesModal(false)}
          selectedItem={selectedItem}
          onSaleComplete={handleSaleComplete}
        />
      </div>
    </div>
  )
}
