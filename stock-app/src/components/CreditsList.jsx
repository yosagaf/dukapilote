import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CreditStorage } from '../utils/creditStorage'
import Button from './common/Button'
import LoadingSpinner from './common/LoadingSpinner'

export default function CreditsList({ onRefresh, onPaymentAdded, onDuplicateCredit, onNewCredit }) {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showActionsMenu, setShowActionsMenu] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [creditToDelete, setCreditToDelete] = useState(null)

  useEffect(() => {
    if (userProfile?.shopId) {
      loadCredits()
    }
  }, [userProfile])

  // Fermer le menu d'actions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsMenu && !event.target.closest('.actions-menu')) {
        setShowActionsMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActionsMenu])

  useEffect(() => {
    if (onRefresh) {
      loadCredits()
    }
  }, [onRefresh])

  const loadCredits = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await CreditStorage.getCredits(userProfile.shopId)
      if (!result.success) {
        setError(result.error)
        return
      }

      setCredits(result.data)
    } catch (error) {
      console.error('Erreur lors du chargement des crédits:', error)
      setError('Erreur lors du chargement des crédits')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadCredits()
      return
    }

    setLoading(true)
    try {
      const result = await CreditStorage.searchCredits(userProfile.shopId, searchTerm)
      if (result.success) {
        setCredits(result.data)
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'partial':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'partial':
        return 'Partiel'
      case 'completed':
        return 'Terminé'
      default:
        return status
    }
  }

  const filteredCredits = credits.filter(credit => {
    const matchesStatus = statusFilter === 'all' || credit.status === statusFilter
    return matchesStatus
  })

  const sortedCredits = [...filteredCredits].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]

    if (sortBy === 'createdAt' || sortBy === 'appointmentDate') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleViewDetails = (credit) => {
    navigate(`/credits/${credit.id}`)
  }

  const handleDeleteCredit = (credit) => {
    setCreditToDelete(credit)
    setShowDeleteModal(true)
    setShowActionsMenu(null)
  }

  const confirmDeleteCredit = async () => {
    if (!creditToDelete) return

    try {
      setActionLoading(true)
      await CreditStorage.deleteCredit(creditToDelete.id)
      await loadCredits()
      if (onPaymentAdded) {
        onPaymentAdded()
      }
      setShowDeleteModal(false)
      setCreditToDelete(null)
    } catch (error) {
      console.error('Erreur lors de la suppression du crédit:', error)
      setError('Erreur lors de la suppression du crédit')
    } finally {
      setActionLoading(false)
    }
  }

  const cancelDeleteCredit = () => {
    setShowDeleteModal(false)
    setCreditToDelete(null)
  }

  const handleCloseCredit = async (credit) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir clôturer le crédit de ${credit.customerName} ${credit.customerFirstName} ?`)) {
      return
    }

    try {
      setActionLoading(true)
      await CreditStorage.updateCredit(credit.id, { status: 'completed' })
      await loadCredits()
      if (onPaymentAdded) {
        onPaymentAdded()
      }
    } catch (error) {
      console.error('Erreur lors de la clôture du crédit:', error)
      setError('Erreur lors de la clôture du crédit')
    } finally {
      setActionLoading(false)
      setShowActionsMenu(null)
    }
  }

  const handleDuplicateCredit = (credit) => {
    // Préparer les données du crédit à dupliquer
    const creditData = {
      customerName: credit.customerName,
      customerFirstName: credit.customerFirstName,
      customerPhone: credit.customerPhone,
      customerAddress: credit.customerAddress,
      items: credit.items
    }
    
    // Appeler la fonction parent pour ouvrir le modal avec les données pré-remplies
    if (onDuplicateCredit) {
      onDuplicateCredit(creditData)
    }
    
    setShowActionsMenu(null)
  }

  const handleNewCredit = () => {
    if (onNewCredit) {
      onNewCredit()
    }
    setShowActionsMenu(null)
  }

  const handleUpdate = async () => {
    await loadCredits()
    
    // Notifier la page parent qu'un paiement a été ajouté
    if (onPaymentAdded) {
      onPaymentAdded()
    }
  }


  // Composant SortIcon pour harmoniser avec les autres pages
  const SortIcon = ({ field }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    )
  }

  if (loading && credits.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par nom de client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtre par statut */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="partial">Partiel</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des crédits */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('customerName')}
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Client</span>
                    <SortIcon field="customerName" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('appointmentDate')}
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Date RDV</span>
                    <SortIcon field="appointmentDate" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('totalAmount')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 8c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z" />
                    </svg>
                    <span>Montant total</span>
                    <SortIcon field="totalAmount" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('paidAmount')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Montant payé</span>
                    <SortIcon field="paidAmount" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('remainingAmount')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>Reste à payer</span>
                    <SortIcon field="remainingAmount" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Statut</span>
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCredits.map((credit) => (
                <tr key={credit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {credit.customerName} {credit.customerFirstName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {credit.birthPlace}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      if (!credit.appointmentDate) return 'Non défini'
                      
                      try {
                        // Si c'est déjà un objet Date
                        if (credit.appointmentDate instanceof Date) {
                          return credit.appointmentDate.toLocaleDateString('fr-FR')
                        }
                        
                        // Si c'est un timestamp Firestore
                        if (credit.appointmentDate.toDate && typeof credit.appointmentDate.toDate === 'function') {
                          return credit.appointmentDate.toDate().toLocaleDateString('fr-FR')
                        }
                        
                        // Si c'est une chaîne ou un nombre
                        const date = new Date(credit.appointmentDate)
                        if (isNaN(date.getTime())) {
                          return 'Date invalide'
                        }
                        
                        return date.toLocaleDateString('fr-FR')
                      } catch (error) {
                        console.error('Erreur lors du formatage de la date:', error)
                        return 'Date invalide'
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {credit.totalAmount.toLocaleString('fr-FR')} KMF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                    {credit.paidAmount.toLocaleString('fr-FR')} KMF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                    {credit.remainingAmount.toLocaleString('fr-FR')} KMF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(credit.status)}`}>
                      {getStatusLabel(credit.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(credit)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                      >
                        Voir
                      </button>
                      
                      {/* Menu à 3 points */}
                      <div className="relative actions-menu">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === credit.id ? null : credit.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Actions"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {showActionsMenu === credit.id && (
                          <div className={`absolute right-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 ${
                            sortedCredits.indexOf(credit) >= sortedCredits.length - 3 
                              ? 'bottom-0 mb-2' 
                              : 'top-0 mt-2'
                          }`}>
                            <div className="py-1">
                              <button
                                onClick={() => handleCloseCredit(credit)}
                                disabled={credit.status === 'completed' || actionLoading}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {credit.status === 'completed' ? 'Déjà clôturé' : 'Clôturer le crédit'}
                              </button>
                              
                              <button
                                onClick={() => handleDuplicateCredit(credit)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Dupliquer
                              </button>
                              
                              <button
                                onClick={() => handleDeleteCredit(credit)}
                                disabled={actionLoading}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {actionLoading ? 'Suppression...' : 'Supprimer'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedCredits.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">Aucun crédit trouvé</p>
            <p className="text-sm text-gray-400">Les crédits apparaîtront ici une fois créés</p>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && creditToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Supprimer le crédit</h3>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Êtes-vous sûr de vouloir supprimer le crédit de <strong>{creditToDelete.customerName} {creditToDelete.customerFirstName}</strong> ?
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Cette action est irréversible</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Toutes les données du crédit seront définitivement supprimées, y compris l'historique des paiements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={cancelDeleteCredit}
                  variant="secondary"
                  disabled={actionLoading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmDeleteCredit}
                  variant="danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer définitivement'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
