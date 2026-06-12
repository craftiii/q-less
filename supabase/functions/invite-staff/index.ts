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

  const { staff_id, mode, email, password, name } = await req.json()
  // mode: 'invite' (email invite) | 'create' (internal account, no email needed)

  // Verify staff belongs to calling provider
  const { data: staffRow } = await adminClient
    .from('staff')
    .select('id, provider_id')
    .eq('id', staff_id)
    .eq('provider_id', user.id)
    .single()

  if (!staffRow) return new Response('Forbidden', { status: 403 })

  if (mode === 'invite') {
    // Email invite flow
    await adminClient.from('staff').update({ email, invite_status: 'pending' }).eq('id', staff_id)

    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { staff_id, role: 'staff' },
      redirectTo: `https://qless.cloud/staff/accept-invite?staff_id=${staff_id}`,
    })
    if (error) return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } else if (mode === 'create') {
    // Internal account — generate a hidden email, set password directly
    const internalEmail = `staff-${staff_id}@internal.qless.cloud`

    const { data: newUser, error } = await adminClient.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: { staff_id, role: 'staff' },
    })
    if (error) return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

    // Link immediately
    await adminClient
      .from('staff')
      .update({ user_id: newUser.user.id, invite_status: 'accepted', email: internalEmail })
      .eq('id', staff_id)
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
