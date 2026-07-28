import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { to, reception, retours, etabNom } = await request.json()

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const dateStr = reception.date_reception
      ? new Date(reception.date_reception + 'T12:00:00').toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
      : ''

    const rows = retours.map(r => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1efe8;font-size:13px;color:#2c2c2a;font-weight:500;">${r.produit_nom || '—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1efe8;font-size:13px;text-align:center;font-weight:600;color:#a32d2d;">${r.quantite || '—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1efe8;font-size:13px;color:#888780;">${r.raison || '—'}</td>
      </tr>
    `).join('')

    const photoHtml = reception.photo_url
      ? `<div style="margin-top:24px;">
          <div style="font-size:12px;font-weight:600;color:#888780;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Bon de livraison</div>
          <img src="${reception.photo_url}" style="max-width:100%;border-radius:8px;border:1px solid #e2e0d8;"/>
        </div>`
      : ''

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">

    <div style="background:#a32d2d;border-radius:12px;padding:24px 28px;margin-bottom:20px;color:#fff;">
      <div style="font-size:13px;opacity:0.8;margin-bottom:4px;">${etabNom || 'FIMC'}</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:4px;">Bon de retour fournisseur</div>
      <div style="font-size:14px;opacity:0.9;">${dateStr}</div>
    </div>

    <div style="background:#fff;border-radius:12px;border:1px solid #e2e0d8;padding:20px;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#888780;">Fournisseur</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#2c2c2a;text-align:right;">${reception.fournisseur}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#888780;">N° BL</td>
          <td style="padding:6px 0;font-size:14px;font-weight:500;color:#2c2c2a;text-align:right;">${reception.bon_livraison || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#888780;">Reçu par</td>
          <td style="padding:6px 0;font-size:14px;color:#2c2c2a;text-align:right;">${reception.recu_par || '—'}</td>
        </tr>
      </table>
    </div>

    <div style="background:#fff;border-radius:12px;border:1px solid #e2e0d8;overflow:hidden;margin-bottom:16px;">
      <div style="background:#f8f7f4;padding:10px 14px;font-size:11px;font-weight:600;color:#888780;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e0d8;">
        Produits retournés (${retours.length})
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:#888780;font-weight:600;text-transform:uppercase;">Produit</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;color:#888780;font-weight:600;text-transform:uppercase;">Quantité</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:#888780;font-weight:600;text-transform:uppercase;">Raison</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    ${reception.commentaire ? `
    <div style="background:#faeeda;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#854f0b;">
      <strong>Commentaire :</strong> ${reception.commentaire}
    </div>` : ''}

    ${photoHtml}

    <div style="text-align:center;font-size:11px;color:#b4b2a9;padding:16px 0 0;">
      ${etabNom || 'FIMC'} — FIMC — Gestion food &amp; métiers de bouche
    </div>
  </div>
</body>
</html>`

    const { data, error } = await resend.emails.send({
      from: 'FIMC <onboarding@resend.dev>',
      to: [to],
      subject: `Bon de retour — ${reception.fournisseur} — ${dateStr}`,
      html,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}