import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase.js'
import { getQueueForProvider } from '../services/queueService.js'
import { useQueueStore } from '../store/queueStore.js'

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Audio not available — silent fail
  }
}

export function useQueue(providerId, onNewCustomer) {
  const { setEntries, setLoading, setError, entries } = useQueueStore()
  const prevCountRef = useRef(null)

  useEffect(() => {
    if (!providerId) return

    setLoading(true)
    getQueueForProvider(providerId)
      .then(data => {
        setEntries(data)
        prevCountRef.current = data.filter(e => e.status === 'waiting').length
      })
      .catch(setError)
      .finally(() => setLoading(false))

    const channel = supabase
      .channel(`queue:${providerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries', filter: `provider_id=eq.${providerId}` },
        () => {
          getQueueForProvider(providerId).then(data => {
            const newWaiting = data.filter(e => e.status === 'waiting').length
            if (prevCountRef.current !== null && newWaiting > prevCountRef.current) {
              playChime()
              onNewCustomer?.()
            }
            prevCountRef.current = newWaiting
            setEntries(data)
          }).catch(setError)
        },
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [providerId])
}
