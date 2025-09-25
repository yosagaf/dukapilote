import React from 'react'
import QuoteInvoiceCard from '../QuoteInvoiceCard'

/**
 * Composant pour afficher la liste des devis
 * @param {Array} quotes - Liste des devis
 * @param {Function} onEdit - Fonction appelée lors de l'édition
 * @param {Function} onDelete - Fonction appelée lors de la suppression
 * @param {Function} onDownload - Fonction appelée lors du téléchargement
 */
export default function QuotesList({ quotes, onEdit, onDelete, onDownload }) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-teal-100">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun devis trouvé</h3>
          <p className="text-gray-600">Commencez par créer votre premier devis.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quotes.map((quote) => (
        <QuoteInvoiceCard
          key={quote.id}
          document={quote}
          type="quote"
          onEdit={onEdit}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      ))}
    </div>
  )
}
