const variants = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'hover:bg-gray-100 text-gray-600',
}

export function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
