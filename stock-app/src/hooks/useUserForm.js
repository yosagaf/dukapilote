import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { validateUserForm, transformFormDataForAPI } from '../utils/modalUtils'
import { ERROR_MESSAGES } from '../constants/modalConstants'

export const useUserForm = (onClose) => {
  const [formData, setFormData] = useState({
    email: '',
    tempPassword: '',
    prenom: '',
    nom: '',
    role: 'shop',
    shopId: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdUserData, setCreatedUserData] = useState(null)
  const { createUserAsAdmin } = useAuth()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate form
    const validationErrors = validateUserForm(formData)
    if (validationErrors.length > 0) {
      setError(validationErrors[0])
      setLoading(false)
      return
    }

    try {
      await createUserAsAdmin(formData.email, formData.tempPassword, 
        transformFormDataForAPI(formData)
      )

      // Show success modal
      setCreatedUserData({
        email: formData.email,
        tempPassword: formData.tempPassword
      })
      setShowSuccessModal(true)
    } catch (error) {
      setError(ERROR_MESSAGES.USER_CREATION_FAILED + error.message)
    }

    setLoading(false)
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    setCreatedUserData(null)
    onClose()
  }

  return {
    formData,
    loading,
    error,
    showSuccessModal,
    createdUserData,
    handleChange,
    handleSubmit,
    handleSuccessModalClose
  }
}

