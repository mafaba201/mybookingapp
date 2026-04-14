const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

function decodeJWT(token: string): { sub?: string; username?: string; userTypeId?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch {
    return null
  }
}

async function verifyToken(token: string): Promise<{ userId?: string; error?: string }> {
  const decoded = decodeJWT(token)
  
  if (!decoded || !decoded.sub) {
    return { error: 'Token inválido' }
  }
  
  return { userId: decoded.sub }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authToken = getAuthToken(req)
    
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Token de autenticación requerido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const decoded = decodeJWT(authToken)
    if (!decoded || !decoded.sub) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { username, phone, password, user_type_id } = await req.json()

    if (!username || !password || !user_type_id) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const hashedPassword = btoa(password)
    
    let phoneWithCode = null
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      phoneWithCode = '+521' + cleanPhone
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/user`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user: username,
          phone: phoneWithCode,
          password: hashedPassword,
          user_type_id: user_type_id
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({ error: `Error al crear usuario: ${errorText}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userData = await response.json()
    const userId = userData[0]?.id

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No se pudo obtener el ID del usuario creado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const calendarResponse = await fetch(
      `${supabaseUrl}/rest/v1/calendar`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId
        })
      }
    )

    const calendarResultText = await calendarResponse.text()
    console.log('Calendar response status:', calendarResponse.status)
    console.log('Calendar response body:', calendarResultText)
    
    if (!calendarResponse.ok) {
      return new Response(JSON.stringify({ 
        error: `Error al crear calendario: ${calendarResultText}`, 
        debug: { userId, status: calendarResponse.status } 
      }), {
        status: calendarResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let calendarId = null
    try {
      const calendarData = JSON.parse(calendarResultText)
      calendarId = calendarData[0]?.id || calendarData.id || 'inserted'
      console.log('Calendar created with ID:', calendarId)
    } catch (e) {
      calendarId = 'inserted (no id returned)'
    }

    return new Response(JSON.stringify({ 
      message: 'Usuario y calendario creados exitosamente', 
      calendarId: calendarId,
      userId: userId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Error al crear usuario' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})