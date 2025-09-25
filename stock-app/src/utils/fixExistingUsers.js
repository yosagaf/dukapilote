// Script utilitaire pour ajouter defaultPassword aux utilisateurs existants
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function addDefaultPasswordToExistingUsers() {
  try {

    const usersCollection = collection(db, 'users')
    const usersSnapshot = await getDocs(usersCollection)

    const updatePromises = []

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data()

      // Si l'utilisateur n'a pas de defaultPassword, l'ajouter
      if (!userData.defaultPassword) {
        const updatePromise = updateDoc(doc(db, 'users', userDoc.id), {
          defaultPassword: '123456', // Mot de passe par défaut
          updated_at: new Date()
        })
        updatePromises.push(updatePromise)

      }
    })

    await Promise.all(updatePromises)

    return { success: true, updated: updatePromises.length }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return { success: false, error }
  }
}

// Script pour créer automatiquement les comptes Firebase Auth manquants
export async function createMissingFirebaseAuthAccounts() {
  try {

    const usersCollection = collection(db, 'users')
    const usersSnapshot = await getDocs(usersCollection)

    const results = []

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()

      // Si l'utilisateur n'a pas de firebaseUid, il manque probablement le compte Auth
      if (!userData.firebaseUid && userData.email && userData.defaultPassword) {
        try {
          // Cette partie nécessiterait l'Admin SDK pour créer les comptes
          // ou sera gérée automatiquement lors de la première connexion

          results.push({
            email: userData.email,
            password: userData.defaultPassword,
            status: 'auth_missing'
          })
        } catch (error) {
          console.error(`Erreur pour ${userData.email}:`, error)
          results.push({
            email: userData.email,
            status: 'error',
            error: error.message
          })
        }
      } else if (userData.firebaseUid) {
        results.push({
          email: userData.email,
          status: 'ok'
        })
      }
    }

    return { success: true, results }
  } catch (error) {
    console.error('Erreur lors de la vérification:', error)
    return { success: false, error }
  }
}