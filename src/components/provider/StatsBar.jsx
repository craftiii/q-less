import { useEffect, useState } from 'react'
import { getTodayStats } from '../../services/statsService.js'

export function StatsBar({ providerId, refreshKey }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!providerId) return
    getTodayStats(providerId).then(setStats).catch(console.error)
  }, [providerId, refreshKey])

  if (!stats) return null

  return (
    <div className="flex gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 overflow-x-auto shrink-0">
      {[
        { label: 'Heute gesamt', value: stats.total },
        { label: 'Abgeschlossen', value: stats.done },
        { label: 'Ø Wartezeit', value: stats.avgWaitMin != null ? `${stats.avgWaitMin} Min.` : '—' },
        { label: 'Abgebrochen', value: stats.cancelled },
      ].map(({ label, value }) => (
        <div key={label} className="shrink-0 text-center min-w-[72px]">
          <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
          <p className="text-[11px] text-gray-400 leading-tight">{label}</p>
        </div>
      ))}
    </div>
  )
}
