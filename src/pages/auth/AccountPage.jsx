import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { useAuthStore } from '../../store/authStore.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { BottomNav } from '../../components/layout/BottomNav.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">{title}</p>
      {children}
    </div>
  )
}

export default function AccountPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [newEmail, setNewEmail] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [emailMsg, setEmailMsg] = useState(null)
  const [pwMsg, setPwMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleEmailChange(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setEmailMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Bestätigungs-E-Mail gesendet.' })
    setSaving(false)
    setNewEmail('')
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: 'Passwörter stimmen nicht überein.' }); return }
    if (newPw.length < 8) { setPwMsg({ ok: false, text: 'Mindestens 8 Zeichen.' }); return }
    setSaving(true)
    // Re-authenticate first
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw })
    if (authErr) { setPwMsg({ ok: false, text: 'Aktuelles Passwort falsch.' }); setSaving(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Passwort geändert.' })
    setSaving(false)
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  async function handleDelete() {
    if (!confirm('Konto wirklich löschen? Alle Daten gehen verloren.')) return
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell>
      <Header title="Konto" />
      <div className="flex-1 p-4 space-y-6 pb-24">

        <Section title="Aktuelle E-Mail">
          <Card>
            <p className="text-sm text-gray-700">{user?.email}</p>
          </Card>
        </Section>

        <Section title="E-Mail ändern">
          <Card>
            <form onSubmit={handleEmailChange} className="space-y-3">
              <input
                type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Neue E-Mail-Adresse"
              />
              {emailMsg && <p className={`text-sm ${emailMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{emailMsg.text}</p>}
              <Button type="submit" variant="secondary" className="w-full" disabled={saving}>
                E-Mail ändern
              </Button>
            </form>
          </Card>
        </Section>

        <Section title="Passwort ändern">
          <Card>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Aktuelles Passwort"
              />
              <input
                type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Neues Passwort (min. 8 Zeichen)"
              />
              <input
                type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Wiederholen"
              />
              {pwMsg && <p className={`text-sm ${pwMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{pwMsg.text}</p>}
              <Button type="submit" variant="secondary" className="w-full" disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Passwort ändern'}
              </Button>
            </form>
          </Card>
        </Section>

        <Section title="Sitzung">
          <Button variant="secondary" className="w-full" onClick={handleLogout}>
            Abmelden
          </Button>
        </Section>

        <Section title="Gefahrenzone">
          <Button variant="danger" className="w-full" onClick={handleDelete}>
            Konto löschen
          </Button>
        </Section>

      </div>
      <BottomNav />
    </AppShell>
  )
}
