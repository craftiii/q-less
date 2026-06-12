import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verify caller is an authenticated provider
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const callerClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { staff_id, email, name } = await req.json()

  // Verify this staff belongs to the calling provider
  const { data: staffRow, error: staffErr } = await adminClient
    .from('staff')
    .select('id, provider_id')
    .eq('id', staff_id)
    .eq('provider_id', user.id)
    .single()

  if (staffErr || !staffRow) return new Response('Forbidden', { status: 403 })

  // Update email on staff record
  await adminClient.from('staff').update({ email, invite_status: 'pending' }).eq('id', staff_id)

  // Send Supabase invite email
  const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { staff_id, role: 'staff' },
    redirectTo: `https://qless.cloud/staff/accept-invite?staff_id=${staff_id}`,
  })

  if (inviteErr) {
    return new Response(JSON.stringify({ error: inviteErr.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
