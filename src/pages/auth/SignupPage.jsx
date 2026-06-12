import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setSubmitting(false) }
    else setDone(true)
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-black text-brand-500">Q-Less</h1>
            <p className="text-gray-500 mt-1">Neues Konto</p>
          </div>
          {done ? (
            <Card className="text-center space-y-3">
              <p className="text-2xl">✉️</p>
              <p className="font-medium">Bestätigungs-E-Mail gesendet</p>
              <p className="text-sm text-gray-500">Bitte prüfe dein Postfach und klicke den Bestätigungslink. Danach kannst du dich einloggen.</p>
              <Link to="/login"><Button variant="secondary" className="w-full">Zum Login</Button></Link>
            </Card>
          ) : (
            <Card>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Mindestens 8 Zeichen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passwort wiederholen</label>
                  <input
                    type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="••••••••"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Spinner size="sm" /> : 'Konto erstellen'}
                </Button>
              </form>
            </Card>
          )}
          <p className="text-center text-sm text-gray-500">
            Bereits ein Konto? <Link to="/login" className="text-brand-500 hover:underline">Einloggen</Link>
          </p>
        </div>
      </div>
    </AppShell>
  )
}
