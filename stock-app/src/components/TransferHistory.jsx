import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy, limit, getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { TransferStorage } from '../utils/transferStorage'

export default function TransferHistory() {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [shopNames, setShopNames] = useState({})
  const [depotNames, setDepotNames] = useState({})
  const { userProfile, isAdmin } = useAuth()

  // Fonction pour récupérer les noms des magasins et dépôts
  const fetchNames = async (transfersData) => {
    const shopIds = [...new Set(transfersData.map(t => t.shopId).filter(Boolean))]
    const depotIds = [...new Set(transfersData.map(t => t.depotId).filter(Boolean))]
    
    // Debug logs removed for cleaner console
    
    const shopNamesMap = {}
    const depotNamesMap = {}
    
    try {
      // Récupérer les noms des magasins
      if (shopIds.length > 0) {
        const shopPromises = shopIds.map(async (shopId) => {
          try {
            const shopDoc = await getDoc(doc(db, 'shops', shopId))
            if (shopDoc.exists()) {
              const shopName = shopDoc.data().name
              shopNamesMap[shopId] = shopName
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du magasin ${shopId}:`, error)
          }
        })
        await Promise.all(shopPromises)
      }
      
      // Récupérer les noms des dépôts
      if (depotIds.length > 0) {
        const depotPromises = depotIds.map(async (depotId) => {
          try {
            const depotDoc = await getDoc(doc(db, 'depots', depotId))
            if (depotDoc.exists()) {
              const depotName = depotDoc.data().name
              depotNamesMap[depotId] = depotName
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du dépôt ${depotId}:`, error)
          }
        })
        await Promise.all(depotPromises)
      }
      
    // Names fetched successfully
      
      setShopNames(shopNamesMap)
      setDepotNames(depotNamesMap)
    } catch (error) {
      console.error('Erreur lors de la récupération des noms:', error)
    }
  }

  // Attendre que le contexte d'authentification soit prêt
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100) // Petit délai pour s'assurer que le contexte est chargé

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Attendre que le composant soit prêt
    if (!isReady) return

    // Vérification renforcée pour éviter les erreurs Firebase
    if (!userProfile || !userProfile.uid || userProfile.uid === undefined || userProfile.uid === null) {
      setLoading(false)
      return
    }

    // Utiliser la nouvelle solution de stockage hybride
    const loadTransfers = async () => {
      try {
        const limitCount = expanded ? 50 : 5
        const transfersData = await TransferStorage.getTransfers(userProfile.uid, isAdmin, limitCount)
        setTransfers(transfersData)
        
        // Récupérer les noms des magasins et dépôts
        await fetchNames(transfersData)
        
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement des transferts:', error)
        setLoading(false)
      }
    }

    loadTransfers()
  }, [userProfile, isAdmin, expanded, isReady])

  const formatDate = (date) => {
    if (!date) return 'Date inconnue'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransferIcon = (type) => {
    if (type === 'transfer') {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      )
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      )
    }
  }

  const getTransferStatus = (type) => {
    return type === 'transfer' ? 'Transféré' : 'Retiré'
  }

  const getTransferColor = (type) => {
    return type === 'transfer' ? 'text-green-600' : 'text-orange-600'
  }

  // Component ready state checked

  // Toujours afficher le composant, même si les données ne sont pas prêtes
  if (!isReady) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Historique des Transferts</h3>
              <p className="text-sm text-gray-600">Initialisation...</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si pas de userProfile, afficher un message
  if (!userProfile || !userProfile.uid) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Historique des Transferts</h3>
              <p className="text-sm text-gray-600">En attente de connexion...</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p>Veuillez vous connecter pour voir l'historique des transferts.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun transfert</h3>
          <p className="text-gray-500">Aucun transfert n'a encore été effectué.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Historique des Transferts</h3>
            <p className="text-sm text-gray-600">
              {transfers.length} transfert{transfers.length > 1 ? 's' : ''} récent{transfers.length > 1 ? 's' : ''}
            </p>
          </div>
          {transfers.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
            >
              <span>{expanded ? 'Voir moins' : 'Voir plus'}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Transfer List */}
      <div className="divide-y divide-gray-200">
        {transfers.slice(0, expanded ? transfers.length : 5).map((transfer) => (
          <div key={transfer.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              {getTransferIcon(transfer.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transfer.itemName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transfer.quantity} {transfer.unit || 'unité(s)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransferColor(transfer.type)} bg-gray-100`}>
                      {getTransferStatus(transfer.type)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(transfer.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded-md">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Retiré de: {depotNames[transfer.depotId] || 'Dépôt inconnu'}
                    </span>
                    {transfer.type === 'transfer' && transfer.shopId && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Ajouté à: {shopNames[transfer.shopId] || 'Magasin inconnu'}
                      </span>
                    )}
                    {transfer.type === 'remove' && (
                      <span className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 rounded-md">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Retiré pour usage personnel
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {transfers.length > 5 && !expanded && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => setExpanded(true)}
            className="w-full text-center text-sm font-medium text-teal-600 hover:text-teal-700 py-2"
          >
            Voir les {transfers.length - 5} autres transferts
          </button>
        </div>
      )}
    </div>
  )
}
