import React from 'react'

/**
 * Composant pour les onglets de navigation devis/factures
 * @param {string} currentTab - Onglet actuel
 * @param {Function} onTabChange - Fonction appelée lors du changement d'onglet
 */
export default function QuotesTabs({ currentTab, onTabChange }) {
  const tabs = [
    { id: 'quotes', label: 'Devis', icon: '📋' },
    { id: 'invoices', label: 'Factures', icon: '🧾' },
    { id: 'drafts', label: 'Brouillons', icon: '📝' }
  ]

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-teal-100">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md font-medium transition-all duration-200 ${
              currentTab === tab.id
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
