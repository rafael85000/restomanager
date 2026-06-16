'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function Commandes() {
  const [tab, setTab] = useState('panier');
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [panier, setPanier] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSugg, setShowSugg] = useState(false);

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    setLoading(true);
    const { data: prod } = await supabase.from('produits').select('*, fournisseurs(nom)');
    const { data: fourn } = await supabase.from('fournisseurs').select('*');
    const { data: cmds } = await supabase.from('commandes').select('*, fournisseurs(nom), commande_lignes(*)').order('date_commande', { ascending: false });
    setProduits(prod || []);
    setFournisseurs(fourn || []);
    setHistorique(cmds || []);
    setLoading(false);
  }

  const suggestions = produits.filter(p => search && p.nom.toLowerCase().includes(search.toLowerCase()));

  function ajouterAuPanier(p) {
    if (panier.find(l => l.produit_id === p.id)) return;
    setPanier([...panier, { produit_id: p.id, nom: p.nom, fourn: p.fournisseurs?.nom, fournisseur_id: p.fournisseur_id, prix: p.prix_ht, qte: 1 }]);
    setSearch('');
    setShowSugg(false);
  }

  function majQte(idx, val) {
    const copie = [...panier];
    copie[idx].qte = parseFloat(val) || 0;
    setPanier(copie);
  }

  function retirerDuPanier(idx) {
    setPanier(panier.filter((_, i) => i !== idx));
  }

  const total = panier.reduce((s,l) => s + l.qte*l.prix, 0);
  const byFourn = panier.reduce((acc,l) => {
    const f = l.fourn || 'Sans fournisseur';
    acc[f] = (acc[f]||0) + l.qte*l.prix;
    return acc;
  }, {});

  async function envoyerCommande() {
    if (panier.length === 0) { alert('Le panier est vide.'); return; }

    const groupesParFourn = panier.reduce((acc,l) => {
      const fid = l.fournisseur_id || 'sans';
      if (!acc[fid]) acc[fid] = [];
      acc[fid].push(l);
      return acc;
    }, {});

    for (const [fid, lignes] of Object.entries(groupesParFourn)) {
      const montant = lignes.reduce((s,l) => s + l.qte*l.prix, 0);
      const { data: cmd, error } = await supabase.from('commandes').insert([{
        fournisseur_id: fid === 'sans' ? null : fid,
        date_commande: new Date().toISOString().split('T')[0],
        montant_total: montant,
        statut: 'envoyee',
      }]).select().single();

      if (error) { alert('Erreur : ' + error.message); continue; }

      const lignesAInserer = lignes.map(l => ({
        commande_id: cmd.id,
        produit_id: l.produit_id,
        quantite: l.qte,
        prix_unitaire: l.prix,
      }));
      await supabase.from('commande_lignes').insert(lignesAInserer);
    }

    setPanier([]);
    chargerDonnees();
    alert('Commande(s) envoyée(s) avec succès !');
  }

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Bons de commande</div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'panier', label:'Panier en cours'}, {id:'historique', label:'Historique'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'panier' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Ajouter un produit</div>
            <div style={{ position:'relative', marginBottom:'16px' }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setShowSugg(true); }} placeholder="Rechercher un produit de la mercuriale..." style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', outline:'none' }} />
              {showSugg && suggestions.length > 0 && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'0.5px solid #e2e0d8', borderRadius:'10px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', zIndex:50, marginTop:'4px', maxHeight:'220px', overflowY:'auto' }}>
                  {suggestions.map(p => (
                    <div key={p.id} onClick={() => ajouterAuPanier(p)} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'0.5px solid #f1efe8' }}>
                      <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</div>
                      <div style={{ fontSize:'11px', color:'#888780' }}>{p.fournisseurs?.nom || '—'} — {parseFloat(p.prix_ht).toFixed(2)} €/kg</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {panier.length === 0 ? (
              <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Panier vide. Recherchez un produit ci-dessus.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                <thead>
                  <tr>
                    {['Produit','Fournisseur','Qté','Prix/kg','Total',''].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign: ['Qté','Prix/kg','Total'].includes(h) ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {panier.map((l,i) => (
                    <tr key={i} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                      <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{l.nom}</td>
                      <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{l.fourn || '—'}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right' }}>
                        <input value={l.qte} onChange={e => majQte(i, e.target.value)} type="number" style={{ width:'60px', padding:'4px 8px', borderRadius:'6px', border:'0.5px solid #d3d1c7', fontSize:'13px', textAlign:'right', fontFamily:'monospace' }} />
                      </td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'#5f5e5a' }}>{parseFloat(l.prix).toFixed(2)} €</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'500', fontFamily:'monospace', color:'#2c2c2a' }}>{(l.qte*l.prix).toFixed(2)} €</td>
                      <td style={{ padding:'10px 12px', textAlign:'right' }}>
                        <button onClick={() => retirerDuPanier(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ background:'#534ab7', borderRadius:'12px', padding:'16px', color:'#fff' }}>
              <div style={{ fontSize:'11px', color:'#cecbf6', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Total commande</div>
              <div style={{ fontSize:'26px', fontWeight:'500', marginBottom:'12px' }}>{total.toFixed(2)} €</div>
              {Object.entries(byFourn).map(([f,v]) => (
                <div key={f} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'4px 0', borderTop:'0.5px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ color:'#cecbf6' }}>{f}</span>
                  <span style={{ fontWeight:'500' }}>{v.toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <button onClick={envoyerCommande} style={{ padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <i className="ti ti-mail" /> Envoyer aux fournisseurs
            </button>
          </div>
        </div>
      )}

      {tab === 'historique' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Chargement...</div>
          ) : historique.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucune commande passée pour le moment.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr>
                  {['Fournisseur','Date','Nb produits','Montant HT','Statut'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign: h==='Montant HT' ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historique.map(c => (
                  <tr key={c.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                    <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{c.fournisseurs?.nom || '—'}</td>
                    <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{new Date(c.date_commande).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{c.commande_lignes?.length || 0} produits</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'500', fontFamily:'monospace', color:'#534ab7' }}>{parseFloat(c.montant_total).toFixed(2)} €</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:'#eaf3de', color:'#27500a', fontWeight:'500' }}>{c.statut}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
