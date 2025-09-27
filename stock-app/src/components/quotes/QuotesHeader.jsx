import React from 'react'

/**
 * Composant pour l'en-tête de la page devis/factures
 * @param {string} currentTab - Onglet actuel
 * @param {Function} onNewQuote - Fonction pour créer un nouveau devis
 * @param {Function} onNewInvoice - Fonction pour créer une nouvelle facture
 * @param {Function} onShowDrafts - Fonction pour afficher les Brouillons
 * @param {Function} onLogout - Fonction pour se déconnecter
 */
export default function QuotesHeader({ 
  currentTab, 
  onNewQuote, 
  onNewInvoice, 
  onShowDrafts, 
  onLogout 
}) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-teal-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentTab === 'quotes' && 'Devis'}
            {currentTab === 'invoices' && 'Factures'}
            {currentTab === 'drafts' && 'Brouillons'}
          </h1>
          <p className="text-gray-600">
            {currentTab === 'quotes' && 'Gérez vos devis et propositions commerciales'}
            {currentTab === 'invoices' && 'Gérez vos factures et encaissements'}
            {currentTab === 'drafts' && 'Gérez vos Brouillons en cours'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {currentTab !== 'drafts' && (
            <>
              <button
                onClick={onNewQuote}
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau Devis
              </button>
              
              <button
                onClick={onNewInvoice}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Nouvelle Facture
              </button>
            </>
          )}
          
          <button
            onClick={onShowDrafts}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Brouillons
          </button>
          
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
