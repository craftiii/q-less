export function QueuePosition({ position }) {
  return (
    <div className="flex flex-col items-center py-8">
      <p className="text-sm text-gray-500 mb-1">Deine Position</p>
      <div className="text-7xl font-black text-brand-500 leading-none">{position}</div>
    </div>
  )
}
