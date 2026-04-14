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
    const { date, userId } = await req.json()

    if (!date || !userId) {
      return new Response(
        JSON.stringify({ error: 'Date and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: calendarData, error: calendarError } = await supabase
      .from('calendar')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (calendarError || !calendarData) {
      return new Response(
        JSON.stringify({ error: 'Calendar not found for this user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const calendarId = calendarData.id

    const { data: bookings, error } = await supabase
      .from('calendar_detail')
      .select('start_time, end_time')
      .eq('calendar_id', calendarId)
      .eq('date', date)
      .or('canceled.is.null', 'canceled.eq.false')

    if (error) {
      throw error
    }

    const bookedTimes = new Set(bookings?.map(b => b.start_time) || [])

    const allSlots = []
    for (let hour = 9; hour <= 17; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`)
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }

    const availableSlots = allSlots.map(time => ({
      time,
      available: !bookedTimes.has(time)
    }))

    return new Response(
      JSON.stringify({ slots: availableSlots }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
