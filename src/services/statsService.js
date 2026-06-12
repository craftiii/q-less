import { supabase } from './supabase.js'

export async function getTodayStats(providerId) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('queue_entries')
    .select('status, checked_in_at, called_at, services(duration_min)')
    .eq('provider_id', providerId)
    .gte('checked_in_at', todayStart.toISOString())

  if (error) throw error

  const total     = data.length
  const done      = data.filter(e => e.status === 'done')
  const waiting   = data.filter(e => e.status === 'waiting').length
  const inService = data.filter(e => e.status === 'in_service').length
  const cancelled = data.filter(e => e.status === 'cancelled').length

  const avgWaitMin = done.length > 0
    ? Math.round(
        done
          .filter(e => e.called_at && e.checked_in_at)
          .reduce((sum, e) => {
            const waited = (new Date(e.called_at) - new Date(e.checked_in_at)) / 60_000
            return sum + waited
          }, 0) / Math.max(done.filter(e => e.called_at).length, 1)
      )
    : null

  return { total, done: done.length, waiting, inService, cancelled, avgWaitMin }
}

export async function getStaffStats(staffId) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('queue_entries')
    .select('status, checked_in_at, called_at, services(name, duration_min)')
    .eq('staff_id', staffId)
    .gte('checked_in_at', weekStart.toISOString())

  if (error) throw error

  const todayDone = data.filter(e =>
    e.status === 'done' && new Date(e.checked_in_at) >= todayStart
  )
  const weekDone = data.filter(e => e.status === 'done')

  const avgWaitMin = todayDone.length > 0
    ? Math.round(
        todayDone
          .filter(e => e.called_at && e.checked_in_at)
          .reduce((sum, e) => sum + (new Date(e.called_at) - new Date(e.checked_in_at)) / 60_000, 0)
          / Math.max(todayDone.filter(e => e.called_at).length, 1)
      )
    : null

  return {
    todayDone: todayDone.length,
    weekDone: weekDone.length,
    avgWaitMin,
  }
}
