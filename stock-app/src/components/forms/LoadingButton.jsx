import React from 'react'

const LoadingButton = ({ 
  loading, 
  loadingText, 
  children, 
  className = '',
  ...props 
}) => (
  <button
    disabled={loading}
    className={`flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium ${className}`}
    {...props}
  >
    {loading ? (
      <div className="flex items-center justify-center">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {loadingText}
      </div>
    ) : (
      children
    )}
  </button>
)

export default LoadingButton

