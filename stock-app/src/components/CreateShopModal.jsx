import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'

export default function CreateShopModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    phone2: '',
    email: '',
    type: 'magasin',
    linkedDepotIds: []
  })
  const [depots, setDepots] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'depots'), orderBy('name')),
      (snapshot) => {
        setDepots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }
    )
    return unsubscribe
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const shopData = {
        name: formData.name,
        location: formData.location,
        phone: formData.phone,
        phone2: formData.phone2,
        email: formData.email,
        type: formData.type,
        created_at: new Date(),
        updated_at: new Date()
      }

      // Ajouter les IDs des dépôts liés si c'est un magasin
      if (formData.type === 'magasin' && formData.linkedDepotIds.length > 0) {
        shopData.linkedDepotIds = formData.linkedDepotIds
      }

      // Créer le magasin
      const shopDoc = await addDoc(collection(db, 'shops'), shopData)

      // Mettre à jour les dépôts pour ajouter l'ID du magasin
      if (formData.type === 'magasin' && formData.linkedDepotIds.length > 0) {
        for (const depotId of formData.linkedDepotIds) {
          const depotRef = doc(db, 'depots', depotId)
          await updateDoc(depotRef, {
            linkedShopIds: arrayUnion(shopDoc.id),
            updated_at: new Date()
          })
        }
      }
      onClose()
    } catch (error) {
      console.error('Erreur lors de la création du magasin:', error)
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleDepotToggle = (depotId) => {
    setFormData(prev => ({
      ...prev,
      linkedDepotIds: prev.linkedDepotIds.includes(depotId)
        ? prev.linkedDepotIds.filter(id => id !== depotId)
        : [...prev.linkedDepotIds, depotId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Nouveau Magasin</h3>
              <p className="text-sm text-gray-600">Créer un magasin</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du magasin</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: Magasin Central, Magasin du Port..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Localisation</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: Moroni - Hadoudja, Anjouan - Mutsamudu..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: +269 XXX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone 2 (optionnel)</label>
              <input
                type="tel"
                name="phone2"
                value={formData.phone2}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: +269 XXX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: contact@magasin.com"
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

            {/* Sélection des dépôts liés */}
            {depots.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dépôts liés (optionnel)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {depots.map(depot => (
                    <label key={depot.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.linkedDepotIds.includes(depot.id)}
                        onChange={() => handleDepotToggle(depot.id)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{depot.name}</span>
                      <span className="text-xs text-gray-500">({depot.location})</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez les dépôts qui fourniront ce magasin
                </p>
              </div>
            )}

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
                    Création...
                  </div>
                ) : (
                  'Créer Magasin'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}