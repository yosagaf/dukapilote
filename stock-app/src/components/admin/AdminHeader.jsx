import React from 'react'

/**
 * Composant pour l'en-tête de l'administration
 * @param {string} currentPage - Page actuelle
 * @param {Function} onLogout - Fonction pour se déconnecter
 */
export default function AdminHeader({ currentPage, onLogout }) {
  const getPageTitle = () => {
    switch (currentPage) {
      case 'users': return 'Gestion des Utilisateurs'
      case 'shops': return 'Gestion des Magasins'
      case 'depots': return 'Gestion des Dépôts'
      case 'tools': return 'Outils d\'Administration'
      default: return 'Tableau de Bord Admin'
    }
  }

  const getPageDescription = () => {
    switch (currentPage) {
      case 'users': return 'Gérez les utilisateurs et leurs permissions'
      case 'shops': return 'Gérez les magasins et leurs configurations'
      case 'depots': return 'Gérez les dépôts et leurs liaisons'
      case 'tools': return 'Outils de maintenance et configuration'
      default: return 'Interface d\'administration du système'
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-teal-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600">
            {getPageDescription()}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}
