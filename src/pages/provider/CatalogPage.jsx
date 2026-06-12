import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProviderStore } from '../../store/providerStore.js'
import { getAllServices, createService, updateService } from '../../services/catalogService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { BottomNav } from '../../components/layout/BottomNav.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

function ServiceForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [duration, setDuration] = useState(initial?.duration_min ?? '')
  const [buffer, setBuffer] = useState(initial?.buffer_min ?? 0)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, durationMin: Number(duration), bufferMin: Number(buffer) })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <input
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        placeholder="Name (z.B. Haarschnitt)" value={name}
        onChange={e => setName(e.target.value)} required
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Dauer (Min.)</label>
          <input type="number" min="1"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={duration} onChange={e => setDuration(e.target.value)} required
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Pause danach (Min.)</label>
          <input type="number" min="0"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={buffer} onChange={e => setBuffer(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Speichern'}
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}

function ServiceRow({ service, index, total, onEdit, onToggle, onMove }) {
  return (
    <Card className={service.is_active ? '' : 'opacity-50'}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{service.name}</span>
            {!service.is_active && <Badge color="gray">Inaktiv</Badge>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {service.duration_min} Min.{service.buffer_min > 0 ? ` + ${service.buffer_min} Min. Pause` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onMove(index, -1)} disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 text-gray-500 text-xs"
            aria-label="Nach oben"
          >▲</button>
          <button
            onClick={() => onMove(index, 1)} disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 text-gray-500 text-xs"
            aria-label="Nach unten"
          >▼</button>
          <button
            onClick={() => onEdit(service)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-xs font-medium"
          >Bearbeiten</button>
          <button
            onClick={() => onToggle(service)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-xs font-medium"
          >{service.is_active ? 'Pausieren' : 'Aktivieren'}</button>
        </div>
      </div>
    </Card>
  )
}

export default function CatalogPage() {
  const { provider } = useProviderStore()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (!provider) return
    // Load all services including inactive
    loadServices()
  }, [provider])

  async function loadServices() {
    try {
      const data = await getAllServices(provider.id)
      setServices(data)
    } catch { /* silent */ }
    setLoading(false)
  }

  async function handleAdd({ name, durationMin, bufferMin }) {
    const s = await createService({ providerId: provider.id, name, durationMin, bufferMin })
    setServices(prev => [...prev, s])
    setShowAdd(false)
  }

  async function handleEdit({ name, durationMin, bufferMin }) {
    const s = await updateService(editing.id, { name, duration_min: durationMin, buffer_min: bufferMin })
    setServices(prev => prev.map(x => x.id === s.id ? s : x))
    setEditing(null)
  }

  async function handleToggle(service) {
    const s = await updateService(service.id, { is_active: !service.is_active })
    setServices(prev => prev.map(x => x.id === s.id ? s : x))
  }

  async function handleMove(index, dir) {
    const next = [...services]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setServices(next)
    // Persist order via updated_at trick — simple approach for MVP
    await Promise.all([
      updateService(next[index].id, { buffer_min: next[index].buffer_min }),
      updateService(next[target].id, { buffer_min: next[target].buffer_min }),
    ])
  }

  const activeCount = services.filter(s => s.is_active).length

  return (
    <AppShell>
      <Header
        title={`Leistungen ${activeCount > 0 ? `(${activeCount})` : ''}`}
        action={
          <Button variant="ghost" className="text-brand-500 font-semibold" onClick={() => { setShowAdd(v => !v); setEditing(null) }}>
            {showAdd ? 'Abbrechen' : '+ Neu'}
          </Button>
        }
      />
      <div className="flex-1 p-4 space-y-3 pb-24">
        {showAdd && (
          <Card className="border-brand-200 bg-brand-50">
            <p className="text-sm font-medium text-brand-700 mb-1">Neue Leistung</p>
            <ServiceForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
          </Card>
        )}

        {loading && <div className="flex justify-center py-8"><Spinner /></div>}

        {services.map((s, i) => (
          editing?.id === s.id ? (
            <Card key={s.id} className="border-brand-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Bearbeiten</p>
              <ServiceForm initial={s} onSave={handleEdit} onCancel={() => setEditing(null)} />
            </Card>
          ) : (
            <ServiceRow
              key={s.id}
              service={s}
              index={i}
              total={services.length}
              onEdit={setEditing}
              onToggle={handleToggle}
              onMove={handleMove}
            />
          )
        ))}

        {!loading && services.length === 0 && !showAdd && (
          <div className="text-center py-16 space-y-3">
            <p className="text-gray-400">Noch keine Leistungen.</p>
            <Button onClick={() => setShowAdd(true)}>Manuell anlegen</Button>
            <div>
              <Link to="/provider/library">
                <Button variant="secondary">Aus Bibliothek wählen</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  )
}
