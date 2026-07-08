import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/review', label: 'Peer Review' },
  { to: '/student/group', label: 'Group Hub' },
]

export default function StudentLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-powder px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="font-sans font-bold text-xl tracking-[-0.04em] text-atlantic-navy">
          pixelsn<span className="text-honeycomb">f</span>iles<span className="text-honeycomb">.</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-atlantic-navy text-soft-butter'
                    : 'text-denim hover:text-atlantic-navy hover:bg-powder'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-denim hidden sm:block">{profile?.full_name || profile?.email}</span>
          <button
            onClick={signOut}
            className="text-xs text-denim border border-powder rounded-lg px-3 py-1.5 hover:border-denim transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile nav */}
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
