export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-powder/70 p-6 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
