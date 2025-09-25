import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy, getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Hook personnalisé pour gérer les articles (items)
 * @param {Object} userProfile - Profil utilisateur
 * @param {boolean} isAdmin - Si l'utilisateur est admin
 * @returns {Object} { items, loading, error, refetch }
 */
export const useItems = (userProfile, isAdmin) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userProfile) {
      setLoading(false)
      return
    }

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

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setItems(itemsData)
        setLoading(false)
        setError('')
      },
      (error) => {
        console.error('Erreur lors du chargement des articles:', error)
        setError('Erreur lors du chargement des articles')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [userProfile, isAdmin])

  const refetch = () => {
    setLoading(true)
    setError('')
  }

  return { items, loading, error, refetch }
}

/**
 * Hook pour charger les articles d'un magasin et de ses dépôts liés
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Object} { items, loading, error }
 */
export const useItemsWithLinkedDepots = (userProfile) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userProfile?.shopId) {
      setLoading(false)
      return
    }

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
        const unsubscribe = onSnapshot(
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
            setError('')
          },
          (error) => {
            console.error('Erreur lors du chargement des articles:', error)
            setError('Erreur lors du chargement des articles')
            setLoading(false)
          }
        )

        return unsubscribe
      } catch (error) {
        console.error('Erreur lors du chargement des articles:', error)
        setError('Erreur lors du chargement des articles')
        setLoading(false)
      }
    }

    loadShopAndDepotItems()
  }, [userProfile])

  return { items, loading, error }
}
