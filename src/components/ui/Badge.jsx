const variants = {
  default:        'bg-powder text-denim',
  success:        'bg-green-100 text-green-800',
  warning:        'bg-honeycomb/20 text-amber-800',
  danger:         'bg-red-100 text-red-700',
  info:           'bg-atlantic-navy/10 text-atlantic-navy',
  honeycomb:      'bg-honeycomb/30 text-amber-900',
}

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
