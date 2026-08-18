// ============================================================
// netlify/functions/notify.js
// Netlify Function — envia e-mail via Resend quando alguém confirma
// COMO USAR:
//   1. Crie a pasta: netlify/functions/ na raiz do seu projeto
//   2. Coloque este arquivo lá como: notify.js
//   3. No painel do Netlify → Site settings → Environment variables → adicione:
//      RESEND_API_KEY = re_xxxxxxxxxxxx  (sua chave do resend.com)
// ============================================================

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const RESEND_KEY   = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = 'mathuska.wanted@gmail.com';

  if (!RESEND_KEY) {
    console.warn('RESEND_API_KEY não configurada');
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'no key' }) };
  }

  const attending = data.attending === 'sim' ? '✅ Confirmou presença' : '❌ Não poderá comparecer';
  const guests    = data.guests > 0 ? `+ ${data.guests} acompanhante(s)` : 'Apenas o convidado';
  const dietary   = data.dietary || 'Nenhuma';
  const message   = data.message || '—';

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #ddd;">
      <h1 style="font-size: 28px; text-align: center; font-family: serif; margin-bottom: 4px;">The Wedding Times</h1>
      <p style="text-align:center; font-size:12px; color:#888; margin-bottom: 24px; letter-spacing:.1em; text-transform:uppercase;">Nova confirmação de presença</p>
      <hr style="border:none; border-top: 3px double #222; margin-bottom: 24px;" />

      <table style="width:100%; font-family: Georgia, serif; font-size: 15px; border-collapse: collapse;">
        <tr><td style="padding:8px 0; color:#555; width:140px;">Nome</td><td style="padding:8px 0;"><strong>${data.name}</strong></td></tr>
        <tr><td style="padding:8px 0; color:#555;">E-mail</td><td style="padding:8px 0;">${data.email}</td></tr>
        <tr><td style="padding:8px 0; color:#555;">Presença</td><td style="padding:8px 0;">${attending}</td></tr>
        <tr><td style="padding:8px 0; color:#555;">Acompanhantes</td><td style="padding:8px 0;">${guests}</td></tr>
        <tr><td style="padding:8px 0; color:#555;">Restrição alimentar</td><td style="padding:8px 0;">${dietary}</td></tr>
      </table>

      ${data.message ? `
      <hr style="border:none; border-top:1px solid #ddd; margin: 20px 0;" />
      <p style="font-size:13px; color:#555; text-transform:uppercase; letter-spacing:.1em;">Mensagem</p>
      <p style="font-style:italic; font-size:15px; color:#333;">"${message}"</p>
      ` : ''}

      <hr style="border:none; border-top: 3px double #222; margin: 24px 0 16px;" />
      <p style="text-align:center; font-size:12px; color:#aaa;">Matheus &amp; Graziela · 12 de Dezembro de 2026 · Palacete Rosa</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'The Wedding Times <onboarding@resend.dev>',
        to: [NOTIFY_EMAIL],
        subject: `✦ ${data.attending === 'sim' ? 'Nova confirmação' : 'Ausência confirmada'}: ${data.name}`,
        html
      })
    });

    const result = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: res.ok, id: result.id })
    };
  } catch (err) {
    console.error('Resend error:', err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
