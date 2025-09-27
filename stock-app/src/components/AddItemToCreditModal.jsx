import { useState } from 'react'
import Modal from './common/Modal'
import Button from './common/Button'

export default function AddItemToCreditModal({ isOpen, onClose, onAddItems, items, selectedItems = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItemIds, setSelectedItemIds] = useState([])

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleItemSelect = (item) => {
    const isSelected = selectedItemIds.includes(item.id)
    if (isSelected) {
      setSelectedItemIds(prev => prev.filter(id => id !== item.id))
    } else {
      setSelectedItemIds(prev => [...prev, item.id])
    }
  }

  const handleAddSelected = () => {
    const selectedItemsData = filteredItems.filter(item => selectedItemIds.includes(item.id))
    onAddItems(selectedItemsData)
    setSelectedItemIds([])
    setSearchTerm('')
  }

  const handleClose = () => {
    setSelectedItemIds([])
    setSearchTerm('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajouter des Articles">
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && filteredItems.every(item => selectedItemIds.includes(item.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItemIds(filteredItems.map(item => item.id))
                      } else {
                        setSelectedItemIds([])
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.id)
                const isAlreadySelected = selectedItems.some(selected => selected.itemId === item.id)
                
                return (
                  <tr
                    key={item.id}
                    onClick={() => !isAlreadySelected && handleItemSelect(item)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isAlreadySelected 
                        ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                        : isSelected 
                          ? 'bg-blue-50 hover:bg-blue-100' 
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isAlreadySelected}
                        onChange={() => !isAlreadySelected && handleItemSelect(item)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {item.name}
                        {isAlreadySelected && (
                          <span className="ml-2 text-xs text-gray-500">(déjà sélectionné)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-sm font-medium ${
                        item.quantity > 10 ? 'text-green-600' : 
                        item.quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm font-medium text-gray-900">
                        {item.price?.toLocaleString('fr-FR')} KMF
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Items Summary */}
        {selectedItemIds.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedItemIds.length} article(s) sélectionné(s)
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={handleClose}
            variant="secondary"
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddSelected}
            disabled={selectedItemIds.length === 0}
            variant="primary"
          >
            Ajouter {selectedItemIds.length} article(s)
          </Button>
        </div>
      </div>
    </Modal>
  )
}
