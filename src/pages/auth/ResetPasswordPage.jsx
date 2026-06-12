import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash on this page
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  async function handleReset(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 8) { setError('Mindestens 8 Zeichen.'); return }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setSubmitting(false) }
    else navigate('/provider', { replace: true })
  }

  if (!ready) return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold">Neues Passwort</h1>
          </div>
          <Card>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Mindestens 8 Zeichen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wiederholen</label>
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Passwort speichern'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
