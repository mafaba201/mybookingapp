const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

function decodeJWT(token: string): { sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authToken = getAuthToken(req)
  console.log('Auth token:', authToken ? 'present' : 'none')
  
  // GET - fetch work schedules (público, sin autenticación)
  if (req.method === 'GET') {
    console.log('Fetching work schedules (public)...')
    
    const getResponse = await fetch(
      `${supabaseUrl}/rest/v1/work_schedule?order=day,start_hour`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    )

    console.log('DB Response status:', getResponse.status)
    const data = await getResponse.json()
    console.log('DB Response data:', data)

    return new Response(JSON.stringify(data), { headers: corsHeaders })
  }

  // POST/PUT/DELETE requieren autenticación
  const decoded = authToken ? decodeJWT(authToken) : null
  const userId = decoded?.sub

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Autenticación requerida para modificar' }), { status: 401, headers: corsHeaders })
  }

  // DELETE - delete work schedule
  if (req.method === 'DELETE') {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers: corsHeaders })
    }
    
    const deleteResponse = await fetch(
      `${supabaseUrl}/rest/v1/work_schedule?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    )

    console.log('Delete Response status:', deleteResponse.status)
    
    if (deleteResponse.status === 204) {
      return new Response(JSON.stringify({ message: 'Eliminado' }), { headers: corsHeaders })
    }
    
    const errorData = await deleteResponse.json()
    return new Response(JSON.stringify(errorData), { status: deleteResponse.status, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: corsHeaders })
})