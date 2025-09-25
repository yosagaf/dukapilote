// Utility functions for modal management
export const useBodyScrollLock = (isLocked) => {
  if (typeof window === 'undefined') return

  if (isLocked) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'unset'
  }
}

// Form validation utilities
export const validateUserForm = (formData) => {
  const errors = []

  if (!formData.email || !formData.tempPassword) {
    errors.push('Email et mot de passe sont requis')
  }

  if (formData.tempPassword && formData.tempPassword.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  }

  return errors
}

// Transform form data for API
export const transformFormDataForAPI = (formData) => ({
  role: formData.role === 'shop' ? 'shop_user' : formData.role,
  shopId: formData.role === 'shop' ? formData.shopId : null,
  prenom: formData.prenom,
  nom: formData.nom
})

