import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, date } = await req.json()
    
    console.log('Step 1 - userId:', userId, 'date:', date)

    if (!userId || !date) {
      return new Response(
        JSON.stringify({ error: 'userId y date son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Step 2 - Querying calendar table')
    const { data: calendarData, error: calendarError } = await supabase
      .from('calendar')
      .select('id')
      .eq('user_id', userId)
      .single()

    console.log('Step 3 - calendarData:', calendarData, 'calendarError:', calendarError)

    if (calendarError || !calendarData) {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const calendarId = calendarData.id
    console.log('Step 4 - calendarId:', calendarId)

    console.log('Step 5 - Querying calendar_detail')
    const { data, error } = await supabase
      .from('calendar_detail')
      .select(`
        id,
        date,
        start_time,
        end_time,
        canceled,
        client(name, phone, email)
      `)
      .eq('calendar_id', calendarId)
      .eq('date', date)
      .order('start_time', { ascending: true })

    console.log('Step 6 - bookings:', data, 'error:', error)

    if (error) {
      console.log('Step 7 - Error:', error.message)
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formattedData = (data || []).map((b: any) => ({
      id: b.id,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      canceled: b.canceled || false,
      client: {
        name: b.client?.name || '',
        phone: b.client?.phone || '',
        email: b.client?.email || ''
      }
    }))

    console.log('Step 8 - Returning:', formattedData)
    return new Response(
      JSON.stringify(formattedData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.log('Error caught:', error)
    return new Response(
      JSON.stringify([]),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})