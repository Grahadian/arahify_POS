// ============================================================
// Supabase Edge Function: create-midtrans-token
// ============================================================
// Deploy ke Supabase Edge Functions:
//   supabase functions deploy create-midtrans-token
//
// Set secret di Supabase dashboard atau CLI:
//   supabase secrets set MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
//   supabase secrets set MIDTRANS_IS_PRODUCTION=false
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MIDTRANS_SERVER_KEY  = Deno.env.get('MIDTRANS_SERVER_KEY')  || ''
const IS_PRODUCTION        = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
const MIDTRANS_SNAP_URL    = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

const corsHeaders = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, gross_amount, customer_name, customer_email } = await req.json()

    if (!order_id || !gross_amount) {
      return new Response(
        JSON.stringify({ error: 'order_id dan gross_amount wajib diisi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Request Snap Token dari Midtrans
    const midtransPayload = {
      transaction_details: {
        order_id     : order_id,
        gross_amount : gross_amount,
      },
      credit_card: { secure: true },
      customer_details: {
        first_name : customer_name || 'Pelanggan',
        email      : customer_email || '',
      },
      item_details: [
        {
          id       : 'MSME-PRO-PLAN',
          price    : gross_amount,
          quantity : 1,
          name     : 'MSME Grow POS — Pro Plan (1 Bulan)',
        },
      ],
      // Aktifkan semua metode pembayaran
      enabled_payments: [
        'credit_card', 'mandiri_clickpay', 'cimb_clicks',
        'bca_klikbca', 'bca_klikpay', 'bri_epay', 'echannel',
        'permata_va', 'bca_va', 'bni_va', 'bri_va', 'other_va',
        'gopay', 'indomaret', 'danamon_online', 'akulaku',
        'shopeepay', 'qris',
      ],
      callbacks: {
        finish  : `${Deno.env.get('APP_URL') || 'https://pos.msmegrow.id'}/payment/success`,
        error   : `${Deno.env.get('APP_URL') || 'https://pos.msmegrow.id'}/payment/failed`,
        pending : `${Deno.env.get('APP_URL') || 'https://pos.msmegrow.id'}/payment/pending`,
      },
    }

    // Encode server key untuk Basic Auth
    const authHeader = btoa(MIDTRANS_SERVER_KEY + ':')

    const response = await fetch(MIDTRANS_SNAP_URL, {
      method  : 'POST',
      headers : {
        'Content-Type'  : 'application/json',
        'Authorization' : `Basic ${authHeader}`,
      },
      body: JSON.stringify(midtransPayload),
    })

    const result = await response.json()

    if (!response.ok || !result.token) {
      console.error('Midtrans error:', result)
      return new Response(
        JSON.stringify({ error: result.error_messages?.join(', ') || 'Midtrans request gagal.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        token    : result.token,
        redirect : result.redirect_url,
        order_id : order_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
