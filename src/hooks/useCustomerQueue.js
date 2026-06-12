import { useEffect } from 'react'
import { getPublicQueue } from '../services/queueService.js'
import { useQueueStore } from '../store/queueStore.js'

const POLL_INTERVAL = 15_000

/** Lightweight queue subscription for the customer view — polls every 15s (anon has no Realtime access) */
export function useCustomerQueue(providerId) {
  const { setEntries } = useQueueStore()

  useEffect(() => {
    if (!providerId) return

    const refresh = () => getPublicQueue(providerId).then(setEntries).catch(console.error)
    refresh()
    const timer = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [providerId])
}
