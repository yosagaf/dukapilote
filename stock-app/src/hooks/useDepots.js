import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Hook personnalisé pour gérer les dépôts
 * @returns {Object} { depots, loading, error, refetch }
 */
export const useDepots = () => {
  const [depots, setDepots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const depotsQuery = query(collection(db, 'depots'), orderBy('name'))
    
    const unsubscribe = onSnapshot(
      depotsQuery,
      (snapshot) => {
        const depotsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setDepots(depotsData)
        setLoading(false)
        setError('')
      },
      (error) => {
        console.error('Erreur lors du chargement des dépôts:', error)
        setError('Erreur lors du chargement des dépôts')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const refetch = () => {
    setLoading(true)
    setError('')
  }

  return { depots, loading, error, refetch }
}
