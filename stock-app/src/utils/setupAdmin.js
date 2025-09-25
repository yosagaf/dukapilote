import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

/**
 * One-time setup script to create the initial admin user
 * This should be run once and then removed from production
 */
export async function setupInitialAdmin() {
  const adminEmail = 'sagafysf@gmail.com'
  const adminPassword = prompt('Enter a secure password for the admin account (minimum 8 characters):')

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }

  try {
    // Create Firebase Auth account first
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)

    // Create Firestore profile (NO password stored)
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: adminEmail,
      role: 'admin',
      prenom: 'Admin',
      nom: 'DukaPilote',
      created_at: new Date(),
      setupComplete: true
    })


    return { success: true, message: 'Admin user created successfully' }
  } catch (error) {
    console.error('Error creating admin user:', error)

    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Admin user already exists' }
    }

    return { success: false, error: error.message }
  }
}

// Temporary setup function for development
window.setupAdmin = setupInitialAdmin