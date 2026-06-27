const variants = {
  primary:   'bg-atlantic-navy text-soft-butter hover:bg-classic-navy',
  secondary: 'bg-powder text-atlantic-navy hover:bg-denim/20',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  ghost:     'text-denim hover:text-atlantic-navy hover:bg-powder',
}

export function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
