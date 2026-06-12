import { supabase } from './supabase.js'

export async function getProviderByQrToken(qrToken) {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('qr_token', qrToken)
    .single()
  if (error) throw error
  return data
}

export async function getProvider(providerId) {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .single()
  if (error) throw error
  return data
}

export async function updateProvider(providerId, updates) {
  const { data, error } = await supabase
    .from('providers')
    .update(updates)
    .eq('id', providerId)
    .select()
    .single()
  if (error) throw error
  return data
}
