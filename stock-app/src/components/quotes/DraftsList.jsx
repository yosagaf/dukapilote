import React from 'react'
import QuoteInvoiceCard from '../QuoteInvoiceCard'

/**
 * Composant pour afficher la liste des brouillons
 * @param {Array} drafts - Liste des brouillons
 * @param {Function} onEdit - Fonction appelée lors de l'édition
 * @param {Function} onDelete - Fonction appelée lors de la suppression
 * @param {Function} onDownload - Fonction appelée lors du téléchargement
 */
export default function DraftsList({ drafts, onEdit, onDelete, onDownload }) {
  if (drafts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-gray-100">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun brouillon trouvé</h3>
          <p className="text-gray-600">Commencez par créer votre premier brouillon.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {drafts.map((draft) => (
        <QuoteInvoiceCard
          key={draft.id}
          document={draft}
          type="draft"
          onEdit={onEdit}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      ))}
    </div>
  )
}
