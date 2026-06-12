import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getEntry, cancelEntry } from '../../services/queueService.js'
import { useCustomerQueue } from '../../hooks/useCustomerQueue.js'
import { useWaitTime } from '../../hooks/useWaitTime.js'
import { useGeolocation } from '../../hooks/useGeolocation.js'
import { useNotification } from '../../hooks/useNotification.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { QueuePosition } from '../../components/queue/QueuePosition.jsx'
import { WaitTimeBadge } from '../../components/queue/WaitTimeBadge.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { GPS_STATE, QUEUE_STATUS } from '../../config/constants.js'
import { useGeoStore } from '../../store/geoStore.js'

function requestBrowserNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  }
}

export default function QueueStatusPage() {
  const { customerToken } = useParams()
  const [entry, setEntry] = useState(null)
  const [gpsEnabled, setGpsEnabled] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [alertBanner, setAlertBanner] = useState(false)
  const prevStaffId = useRef(null)
  const { gpsState } = useGeoStore()

  useEffect(() => {
    requestBrowserNotificationPermission()

    const refresh = () =>
      getEntry(customerToken).then(e => {
        if (prevStaffId.current !== null && prevStaffId.current !== e?.staff_id) {
          sendBrowserNotification(
            'Deine Buchung wurde angepasst',
            'Du wurdest einem anderen Mitarbeiter zugewiesen.',
          )
        }
        prevStaffId.current = e?.staff_id ?? null
        setEntry(e)
      }).catch(console.error)

    refresh()
    const timer = setInterval(refresh, 10_000)
    return () => clearInterval(timer)
  }, [customerToken])

  useCustomerQueue(entry?.provider_id)
  useGeolocation(gpsEnabled)
  const waitMin = useWaitTime(entry?.position, entry?.staff_id ?? null)
  useNotification({
    waitTimeMin: waitMin,
    customerToken,
    alertSent: entry?.alert_sent,
    providerLat: null,
    providerLng: null,
    onAlert: () => setAlertBanner(true),
  })

  async function handleCancel() {
    setCancelling(true)
    await cancelEntry(customerToken)
    setCancelled(true)
    setCancelling(false)
  }

  if (cancelled) return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <p className="text-4xl">👋</p>
        <p className="text-lg font-semibold">Du hast dich ausgereiht.</p>
        <p className="text-sm text-gray-500">Bis zum nächsten Mal!</p>
      </div>
    </AppShell>
  )

  if (!entry) return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>

  if (entry.status === QUEUE_STATUS.IN_SERVICE) return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <p className="text-6xl">🔔</p>
        <h1 className="text-2xl font-bold">Du bist dran!</h1>
        {entry.staff?.name && (
          <p className="text-gray-500">Bitte zu <strong>{entry.staff.name}</strong> kommen.</p>
        )}
        <p className="text-gray-400 text-sm">Bitte begib dich jetzt zum Schalter.</p>
      </div>
    </AppShell>
  )

  if (entry.status === QUEUE_STATUS.DONE || entry.status === QUEUE_STATUS.CANCELLED) return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <p className="text-4xl">✅</p>
        <p className="text-lg font-semibold">Alles erledigt.</p>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <Header title="Deine Wartemarke" />
      <div className="flex-1 p-4 space-y-4 pb-6">
        {alertBanner && (
          <div className="bg-brand-500 text-white rounded-2xl p-4 text-center space-y-1 animate-pulse">
            <p className="font-bold">Du bist gleich dran!</p>
            <p className="text-sm opacity-90">Mach dich auf den Weg.</p>
          </div>
        )}
        <QueuePosition position={entry.position} />

        <div className="flex justify-center">
          <WaitTimeBadge minutes={waitMin} />
        </div>

        <Card>
          <p className="text-xs text-gray-400 mb-0.5">Leistung</p>
          <p className="font-medium text-sm">{entry.services?.name}</p>
        </Card>

        {entry.staff_id && (
          <Card>
            <p className="text-xs text-gray-400 mb-0.5">Mitarbeiter</p>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: entry.staff?.color ?? '#0ea5e9' }}
              >
                {(entry.staff?.name ?? '?').charAt(0).toUpperCase()}
              </div>
              <p className="font-medium text-sm">{entry.staff?.name ?? '—'}</p>
            </div>
          </Card>
        )}

        {gpsState === GPS_STATE.OFF && !gpsEnabled && (
          <Card className="border-brand-100 bg-brand-50">
            <p className="text-sm text-gray-700 mb-3">
              GPS aktivieren für rechtzeitige Benachrichtigung wenn du unterwegs bist.
            </p>
            <Button variant="secondary" onClick={() => setGpsEnabled(true)}>
              GPS aktivieren
            </Button>
          </Card>
        )}

        {gpsState === GPS_STATE.PRECISE && (
          <p className="text-xs text-center text-green-600">GPS aktiv — wir benachrichtigen dich rechtzeitig.</p>
        )}
        {gpsState === GPS_STATE.COARSE && (
          <p className="text-xs text-center text-yellow-600">GPS ungenau — zeitbasierte Benachrichtigung aktiv.</p>
        )}

        <div className="pt-4">
          <Button variant="secondary" className="w-full" disabled={cancelling} onClick={handleCancel}>
            {cancelling ? <Spinner size="sm" /> : 'Ausreihen / Abbrechen'}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
