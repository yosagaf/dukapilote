import { forwardRef } from 'react'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary: 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 focus:ring-teal-500 shadow-sm hover:shadow-md transform hover:scale-105',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500 shadow-sm hover:shadow-md transform hover:scale-105',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-sm hover:shadow-md transform hover:scale-105',
    warning: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 focus:ring-amber-500 shadow-sm hover:shadow-md transform hover:scale-105',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-sm hover:shadow-md transform hover:scale-105',
    info: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-sm hover:shadow-md transform hover:scale-105',
    purple: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-500 shadow-sm hover:shadow-md transform hover:scale-105',
    outline: 'border-2 border-teal-300 text-teal-700 bg-white hover:bg-teal-50 hover:border-teal-400 focus:ring-teal-500 shadow-sm hover:shadow-md',
    ghost: 'text-teal-700 hover:bg-teal-100 focus:ring-teal-500',
    link: 'text-teal-600 hover:text-teal-800 underline-offset-4 hover:underline focus:ring-teal-500'
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  const disabledStyles = 'opacity-50 cursor-not-allowed transform-none hover:scale-100'
  const fullWidthStyles = fullWidth ? 'w-full' : ''

  const buttonClasses = [
    baseStyles,
    variants[variant],
    sizes[size],
    disabled || loading ? disabledStyles : '',
    fullWidthStyles,
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}

      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2 flex-shrink-0">
          {icon}
        </span>
      )}

      <span>{children}</span>

      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2 flex-shrink-0">
          {icon}
        </span>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button