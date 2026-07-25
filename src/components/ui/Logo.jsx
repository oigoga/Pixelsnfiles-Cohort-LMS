export function Logo({ size = 'md', theme = 'dark' }) {
  const sizes = {
    sm:  'text-lg',
    md:  'text-xl',
    lg:  'text-3xl',
    xl:  'text-4xl',
  }
  const navy = theme === 'dark' ? 'text-atlantic-navy' : 'text-soft-butter'

  return (
    <span className={`font-sans font-bold tracking-[-0.04em] ${sizes[size]}`}>
      <span className={navy}>pixels</span>
      <span className="text-honeycomb">n</span>
      <span className={navy}>files</span>
      <span className="text-honeycomb">.</span>
    </span>
  )
}
