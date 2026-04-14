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
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))
    
    const { name, email, phone, date, startTime, endTime, comment, userId, services } = body
    
    console.log('Extracted phone:', phone)
    console.log('Services:', services)
    
    if (!name || !email || !date || !startTime || !endTime || !userId) {
      console.log('Validation failed - missing fields:', { name: !!name, email: !!email, date: !!date, startTime: !!startTime, endTime: !!endTime, userId: !!userId })
      return new Response(
        JSON.stringify({ error: 'All fields are required', received: body }),
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

    const existingBooking = await supabase
      .from('calendar_detail')
      .select('*')
      .eq('calendar_id', calendarId)
      .eq('date', date)
      .eq('start_time', startTime)
      .or('canceled.is.null', 'canceled.eq.false')
      .single()

    if (existingBooking.data) {
      return new Response(
        JSON.stringify({ error: 'This time slot is already booked' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Checking if client exists with email:', email)

    const { data: existingClient } = await supabase
      .from('client')
      .select('id')
      .eq('email', email)
      .single()

    let clientData: any

    if (existingClient) {
      console.log('Client exists, updating:', existingClient.id)
      const { data: updatedClient, error: updateError } = await supabase
        .from('client')
        .update({ name, phone: phone || null })
        .eq('id', existingClient.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }
      clientData = updatedClient
    } else {
      console.log('Inserting new client with:', { name, email, phone })
      const { data: newClient, error: clientError } = await supabase
        .from('client')
        .insert([{ name, email, phone: phone || null }])
        .select()
        .single()

      if (clientError) {
        throw clientError
      }
      clientData = newClient
    }

    console.log('Client result:', clientData)

    const { data: bookingData, error: bookingError } = await supabase
      .from('calendar_detail')
      .insert([{
        date,
        start_time: startTime,
        end_time: endTime,
        comment: comment || null,
        client_id: clientData.id,
        calendar_id: calendarId
      }])
      .select()
      .single()

    if (bookingError) {
      throw bookingError
    }

    console.log('Booking created:', bookingData.id)

    if (services && services.length > 0) {
      console.log('Inserting services:', services)
      const servicesData = services.map((serviceId: number) => ({
        calendar_detail_id: bookingData.id,
        service_id: serviceId
      }))

      const { error: servicesError } = await supabase
        .from('calendar_detail_service')
        .insert(servicesData)

      if (servicesError) {
        console.error('Error inserting services:', servicesError)
      } else {
        console.log('Services inserted successfully')
      }
    }

    return new Response(
      JSON.stringify({ client: clientData, booking: bookingData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
