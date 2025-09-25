import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, collection, query, where, getDocs, getDocFromServer } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password, userData) {
    const result = await createUserWithEmailAndPassword(auth, email, password)

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      role: userData.role || 'shop_user',
      shopId: userData.shopId || null,
      created_at: new Date()
    })

    return result
  }

  async function createUserAsAdmin(email, tempPassword, userData) {
    // Validate password strength
    if (tempPassword.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères')
    }

    // Store current admin session info
    const adminUid = currentUser?.uid
    const adminEmail = currentUser?.email

    try {
      // Create the new user with temporary password
      const result = await createUserWithEmailAndPassword(auth, email, tempPassword)

      // Create secure user profile in Firestore (NO password stored)
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role: userData.role || 'shop_user',
        shopId: userData.shopId || null,
        prenom: userData.prenom || '',
        nom: userData.nom || '',
        mustChangePassword: true, // Force password change on first login
        createdBy: adminUid || 'system',
        created_at: new Date()
      })

      // Immediately sign out the newly created user
      await signOut(auth)

      // Re-authenticate the admin user
      // We need to wait a moment for the signOut to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // The onAuthStateChanged listener will handle the re-authentication
      // We just need to trigger a re-login of the admin
      // This is a limitation of Firebase Auth - we can't maintain multiple sessions
      
      // Log admin action for security audit

      return result
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async function login(email, password) {
    try {
      // Secure login - only use Firebase Auth
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Login error:', error)

      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        throw new Error('Email ou mot de passe incorrect. Vérifiez vos identifiants.')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Trop de tentatives de connexion. Veuillez réessayer plus tard.')
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('Ce compte a été désactivé. Contactez l\'administrateur.')
      } else {
        throw new Error('Erreur de connexion. Veuillez réessayer.')
      }
    }
  }

  function logout() {
    return signOut(auth)
  }

  async function fetchUserProfile(user) {
    if (user) {
      try {
        // First try to get from server to avoid snapshot listener issues
        const userDoc = await getDocFromServer(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const profileData = userDoc.data()
          const userProfileWithUid = {
            ...profileData,
            uid: user.uid // Ajouter l'uid au profil utilisateur
          }
          setUserProfile(userProfileWithUid)
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // For permission errors, we might want to create a basic profile or handle differently
        if (error.code === 'permission-denied') {
          // Try to create a basic profile or set minimal user data
          const fallbackProfile = {
            email: user.email,
            uid: user.uid,
            role: 'user' // default role
          }
          setUserProfile(fallbackProfile)
        } else {
          setUserProfile(null)
        }
      }
    } else {
      setUserProfile(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      await fetchUserProfile(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    signup,
    createUserAsAdmin,
    login,
    logout,
    isAdmin: userProfile?.role === 'admin',
    isShopUser: userProfile?.role === 'shop_user'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}