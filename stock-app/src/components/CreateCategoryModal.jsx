import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function CreateCategoryModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 1,
    color: 'blue',
    icon: 'tag'
  })

  const predefinedCategories = [
    { name: 'Sanitaire', description: 'Produits sanitaires et d\'hygiène', color: 'green', icon: 'droplet' },
    { name: 'Plomberie', description: 'Équipements et outils de plomberie', color: 'blue', icon: 'wrench' },
    { name: 'Batterie', description: 'Batteries et accumulateurs', color: 'yellow', icon: 'battery' },
    { name: 'Électricité', description: 'Matériel électrique et électronique', color: 'orange', icon: 'lightning' },
    { name: 'Meuble', description: 'Mobilier et ameublement', color: 'brown', icon: 'home' },
    { name: 'Alimentation', description: 'Produits alimentaires', color: 'green', icon: 'apple' },
    { name: 'Vêtements', description: 'Textiles et habillement', color: 'purple', icon: 'shirt' },
    { name: 'Électroménager', description: 'Appareils électroménagers', color: 'gray', icon: 'microwave' }
  ]

  const colors = [
    { name: 'Bleu', value: 'blue' },
    { name: 'Vert', value: 'green' },
    { name: 'Rouge', value: 'red' },
    { name: 'Jaune', value: 'yellow' },
    { name: 'Orange', value: 'orange' },
    { name: 'Violet', value: 'purple' },
    { name: 'Rose', value: 'pink' },
    { name: 'Gris', value: 'gray' },
    { name: 'Marron', value: 'brown' }
  ]

  const icons = [
    { name: 'Tag', value: 'tag' },
    { name: 'Goutte', value: 'droplet' },
    { name: 'Clé', value: 'wrench' },
    { name: 'Batterie', value: 'battery' },
    { name: 'Éclair', value: 'lightning' },
    { name: 'Maison', value: 'home' },
    { name: 'Pomme', value: 'apple' },
    { name: 'T-shirt', value: 'shirt' },
    { name: 'Micro-onde', value: 'microwave' }
  ]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await addDoc(collection(db, 'categories'), {
        ...formData,
        order: Number(formData.order),
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      onClose()
    } catch (error) {
      setError('Erreur lors de la création de la catégorie: ' + error.message)
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const selectPredefinedCategory = (category) => {
    setFormData({
      ...formData,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon
    })
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Nouvelle Catégorie</h3>
              <p className="text-sm text-gray-600">Créer une catégorie de produits</p>
            </div>
          </div>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Catégories prédéfinies */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Catégories suggérées</h4>
            <div className="grid grid-cols-2 gap-2">
              {predefinedCategories.map((category, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectPredefinedCategory(category)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border hover:border-purple-300"
                >
                  <p className="text-sm font-medium text-gray-900">{category.name}</p>
                  <p className="text-xs text-gray-500 truncate">{category.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 p-2 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600">
                Cliquez sur une catégorie pour pré-remplir le formulaire
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Personnaliser la catégorie</h4>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la catégorie</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: Électroménager, Vêtements..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Description des produits de cette catégorie..."
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ordre d'affichage</label>
              <input
                type="number"
                name="order"
                min="1"
                value={formData.order}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="1"
              />
            </div>

            {/* Sélection de couleur */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur</label>
              <div className="grid grid-cols-5 gap-2">
                {colors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({...formData, color: color.value})}
                    className={`w-full h-10 rounded-lg border-2 transition-all duration-200 ${
                      formData.color === color.value
                        ? 'border-gray-400 ring-2 ring-purple-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor:
                      color.value === 'blue' ? '#3B82F6' :
                      color.value === 'green' ? '#10B981' :
                      color.value === 'red' ? '#EF4444' :
                      color.value === 'yellow' ? '#F59E0B' :
                      color.value === 'orange' ? '#F97316' :
                      color.value === 'purple' ? '#8B5CF6' :
                      color.value === 'pink' ? '#EC4899' :
                      color.value === 'gray' ? '#6B7280' :
                      color.value === 'brown' ? '#92400E' : '#3B82F6'
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Sélection d'icône */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Icône</label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                {icons.map(icon => (
                  <option key={icon.value} value={icon.value}>
                    {icon.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/95 text-purple-600 border border-purple-100 shadow-sm py-3 px-4 rounded-lg hover:bg-purple-50 hover:border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création...
                  </div>
                ) : (
                  'Créer Catégorie'
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}