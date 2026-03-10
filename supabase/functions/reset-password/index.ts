// ============================================================
// Supabase Edge Function: reset-password
// Handle: lupa password & lupa akun via email
//
// CARA DEPLOY:
//   npx supabase functions deploy reset-password --no-verify-jwt
//
// SECRET YANG DIBUTUHKAN (sama dengan send-otp-email):
//   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//   npx supabase secrets set FROM_EMAIL=noreply@domainanda.com
//   npx supabase secrets set APP_URL=https://domainanda.com
//   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
//
// ENDPOINTS:
//   POST body: { action: 'forgot-password', email }
//     → Kirim link reset password ke email
//   POST body: { action: 'forgot-account', email }
//     → Kirim info username ke email
//   POST body: { action: 'verify-reset-token', token }
//     → Cek apakah token reset valid
//   POST body: { action: 'do-reset-password', token, new_password }
//     → Eksekusi ganti password
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Token store: token → { email, expiry }
const tokenStore = new Map<string, { email: string; expiry: number }>()

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY') || ''
    const FROM_EMAIL        = Deno.env.get('FROM_EMAIL') || 'noreply@msmegrow.id'
    const APP_URL           = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const APP_NAME          = 'MSME Grow POS'

    const body = await req.json().catch(() => ({}))
    const { action, email, token, new_password } = body

    // Helper: cari user by email
    const findUserByEmail = async (emailAddr: string) => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(emailAddr)}&is_active=eq.true&select=id,username,email,full_name,role`,
        { headers: { 'apikey': SUPABASE_SERV_KEY, 'Authorization': `Bearer ${SUPABASE_SERV_KEY}` } }
      )
      const data = await res.json()
      return Array.isArray(data) && data.length > 0 ? data[0] : null
    }

    // Helper: kirim email via Resend
    const sendEmail = async (to: string, subject: string, html: string) => {
      if (!RESEND_API_KEY) {
        console.log(`[DEMO EMAIL] To: ${to} | Subject: ${subject}`)
        return { demo: true }
      }
      const res = await fetch('https://api.resend.com/emails', {
        method : 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body   : JSON.stringify({ from: `${APP_NAME} <${FROM_EMAIL}>`, to: [to], subject, html }),
      })
      return res.ok ? { success: true } : { error: await res.json() }
    }

    // ── ACTION: forgot-password ───────────────────────────────
    if (action === 'forgot-password') {
      if (!email?.includes('@')) {
        return new Response(
          JSON.stringify({ error: 'Email tidak valid.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const user = await findUserByEmail(email)

      // Selalu return success agar tidak expose apakah email terdaftar
      if (!user) {
        return new Response(
          JSON.stringify({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const resetToken = generateToken()
      const expiry     = Date.now() + 30 * 60 * 1000 // 30 menit
      tokenStore.set(resetToken, { email, expiry })

      const resetLink = `${APP_URL}?action=reset-password&token=${resetToken}`
      const displayName = user.full_name || user.username

      const html = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#F8FAFC;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#DC2626,#B91C1C);padding:32px;text-align:center">
            <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:12px">🔐</div>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff">${APP_NAME}</h1>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8)">Reset Password</p>
          </div>
          <div style="background:#fff;padding:36px 32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px">
            <p style="font-size:15px;color:#374151;margin:0 0 8px">Halo, <strong>${displayName}</strong></p>
            <p style="font-size:14px;color:#6B7280;margin:0 0 28px;line-height:1.7">
              Kami menerima permintaan reset password untuk akun Anda. 
              Klik tombol di bawah untuk membuat password baru:
            </p>
            <div style="text-align:center;margin:0 0 28px">
              <a href="${resetLink}" style="display:inline-block;padding:16px 36px;background:#2563EB;color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:-0.2px">
                🔑 Reset Password Sekarang
              </a>
            </div>
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 16px;margin:0 0 20px">
              <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5">
                ⏰ <strong>Link berlaku 30 menit.</strong> Jika Anda tidak meminta reset password, abaikan email ini — akun Anda tetap aman.
              </p>
            </div>
            <p style="font-size:12px;color:#9CA3AF;margin:0;line-height:1.6">
              Atau copy link ini ke browser:<br/>
              <span style="color:#2563EB;word-break:break-all;font-size:11px">${resetLink}</span>
            </p>
          </div>
        </div>
      `

      const emailResult = await sendEmail(email, `Reset Password ${APP_NAME}`, html)

      return new Response(
        JSON.stringify({
          success     : true,
          demo        : emailResult.demo || false,
          demo_token  : (!RESEND_API_KEY) ? resetToken : undefined,
          demo_link   : (!RESEND_API_KEY) ? resetLink : undefined,
          message     : 'Link reset password dikirim ke email Anda.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: forgot-account ────────────────────────────────
    if (action === 'forgot-account') {
      if (!email?.includes('@')) {
        return new Response(
          JSON.stringify({ error: 'Email tidak valid.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const user = await findUserByEmail(email)

      if (!user) {
        return new Response(
          JSON.stringify({ success: true, message: 'Jika email terdaftar, info akun akan dikirim.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const displayName = user.full_name || user.username
      const roleLabel   = user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin Bisnis' : 'Kasir'

      const html = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#F8FAFC;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#2563EB,#1D4ED8);padding:32px;text-align:center">
            <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:12px">👤</div>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff">${APP_NAME}</h1>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8)">Informasi Akun Anda</p>
          </div>
          <div style="background:#fff;padding:36px 32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px">
            <p style="font-size:15px;color:#374151;margin:0 0 8px">Halo, <strong>${displayName}</strong></p>
            <p style="font-size:14px;color:#6B7280;margin:0 0 24px;line-height:1.7">
              Berikut informasi akun yang terdaftar dengan email <strong style="color:#2563EB">${email}</strong>:
            </p>
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin:0 0 24px">
              <table style="width:100%;border-collapse:collapse">
                <tr style="border-bottom:1px solid #F1F5F9">
                  <td style="font-size:12px;color:#9CA3AF;padding:8px 0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Email Login</td>
                  <td style="font-size:14px;font-weight:700;color:#111827;text-align:right;padding:8px 0">${user.email}</td>
                </tr>
                <tr style="border-bottom:1px solid #F1F5F9">
                  <td style="font-size:12px;color:#9CA3AF;padding:8px 0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Username</td>
                  <td style="font-size:14px;font-weight:700;color:#2563EB;text-align:right;padding:8px 0">${user.username}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:8px 0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Tipe Akun</td>
                  <td style="font-size:14px;font-weight:700;color:#111827;text-align:right;padding:8px 0">${roleLabel}</td>
                </tr>
              </table>
            </div>
            <div style="text-align:center;margin:0 0 20px">
              <a href="${APP_URL}" style="display:inline-block;padding:14px 32px;background:#2563EB;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700">
                Masuk Sekarang →
              </a>
            </div>
            <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0">
              Jika bukan Anda yang meminta informasi ini, abaikan email ini.
            </p>
          </div>
        </div>
      `

      await sendEmail(email, `Info Akun ${APP_NAME}`, html)

      return new Response(
        JSON.stringify({
          success      : true,
          demo_username: (!RESEND_API_KEY) ? user.username : undefined,
          message      : 'Info akun dikirim ke email Anda.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: verify-reset-token ────────────────────────────
    if (action === 'verify-reset-token') {
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token wajib diisi.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const stored = tokenStore.get(token)

      if (!stored || stored.expiry < Date.now()) {
        if (stored) tokenStore.delete(token)
        return new Response(
          JSON.stringify({ error: 'Link reset tidak valid atau sudah kadaluarsa. Minta link baru.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, email: stored.email }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: do-reset-password ─────────────────────────────
    if (action === 'do-reset-password') {
      if (!token || !new_password || new_password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Token dan password baru (min. 6 karakter) wajib diisi.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const stored = tokenStore.get(token)

      if (!stored || stored.expiry < Date.now()) {
        if (stored) tokenStore.delete(token)
        return new Response(
          JSON.stringify({ error: 'Link reset tidak valid atau sudah kadaluarsa.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update password via RPC
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_user_password`, {
        method : 'POST',
        headers: {
          'Content-Type' : 'application/json',
          'apikey'       : SUPABASE_SERV_KEY,
          'Authorization': `Bearer ${SUPABASE_SERV_KEY}`,
        },
        body: JSON.stringify({ p_email: stored.email, p_new_password: new_password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return new Response(
          JSON.stringify({ error: err.message || 'Gagal mengubah password.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      tokenStore.delete(token) // one-time use

      return new Response(
        JSON.stringify({ success: true, message: 'Password berhasil diubah. Silakan login.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action tidak valid.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[reset-password] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
