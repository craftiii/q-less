import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/provider',         label: 'Queue',      icon: '👥' },
  { to: '/provider/catalog', label: 'Leistungen', icon: '✂️' },
  { to: '/provider/library', label: 'Bibliothek', icon: '📚' },
  { to: '/provider/staff',   label: 'Team',       icon: '🧑‍🤝‍🧑' },
  { to: '/provider/settings',label: 'Settings',   icon: '⚙️' },
  { to: '/account',          label: 'Konto',      icon: '👤' },
]

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 bg-white border-t border-gray-100 flex">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/provider'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
              isActive ? 'text-brand-500 font-semibold' : 'text-gray-400'
            }`
          }
        >
          <span className="text-xl leading-none">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
