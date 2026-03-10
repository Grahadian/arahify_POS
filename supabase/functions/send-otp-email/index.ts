// ============================================================
// Supabase Edge Function: send-otp-email
// Kirim & verifikasi OTP via email menggunakan Resend API
//
// CARA DEPLOY:
//   npx supabase functions deploy send-otp-email --no-verify-jwt
//
// CARA SET SECRET (wajib sebelum deploy ke production):
//   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//   npx supabase secrets set FROM_EMAIL=noreply@domainanda.com
//
// CARA DAPAT RESEND API KEY:
//   1. Daftar gratis di https://resend.com (3.000 email/bulan gratis)
//   2. Verifikasi domain di Resend Dashboard > Domains
//   3. Buat API Key di Resend Dashboard > API Keys
//   4. Set: npx supabase secrets set RESEND_API_KEY=re_xxx
//
// CATATAN:
//   - Tanpa RESEND_API_KEY: berjalan dalam "Demo Mode"
//     OTP dikirim balik ke frontend (hanya untuk testing lokal)
//   - Dengan RESEND_API_KEY: OTP dikirim ke email sungguhan
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// OTP store sementara (hilang saat function cold start)
// Untuk production persistent: simpan di tabel `otp_tokens` Supabase
const otpStore = new Map<string, { code: string; expiry: number; attempts: number }>()

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function cleanExpired() {
  const now = Date.now()
  for (const [key, val] of otpStore.entries()) {
    if (val.expiry < now) otpStore.delete(key)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
    const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') || 'noreply@msmegrow.id'
    const APP_NAME       = 'MSME Grow POS'

    const body = await req.json().catch(() => ({}))
    const { action, email, code } = body

    // ── ACTION: send ──────────────────────────────────────────
    if (action === 'send') {
      if (!email || !email.includes('@')) {
        return new Response(
          JSON.stringify({ error: 'Email tidak valid.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      cleanExpired()

      // Rate limit: max 3x kirim per sesi per email
      const existing = otpStore.get(email)
      if (existing && existing.attempts >= 3 && existing.expiry > Date.now()) {
        return new Response(
          JSON.stringify({ error: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const otp    = generateOTP()
      const expiry = Date.now() + 3 * 60 * 1000 // 3 menit

      otpStore.set(email, {
        code,
        expiry,
        attempts: (existing?.attempts || 0) + 1,
      })
      // Simpan kode yang benar (bukan variable otp)
      otpStore.set(email, { code: otp, expiry, attempts: (existing?.attempts || 0) + 1 })

      // ── Kirim via Resend (production) ──
      if (RESEND_API_KEY) {
        const html = `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#F8FAFC;border-radius:16px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#2563EB,#1D4ED8);padding:32px;text-align:center">
              <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:12px">🏪</div>
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px">${APP_NAME}</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8)">Verifikasi Email Pendaftaran</p>
            </div>
            <div style="background:#fff;padding:36px 32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px">
              <p style="font-size:14px;color:#6B7280;margin:0 0 24px;line-height:1.7">
                Halo! Kami menerima permintaan verifikasi email untuk pendaftaran akun <strong style="color:#111827">${APP_NAME}</strong>. 
                Masukkan kode OTP berikut di halaman pendaftaran:
              </p>
              <div style="background:#EFF6FF;border:2px dashed #93C5FD;border-radius:16px;padding:32px 24px;text-align:center;margin:0 0 24px">
                <p style="margin:0 0 8px;font-size:11px;color:#60A5FA;text-transform:uppercase;letter-spacing:3px;font-weight:700">Kode OTP Anda</p>
                <p style="margin:0;font-size:52px;font-weight:900;color:#2563EB;letter-spacing:16px;font-variant-numeric:tabular-nums;line-height:1">${otp}</p>
              </div>
              <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 16px;margin:0 0 24px">
                <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5">
                  ⏰ <strong>Kode berlaku 3 menit.</strong> Jangan bagikan kode ini kepada siapapun, termasuk tim support kami.
                </p>
              </div>
              <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0">
                Jika Anda tidak mendaftar di ${APP_NAME}, abaikan email ini.
              </p>
            </div>
          </div>
        `

        const emailRes = await fetch('https://api.resend.com/emails', {
          method : 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            from   : `${APP_NAME} <${FROM_EMAIL}>`,
            to     : [email],
            subject: `${otp} — Kode Verifikasi ${APP_NAME}`,
            html,
          }),
        })

        if (!emailRes.ok) {
          const errData = await emailRes.json().catch(() => ({}))
          console.error('[send-otp-email] Resend error:', JSON.stringify(errData))
        }

        return new Response(
          JSON.stringify({ success: true, message: `Kode OTP dikirim ke ${email}. Cek inbox & folder spam.` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } else {
        // ── Demo mode: RESEND_API_KEY belum diset ──
        console.log(`[DEMO OTP] Email: ${email} | Kode: ${otp}`)

        return new Response(
          JSON.stringify({
            success : true,
            demo    : true,
            demo_otp: otp,
            message : 'Demo mode aktif. Set RESEND_API_KEY untuk email sungguhan.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ── ACTION: verify ────────────────────────────────────────
    if (action === 'verify') {
      if (!email || !code) {
        return new Response(
          JSON.stringify({ error: 'Email dan kode OTP wajib diisi.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const stored = otpStore.get(email)

      if (!stored) {
        return new Response(
          JSON.stringify({ error: 'OTP tidak ditemukan. Kirim ulang kode.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (stored.expiry < Date.now()) {
        otpStore.delete(email)
        return new Response(
          JSON.stringify({ error: 'Kode OTP kadaluarsa. Silakan kirim ulang.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (stored.code !== String(code).trim()) {
        return new Response(
          JSON.stringify({ error: 'Kode OTP salah. Periksa kembali email Anda.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      otpStore.delete(email) // one-time use

      return new Response(
        JSON.stringify({ success: true, message: 'Email berhasil diverifikasi.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action tidak valid. Gunakan: send | verify' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[send-otp-email] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
