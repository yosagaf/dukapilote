import React, { useState, useEffect, useRef } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function SearchBar({ onItemSelect }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { userProfile, isAdmin } = useAuth()
  const searchRef = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchItems = async () => {
      if (searchTerm.length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setLoading(true)
      try {
        const itemsRef = collection(db, 'items')
        const q = query(
          itemsRef,
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff')
        )

        const querySnapshot = await getDocs(q)
        const items = []
        let linkedDepotIds = []

        // Si l'utilisateur n'est pas admin et a un shopId, récupérer les dépôts liés
        if (!isAdmin && userProfile?.shopId) {
          try {
            const userShopDoc = await getDoc(doc(db, 'shops', userProfile.shopId))
            if (userShopDoc.exists()) {
              const shopData = userShopDoc.data()
              if (shopData.linkedDepotIds && shopData.linkedDepotIds.length > 0) {
                linkedDepotIds = shopData.linkedDepotIds
              }
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des dépôts liés:', error)
          }
        }

        for (const itemDoc of querySnapshot.docs) {
          const itemData = { id: itemDoc.id, ...itemDoc.data() }

          // Récupérer les informations du magasin/dépôt
          let locationInfo = null
          if (itemData.shopId) {
            try {
              const shopDoc = await getDoc(doc(db, 'shops', itemData.shopId))
              if (shopDoc.exists()) {
                const shopData = shopDoc.data()
                locationInfo = {
                  name: shopData.name,
                  location: shopData.location,
                  type: shopData.type || 'shop'
                }
              }
            } catch (error) {
              // Si erreur avec shops, essayer avec depots
              try {
                const depotDoc = await getDoc(doc(db, 'depots', itemData.shopId))
                if (depotDoc.exists()) {
                  const depotData = depotDoc.data()
                  locationInfo = {
                    name: depotData.name,
                    location: depotData.location,
                    type: 'depot'
                  }
                }
              } catch (depotError) {
                console.error('Erreur lors de la récupération du dépôt:', depotError)
              }
            }
          }

          // Filtrer selon les permissions avec cross-location pour les dépôts liés
          let canSeeItem = false
          let isLinkedDepot = false

          if (isAdmin) {
            canSeeItem = true
          } else if (!userProfile?.shopId) {
            canSeeItem = true
          } else if (itemData.shopId === userProfile.shopId) {
            canSeeItem = true
          } else if (linkedDepotIds.includes(itemData.shopId)) {
            canSeeItem = true
            isLinkedDepot = true
          }

          if (canSeeItem) {
            items.push({
              ...itemData,
              locationInfo,
              isLinkedDepot,
              isAvailableLocally: itemData.shopId === userProfile?.shopId
            })
          }
        }

        // Trier les résultats : articles locaux d'abord, puis dépôts liés
        items.sort((a, b) => {
          if (a.isAvailableLocally && !b.isAvailableLocally) return -1
          if (!a.isAvailableLocally && b.isAvailableLocally) return 1
          if (a.isLinkedDepot && !b.isLinkedDepot) return -1
          if (!a.isLinkedDepot && b.isLinkedDepot) return 1
          return 0
        })

        setResults(items)
        setShowResults(true)
      } catch (error) {
        console.error('Erreur lors de la recherche:', error)
        setResults([])
      }
      setLoading(false)
    }

    const debounceTimer = setTimeout(searchItems, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, userProfile, isAdmin])

  const handleItemClick = (item) => {
    setSearchTerm('')
    setShowResults(false)
    if (onItemSelect) {
      onItemSelect(item)
    }
  }

  const getStockStatus = (quantity, minThreshold) => {
    if (quantity === 0) return { status: 'out', color: 'red', text: 'Rupture' }
    if (quantity <= minThreshold) return { status: 'low', color: 'orange', text: 'Stock faible' }
    return { status: 'good', color: 'green', text: 'En stock' }
  }

  const getLocationIcon = (type) => {
    if (type === 'depot') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }

  return (
    <div className="relative w-full max-w-lg" ref={searchRef}>
      {/* Barre de recherche */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
          placeholder="Rechercher un article..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Résultats de recherche */}
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto"
        >
          {results.map((item) => {
            const stockInfo = getStockStatus(item.quantity, item.minThreshold)
            const isLocalItem = item.isAvailableLocally
            const isFromLinkedDepot = item.isLinkedDepot && !isLocalItem

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                  isFromLinkedDepot ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-${stockInfo.color}-600 bg-${stockInfo.color}-50`}>
                        {stockInfo.text}
                      </span>
                      {isFromLinkedDepot && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-blue-600 bg-blue-100">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Dépôt lié
                        </span>
                      )}
                      {isLocalItem && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-green-600 bg-green-100">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Local
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-gray-500">
                        Quantité: <span className="font-medium">{item.quantity}</span>
                      </p>
                    </div>
                    {item.locationInfo && (
                      <div className="flex items-center space-x-1 mt-1">
                        {getLocationIcon(item.locationInfo.type)}
                        <span className="text-xs text-gray-600">
                          {item.locationInfo.name} • {item.locationInfo.location}
                        </span>
                        {isFromLinkedDepot && (
                          <span className="text-xs text-blue-600 font-medium">
                            (Transfert possible)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Aucun résultat */}
      {showResults && searchTerm.length >= 2 && results.length === 0 && !loading && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4"
        >
          <div className="text-center text-gray-500">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-900 mb-1">Aucun article trouvé pour "{searchTerm}"</p>
            {!isAdmin && userProfile?.shopId && (
              <p className="text-xs text-gray-500">
                Recherche effectuée dans votre magasin et les dépôts liés
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}