import { createContext, useContext, useEffect, useState } from 'react'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const ConfigContext = createContext()

export function useConfig() {
  return useContext(ConfigContext)
}

export function ConfigProvider({ children }) {
  const { userProfile } = useAuth()
  const [config, setConfig] = useState({
    // Configuration des documents
    autoDeductStock: false, // Déduire automatiquement le stock à la création
    requirePaymentConfirmation: true, // Exiger confirmation de paiement
    
    // Configuration de l'entreprise
    companyName: 'DUKAPILOTE',
    companyLocation: 'Moroni, Comores',
    companyPhone: '+269 XXX XX XX',
    companyPhone2: null,
    companyEmail: 'contact@dukapilote.com',
    
    // Configuration des documents
    defaultQuoteValidity: 30, // Validité par défaut des devis (jours)
    defaultPaymentTerms: 30, // Délai de paiement par défaut (jours)
    
    // Configuration des notifications
    enableNotifications: true,
    notificationTypes: {
      lowStock: true,
      paymentReminders: true,
      newOrders: true
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Charger la configuration depuis Firestore
  useEffect(() => {
    if (!userProfile?.uid) return

    const loadConfig = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const configRef = doc(db, 'config', userProfile.uid)
        const configSnap = await getDoc(configRef)
        
        if (configSnap.exists()) {
          setConfig(prevConfig => ({
            ...prevConfig,
            ...configSnap.data()
          }))
        } else {
          // Créer la configuration par défaut
          await setDoc(configRef, config)
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la configuration:', err)
        // Ne pas afficher d'erreur si c'est juste un problème de permissions
        // Utiliser la configuration par défaut
        if (err.code === 'permission-denied') {
          console.log('Utilisation de la configuration par défaut (permissions insuffisantes)')
        } else {
          setError('Erreur lors du chargement de la configuration')
        }
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [userProfile])

  // Sauvegarder la configuration
  const updateConfig = async (newConfig) => {
    if (!userProfile?.uid) return

    try {
      setError(null)
      const configRef = doc(db, 'config', userProfile.uid)
      await setDoc(configRef, newConfig, { merge: true })
      setConfig(newConfig)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la configuration:', err)
      if (err.code === 'permission-denied') {
        setError('Permissions insuffisantes pour sauvegarder la configuration')
      } else {
        setError('Erreur lors de la sauvegarde de la configuration')
      }
    }
  }

  // Mettre à jour une propriété spécifique
  const updateConfigProperty = async (property, value) => {
    const newConfig = { ...config, [property]: value }
    await updateConfig(newConfig)
  }

  const value = {
    config,
    updateConfig,
    updateConfigProperty,
    loading,
    error,
    clearError: () => setError(null)
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}
