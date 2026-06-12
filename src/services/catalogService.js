import { supabase } from './supabase.js'

export async function getTemplates() {
  const { data, error } = await supabase
    .from('catalog_templates')
    .select('*')
    .order('category')
    .order('name')
  if (error) throw error
  return data
}

export async function getServices(providerId) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function getAllServices(providerId) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createService({ providerId, name, durationMin, bufferMin = 0 }) {
  const { data, error } = await supabase
    .from('services')
    .insert({ provider_id: providerId, name, duration_min: durationMin, buffer_min: bufferMin })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateService(serviceId, updates) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteService(serviceId) {
  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', serviceId)
  if (error) throw error
}
