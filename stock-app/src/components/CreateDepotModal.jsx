import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'

export default function CreateDepotModal({ onClose }) {
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
        type: 'depot',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }

      // Ajouter les IDs des magasins liés si il y en a
      if (formData.linkedShopIds.length > 0) {
        depotData.linkedShopIds = formData.linkedShopIds
      }

      // Créer le dépôt
      const depotDoc = await addDoc(collection(db, 'depots'), depotData)

      // Mettre à jour les magasins pour ajouter l'ID du dépôt
      if (formData.linkedShopIds.length > 0) {
        for (const shopId of formData.linkedShopIds) {
          const shopRef = doc(db, 'shops', shopId)
          await updateDoc(shopRef, {
            linkedDepotIds: arrayUnion(depotDoc.id),
            updated_at: new Date()
          })
        }
      }

      onClose()
    } catch (error) {
      setError('Erreur lors de la création du dépôt: ' + error.message)
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
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Nouveau Dépôt</h3>
              <p className="text-sm text-gray-600">Créer un entrepôt de stockage</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du dépôt *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: Dépôt Central Moroni"
              />
            </div>

            {/* Location field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Localisation *
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: Moroni - Hadoudja"
              />
            </div>

            {/* Manager field */}
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
                placeholder="Nom du responsable du dépôt"
              />
            </div>

            {/* Description field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Description du dépôt et de son utilisation..."
                rows="3"
              />
            </div>

            {/* Date de création (lecture seule) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date de création
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-600">
                {new Date().toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cette date sera automatiquement enregistrée lors de la création
              </p>
            </div>

            {/* Sélection des dukanis liés */}
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
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez les dukanis qui utiliseront ce dépôt
                </p>
              </div>
            )}

            {/* Action buttons */}
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
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
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
                  'Créer Dépôt'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}