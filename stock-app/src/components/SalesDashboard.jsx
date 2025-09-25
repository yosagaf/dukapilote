import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { SalesStorage } from '../utils/salesStorage'
import StatCard from './common/StatCard'
import LoadingSpinner from './common/LoadingSpinner'
import Button from './common/Button'

export default function SalesDashboard() {
  const { userProfile } = useAuth()
  const [salesData, setSalesData] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  useEffect(() => {
    if (userProfile?.uid) {
      loadSalesData()
    }
  }, [userProfile])

  const loadSalesData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const sales = await SalesStorage.getSales(userProfile.uid, false, 1000)
      setSalesData(sales)
      
      const salesStats = SalesStorage.getSalesStats(userProfile.uid, sales)
      setStats(salesStats)
    } catch (error) {
      console.error('Erreur lors du chargement des données de vente:', error)
      setError('Erreur lors du chargement des données de vente')
    } finally {
      setIsLoading(false)
    }
  }

  const getPeriodData = (period) => {
    if (!stats) return { count: 0, total: 0 }

    switch (period) {
      case 'today':
        return stats.today
      case 'yesterday':
        return stats.yesterday
      case 'week':
        return stats.thisWeek
      case 'month':
        return stats.thisMonth
      case 'year':
        return stats.thisYear
      case 'quarter':
        return stats.lastThreeMonths
      default:
        return stats.allTime
    }
  }

  const getPeriodLabel = (period) => {
    const labels = {
      today: "Aujourd'hui",
      yesterday: "Hier",
      week: "Cette semaine",
      month: "Ce mois",
      year: "Cette année",
      quarter: "3 derniers mois",
      all: "Tout le temps"
    }
    return labels[period] || period
  }

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString('fr-FR')} KMF`
  }

  const getTopSellingItems = () => {
    const itemSales = {}
    
    salesData.forEach(sale => {
      if (!itemSales[sale.itemName]) {
        itemSales[sale.itemName] = {
          name: sale.itemName,
          quantity: 0,
          total: 0
        }
      }
      itemSales[sale.itemName].quantity += sale.quantity
      itemSales[sale.itemName].total += sale.totalPrice
    })

    return Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }

  const getSalesByCategory = () => {
    const categorySales = {}
    
    salesData.forEach(sale => {
      if (!categorySales[sale.itemCategory]) {
        categorySales[sale.itemCategory] = {
          name: sale.itemCategory,
          quantity: 0,
          total: 0
        }
      }
      categorySales[sale.itemCategory].quantity += sale.quantity
      categorySales[sale.itemCategory].total += sale.totalPrice
    })

    return Object.values(categorySales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <Button 
          onClick={loadSalesData} 
          variant="secondary" 
          size="sm" 
          className="mt-2"
        >
          Réessayer
        </Button>
      </div>
    )
  }

  const currentPeriodData = getPeriodData(selectedPeriod)
  const topItems = getTopSellingItems()
  const categorySales = getSalesByCategory()

  return (
    <div className="space-y-6">
      {/* Sélecteur de période */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'all'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Nombre de ventes"
          value={currentPeriodData.count}
          subtitle={getPeriodLabel(selectedPeriod)}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(currentPeriodData.total)}
          subtitle={getPeriodLabel(selectedPeriod)}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
        <StatCard
          title="Panier moyen"
          value={currentPeriodData.count > 0 ? formatCurrency(currentPeriodData.total / currentPeriodData.count) : '0 KMF'}
          subtitle="Par vente"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
          }
        />
        <StatCard
          title="Total des ventes"
          value={formatCurrency(stats?.allTime?.total || 0)}
          subtitle="Tout le temps"
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Top articles et catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top articles vendus */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Articles Vendus</h3>
          </div>
          <div className="p-6">
            {topItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.quantity} unité(s) vendue(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ventes par catégorie */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Ventes par Catégorie</h3>
          </div>
          <div className="p-6">
            {categorySales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-4">
                {categorySales.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-600">{category.quantity} unité(s) vendue(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(category.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Graphique simple des ventes par jour (7 derniers jours) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Ventes des 7 derniers jours</h3>
        </div>
        <div className="p-6">
          <SalesChart data={salesData} />
        </div>
      </div>
    </div>
  )
}

// Composant de graphique simple
function SalesChart({ data }) {
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    return days
  }

  const getSalesByDay = () => {
    const last7Days = getLast7Days()
    return last7Days.map(day => {
      const daySales = data.filter(sale => {
        const saleDate = sale.saleDate.toDate ? sale.saleDate.toDate() : new Date(sale.saleDate)
        return saleDate.toDateString() === day.toDateString()
      })
      
      const total = daySales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
      const count = daySales.length
      
      return {
        date: day,
        total,
        count,
        label: day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
      }
    })
  }

  const salesByDay = getSalesByDay()
  const maxTotal = Math.max(...salesByDay.map(d => d.total))

  if (maxTotal === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune vente enregistrée cette semaine</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between h-32 space-x-2">
        {salesByDay.map((day, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-gray-200 rounded-t-lg relative">
              <div 
                className="bg-blue-500 rounded-t-lg transition-all duration-300"
                style={{ 
                  height: `${(day.total / maxTotal) * 100}%`,
                  minHeight: day.total > 0 ? '4px' : '0px'
                }}
              />
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs text-gray-600">{day.label}</div>
              <div className="text-xs font-semibold text-gray-900">{day.count}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>0 KMF</span>
        <span>{maxTotal.toLocaleString('fr-FR')} KMF</span>
      </div>
    </div>
  )
}
