const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, username, phone, password, user_type_id } = await req.json()

    if (!user_id || !username || !user_type_id) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const updateData: any = {
      user: username,
      user_type_id: user_type_id
    }

    if (phone !== undefined) {
      const cleanPhone = phone.replace(/\D/g, '')
      updateData.phone = cleanPhone ? '+521' + cleanPhone : null
    }

    if (password) {
      updateData.password = btoa(password)
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/user?id=eq.${user_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({ error: `Error al actualizar usuario: ${errorText}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ message: 'Usuario actualizado exitosamente' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Error al actualizar usuario' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})