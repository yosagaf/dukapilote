import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function AddItemModal({ onClose, shopId, contextInfo }) {
  const { userProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    minThreshold: 5,
    price: '',
    imageUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])

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

    if (!shopId) {
      setError('Aucun ID de magasin fourni. Veuillez vous assurer d\'être assigné à un magasin.')
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
      await addDoc(collection(db, 'items'), {
        ...formData,
        quantity: Number(formData.quantity),
        minThreshold: Number(formData.minThreshold),
        price: Number(formData.price),
        shopId,
        created_at: new Date()
      })
      onClose()
    } catch (error) {
      setError('Échec de l\'ajout de l\'article: ' + error.message)
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 ${
              contextInfo?.type === 'depot' 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700' 
                : 'bg-gradient-to-r from-teal-600 to-teal-700'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {contextInfo?.type === 'depot' ? 'Ajouter un Article au Dépôt' : 'Ajouter un Article au Magasin'}
              </h3>
              <p className="text-sm text-gray-600">
                {contextInfo?.type === 'depot' 
                  ? `Nouveau produit dans le dépôt "${contextInfo.name}"` 
                  : `Nouveau produit dans le magasin "${contextInfo?.name || 'votre magasin'}"`
                }
              </p>
            </div>
          </div>

          {/* Context Information */}
          {contextInfo && (
            <div className={`mb-4 p-4 rounded-lg border-2 ${
              contextInfo.type === 'depot' 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-teal-50 border-teal-200'
            }`}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  contextInfo.type === 'depot' 
                    ? 'bg-purple-100' 
                    : 'bg-teal-100'
                }`}>
                  {contextInfo.type === 'depot' ? (
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${
                    contextInfo.type === 'depot' ? 'text-purple-800' : 'text-teal-800'
                  }`}>
                    {contextInfo.type === 'depot' ? 'Dépôt' : 'Magasin'}: {contextInfo.name}
                  </p>
                  <p className={`text-sm ${
                    contextInfo.type === 'depot' ? 'text-purple-600' : 'text-teal-600'
                  }`}>
                    {contextInfo.location && `📍 ${contextInfo.location}`}
                  </p>
                </div>
              </div>
            </div>
          )}
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: 1500"
              />
              <p className="text-xs text-gray-500 mt-1">Prix de référence pour la vente (obligatoire)</p>
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL Image (optionnel)</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                placeholder="https://..."
              />
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ajout...
                  </div>
                ) : (
                  contextInfo?.type === 'depot' ? 'Ajouter Article au Dépôt' : 'Ajouter Article au Magasin'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}