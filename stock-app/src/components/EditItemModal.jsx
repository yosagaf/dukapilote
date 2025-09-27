import { useState, useEffect } from 'react'
import { doc, updateDoc, deleteDoc, collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function EditItemModal({ onClose, item }) {
  const { userProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    quantity: item?.quantity || 0,
    minThreshold: item?.minThreshold ?? 3,
    price: item?.price || '',
    imageUrl: item?.imageUrl || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!userProfile?.uid) return

    const q = query(
      collection(db, 'categories'),
      where('userId', '==', userProfile.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Tri côté client pour éviter les problèmes d'index
      categoriesData.sort((a, b) => a.name.localeCompare(b.name))
      setCategories(categoriesData)
    })

    return unsubscribe
  }, [userProfile?.uid])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!item?.id) {
      setError('Aucun article sélectionné pour la modification.')
      setLoading(false)
      return
    }

    // Validation du prix de référence
    if (!formData.price || formData.price <= 0) {
      setError('Le prix de référence est obligatoire et doit être supérieur à 0.')
      setLoading(false)
      return
    }

    try {
      await updateDoc(doc(db, 'items', item.id), {
        name: formData.name,
        category: formData.category,
        quantity: Number(formData.quantity),
        minThreshold: Number(formData.minThreshold),
        price: Number(formData.price),
        imageUrl: formData.imageUrl,
        updated_at: new Date()
      })
      onClose()
    } catch (error) {
      setError('Échec de la modification de l\'article: ' + error.message)
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleDelete = async () => {
    if (!item?.id) {
      setError('Aucun article sélectionné pour la suppression.')
      return
    }

    setDeleteLoading(true)
    setError('')

    try {
      await deleteDoc(doc(db, 'items', item.id))
      onClose()
    } catch (error) {
      setError('Échec de la suppression de l\'article: ' + error.message)
    }

    setDeleteLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Modifier l'Article</h3>
              <p className="text-sm text-gray-600">Mettre à jour les informations</p>
            </div>
          </div>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du produit</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: Pommes Golden"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
              {categories.length === 0 ? (
                <div className="w-full border border-orange-300 rounded-lg px-4 py-3 bg-orange-50">
                  <p className="text-orange-700 text-sm">
                    Aucune catégorie créée. Créez d'abord des catégories pour organiser vos articles.
                  </p>
                </div>
              ) : (
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantité</label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Seuil Minimum</label>
                <input
                  type="number"
                  name="minThreshold"
                  min="0"
                  value={formData.minThreshold}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prix de Référence (KMF)</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: 1500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL Image (optionnel)</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="https://..."
              />
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-lg shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || deleteLoading}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
              <button
                type="submit"
                disabled={loading || deleteLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Modification...
                  </div>
                ) : (
                  'Modifier Article'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Supprimer l'Article</h3>
                  <p className="text-sm text-gray-600">Action irréversible</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-800 font-medium">Attention</p>
                  </div>
                </div>
                <p className="text-gray-700 text-center">
                  Êtes-vous sûr de vouloir supprimer définitivement l'article
                  <br />
                  <span className="font-bold text-gray-900">"{item?.name}"</span> ?
                </p>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Cette action ne peut pas être annulée.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className="flex-1 border border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-lg shadow-sm hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
                >
                  {deleteLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression...
                    </div>
                  ) : (
                    'Supprimer Définitivement'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}