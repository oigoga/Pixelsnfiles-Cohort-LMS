export function Card({ children, className = '' }) {
  return (
    <div className={`bg-whipped-cream rounded-2xl border border-powder p-6 ${className}`}>
      {children}
    </div>
  )
}
