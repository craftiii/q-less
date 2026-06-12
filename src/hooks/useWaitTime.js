import { useMemo } from 'react'
import { useQueueStore } from '../store/queueStore.js'
import { calcWaitTime, calcMinStaffWait } from '../utils/timeCalculator.js'

export function useWaitTime(customerPosition, staffId = null) {
  const entries = useQueueStore(s => s.entries)
  return useMemo(() => {
    if (staffId) {
      const scoped = entries.filter(e => e.staff_id === staffId)
      return calcWaitTime(scoped, customerPosition)
    }
    // No staff assigned: show fastest available staff (critical path)
    return calcMinStaffWait(entries)
  }, [entries, customerPosition, staffId])
}
