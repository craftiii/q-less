import { supabase } from './supabase.js'

export async function getStaff(providerId) {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function getActiveStaff(providerId) {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createStaffMember({ providerId, name, color = '#0ea5e9', canSelfManage = false }) {
  const { data, error } = await supabase
    .from('staff')
    .insert({ provider_id: providerId, name, color, can_self_manage: canSelfManage })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateStaffMember(staffId, updates) {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', staffId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteStaffMember(staffId) {
  const { error } = await supabase.from('staff').delete().eq('id', staffId)
  if (error) throw error
}

export async function suspendStaffMember(staffId, suspended) {
  const { error } = await supabase.from('staff').update({ is_suspended: suspended }).eq('id', staffId)
  if (error) throw error
}

export async function inviteStaffMember(staffId, email, name) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ staff_id: staffId, email, name }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateStaffProfile(staffId, updates) {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', staffId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getShortestQueueStaff(providerId) {
  const { data, error } = await supabase
    .rpc('get_shortest_queue_staff', { p_provider_id: providerId })
  if (error) throw error
  return data
}
