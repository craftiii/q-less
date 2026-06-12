import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { updateStaffProfile } from '../../services/staffService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Toast } from '../../components/ui/Toast.jsx'

const SPECIALTY_OPTIONS = [
  'Herrenhaarschnitt', 'Damenhaarschnitt', 'Kinderhaarschnitt',
  'Bart', 'Rasur', 'Färben', 'Strähnen', 'Dauerwelle', 'Styling'
]

export default function StaffProfilePage() {
  const navigate = useNavigate()
  const { staffProfile, setStaffProfile } = useAuthStore()
  const [name, setName] = useState(staffProfile?.name || '')
  const [bio, setBio] = useState(staffProfile?.bio || '')
  const [specialties, setSpecialties] = useState(staffProfile?.specialties || [])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  function toggleSpecialty(s) {
    setSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateStaffProfile(staffProfile.id, { name, bio, specialties })
      setStaffProfile({ ...staffProfile, ...updated })
      setToast({ message: 'Profil gespeichert', type: 'success' })
    } catch {
      setToast({ message: 'Fehler beim Speichern', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <Header title="Mein Profil" back={() => navigate('/staff')} />

      <div className="p-4 space-y-4">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ background: staffProfile?.color || '#0ea5e9' }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-gray-400">{staffProfile?.email || ''}</p>
            </div>
          </div>

          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-3"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <label className="block text-xs text-gray-400 mb-1">Kurz-Bio</label>
          <textarea
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none"
            rows={3}
            placeholder="Z.B. 10 Jahre Erfahrung, spezialisiert auf…"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
        </Card>

        <Card>
          <p className="text-sm font-medium mb-3">Spezialisierungen</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => toggleSpecialty(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  specialties.includes(s)
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern…' : 'Profil speichern'}
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  )
}
