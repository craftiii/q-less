import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setSubmitting(false) }
    else setDone(true)
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold">Passwort zurücksetzen</h1>
            <p className="text-gray-500 mt-1 text-sm">Wir schicken dir einen Reset-Link</p>
          </div>
          {done ? (
            <Card className="text-center space-y-3">
              <p className="text-2xl">✉️</p>
              <p className="text-sm text-gray-600">Reset-Link wurde an <strong>{email}</strong> gesendet.</p>
              <Link to="/login"><Button variant="secondary" className="w-full">Zurück zum Login</Button></Link>
            </Card>
          ) : (
            <Card>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="name@example.com"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Spinner size="sm" /> : 'Reset-Link senden'}
                </Button>
              </form>
            </Card>
          )}
          <p className="text-center text-sm">
            <Link to="/login" className="text-brand-500 hover:underline">Zurück zum Login</Link>
          </p>
        </div>
      </div>
    </AppShell>
  )
}
