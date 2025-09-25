import { useState, useEffect } from 'react'
import { doc, updateDoc, onSnapshot, query, orderBy, collection } from 'firebase/firestore'
import { db } from '../firebase'

export default function EditDepotModal({ depot, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    manager: '',
    linkedShopIds: []
  })
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (depot) {
      setFormData({
        name: depot.name || '',
        location: depot.location || '',
        description: depot.description || '',
        manager: depot.manager || '',
        linkedShopIds: depot.linkedShopIds || []
      })
    }
  }, [depot])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'shops'), orderBy('name')),
      (snapshot) => {
        const shopsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        // Filtrer seulement les magasins
        const magasins = shopsData.filter(shop => shop.type === 'magasin')
        setShops(magasins)
      }
    )
    return unsubscribe
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const depotData = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        manager: formData.manager,
        linkedShopIds: formData.linkedShopIds,
        updated_at: new Date()
      }

      // Mettre à jour le dépôt
      const depotRef = doc(db, 'depots', depot.id)
      await updateDoc(depotRef, depotData)

      onClose()
    } catch (error) {
      setError('Erreur lors de la mise à jour du dépôt: ' + error.message)
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleShopToggle = (shopId) => {
    setFormData(prev => ({
      ...prev,
      linkedShopIds: prev.linkedShopIds.includes(shopId)
        ? prev.linkedShopIds.filter(id => id !== shopId)
        : [...prev.linkedShopIds, shopId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Modifier le Dépôt</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du Dépôt *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Nom du dépôt"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Localisation *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Localisation du dépôt"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Description du dépôt"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Responsable
              </label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Nom du responsable"
              />
            </div>

            {/* Sélection des magasins liés */}
            {shops.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Magasins liés (optionnel)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {shops.map(shop => (
                    <label key={shop.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.linkedShopIds.includes(shop.id)}
                        onChange={() => handleShopToggle(shop.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{shop.name}</span>
                      <span className="text-xs text-gray-500">({shop.location})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
