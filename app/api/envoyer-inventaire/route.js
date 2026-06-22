import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { to, date, csv, total, byFournisseur, lignes, nomEtablissement } = await request.json()
    const etab = nomEtablissement || 'FIMC'

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const dateStr = new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const cats = { merc: '🥩 Mercuriale', rec: '🍽️ Recettes', autre: '📦 Hors mercuriale' }
    const lignesParCat = ['merc', 'rec', 'autre'].map(cat => {
      const items = (lignes || []).filter(l => l.categorie === cat)
      if (!items.length) return ''
      const totalCat = items.reduce((s, l) => s + l.poids_net * l.prix, 0)
      const rows = items.map(l => `
        <tr>
          <td style="padding:8px 12px;border-bottom:0.5px solid #f1efe8;font-size:13px;color:#2c2c2a;font-weight:500;">${l.nom}</td>
          <td style="padding:8px 12px;border-bottom:0.5px solid #f1efe8;font-size:12px;color:#888780;">${l.fourn || '—'}</td>
          <td style="padding:8px 12px;border-bottom:0.5px solid #f1efe8;font-size:12px;color:#534ab7;">${l.contenants_detail || '—'}</td>
          <td style="padding:8px 12px;border-bottom:0.5px solid #f1efe8;font-size:12px;text-align:right;font-family:monospace;color:#2c2c2a;">${Number(l.poids_net).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</td>
          <td style="padding:8px 12px;border-bottom:0.5px solid #f1efe8;font-size:12px;text-align:right;color:#888780;">${Number(l.prix).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
          <td style="padding:8px 12px;border-bottom:0.5px solid #f1efe8;font-size:12px;text-align:right;font-weight:500;color:#534ab7;">${(l.poids_net * l.prix).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
        </tr>
      `).join('')

      return `
        <div style="margin-bottom:16px;">
          <div style="background:#2c2c2a;color:#fff;padding:8px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-radius:8px 8px 0 0;">
            ${cats[cat]}
          </div>
          <div style="background:#fff;border-radius:0 0 8px 8px;border:0.5px solid #e2e0d8;border-top:none;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  ${['Produit', 'Fournisseur', 'Contenants', 'Poids net', 'Prix/kg', 'Valeur'].map(h => `<th style="padding:7px 12px;text-align:${['Poids net','Prix/kg','Valeur'].includes(h)?'right':'left'};font-size:10px;font-weight:600;color:#888780;text-transform:uppercase;background:#f8f7f4;border-bottom:0.5px solid #e2e0d8;">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="5" style="padding:8px 12px;font-size:12px;font-weight:500;color:#888780;background:#f8f7f4;">Total ${cats[cat]}</td>
                  <td style="padding:8px 12px;text-align:right;font-size:13px;font-weight:600;color:#534ab7;background:#f8f7f4;">${totalCat.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `
    }).join('')

    // Par fournisseur — tableau HTML pur (display:flex ne marche pas dans les mails)
    const totalFourn = byFournisseur ? Object.values(byFournisseur).reduce((s, v) => s + v, 0) : 0
    const fournisseurHTML = byFournisseur && Object.keys(byFournisseur).length > 0
      ? `
        <div style="background:#fff;border-radius:8px;border:0.5px solid #e2e0d8;padding:16px;margin-bottom:16px;">
          <div style="font-size:11px;font-weight:600;color:#888780;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Par fournisseur</div>
          <table style="width:100%;border-collapse:collapse;">
            <tbody>
              ${Object.entries(byFournisseur).sort((a, b) => b[1] - a[1]).map(([f, v]) => `
                <tr>
                  <td style="padding:6px 0;border-bottom:0.5px solid #f1efe8;font-size:13px;color:#888780;">${f}</td>
                  <td style="padding:6px 0;border-bottom:0.5px solid #f1efe8;font-size:13px;font-weight:500;color:#534ab7;text-align:right;">${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding:8px 0 2px;font-size:13px;font-weight:600;color:#2c2c2a;border-top:1.5px solid #2c2c2a;">Total mercuriale</td>
                <td style="padding:8px 0 2px;font-size:13px;font-weight:600;color:#534ab7;text-align:right;border-top:1.5px solid #2c2c2a;">${totalFourn.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : ''

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:720px;margin:0 auto;padding:24px;">

    <div style="background:#534ab7;border-radius:12px;padding:24px 28px;margin-bottom:20px;color:#fff;">
      <div style="font-size:18px;font-weight:600;margin-bottom:4px;">${etab}</div>
      <div style="font-size:11px;color:#cecbf6;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;">FIMC — Gestion food &amp; métiers de bouche</div>
      <div style="font-size:16px;font-weight:500;margin-bottom:4px;">Inventaire du ${dateStr}</div>
      <div style="font-size:32px;font-weight:600;margin-top:8px;">${total} €</div>
    </div>

    ${fournisseurHTML}
    ${lignesParCat}

    <div style="text-align:center;font-size:11px;color:#b4b2a9;padding:16px 0 8px;">
      ${etab} — FIMC — Gestion food &amp; métiers de bouche
    </div>
  </div>
</body>
</html>`

    const { data, error } = await resend.emails.send({
      from: 'FIMC <onboarding@resend.dev>',
      to: [to],
      subject: `📦 ${etab} — Inventaire du ${dateStr} — ${total} €`,
      html: htmlBody,
      attachments: [{
        filename: `inventaire_${date}.csv`,
        content: Buffer.from(csv, 'utf-8').toString('base64'),
      }]
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Erreur serveur:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}