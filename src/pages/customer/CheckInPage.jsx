import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProviderByQrToken } from '../../services/providerService.js'
import { getServices } from '../../services/catalogService.js'
import { getActiveStaff, getShortestQueueStaff } from '../../services/staffService.js'
import { createEntry } from '../../services/queueService.js'
import { getOrCreateCustomerToken } from '../../utils/qrCodeHelper.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function CheckInPage() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const [provider, setProvider] = useState(null)
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState(null) // null = auto
  const [step, setStep] = useState('service') // 'service' | 'staff'
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProviderByQrToken(qrToken)
      .then(async p => {
        setProvider(p)
        const [svcs, stf] = await Promise.all([getServices(p.id), getActiveStaff(p.id)])
        setServices(svcs)
        setStaff(stf)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [qrToken])

  const needsStaffStep = staff.length > 0 && provider?.staff_assignment === 'customer_choice'

  function handleServiceSelect(serviceId) {
    setSelectedService(serviceId)
    if (needsStaffStep) setStep('staff')
  }

  async function handleCheckIn() {
    setSubmitting(true)
    try {
      const token = getOrCreateCustomerToken()
      let staffId = selectedStaff

      // Only auto-assign when mode is explicitly 'auto' — 'Egal' stays unassigned until a staff member pulls
      if (staff.length > 0 && !staffId && provider?.staff_assignment === 'auto') {
        staffId = await getShortestQueueStaff(provider.id)
      }

      await createEntry({
        providerId: provider.id,
        serviceId: selectedService,
        customerToken: token,
        staffId,
      })
      navigate(`/status/${token}`)
    } catch (e) {
      setError(e)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>
  if (error) return <div className="p-6 text-red-600 text-sm break-all">Fehler: {error?.message ?? String(error)}</div>
  if (provider?.queue_open === false) return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-4xl">🔒</p>
        <h1 className="text-xl font-bold">{provider.name}</h1>
        <p className="text-gray-500">Die Warteschlange ist aktuell geschlossen. Bitte komm später wieder.</p>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <Header title={provider?.name ?? 'Einreihen'} />
      <div className="flex-1 p-4 space-y-3 overflow-y-auto pb-6">

        {/* Step: Service */}
        {step === 'service' && (
          <>
            <p className="text-sm text-gray-500">Wähle eine Leistung:</p>
            {services.map(s => (
              <Card
                key={s.id}
                className={`cursor-pointer transition-all ${selectedService === s.id ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => handleServiceSelect(s.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{s.name}</span>
                  <span className="text-xs text-gray-400">~{s.duration_min} Min.</span>
                </div>
              </Card>
            ))}
            {!needsStaffStep && selectedService && (
              <div className="pt-2">
                <Button className="w-full" disabled={submitting} onClick={handleCheckIn}>
                  {submitting ? <Spinner size="sm" /> : 'Jetzt einreihen'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Step: Staff selection */}
        {step === 'staff' && (
          <>
            <button onClick={() => setStep('service')} className="text-sm text-brand-500 mb-1">← Zurück</button>
            <p className="text-sm text-gray-500">Mitarbeiter wählen:</p>

            {/* Any available option */}
            <Card
              className={`cursor-pointer transition-all ${selectedStaff === null ? 'ring-2 ring-brand-500' : ''}`}
              onClick={() => setSelectedStaff(null)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg">?</div>
                <div>
                  <p className="font-medium text-sm">Egal — Nächster Verfügbarer</p>
                  <p className="text-xs text-gray-400">Kürzeste Wartezeit</p>
                </div>
              </div>
            </Card>

            {staff.map(member => (
              <Card
                key={member.id}
                className={`cursor-pointer transition-all ${selectedStaff === member.id ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => setSelectedStaff(member.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: member.color }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium text-sm">{member.name}</p>
                </div>
              </Card>
            ))}

            <div className="pt-2">
              <Button className="w-full" disabled={submitting} onClick={handleCheckIn}>
                {submitting ? <Spinner size="sm" /> : 'Jetzt einreihen'}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
