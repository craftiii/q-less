import { useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { Spinner } from '../ui/Spinner.jsx'
import { advanceQueue } from '../../services/queueService.js'

export function DoneButton({ providerId, onAdvanced }) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    await advanceQueue(providerId)
    onAdvanced?.()
    setLoading(false)
  }

  return (
    <Button className="w-full" onClick={handle} disabled={loading}>
      {loading ? <Spinner size="sm" /> : 'Fertig — Nächster Kunde'}
    </Button>
  )
}
