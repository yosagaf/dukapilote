import React from 'react'

const FormField = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  minLength,
  className = '',
  error,
  children 
}) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
    </label>
    {children || (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
          error 
            ? 'border-red-500 focus:ring-red-500 bg-red-50' 
            : 'border-gray-300 focus:ring-teal-500'
        }`}
      />
    )}
    {error && (
      <p className="mt-1 text-sm text-red-600 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {error}
      </p>
    )}
  </div>
)

export default FormField

