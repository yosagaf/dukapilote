import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { CreditStorage } from '../utils/creditStorage'
import Sidebar from '../components/Sidebar'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import StatCard from '../components/common/StatCard'
import CreditModal from '../components/CreditModal'
import CreditsList from '../components/CreditsList'

export default function Credits() {
  const { userProfile, logout } = useAuth()
  const { sidebarWidth } = useSidebar()
  const [stats, setStats] = useState({
    totalCredits: 0,
    pendingCredits: 0,
    partialCredits: 0,
    completedCredits: 0,
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentPage, setCurrentPage] = useState('credits')

  useEffect(() => {
    if (userProfile?.shopId) {
      loadStats()
    }
  }, [userProfile?.shopId])

  useEffect(() => {
    if (userProfile?.shopId && refreshTrigger > 0) {
      loadStats()
    }
  }, [refreshTrigger])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await CreditStorage.getCreditStats(userProfile.shopId)
      
      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || 'Erreur lors du chargement des statistiques')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      setError('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  const handleCreditCreated = () => {
    setShowCreditModal(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handlePaymentAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
        <Sidebar currentPage={currentPage} />
        <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="flex items-center justify-center h-screen">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} />
      <div className="transition-all duration-300" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Crédits</h1>
                <p className="text-gray-600 mt-2">
                  Gérez les crédits clients et suivez les paiements
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nouveau Crédit
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

            {/* Contenu principal */}
            <div className="px-6 py-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  gradient="green"
                  title="Crédits Terminés"
                  value={stats.completedCredits}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatCard
                  gradient="orange"
                  title="En Attente"
                  value={stats.pendingCredits}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatCard
                  gradient="blue"
                  title="Paiements Partiels"
                  value={stats.partialCredits}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
                <StatCard
                  gradient="purple"
                  title="Total des Crédits"
                  value={stats.totalCredits}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                />
              </div>

              {/* Montants financiers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  gradient="blue"
                  title="Montant Total des Crédits"
                  value={`${stats.totalAmount.toLocaleString('fr-FR')} KMF`}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 8c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z" />
                    </svg>
                  }
                />
                <StatCard
                  gradient="green"
                  title="Montant Payé Total"
                  value={`${stats.paidAmount.toLocaleString('fr-FR')} KMF`}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatCard
                  gradient="danger"
                  title="Reste à Payer Total"
                  value={`${stats.remainingAmount.toLocaleString('fr-FR')} KMF`}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  }
                />
              </div>

              {/* Liste des crédits */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Liste des Crédits</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Gérez et suivez tous vos crédits clients
                  </p>
                </div>
                <div className="p-6">
                  <CreditsList onRefresh={refreshTrigger} onPaymentAdded={handlePaymentAdded} />
                </div>
              </div>
            </div>

        {/* CreditModal - Toujours en plein écran */}
        <CreditModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          onSuccess={handleCreditCreated}
        />
      </div>
    </div>
  )
}