import React, { memo, useMemo } from 'react'

/**
 * Composant StatCard optimisé avec React.memo
 * @param {string} title - Titre de la statistique
 * @param {string|number} value - Valeur de la statistique
 * @param {string} icon - Icône à afficher
 * @param {string} color - Couleur du gradient
 * @param {string} description - Description de la statistique
 * @param {Function} onClick - Fonction appelée lors du clic
 */
const OptimizedStatCard = memo(({ 
  title, 
  value, 
  icon, 
  color = 'teal', 
  description, 
  onClick 
}) => {
  // Mémoriser les classes CSS pour éviter les recalculs
  const gradientClasses = useMemo(() => {
    const gradients = {
      teal: 'from-teal-500 to-teal-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      gray: 'from-gray-500 to-gray-600'
    }
    return gradients[color] || gradients.teal
  }, [color])

  const iconClasses = useMemo(() => {
    const iconSizes = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    }
    return iconSizes.md
  }, [])

  return (
    <div 
      className={`bg-gradient-to-r ${gradientClasses} text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer min-h-[120px] flex flex-col justify-center`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-white/70 text-xs mt-1">{description}</p>
          )}
        </div>
        <div className="bg-white/20 rounded-full p-3">
          <span className={`${iconClasses} text-white`}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  )
})

OptimizedStatCard.displayName = 'OptimizedStatCard'

export default OptimizedStatCard
