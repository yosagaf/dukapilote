import React from 'react'

/**
 * Composant pour la navigation de l'administration
 * @param {string} currentPage - Page actuelle
 * @param {Function} onPageChange - Fonction appelée lors du changement de page
 */
export default function AdminNavigation({ currentPage, onPageChange }) {
  const menuItems = [
    { id: 'users', label: 'Utilisateurs', icon: '👥' },
    { id: 'shops', label: 'Magasins', icon: '🏪' },
    { id: 'depots', label: 'Dépôts', icon: '📦' },
    { id: 'tools', label: 'Outils', icon: '🔧' }
  ]

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-teal-100">
      <div className="flex flex-wrap gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
