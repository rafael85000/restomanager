'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { getEtablissementActif } from '../../../lib/etablissement';
import { APP_NAME, APP_NAME_FULL } from '../../../lib/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Rapport() {
  const [tab, setTab] = useState('apercu');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [genPdfEnCours, setGenPdfEnCours] = useState(false);

  const [donnees, setDonnees] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [destinataires, setDestinataires] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [autoEnvoi, setAutoEnvoi] = useState(true);
  const [configId, setConfigId] = useState(null);
  const [contenuConfig, setContenuConfig] = useState({ stock: true, couts: true, plats: true, pertes: true });

  useEffect(() => { chargerDonnees(); }, []);

  function toast(msg) {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  }

  async function chargerDonnees() {
    setLoading(true);
    const etId = getEtablissementActif();
    const now = new Date();
    const moisActuel = now.getMonth() + 1;
    const anneeActuelle = now.getFullYear();
    const nomMois = now.toLocaleDateString('fr-FR', { month: 'long' });

    let qInv = supabase.from('inventaires').select('*').order('date_inventaire', { ascending: false }).limit(2);
    if (etId) qInv = qInv.eq('etablissement_id', etId);
    const { data: invs } = await qInv;
    const valeurStock = invs && invs[0] ? parseFloat(invs[0].valeur_totale) : 0;
    const deltaStock = invs && invs.length > 1 && parseFloat(invs[1].valeur_totale) > 0
      ? ((valeurStock - parseFloat(invs[1].valeur_totale)) / parseFloat(invs[1].valeur_totale) * 100) : null;

    let qRec = supabase.from('recettes').select('*, recette_ingredients(*, produits(prix_ht))');
    if (etId) qRec = qRec.eq('etablissement_id', etId);
    const { data: recs } = await qRec;
    const recettesAvecMarge = (recs || []).filter(r => r.prix_vente > 0).map(r => {
      const coutTotal = (r.recette_ingredients || []).reduce((s, i) => s + (i.quantite * (i.produits?.prix_ht || 0)), 0);
      const coutPortion = r.portions > 0 ? coutTotal / r.portions : coutTotal;
      const pvht = r.prix_vente / (1 + (r.tva || 10) / 100);
      const marge = pvht > 0 ? ((pvht - coutPortion) / pvht * 100) : 0;
      return { nom: r.nom, marge };
    });
    const margeMoyenne = recettesAvecMarge.length > 0 ? recettesAvecMarge.reduce((s, r) => s + r.marge, 0) / recettesAvecMarge.length : 0;
    const triees = [...recettesAvecMarge].sort((a, b) => b.marge - a.marge);
    const topPlats = triees.slice(0, 3);
    const bottomPlats = triees.slice(-3).reverse();

    const debutMois = new Date(anneeActuelle, now.getMonth(), 1).toISOString().split('T')[0];
    let qCmd = supabase.from('commandes').select('*').gte('date_commande', debutMois);
    if (etId) qCmd = qCmd.eq('etablissement_id', etId);
    const { data: cmds } = await qCmd;
    const totalCommandes = (cmds || []).reduce((s, c) => s + parseFloat(c.montant_total || 0), 0);

    let qPertes = supabase.from('pertes').select('*').gte('date_perte', debutMois);
    if (etId) qPertes = qPertes.eq('etablissement_id', etId);
    const { data: pertesData } = await qPertes;
    const totalPertes = (pertesData || []).reduce((s, p) => s + parseFloat(p.total || 0), 0);

    setDonnees({
      mois: nomMois, annee: anneeActuelle, moisNum: moisActuel,
      valeurStock, deltaStock, margeMoyenne, totalCommandes, totalPertes,
      topPlats, bottomPlats, pertesDetail: pertesData || [],
    });

    let qHisto = supabase.from('rapports_mensuels').select('*').order('genere_le', { ascending: false });
    if (etId) qHisto = qHisto.eq('etablissement_id', etId);
    const { data: histo } = await qHisto;
    setHistorique(histo || []);

    let qDest = supabase.from('rapport_destinataires').select('*');
    if (etId) qDest = qDest.eq('etablissement_id', etId);
    const { data: dest } = await qDest;
    setDestinataires(dest || []);

    // Charger la config du contenu du rapport
    let qConf = supabase.from('rapport_config').select('*');
    if (etId) qConf = qConf.eq('etablissement_id', etId);
    const { data: confData } = await qConf;
    if (confData && confData.length > 0) {
      const c = confData[0];
      setConfigId(c.id);
      setContenuConfig({
        stock: c.afficher_stock,
        couts: c.afficher_couts,
        plats: c.afficher_plats,
        pertes: c.afficher_pertes,
      });
    } else {
      // Créer la config par défaut
      const { data: nouvelle } = await supabase.from('rapport_config').insert([{
        etablissement_id: etId, afficher_stock: true, afficher_couts: true, afficher_plats: true, afficher_pertes: true,
      }]).select().single();
      if (nouvelle) setConfigId(nouvelle.id);
    }

    setLoading(false);
  }

  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  async function ajouterEmail() {
    if (!newEmail || !newEmail.includes('@')) { toast('Email invalide'); return; }
    const etId = getEtablissementActif();
    await supabase.from('rapport_destinataires').insert([{ email: newEmail, etablissement_id: etId }]);
    setNewEmail('');
    chargerDonnees();
    toast('Destinataire ajouté');
  }

  async function supprimerEmail(id) {
    await supabase.from('rapport_destinataires').delete().eq('id', id);
    chargerDonnees();
  }

  async function toggleContenu(key) {
    const nouvelleConfig = { ...contenuConfig, [key]: !contenuConfig[key] };
    setContenuConfig(nouvelleConfig);
    if (configId) {
      const colMap = { stock: 'afficher_stock', couts: 'afficher_couts', plats: 'afficher_plats', pertes: 'afficher_pertes' };
      await supabase.from('rapport_config').update({ [colMap[key]]: nouvelleConfig[key] }).eq('id', configId);
    }
  }

  async function genererRapport(type) {
    if (!donnees) return;
    const etId = getEtablissementActif();
    await supabase.from('rapports_mensuels').insert([{
      mois: donnees.moisNum, annee: donnees.annee, type: type,
      etablissement_id: etId, donnees_snapshot: { ...donnees, contenuConfig },
    }]);
    chargerDonnees();
    toast('Rapport de ' + donnees.mois + ' ' + donnees.annee + ' généré et enregistré');
  }

  async function envoyerParEmail() {
    if (destinataires.length === 0) { toast('Ajoutez au moins un destinataire dans Paramètres'); return; }
    if (!donnees) return;
    setEnvoiEnCours(true);
    try {
      const res = await fetch('/api/envoyer-rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinataires: destinataires.map(d => d.email),
          mois: donnees.mois, annee: donnees.annee, donnees: donnees, contenuConfig: contenuConfig,
        }),
      });
      const result = await res.json();
      if (result.error) {
        toast('Erreur envoi : ' + result.error);
      } else {
        toast('Email envoyé avec succès à ' + destinataires.map(d => d.email).join(', '));
      }
    } catch (e) {
      toast('Erreur réseau : ' + e.message);
    }
    setEnvoiEnCours(false);
  }

  async function telechargerPDF() {
    const zone = document.getElementById('rapport-capture-zone');
    if (!zone || !donnees) { toast("Impossible de générer le PDF — ouvrez l'aperçu du rapport d'abord"); return; }
    setGenPdfEnCours(true);
    try {
      const canvas = await html2canvas(zone, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Rapport_' + donnees.mois + '_' + donnees.annee + '.pdf');
      toast('PDF téléchargé : Rapport_' + donnees.mois + '_' + donnees.annee + '.pdf');
    } catch (e) {
      toast('Erreur génération PDF : ' + e.message);
    }
    setGenPdfEnCours(false);
  }

  if (loading) return <div style={{ textAlign:'center', padding:'60px', color:'#888780' }}>Chargement...</div>;

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}><i className="ti ti-file-analytics" style={{ marginRight:'8px', verticalAlign:'-2px' }} />Rapport mensuel</div>
        <button onClick={() => genererRapport('manuel')} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-refresh" /> Générer le rapport de {donnees?.mois} {donnees?.annee}
        </button>
      </div>

      {showToast && (
        <div style={{ background:'#eaf3de', color:'#27500a', borderRadius:'10px', padding:'12px 16px', fontSize:'13px', fontWeight:'500', display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
          <i className="ti ti-check" />{toastMsg}
        </div>
      )}

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'apercu',label:'Aperçu du rapport'},{id:'params',label:'Paramètres'},{id:'histo',label:'Historique'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: tab === 'apercu' ? 'block' : 'none' }}>
        {donnees && (
          <div style={{ border:'0.5px solid #e2e0d8', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ background:'#f8f7f4', borderBottom:'0.5px solid #e2e0d8', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:'500', color:'#5f5e5a' }}>
                <i className="ti ti-file-type-pdf" style={{ color:'#a32d2d', fontSize:'16px' }} />
                Rapport — {donnees.mois} {donnees.annee}
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={envoyerParEmail} disabled={envoiEnCours} style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a', display:'flex', alignItems:'center', gap:'5px' }}>
                  <i className="ti ti-mail" /> {envoiEnCours ? 'Envoi...' : 'Envoyer'}
                </button>
                <button onClick={telechargerPDF} disabled={genPdfEnCours} style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'5px' }}>
                  <i className="ti ti-download" /> {genPdfEnCours ? 'Génération...' : 'Télécharger PDF'}
                </button>
              </div>
            </div>

            <div id="rapport-capture-zone" style={{ padding:'28px 32px', background:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', paddingBottom:'16px', borderBottom:'2px solid #2c2c2a' }}>
                <div>
                  <div style={{ fontSize:'20px', fontWeight:'500', color:'#2c2c2a' }}>Rapport mensuel — {donnees.mois} {donnees.annee}</div>
                  <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Le Bistrot du Coin</div>
                </div>
              </div>

              {contenuConfig.stock && (
                <div style={{ marginBottom:'20px' }}>
                  <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Indicateurs clés du mois</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
                    <div style={{ background:'#f8f7f4', borderRadius:'8px', padding:'10px 12px' }}>
                      <div style={{ fontSize:'9px', color:'#888780', textTransform:'uppercase' }}>Valeur du stock</div>
                      <div style={{ fontSize:'16px', fontWeight:'500' }}>{fmt(donnees.valeurStock)} €</div>
                      {donnees.deltaStock !== null && <div style={{ fontSize:'10px', color: donnees.deltaStock < 0 ? '#a32d2d' : '#27500a' }}>{donnees.deltaStock > 0 ? '+' : ''}{donnees.deltaStock.toFixed(1)}%</div>}
                    </div>
                    <div style={{ background:'#eeedfe', borderRadius:'8px', padding:'10px 12px' }}>
                      <div style={{ fontSize:'9px', color:'#888780', textTransform:'uppercase' }}>Marge moyenne</div>
                      <div style={{ fontSize:'16px', fontWeight:'500', color:'#3c3489' }}>{donnees.margeMoyenne.toFixed(1)}%</div>
                    </div>
                    <div style={{ background:'#f8f7f4', borderRadius:'8px', padding:'10px 12px' }}>
                      <div style={{ fontSize:'9px', color:'#888780', textTransform:'uppercase' }}>Commandes fournisseurs</div>
                      <div style={{ fontSize:'16px', fontWeight:'500' }}>{fmt(donnees.totalCommandes)} €</div>
                    </div>
                    {contenuConfig.pertes && (
                      <div style={{ background:'#f8f7f4', borderRadius:'8px', padding:'10px 12px' }}>
                        <div style={{ fontSize:'9px', color:'#888780', textTransform:'uppercase' }}>Pertes & gaspillage</div>
                        <div style={{ fontSize:'16px', fontWeight:'500' }}>{fmt(donnees.totalPertes)} €</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {contenuConfig.couts && (
                <div style={{ marginBottom:'20px' }}>
                  <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Évolution des coûts matières premières</div>
                  <div style={{ fontSize:'12px', color:'#b4b2a9' }}>Données disponibles une fois plusieurs mois d'historique de prix enregistrés.</div>
                </div>
              )}

              {contenuConfig.plats && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Top plats les plus rentables</div>
                    {donnees.topPlats.length === 0 ? <div style={{ fontSize:'12px', color:'#b4b2a9' }}>Pas assez de données</div> : donnees.topPlats.map((p, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid #f1efe8', fontSize:'12px' }}>
                        <span>{p.nom}</span>
                        <span style={{ padding:'1px 7px', borderRadius:'8px', background:'#eaf3de', color:'#27500a', fontWeight:'500' }}>{p.marge.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Plats à surveiller</div>
                    {donnees.bottomPlats.length === 0 ? <div style={{ fontSize:'12px', color:'#b4b2a9' }}>Pas assez de données</div> : donnees.bottomPlats.map((p, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid #f1efe8', fontSize:'12px' }}>
                        <span>{p.nom}</span>
                        <span style={{ padding:'1px 7px', borderRadius:'8px', background: p.marge < 50 ? '#fcebeb' : '#eaf3de', color: p.marge < 50 ? '#a32d2d' : '#27500a', fontWeight:'500' }}>{p.marge.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contenuConfig.pertes && (
                <div>
                  <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Pertes & gaspillage du mois ({fmt(donnees.totalPertes)} €)</div>
                  {donnees.pertesDetail.length === 0 ? <div style={{ fontSize:'12px', color:'#b4b2a9' }}>Aucune perte enregistrée ce mois-ci</div> : donnees.pertesDetail.map((p, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'0.5px solid #f1efe8', fontSize:'12px' }}>
                      <span>{p.nom} — {p.type_perte}</span>
                      <span style={{ fontWeight:'500', color:'#a32d2d' }}>−{fmt(p.total)} €</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop:'0.5px solid #e2e0d8', paddingTop:'8px', marginTop:'16px', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#b4b2a9' }}>
                <span>Le Bistrot du Coin · Rapport généré par {APP_NAME}</span>
                <span>Généré le {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {tab === 'params' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Envoi automatique</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'0.5px solid #f1efe8' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>Envoi automatique le 1er de chaque mois</div>
                <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Le rapport du mois précédent est généré et envoyé automatiquement</div>
              </div>
              <div onClick={() => setAutoEnvoi(!autoEnvoi)} style={{ width:'40px', height:'22px', borderRadius:'11px', background: autoEnvoi ? '#534ab7' : '#d3d1c7', position:'relative', cursor:'pointer', flexShrink:0 }}>
                <div style={{ position:'absolute', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', top:'3px', left: autoEnvoi ? '21px' : '3px', transition:'0.2s' }} />
              </div>
            </div>
            <div style={{ padding:'12px 0', borderBottom:'0.5px solid #f1efe8' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a', marginBottom:'10px' }}>Destinataires ({destinataires.length})</div>
              {destinataires.map(d => (
                <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0' }}>
                  <span style={{ fontSize:'13px', color:'#5f5e5a' }}>{d.email}</span>
                  <button onClick={() => supprimerEmail(d.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888780' }}><i className="ti ti-x" /></button>
                </div>
              ))}
            </div>
            <div style={{ padding:'12px 0' }}>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemple.com" style={{ width:'240px', fontSize:'13px', padding:'8px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7' }} />
                <button onClick={ajouterEmail} style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'13px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}><i className="ti ti-plus" /> Ajouter</button>
              </div>
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Contenu du rapport</div>
            {[{key:'stock',label:'Valeur du stock'},{key:'couts',label:'Évolution des coûts matières premières'},{key:'plats',label:'Top & bottom plats'},{key:'pertes',label:'Pertes & gaspillage'}].map((item, i) => (
              <div key={item.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom: i<3 ? '0.5px solid #f1efe8' : 'none' }}>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{item.label}</div>
                <div onClick={() => toggleContenu(item.key)} style={{ width:'40px', height:'22px', borderRadius:'11px', background: contenuConfig[item.key] ? '#534ab7' : '#d3d1c7', position:'relative', cursor:'pointer', flexShrink:0 }}>
                  <div style={{ position:'absolute', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', top:'3px', left: contenuConfig[item.key] ? '21px' : '3px', transition:'0.2s' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop:'10px', fontSize:'12px', color:'#888780' }}>Les sections désactivées disparaissent immédiatement de l'aperçu, du PDF et de l'email.</div>
          </div>
        </div>
      )}

      {tab === 'histo' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Rapports générés</div>
          {historique.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucun rapport généré pour le moment.</div>
          ) : historique.map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f8f7f4', borderRadius:'8px', marginBottom:'8px' }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>Rapport — {new Date(r.annee, r.mois-1).toLocaleDateString('fr-FR', {month:'long', year:'numeric'})}</div>
                <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Généré le {new Date(r.genere_le).toLocaleDateString('fr-FR')}</div>
              </div>
              <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: r.type === 'automatique' ? '#eeedfe' : '#f1efe8', color: r.type === 'automatique' ? '#3c3489' : '#5f5e5a' }}>
                {r.type === 'automatique' ? 'Automatique' : 'Manuel'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
