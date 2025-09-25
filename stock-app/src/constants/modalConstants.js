// Modal configuration constants
export const MODAL_CONFIG = {
  SUCCESS: {
    TITLE: 'Utilisateur créé avec succès!',
    SUBTITLE: 'Le compte a été créé et est prêt à être utilisé',
    BUTTON_TEXT: "Parfait, j'ai compris"
  },
  CREATE_USER: {
    TITLE: 'Nouvel Utilisateur',
    SUBTITLE: 'Créer un compte utilisateur',
    BUTTON_TEXT: 'Créer Utilisateur',
    LOADING_TEXT: 'Création...'
  }
}

// Form validation constants
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  REQUIRED_FIELDS: ['email', 'tempPassword']
}

// Error messages
export const ERROR_MESSAGES = {
  PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 8 caractères',
  REQUIRED_FIELDS: 'Email et mot de passe sont requis',
  USER_CREATION_FAILED: 'Erreur lors de la création de l\'utilisateur: '
}

// Warning messages
export const WARNING_MESSAGES = {
  PASSWORD_CHANGE_REQUIRED: 'L\'utilisateur devra changer son mot de passe lors de sa première connexion.',
  PASSWORD_CHANGE_REQUIRED_SHORT: 'L\'utilisateur devra changer ce mot de passe lors de sa première connexion'
}

// Role options
export const ROLE_OPTIONS = [
  { value: 'shop', label: 'Utilisateur Magasin' },
  { value: 'admin', label: 'Administrateur' }
]

