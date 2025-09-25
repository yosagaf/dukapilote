import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy, getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Hook personnalisé pour gérer les magasins
 * @returns {Object} { shops, loading, error, refetch }
 */
export const useShops = () => {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const shopsQuery = query(collection(db, 'shops'), orderBy('name'))
    
    const unsubscribe = onSnapshot(
      shopsQuery,
      (snapshot) => {
        const shopsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setShops(shopsData)
        setLoading(false)
        setError('')
      },
      (error) => {
        console.error('Erreur lors du chargement des magasins:', error)
        setError('Erreur lors du chargement des magasins')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const refetch = () => {
    setLoading(true)
    setError('')
  }

  return { shops, loading, error, refetch }
}

/**
 * Hook pour charger les informations d'un magasin spécifique
 * @param {string} shopId - ID du magasin
 * @returns {Object} { shop, loading, error }
 */
export const useShop = (shopId) => {
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!shopId) {
      setLoading(false)
      return
    }

    const fetchShop = async () => {
      try {
        const shopDoc = await getDoc(doc(db, 'shops', shopId))
        if (shopDoc.exists()) {
          setShop({
            id: shopDoc.id,
            ...shopDoc.data()
          })
        } else {
          setError('Magasin non trouvé')
        }
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors de la récupération du magasin:', error)
        setError('Erreur lors de la récupération du magasin')
        setLoading(false)
      }
    }

    fetchShop()
  }, [shopId])

  return { shop, loading, error }
}
