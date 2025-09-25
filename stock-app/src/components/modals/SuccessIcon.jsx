import React from 'react'

const SuccessIcon = () => (
  <div className="relative">
    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    {/* Animated success ring */}
    <div className="absolute inset-0 w-16 h-16 border-4 border-green-200 rounded-full animate-ping opacity-20"></div>
  </div>
)

export default SuccessIcon

