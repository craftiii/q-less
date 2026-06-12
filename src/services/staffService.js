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

export async function getShortestQueueStaff(providerId) {
  const { data, error } = await supabase
    .rpc('get_shortest_queue_staff', { p_provider_id: providerId })
  if (error) throw error
  return data
}
