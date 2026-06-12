import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/provider', { replace: true })
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate('/provider', { replace: true })
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  async function handleLogin(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-Mail oder Passwort falsch.'); setSubmitting(false) }
  }

  if (loading) return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-black text-brand-500">Q-Less</h1>
            <p className="text-gray-500 mt-1">Provider Login</p>
          </div>
          <Card>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Einloggen'}
              </Button>
            </form>
          </Card>
          <div className="flex justify-between text-sm text-gray-500">
            <Link to="/forgot-password" className="hover:text-brand-500">Passwort vergessen?</Link>
            <Link to="/signup" className="hover:text-brand-500">Konto erstellen</Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
