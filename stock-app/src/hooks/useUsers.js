import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Hook personnalisé pour gérer les utilisateurs
 * @returns {Object} { users, loading, error, refetch }
 */
export const useUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), orderBy('email'))
    
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setUsers(usersData)
        setLoading(false)
        setError('')
      },
      (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error)
        setError('Erreur lors du chargement des utilisateurs')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const refetch = () => {
    setLoading(true)
    setError('')
  }

  return { users, loading, error, refetch }
}
