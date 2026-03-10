// ============================================================
// Supabase Edge Function: midtrans-webhook
// ============================================================
// URL ini didaftarkan ke Midtrans sebagai Notification URL:
// Dashboard Midtrans → Settings → Configuration → Notification URL
//   → https://YOUR_PROJECT.supabase.co/functions/v1/midtrans-webhook
//
// Deploy: supabase functions deploy midtrans-webhook
// Secret: supabase secrets set MIDTRANS_SERVER_KEY=xxxx
// ============================================================

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MIDTRANS_SERVER_KEY  = Deno.env.get('MIDTRANS_SERVER_KEY')!
const IS_PRODUCTION        = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log('Midtrans webhook:', JSON.stringify(payload))

    const {
      order_id,
      transaction_status,
      fraud_status,
      signature_key,
      status_code,
      gross_amount,
      transaction_id,
      payment_type,
    } = payload

    // ── Verifikasi signature Midtrans ────────────────────────
    const expectedSig = await sha512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
    if (signature_key !== expectedSig) {
      console.error('Invalid signature!')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
    }

    // ── Tentukan apakah pembayaran berhasil ──────────────────
    const isPaid = (
      transaction_status === 'capture' && fraud_status === 'accept'
    ) || transaction_status === 'settlement'

    const isFailed = ['cancel', 'deny', 'expire'].includes(transaction_status)
    const isPending = transaction_status === 'pending'

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // ── Update payment record ────────────────────────────────
    const updateData: any = {
      status           : isPaid ? 'paid' : isFailed ? 'failed' : 'pending',
      midtrans_txn_id  : transaction_id,
      payment_method   : payment_type,
      midtrans_payload : payload,
    }
    if (isPaid) updateData.paid_at = new Date().toISOString()

    await supabase
      .from('subscription_payments')
      .update(updateData)
      .eq('midtrans_order_id', order_id)

    // ── Jika bayar sukses: aktivasi client ───────────────────
    if (isPaid) {
      // Cari registration request yang menggunakan order_id ini
      const { data: reg } = await supabase
        .from('registration_requests')
        .select('id')
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Ambil payment record untuk dapat registration_id
      const { data: payment } = await supabase
        .from('subscription_payments')
        .select('id, client_id')
        .eq('midtrans_order_id', order_id)
        .single()

      if (payment) {
        // Cari registration yang terhubung ke payment ini
        const { data: regLinked } = await supabase
          .from('registration_requests')
          .select('id, client_id')
          .eq('payment_id', payment.id)
          .maybeSingle()

        if (regLinked && !regLinked.client_id) {
          // Aktivasi client via RPC
          const { data: activation } = await supabase.rpc('activate_client', {
            p_registration_id   : regLinked.id,
            p_midtrans_order_id : order_id,
          })
          console.log('Client activated:', activation)
        } else if (payment.client_id) {
          // Perpanjangan langganan existing client
          await supabase.rpc('extend_subscription', {
            p_client_id        : payment.client_id,
            p_midtrans_order_id: order_id,
          })
          console.log('Subscription extended for:', payment.client_id)
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

// SHA-512 helper
async function sha512(str: string): Promise<string> {
  const buf  = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-512', buf)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}
