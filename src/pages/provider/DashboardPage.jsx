import { useEffect, useState } from 'react'
import { useProviderStore } from '../../store/providerStore.js'
import { useQueueStore } from '../../store/queueStore.js'
import { useQueue } from '../../hooks/useQueue.js'
import { advanceQueue, removeFromQueue, reassignStaff } from '../../services/queueService.js'
import { getActiveStaff } from '../../services/staffService.js'
import { updateProvider } from '../../services/providerService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { BottomNav } from '../../components/layout/BottomNav.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { StatsBar } from '../../components/provider/StatsBar.jsx'
import { QUEUE_STATUS } from '../../config/constants.js'
import { calcWaitTime } from '../../utils/timeCalculator.js'

function WaitingRow({ entry, laneEntries, staff, onRemove, onReassign }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const wait = calcWaitTime(laneEntries, entry.position)

  return (
    <Card className="py-2.5 relative">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-200 w-5 text-center shrink-0">{entry.position}</span>
          <div>
            <p className="text-sm font-medium leading-tight">{entry.services?.name}</p>
            <p className="text-xs text-gray-400">~{wait} Min.</p>
          </div>
        </div>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 text-lg leading-none"
          aria-label="Optionen"
        >⋯</button>
      </div>

      {menuOpen && (
        <div className="absolute right-3 top-10 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-40">
          {staff.length > 1 && (
            <>
              <p className="text-xs text-gray-400 px-3 py-1">Zuweisen an</p>
              {staff.map(m => (
                m.id !== entry.staff_id && (
                  <button key={m.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => { onReassign(entry.id, m.id); setMenuOpen(false) }}
                  >
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ background: m.color }} />
                    {m.name}
                  </button>
                )
              ))}
              <div className="border-t border-gray-100 my-1" />
            </>
          )}
          <button
            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            onClick={() => { onRemove(entry.id); setMenuOpen(false) }}
          >
            No-Show entfernen
          </button>
        </div>
      )}
    </Card>
  )
}

function StaffLane({ member, entries, allStaff, onNext, onRemove, onReassign }) {
  const inService = entries.find(e => e.status === QUEUE_STATUS.IN_SERVICE)
  const waiting = entries.filter(e => e.status === QUEUE_STATUS.WAITING)
  const [advancing, setAdvancing] = useState(false)

  async function handleNext() {
    setAdvancing(true)
    await onNext(member.id)
    setAdvancing(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: member.color }}>
          {member.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-sm">{member.name}</span>
        <Badge color={waiting.length > 0 ? 'blue' : 'gray'} className="ml-auto">
          {waiting.length} wartend
        </Badge>
      </div>

      {inService ? (
        <Card className="border-l-4" style={{ borderLeftColor: member.color }}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide text-[11px]">Aktuell</p>
              <p className="font-medium text-sm">{inService.services?.name}</p>
              <p className="text-xs text-gray-400">{inService.services?.duration_min} Min.</p>
            </div>
            <Badge color="green">Dran</Badge>
          </div>
          <Button className="w-full text-sm py-2" onClick={handleNext} disabled={advancing}>
            {advancing ? <Spinner size="sm" /> : 'Fertig — Nächster'}
          </Button>
        </Card>
      ) : waiting.length > 0 ? (
        <Card>
          <Button className="w-full text-sm py-2" onClick={handleNext} disabled={advancing}>
            {advancing ? <Spinner size="sm" /> : 'Ersten aufrufen'}
          </Button>
        </Card>
      ) : (
        <Card><p className="text-center text-gray-400 text-sm py-1">Frei</p></Card>
      )}

      {waiting.map(e => (
        <WaitingRow
          key={e.id}
          entry={e}
          laneEntries={entries}
          staff={allStaff}
          onRemove={onRemove}
          onReassign={onReassign}
        />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { provider, setProvider } = useProviderStore()
  const { entries, loading } = useQueueStore()
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useQueue(provider?.id, () => setToast('Neuer Kunde in der Warteschlange'))

  useEffect(() => {
    if (!provider) return
    getActiveStaff(provider.id).then(setStaff).finally(() => setStaffLoading(false))
  }, [provider])

  async function handleNext(staffId) {
    await advanceQueue(provider.id, staffId)
  }

  async function handleRemove(entryId) {
    await removeFromQueue(entryId)
  }

  async function handleReassign(entryId, newStaffId) {
    await reassignStaff(entryId, newStaffId)
  }

  async function handleToggleQueue() {
    const updated = await updateProvider(provider.id, { queue_open: !provider.queue_open })
    setProvider(updated)
  }

  const activeEntries = entries.filter(e =>
    e.status === QUEUE_STATUS.WAITING || e.status === QUEUE_STATUS.IN_SERVICE
  )
  const totalWaiting   = entries.filter(e => e.status === QUEUE_STATUS.WAITING).length
  const totalInService = entries.filter(e => e.status === QUEUE_STATUS.IN_SERVICE).length
  const unassigned     = staff.length > 0
    ? activeEntries.filter(e => !e.staff_id)
    : []

  if (loading || staffLoading) return (
    <AppShell>
      <Header title="Warteschlange" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
      <BottomNav />
    </AppShell>
  )

  return (
    <AppShell>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <Header title="Warteschlange" action={
        <button
          onClick={handleToggleQueue}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            provider?.queue_open !== false
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          }`}
        >
          {provider?.queue_open !== false ? 'Queue offen' : 'Queue gesperrt'}
        </button>
      } />

      <StatsBar providerId={provider?.id} refreshKey={entries.length} />
      <div className="flex-1 p-4 pb-24 overflow-y-auto space-y-6">
        {staff.length > 0 ? (
          <>
            <div className={`grid gap-6 ${staff.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {staff.map(member => (
                <StaffLane
                  key={member.id}
                  member={member}
                  entries={activeEntries.filter(e => e.staff_id === member.id)}
                  allStaff={staff}
                  onNext={handleNext}
                  onRemove={handleRemove}
                  onReassign={handleReassign}
                />
              ))}
            </div>

            {unassigned.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nicht zugewiesen</p>
                {unassigned.map(e => (
                  <WaitingRow
                    key={e.id}
                    entry={e}
                    laneEntries={unassigned}
                    staff={staff}
                    onRemove={handleRemove}
                    onReassign={handleReassign}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Single queue — no staff */
          <div className="space-y-2">
            {activeEntries.filter(e => e.status === QUEUE_STATUS.IN_SERVICE).map(e => (
              <Card key={e.id} className="border-l-4 border-l-brand-500">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide text-[11px]">Aktuell</p>
                    <p className="font-semibold text-sm">{e.services?.name}</p>
                    <p className="text-xs text-gray-400">{e.services?.duration_min} Min.</p>
                  </div>
                  <Badge color="green">In Bearbeitung</Badge>
                </div>
                <Button className="w-full text-sm" onClick={() => handleNext(null)}>
                  Fertig — Nächster
                </Button>
              </Card>
            ))}

            {totalInService === 0 && totalWaiting > 0 && (
              <Button className="w-full" onClick={() => handleNext(null)}>
                Ersten Kunden aufrufen
              </Button>
            )}

            {activeEntries.filter(e => e.status === QUEUE_STATUS.WAITING).map(e => (
              <WaitingRow
                key={e.id}
                entry={e}
                laneEntries={activeEntries}
                staff={[]}
                onRemove={handleRemove}
                onReassign={handleReassign}
              />
            ))}

            {activeEntries.length === 0 && (
              <p className="text-center text-gray-400 py-16">Warteschlange ist leer.</p>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  )
}
