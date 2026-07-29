export function StudentName({ name, track, className = '' }) {
  if (track === 'marketing') {
    return (
      <span className={`inline-block bg-powder text-atlantic-navy font-medium px-2.5 py-0.5 rounded-full ${className}`}>
        {name}
      </span>
    )
  }
  if (track === 'design') {
    return (
      <span className={`inline-block bg-whipped-cream text-classic-navy font-medium px-2.5 py-0.5 rounded-full ${className}`}>
        {name}
      </span>
    )
  }
  return <span className={`font-medium text-classic-navy ${className}`}>{name}</span>
}
