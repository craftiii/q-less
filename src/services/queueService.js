import { supabase } from './supabase.js'

export async function createEntry({ providerId, serviceId, customerToken, staffId = null }) {
  const { data, error } = await supabase.rpc('check_in_customer', {
    p_provider_id:    providerId,
    p_service_id:     serviceId,
    p_customer_token: customerToken,
    p_staff_id:       staffId,
  })
  if (error) throw error
  return data
}

export async function getEntry(customerToken) {
  const { data, error } = await supabase.rpc('get_customer_entry', { p_customer_token: customerToken })
  if (error) throw error
  if (!data) throw new Error('Entry not found')
  return data
}

export async function getQueueForProvider(providerId) {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*, services(name, duration_min, buffer_min), staff(id, name, color)')
    .eq('provider_id', providerId)
    .in('status', ['waiting', 'in_service'])
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

/** Public (anon-safe) queue snapshot for wait-time calculation — no PII exposed */
export async function getPublicQueue(providerId) {
  const { data, error } = await supabase.rpc('get_public_queue', { p_provider_id: providerId })
  if (error) throw error
  // Returns JSON array; each item uses 'pos' instead of 'position' — normalize here
  return (data ?? []).map(e => ({ ...e, position: e.pos }))
}

export async function updateGeo({ customerToken, lat, lng }) {
  const { error } = await supabase.rpc('update_customer_geo', {
    p_customer_token: customerToken, p_lat: lat, p_lng: lng,
  })
  if (error) throw error
}

export async function markAlertSent(customerToken) {
  const { error } = await supabase.rpc('mark_alert_sent', { p_customer_token: customerToken })
  if (error) throw error
}

export async function advanceQueue(providerId, staffId = null) {
  const { error } = await supabase.rpc('advance_queue', {
    p_provider_id: providerId,
    p_staff_id: staffId,
  })
  if (error) throw error
}

export async function cancelEntry(customerToken) {
  const { error } = await supabase.rpc('cancel_customer_entry', { p_customer_token: customerToken })
  if (error) throw error
}

export async function removeFromQueue(entryId) {
  const { error } = await supabase
    .from('queue_entries')
    .update({ status: 'cancelled' })
    .eq('id', entryId)
  if (error) throw error
}

export async function reassignStaff(entryId, staffId) {
  const { error } = await supabase
    .from('queue_entries')
    .update({ staff_id: staffId })
    .eq('id', entryId)
  if (error) throw error
}
