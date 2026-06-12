import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { useAuthStore } from '../../store/authStore.js'
import { advanceQueue, removeFromQueue } from '../../services/queueService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { calcWaitTime } from '../../utils/timeCalculator.js'
import { QUEUE_STATUS } from '../../config/constants.js'

export default function StaffDashboardPage() {
  const { staffProfile } = useAuthStore()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const providerId = staffProfile?.provider_id
  const staffId = staffProfile?.id

  async function load() {
    if (!providerId || !staffId) return
    const { data } = await supabase
      .from('queue_entries')
      .select('*, services(name, duration_min, buffer_min)')
      .eq('provider_id', providerId)
      .eq('staff_id', staffId)
      .in('status', ['waiting', 'in_service'])
      .order('position')
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`staff-queue:${staffId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_entries',
        filter: `staff_id=eq.${staffId}`
      }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [staffId])

  const current = entries.find(e => e.status === QUEUE_STATUS.IN_SERVICE)
  const waiting = entries.filter(e => e.status === QUEUE_STATUS.WAITING)

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

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>

  return (
    <AppShell>
      <Header
        title={staffProfile?.name || 'Meine Queue'}
        right={
          <div className="flex gap-2">
            <button onClick={() => navigate('/staff/profile')} className="text-sm text-blue-400">Profil</button>
            <button onClick={handleSignOut} className="text-sm text-gray-400">Abmelden</button>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center py-3">
            <p className="text-2xl font-bold">{waiting.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Wartend</p>
          </Card>
          <Card className="text-center py-3">
            <p className="text-2xl font-bold">{current ? 1 : 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">In Bearbeitung</p>
          </Card>
        </div>

        {/* Current customer */}
        {current ? (
          <Card className="border border-blue-500/30 bg-blue-500/5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Badge variant="info">Aktuell</Badge>
                <p className="font-semibold mt-1">{current.services?.name}</p>
                <p className="text-sm text-gray-400">{current.services?.duration_min} Min.</p>
              </div>
              <Badge variant="success">Dran</Badge>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleNext}>Fertig — Nächster</Button>
              <Button variant="ghost" className="text-red-400" onClick={() => handleNoShow(current.id)}>No-Show</Button>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-6">
            <p className="text-gray-400 text-sm">Kein aktiver Kunde</p>
            {waiting.length > 0 && (
              <Button className="mt-3" onClick={handleNext}>Ersten rufen</Button>
            )}
          </Card>
        )}

        {/* Waiting list */}
        {waiting.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Warteschlange</p>
            <div className="space-y-2">
              {waiting.map(entry => (
                <Card key={entry.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-400 w-5">{entry.position}</span>
                      <div>
                        <p className="text-sm font-medium">{entry.services?.name}</p>
                        <p className="text-xs text-gray-400">~{calcWaitTime(entries, entry.position)} Min.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNoShow(entry.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                    >
                      Entfernen
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">☕</p>
            <p>Keine Kunden in der Warteschlange</p>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  )
}
