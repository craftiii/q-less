export function Header({ title, action }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      {action && <div>{action}</div>}
    </header>
  )
}
