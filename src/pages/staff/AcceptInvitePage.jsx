import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function AcceptInvitePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const staffId = params.get('staff_id')
  const [status, setStatus] = useState('linking') // linking | done | error

  useEffect(() => {
    async function link() {
      if (!staffId) { setStatus('error'); return }
      const { error } = await supabase.rpc('link_staff_account', { p_staff_id: staffId })
      if (error) { setStatus('error'); return }
      setStatus('done')
      setTimeout(() => navigate('/staff', { replace: true }), 1500)
    }
    link()
  }, [staffId])

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-6 text-center">
        {status === 'linking' && <><Spinner size="lg" /><p className="text-gray-400">Konto wird verknüpft…</p></>}
        {status === 'done' && <><p className="text-2xl">✅</p><p className="font-semibold">Willkommen im Team!</p><p className="text-gray-400 text-sm">Du wirst weitergeleitet…</p></>}
        {status === 'error' && (
          <>
            <p className="text-2xl">❌</p>
            <p className="font-semibold">Verknüpfung fehlgeschlagen</p>
            <p className="text-gray-400 text-sm">Der Einladungslink ist ungültig oder abgelaufen.</p>
            <Button onClick={() => navigate('/login')}>Zum Login</Button>
          </>
        )}
      </div>
    </AppShell>
  )
}
