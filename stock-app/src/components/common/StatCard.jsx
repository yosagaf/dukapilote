export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  gradient = 'blue',
  className = ''
}) {
  const gradients = {
    primary: 'from-teal-50 to-teal-100 border-teal-200',
    secondary: 'from-cyan-50 to-cyan-100 border-cyan-200',
    success: 'from-green-50 to-green-100 border-green-200',
    warning: 'from-amber-50 to-amber-100 border-amber-200',
    danger: 'from-red-50 to-red-100 border-red-200',
    info: 'from-blue-50 to-blue-100 border-blue-200',
    // Legacy support
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
    teal: 'from-teal-50 to-teal-100 border-teal-200'
  }

  const iconColors = {
    primary: 'bg-teal-600',
    secondary: 'bg-cyan-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',
    // Legacy support
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    teal: 'bg-teal-600'
  }

  const textColors = {
    primary: 'text-teal-900',
    secondary: 'text-cyan-900',
    success: 'text-green-900',
    warning: 'text-amber-900',
    danger: 'text-red-900',
    info: 'text-blue-900',
    // Legacy support
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900',
    teal: 'text-teal-900'
  }

  const subtitleColors = {
    primary: 'text-teal-700',
    secondary: 'text-cyan-700',
    success: 'text-green-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
    info: 'text-blue-700',
    // Legacy support
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
    teal: 'text-teal-700'
  }

  return (
    <div className={`bg-gradient-to-r ${gradients[gradient]} border p-4 lg:p-6 rounded-xl h-24 lg:h-auto ${className}`}>
      <div className="flex items-center h-full">
        <div className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 ${iconColors[gradient]} rounded-xl mr-3 lg:mr-4 flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xl lg:text-2xl font-bold ${textColors[gradient]} truncate`}>
            {value}
          </p>
          <p className={`text-xs lg:text-sm ${subtitleColors[gradient]}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`text-xs ${subtitleColors[gradient]} mt-1`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}