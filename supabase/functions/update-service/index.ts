const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
  if (!authToken) {
    return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: corsHeaders })
  }

  const decoded = decodeJWT(authToken)
  if (!decoded?.sub) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders })
  }

  const body = await req.json()
  const { id, name, price } = body

  if (!id || !name || !price) {
    return new Response(JSON.stringify({ error: 'ID, name and price are required' }), { status: 400, headers: corsHeaders })
  }

  const updateResponse = await fetch(
    `${supabaseUrl}/rest/v1/service?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ name, price })
    }
  )

  const data = await updateResponse.json()

  if (!updateResponse.ok) {
    return new Response(JSON.stringify({ error: data.message || 'Error', details: data }), { 
      status: updateResponse.status, 
      headers: corsHeaders 
    })
  }

  return new Response(JSON.stringify(data), { headers: corsHeaders })
})