import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/coach/overview', label: 'Overview' },
  { to: '/coach/risk', label: 'Risk Board' },
  { to: '/coach/verify', label: 'Verify Queue' },
  { to: '/coach/modules', label: 'Modules' },
  { to: '/coach/cohort', label: 'Cohort Setup' },
  { to: '/coach/announcements', label: 'Announcements' },
]

export default function CoachLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-soft-butter flex flex-col">
      <header className="bg-atlantic-navy text-soft-butter px-6 py-3 flex items-center justify-between">
        <div className="font-sans font-bold text-xl tracking-[-0.04em]">
          pixelsn<span className="text-honeycomb">f</span>iles<span className="text-honeycomb">.</span>
          <span className="ml-3 text-xs font-normal text-powder/70 tracking-widest uppercase">Coach</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-powder hidden sm:block">{profile?.full_name || profile?.email}</span>
          <button
            onClick={signOut}
            className="text-xs text-powder border border-powder/40 rounded-lg px-3 py-1.5 hover:border-powder transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Sidebar layout on md+ */}
      <div className="flex flex-1">
        <aside className="hidden md:flex flex-col w-52 bg-whipped-cream border-r border-powder py-6 px-3 gap-1 shrink-0">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-atlantic-navy text-soft-butter'
                    : 'text-denim hover:text-classic-navy hover:bg-powder'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        {/* Mobile nav bar */}
        <div className="flex flex-col flex-1 min-w-0">
          <nav className="md:hidden bg-whipped-cream border-b border-powder flex overflow-x-auto">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-atlantic-navy text-atlantic-navy'
                      : 'border-transparent text-denim'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
