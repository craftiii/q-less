import { QUEUE_STATUS } from '../config/constants.js'

/**
 * Returns total wait time in minutes for a customer at the given position.
 * @param {Array} entries - queue_entries ordered by position, with joined service data
 * @param {number} customerPosition - the customer's current position (1-based)
 */
function dur(e)    { return e.services?.duration_min ?? e.duration_min ?? 0 }
function buf(e)    { return e.services?.buffer_min  ?? e.buffer_min  ?? 0 }

export function calcWaitTime(entries, customerPosition) {
  const waiting = entries.filter(e => e.status === QUEUE_STATUS.WAITING && e.position < customerPosition)
  const inService = entries.find(e => e.status === QUEUE_STATUS.IN_SERVICE)

  let total = waiting.reduce((sum, e) => sum + dur(e) + buf(e), 0)

  if (inService) {
    const elapsed = inService.called_at
      ? (Date.now() - new Date(inService.called_at).getTime()) / 60_000
      : 0
    const remaining = Math.max(0, dur(inService) - elapsed)
    total += remaining
  }

  return Math.round(total)
}

/** For unassigned customers: minimum "time until free" across all staff — fastest wins */
export function calcMinStaffWait(entries) {
  const staffIds = [...new Set(entries.filter(e => e.staff_id).map(e => e.staff_id))]
  if (staffIds.length === 0) return calcWaitTime(entries, 1)

  const waits = staffIds.map(staffId => {
    const scoped    = entries.filter(e => e.staff_id === staffId)
    const inService = scoped.find(e => e.status === QUEUE_STATUS.IN_SERVICE)
    const waiting   = scoped.filter(e => e.status === QUEUE_STATUS.WAITING)
    let total = waiting.reduce((sum, e) => sum + dur(e) + buf(e), 0)
    if (inService) {
      const elapsed = inService.called_at
        ? (Date.now() - new Date(inService.called_at).getTime()) / 60_000
        : 0
      total += Math.max(0, dur(inService) - elapsed)
    }
    return total
  })

  return Math.round(Math.min(...waits))
}
