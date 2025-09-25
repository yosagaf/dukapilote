import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Hook personnalisé pour gérer les catégories
 * @returns {Object} { categories, loading, error, refetch }
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const categoriesQuery = collection(db, 'categories')
    
    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Trier par ordre si disponible
        categoriesData.sort((a, b) => (a.order || 0) - (b.order || 0))
        
        setCategories(categoriesData)
        setLoading(false)
        setError('')
      },
      (error) => {
        console.error('Erreur lors du chargement des catégories:', error)
        setError('Erreur lors du chargement des catégories')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const refetch = () => {
    setLoading(true)
    setError('')
  }

  return { categories, loading, error, refetch }
}
