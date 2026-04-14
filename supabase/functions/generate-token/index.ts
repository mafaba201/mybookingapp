const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, username, userTypeId, expiresIn } = await req.json()

    if (!userId || !username || !userTypeId) {
      return new Response(JSON.stringify({ error: 'Faltan parametros requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const expTime = expiresIn === '10000d' 
      ? Math.floor(Date.now() / 1000) + (10000 * 24 * 60 * 60)
      : Math.floor(Date.now() / 1000) + (2 * 60 * 60)

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      sub: userId.toString(),
      username,
      userTypeId,
      iat: Math.floor(Date.now() / 1000),
      exp: expTime
    }))
    
    const secret = supabaseAnonKey
    const encoder = new TextEncoder()
    const keyData = await crypto.subtle.digest('SHA-256', encoder.encode(secret))
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`))
    
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    const token = `${header}.${payload}.${signatureBase64}`

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Error al generar token' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})