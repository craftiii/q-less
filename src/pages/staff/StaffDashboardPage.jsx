import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { useAuthStore } from '../../store/authStore.js'
import { advanceQueue, removeFromQueue } from '../../services/queueService.js'
import { getStaffStats } from '../../services/statsService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { calcWaitTime } from '../../utils/timeCalculator.js'
import { QUEUE_STATUS } from '../../config/constants.js'

const FILTER_ALL  = 'all'
const FILTER_MINE = 'mine'

export default function StaffDashboardPage() {
  const { staffProfile } = useAuthStore()
  const navigate = useNavigate()

  const [entries, setEntries]   = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState(FILTER_MINE)
  const [toast, setToast]       = useState(null)

  const providerId = staffProfile?.provider_id
  const staffId    = staffProfile?.id

  async function loadQueue() {
    if (!providerId) return
    const { data } = await supabase
      .from('queue_entries')
      .select('*, services(name, duration_min, buffer_min), staff(id, name, color)')
      .eq('provider_id', providerId)
      .in('status', ['waiting', 'in_service'])
      .order('position')
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadQueue()
    getStaffStats(staffId).then(setStats).catch(() => {})

    const channel = supabase
      .channel(`staff-full-queue:${providerId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_entries',
        filter: `provider_id=eq.${providerId}`,
      }, loadQueue)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [providerId, staffId])

  // Unique service names in queue for service-filter chips
  const serviceFilters = useMemo(() => {
    const names = [...new Set(entries.map(e => e.services?.name).filter(Boolean))]
    return names
  }, [entries])

  const filtered = useMemo(() => {
    if (filter === FILTER_MINE) return entries.filter(e => e.staff_id === staffId)
    if (filter === FILTER_ALL)  return entries
    return entries.filter(e => e.services?.name === filter)
  }, [entries, filter, staffId])

  const current = filtered.find(e => e.status === QUEUE_STATUS.IN_SERVICE)
  const waiting = filtered.filter(e => e.status === QUEUE_STATUS.WAITING)

  // For "Fertig — Nächster": always advance own lane
  const myCurrentEntry = entries.find(e => e.staff_id === staffId && e.status === QUEUE_STATUS.IN_SERVICE)

  async function handleNext() {
    try {
      await advanceQueue(providerId, staffId)
      setToast({ message: 'Nächster Kunde wird gerufen', type: 'success' })
    } catch {
      setToast({ message: 'Fehler beim Weiterschalten', type: 'error' })
    }
  }

  async function handleNoShow(entryId) {
    try {
      await removeFromQueue(entryId)
      setToast({ message: 'Kunde entfernt', type: 'success' })
    } catch {
      setToast({ message: 'Fehler', type: 'error' })
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>

  return (
    <AppShell>
      <Header
        title={staffProfile?.name || 'Meine Queue'}
        right={
          <div className="flex gap-3">
            <button onClick={() => navigate('/staff/profile')} className="text-sm text-blue-400">Profil</button>
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-400">Abmelden</button>
          </div>
        }
      />

      <div className="p-4 space-y-4">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <Card className="text-center py-2.5">
              <p className="text-xl font-bold">{stats.todayDone}</p>
              <p className="text-xs text-gray-400 mt-0.5">Heute</p>
            </Card>
            <Card className="text-center py-2.5">
              <p className="text-xl font-bold">{stats.weekDone}</p>
              <p className="text-xs text-gray-400 mt-0.5">Diese Woche</p>
            </Card>
            <Card className="text-center py-2.5">
              <p className="text-xl font-bold">{stats.avgWaitMin ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Ø Min.</p>
            </Card>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: FILTER_MINE, label: 'Meine' },
            { key: FILTER_ALL,  label: 'Alle' },
            ...serviceFilters.map(s => ({ key: s, label: s })),
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0 ${
                filter === key
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              {label}
              {key === FILTER_MINE && ` (${entries.filter(e => e.staff_id === staffId).length})`}
              {key === FILTER_ALL  && ` (${entries.length})`}
            </button>
          ))}
        </div>

        {/* Current customer */}
        {current ? (
          <Card className="border border-blue-500/30 bg-blue-500/5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Badge variant="info">Aktuell{current.staff_id !== staffId ? ` · ${current.staff?.name}` : ''}</Badge>
                <p className="font-semibold mt-1">{current.services?.name}</p>
                <p className="text-sm text-gray-400">{current.services?.duration_min} Min.</p>
              </div>
              <Badge variant="success">Dran</Badge>
            </div>
            {myCurrentEntry && (
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleNext}>Fertig — Nächster</Button>
                <Button variant="ghost" className="text-red-400" onClick={() => handleNoShow(myCurrentEntry.id)}>
                  No-Show
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="text-center py-5">
            <p className="text-gray-400 text-sm">Kein aktiver Kunde</p>
            {entries.filter(e => e.staff_id === staffId && e.status === 'waiting').length > 0 && (
              <Button className="mt-3" onClick={handleNext}>Ersten rufen</Button>
            )}
          </Card>
        )}

        {/* Waiting list */}
        {waiting.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">
              Warteschlange · {waiting.length} wartend
            </p>
            <div className="space-y-2">
              {waiting.map(entry => (
                <Card key={entry.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-gray-500 w-5 shrink-0">{entry.position}</span>
                      {entry.staff && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: entry.staff.color }}
                          title={entry.staff.name}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium leading-tight">{entry.services?.name}</p>
                        <p className="text-xs text-gray-400">
                          {entry.staff_id === staffId ? 'Deine Lane' : entry.staff?.name || 'Pool'}
                          {' · '}~{calcWaitTime(entries, entry.position)} Min.
                        </p>
                      </div>
                    </div>
                    {entry.staff_id === staffId && (
                      <button
                        onClick={() => handleNoShow(entry.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 shrink-0"
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">☕</p>
            <p className="text-sm">
              {filter === FILTER_MINE ? 'Keine Kunden in deiner Lane' : 'Keine Kunden in der Warteschlange'}
            </p>
          </div>
        )}

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  )
}
