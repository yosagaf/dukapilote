import { useState, useCallback, useEffect } from 'react'

/**
 * Hook personnalisé pour la gestion des formulaires
 * @param {Object} initialValues - Valeurs initiales du formulaire
 * @param {Function} validationSchema - Schéma de validation (optionnel)
 * @param {Function} onSubmit - Fonction de soumission
 * @returns {Object} { values, errors, isValid, handleChange, handleSubmit, reset, setValues }
 */
export const useForm = (initialValues = {}, validationSchema = null, onSubmit = null) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState({})

  // Validation en temps réel
  useEffect(() => {
    if (validationSchema) {
      const newErrors = {}
      Object.keys(values).forEach(field => {
        if (touched[field] && validationSchema[field]) {
          const error = validationSchema[field](values[field], values)
          if (error) {
            newErrors[field] = error
          }
        }
      })
      setErrors(newErrors)
    }
  }, [values, touched, validationSchema])

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const validate = useCallback(() => {
    if (!validationSchema) return true

    const newErrors = {}
    Object.keys(validationSchema).forEach(field => {
      const error = validationSchema[field](values[field], values)
      if (error) {
        newErrors[field] = error
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validationSchema])

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()
    
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(values)
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setFieldValue,
    setFieldError,
    validate
  }
}

/**
 * Hook pour la gestion des formulaires avec validation avancée
 * @param {Object} config - Configuration du formulaire
 * @returns {Object} État et fonctions du formulaire
 */
export const useAdvancedForm = (config = {}) => {
  const {
    initialValues = {},
    validationSchema = null,
    onSubmit = null,
    onReset = null,
    validateOnChange = true,
    validateOnBlur = true
  } = config

  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Validation en temps réel
  useEffect(() => {
    if (validateOnChange && validationSchema) {
      const newErrors = {}
      Object.keys(values).forEach(field => {
        if (touched[field] && validationSchema[field]) {
          const error = validationSchema[field](values[field], values)
          if (error) {
            newErrors[field] = error
          }
        }
      })
      setErrors(newErrors)
    }
  }, [values, touched, validationSchema, validateOnChange])

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    setIsDirty(true)
  }, [])

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    if (validateOnBlur && validationSchema?.[field]) {
      const error = validationSchema[field](values[field], values)
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }))
      } else {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }
  }, [values, validationSchema, validateOnBlur])

  const validate = useCallback(() => {
    if (!validationSchema) return true

    const newErrors = {}
    Object.keys(validationSchema).forEach(field => {
      const error = validationSchema[field](values[field], values)
      if (error) {
        newErrors[field] = error
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validationSchema])

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()
    
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(values)
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setIsDirty(false)
    if (onReset) {
      onReset()
    }
  }, [initialValues, onReset])

  const setFieldValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setFieldValue,
    setFieldError,
    validate
  }
}
