import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { destinataires, mois, annee, donnees, contenuConfig } = await request.json();
    const config = contenuConfig || { stock: true, couts: true, plats: true, pertes: true };

    if (!destinataires || destinataires.length === 0) {
      return Response.json({ error: 'Aucun destinataire' }, { status: 400 });
    }

    const indicateursHtml = config.stock ? `
      <div style="font-size:10px;font-weight:600;color:#534ab7;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #534ab7">Indicateurs clés du mois</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr>
          <td style="background:#f8f7f4;border-radius:8px;padding:12px;width:25%">
            <div style="font-size:9px;color:#888780;text-transform:uppercase">Valeur du stock</div>
            <div style="font-size:16px;font-weight:700;color:#2c2c2a">${(donnees.valeurStock || 0).toFixed(2)} €</div>
          </td>
          <td style="width:8px"></td>
          <td style="background:#eeedfe;border-radius:8px;padding:12px;width:25%">
            <div style="font-size:9px;color:#888780;text-transform:uppercase">Marge moyenne</div>
            <div style="font-size:16px;font-weight:700;color:#3c3489">${(donnees.margeMoyenne || 0).toFixed(1)}%</div>
          </td>
          <td style="width:8px"></td>
          <td style="background:#f8f7f4;border-radius:8px;padding:12px;width:25%">
            <div style="font-size:9px;color:#888780;text-transform:uppercase">Commandes</div>
            <div style="font-size:16px;font-weight:700;color:#2c2c2a">${(donnees.totalCommandes || 0).toFixed(2)} €</div>
          </td>
        </tr>
      </table>` : '';

    const topPlatsHtml = config.plats ? `
      <div style="font-size:10px;font-weight:600;color:#534ab7;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #534ab7">Top plats les plus rentables</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        ${(donnees.topPlats || []).map(p => `<tr><td style="padding:6px 0;border-bottom:1px solid #f1efe8;color:#2c2c2a;font-size:13px">${p.nom}</td><td style="padding:6px 0;border-bottom:1px solid #f1efe8;text-align:right"><span style="background:#eaf3de;color:#27500a;font-size:11px;font-weight:600;padding:2px 8px;border-radius:8px">${p.marge.toFixed(1)}%</span></td></tr>`).join('')}
      </table>
      <div style="font-size:10px;font-weight:600;color:#534ab7;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #534ab7">Plats à surveiller</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        ${(donnees.bottomPlats || []).map(p => `<tr><td style="padding:6px 0;border-bottom:1px solid #f1efe8;color:#2c2c2a;font-size:13px">${p.nom}</td><td style="padding:6px 0;border-bottom:1px solid #f1efe8;text-align:right"><span style="background:${p.marge < 50 ? '#fcebeb' : '#eaf3de'};color:${p.marge < 50 ? '#a32d2d' : '#27500a'};font-size:11px;font-weight:600;padding:2px 8px;border-radius:8px">${p.marge.toFixed(1)}%</span></td></tr>`).join('')}
      </table>` : '';

    const pertesHtml = config.pertes ? `
      <div style="font-size:10px;font-weight:600;color:#534ab7;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #534ab7">Pertes & gaspillage (${(donnees.totalPertes || 0).toFixed(2)} €)</div>
      <table style="width:100%;border-collapse:collapse">
        ${(donnees.pertesDetail || []).length > 0 ? donnees.pertesDetail.map(p => `<tr><td style="padding:5px 0;border-bottom:1px solid #f1efe8;color:#2c2c2a;font-size:12px">${p.nom} — ${p.type_perte}</td><td style="padding:5px 0;border-bottom:1px solid #f1efe8;text-align:right;color:#a32d2d;font-weight:600;font-size:12px">−${(p.total || 0).toFixed(2)} €</td></tr>`).join('') : '<tr><td style="padding:8px 0;color:#888780;font-size:12px">Aucune perte enregistrée ce mois-ci</td></tr>'}
      </table>` : '';

    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f8f7f4;padding:24px">
      <div style="background:#fff;border-radius:12px;border:1px solid #e2e0d8;overflow:hidden">
        <div style="padding:28px 28px 20px;border-bottom:2px solid #2c2c2a">
          <h1 style="margin:0 0 4px;font-size:20px;color:#2c2c2a;font-weight:600">Rapport mensuel — ${mois} ${annee}</h1>
          <p style="margin:0;color:#888780;font-size:12px">Le Bistrot du Coin</p>
        </div>
        <div style="padding:24px 28px">
          ${indicateursHtml}
          ${topPlatsHtml}
          ${pertesHtml}
        </div>
        <div style="padding:14px 28px;border-top:1px solid #e2e0d8;background:#f8f7f4">
          <p style="margin:0;font-size:10px;color:#b4b2a9">Rapport généré automatiquement par FIMC</p>
        </div>
      </div>
    </div>
    `;

    const result = await resend.emails.send({
      from: 'FIMC <onboarding@resend.dev>',
      to: destinataires,
      subject: `Rapport mensuel ${mois} ${annee} — Le Bistrot du Coin`,
      html: html,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
