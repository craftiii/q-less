import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { useProviderStore } from '../../store/providerStore.js'
import { createService } from '../../services/catalogService.js'
import { createStaffMember } from '../../services/staffService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

const STEPS = ['Betrieb', 'Leistungen', 'Team', 'Fertig']

const COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
            i < current ? 'bg-brand-500 text-white'
            : i === current ? 'bg-brand-100 text-brand-600 ring-2 ring-brand-500'
            : 'bg-gray-100 text-gray-400'
          }`}>{i < current ? '✓' : i + 1}</div>
          {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < current ? 'bg-brand-500' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

// Step 1 — Betrieb
function StepBetrieb({ onNext }) {
  const { setProvider } = useProviderStore()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const qrToken = crypto.randomUUID()
    const { data, error } = await supabase
      .from('providers')
      .insert({ id: user.id, name, address, qr_token: qrToken })
      .select().single()
    if (error) { setError(error.message); setSaving(false); return }
    setProvider(data)
    onNext()
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Dein Betrieb</h2>
        <p className="text-sm text-gray-500 mt-1">Wie heißt dein Betrieb?</p>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="z.B. Friseur Müller" value={name}
              onChange={e => setName(e.target.value)} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Musterstraße 1, 12345 Stadt" value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Weiter'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

// Step 2 — Leistungen
function StepLeistungen({ onNext, onSkip }) {
  const { provider } = useProviderStore()
  const [services, setServices] = useState([{ name: '', duration: '' }])
  const [saving, setSaving] = useState(false)

  function addRow() { setServices(prev => [...prev, { name: '', duration: '' }]) }
  function updateRow(i, field, val) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }
  function removeRow(i) { setServices(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSave() {
    const valid = services.filter(s => s.name.trim() && s.duration)
    if (valid.length === 0) { onSkip(); return }
    setSaving(true)
    await Promise.all(valid.map(s =>
      createService({ providerId: provider.id, name: s.name.trim(), durationMin: Number(s.duration), bufferMin: 0 })
    ))
    onNext()
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Leistungen anlegen</h2>
        <p className="text-sm text-gray-500 mt-1">Was bietest du an? Kannst du später ergänzen.</p>
      </div>
      <div className="space-y-2">
        {services.map((s, i) => (
          <Card key={i} className="flex gap-2 items-center">
            <input
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Name" value={s.name} onChange={e => updateRow(i, 'name', e.target.value)}
            />
            <input
              type="number" min="1"
              className="w-20 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Min." value={s.duration} onChange={e => updateRow(i, 'duration', e.target.value)}
            />
            {services.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none px-1">×</button>
            )}
          </Card>
        ))}
        <button onClick={addRow} className="text-sm text-brand-500 hover:underline px-1">+ Zeile hinzufügen</button>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Weiter'}
        </Button>
        <Button variant="secondary" onClick={onSkip} disabled={saving}>Überspringen</Button>
      </div>
    </div>
  )
}

// Step 3 — Team
function StepTeam({ onNext, onSkip }) {
  const { provider } = useProviderStore()
  const [members, setMembers] = useState([{ name: '', color: COLORS[0] }])
  const [saving, setSaving] = useState(false)

  function addRow() { setMembers(prev => [...prev, { name: '', color: COLORS[prev.length % COLORS.length] }]) }
  function updateRow(i, field, val) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))
  }
  function removeRow(i) { setMembers(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSave() {
    const valid = members.filter(m => m.name.trim())
    if (valid.length === 0) { onSkip(); return }
    setSaving(true)
    await Promise.all(valid.map(m =>
      createStaffMember({ providerId: provider.id, name: m.name.trim(), color: m.color })
    ))
    onNext()
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Dein Team</h2>
        <p className="text-sm text-gray-500 mt-1">Mitarbeiter anlegen — oder später in den Einstellungen.</p>
      </div>
      <div className="space-y-2">
        {members.map((m, i) => (
          <Card key={i} className="flex gap-2 items-center">
            <input
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Name" value={m.name} onChange={e => updateRow(i, 'name', e.target.value)}
            />
            <div className="flex gap-1">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => updateRow(i, 'color', c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${m.color === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
            {members.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none px-1">×</button>
            )}
          </Card>
        ))}
        <button onClick={addRow} className="text-sm text-brand-500 hover:underline px-1">+ Mitarbeiter hinzufügen</button>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Weiter'}
        </Button>
        <Button variant="secondary" onClick={onSkip} disabled={saving}>Überspringen</Button>
      </div>
    </div>
  )
}

// Step 4 — Done
function StepFertig({ onFinish }) {
  const { provider } = useProviderStore()
  const checkInUrl = provider ? `${window.location.origin}/check-in/${provider.qr_token}` : ''

  return (
    <div className="space-y-4 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="text-xl font-bold">Alles bereit!</h2>
      <p className="text-sm text-gray-500">Dein Q-Less-Portal ist eingerichtet. Teile den Check-in Link mit deinen Kunden.</p>
      <Card>
        <p className="text-xs text-gray-400 mb-1">Dein Check-in Link</p>
        <p className="text-xs font-mono text-brand-600 break-all">{checkInUrl}</p>
        <Button variant="secondary" className="w-full mt-3 text-sm"
          onClick={() => navigator.clipboard.writeText(checkInUrl)}>
          Link kopieren
        </Button>
      </Card>
      <Button className="w-full" onClick={onFinish}>Zum Dashboard</Button>
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-start p-6 pt-10">
        <div className="w-full max-w-sm space-y-2">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-black text-brand-500">Q-Less</h1>
          </div>
          <StepIndicator current={step} />
          {step === 0 && <StepBetrieb onNext={() => setStep(1)} />}
          {step === 1 && <StepLeistungen onNext={() => setStep(2)} onSkip={() => setStep(2)} />}
          {step === 2 && <StepTeam onNext={() => setStep(3)} onSkip={() => setStep(3)} />}
          {step === 3 && <StepFertig onFinish={() => navigate('/provider', { replace: true })} />}
        </div>
      </div>
    </AppShell>
  )
}
