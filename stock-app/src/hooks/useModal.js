import { useState, useCallback } from 'react'

/**
 * Hook personnalisé pour la gestion des modales
 * @param {boolean} initialOpen - État initial de la modale
 * @returns {Object} { isOpen, openModal, closeModal, toggleModal }
 */
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return { isOpen, openModal, closeModal, toggleModal }
}

/**
 * Hook pour la gestion de plusieurs modales
 * @param {Array} modalNames - Noms des modales à gérer
 * @returns {Object} Objet avec les états et fonctions pour chaque modale
 */
export const useMultipleModals = (modalNames = []) => {
  const [modals, setModals] = useState(
    modalNames.reduce((acc, name) => ({ ...acc, [name]: false }), {})
  )

  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }))
  }, [])

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }))
  }, [])

  const toggleModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: !prev[modalName] }))
  }, [])

  const closeAllModals = useCallback(() => {
    setModals(modalNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}))
  }, [modalNames])

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals
  }
}
