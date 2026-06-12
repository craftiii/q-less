const colors = {
  blue:   'bg-brand-100 text-brand-700',
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-gray-100 text-gray-600',
}

export function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}
