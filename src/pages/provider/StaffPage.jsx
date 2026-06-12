import { useEffect, useState } from 'react'
import { useProviderStore } from '../../store/providerStore.js'
import { getStaff, createStaffMember, updateStaffMember } from '../../services/staffService.js'
import { updateProvider } from '../../services/providerService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { BottomNav } from '../../components/layout/BottomNav.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

const COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

const ASSIGNMENT_LABELS = {
  customer_choice: 'Kunde wählt',
  auto:            'Automatisch (kürzeste Queue)',
  provider_assigns:'Provider weist zu',
}

function StaffForm({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [canSelf, setCanSelf] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, color, canSelfManage: canSelf })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-1">
      <input
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        placeholder="Name des Mitarbeiters" value={name}
        onChange={e => setName(e.target.value)} required
      />
      <div>
        <p className="text-xs text-gray-500 mb-2">Farbe (für Dashboard)</p>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c} type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={canSelf} onChange={e => setCanSelf(e.target.checked)}
          className="w-4 h-4 rounded accent-brand-500" />
        <span className="text-sm text-gray-700">Darf eigene Queue selbst managen</span>
      </label>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Hinzufügen'}
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Abbrechen</Button>
      </div>
    </form>
  )
}

export default function StaffPage() {
  const { provider, setProvider } = useProviderStore()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [savingMode, setSavingMode] = useState(false)

  useEffect(() => {
    if (!provider) return
    getStaff(provider.id).then(setStaff).finally(() => setLoading(false))
  }, [provider])

  async function handleAdd(data) {
    const s = await createStaffMember({ providerId: provider.id, ...data })
    setStaff(prev => [...prev, s])
    setShowAdd(false)
  }

  async function handleToggleActive(member) {
    const s = await updateStaffMember(member.id, { is_active: !member.is_active })
    setStaff(prev => prev.map(x => x.id === s.id ? s : x))
  }

  async function handleToggleSelfManage(member) {
    const s = await updateStaffMember(member.id, { can_self_manage: !member.can_self_manage })
    setStaff(prev => prev.map(x => x.id === s.id ? s : x))
  }

  async function handleAssignmentChange(mode) {
    setSavingMode(true)
    const updated = await updateProvider(provider.id, { staff_assignment: mode })
    setProvider(updated)
    setSavingMode(false)
  }

  return (
    <AppShell>
      <Header
        title="Mitarbeiter"
        action={
          <Button variant="ghost" className="text-brand-500 font-semibold"
            onClick={() => setShowAdd(v => !v)}>
            {showAdd ? 'Abbrechen' : '+ Neu'}
          </Button>
        }
      />
      <div className="flex-1 p-4 space-y-5 pb-24">

        {/* Assignment mode */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Zuweisung beim Check-in</p>
          <Card className="space-y-2">
            {Object.entries(ASSIGNMENT_LABELS).map(([mode, label]) => (
              <label key={mode} className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="radio" name="assignment"
                  checked={provider?.staff_assignment === mode}
                  onChange={() => handleAssignmentChange(mode)}
                  className="accent-brand-500"
                  disabled={savingMode}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </Card>
        </div>

        {/* Add form */}
        {showAdd && (
          <Card className="border-brand-200 bg-brand-50">
            <p className="text-sm font-medium text-brand-700 mb-2">Neuer Mitarbeiter</p>
            <StaffForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
          </Card>
        )}

        {/* Staff list */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team</p>
          {loading && <div className="flex justify-center py-8"><Spinner /></div>}
          <div className="space-y-2">
            {staff.map(member => (
              <Card key={member.id} className={member.is_active ? '' : 'opacity-50'}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: member.color }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{member.name}</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {!member.is_active && <Badge color="gray">Inaktiv</Badge>}
                      {member.can_self_manage && <Badge color="blue">Self-manage</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <button
                      onClick={() => handleToggleActive(member)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >{member.is_active ? 'Pausieren' : 'Aktivieren'}</button>
                    <button
                      onClick={() => handleToggleSelfManage(member)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >{member.can_self_manage ? 'Self-manage entziehen' : 'Self-manage erlauben'}</button>
                  </div>
                </div>
              </Card>
            ))}
            {!loading && staff.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Noch keine Mitarbeiter angelegt.</p>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </AppShell>
  )
}
