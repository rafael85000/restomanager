'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function Mercuriale() {
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nom:'', reference:'', prix_ht:'', fournisseur_id:'', categorie:'' });

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setLoading(true);
    const { data: prod } = await supabase.from('produits').select('*, fournisseurs(nom)').order('created_at', { ascending: false });
    const { data: fourn } = await supabase.from('fournisseurs').select('*');
    setProduits(prod || []);
    setFournisseurs(fourn || []);
    setLoading(false);
  }

  async function ajouterProduit() {
    if (!form.nom || !form.prix_ht) { alert('Nom et prix sont obligatoires'); return; }
    const { error } = await supabase.from('produits').insert([{
      nom: form.nom,
      reference: form.reference,
      prix_ht: parseFloat(form.prix_ht),
      fournisseur_id: form.fournisseur_id || null,
      categorie: form.categorie,
    }]);
    if (error) { alert('Erreur : ' + error.message); return; }
    setModal(false);
    setForm({ nom:'', reference:'', prix_ht:'', fournisseur_id:'', categorie:'' });
    chargerDonnees();
  }

  async function supprimerProduit(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    const { error } = await supabase.from('produits').delete().eq('id', id);
    if (error) { alert('Erreur : ' + error.message); return; }
    chargerDonnees();
  }

  const filtered = produits.filter(p => !search || p.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Mercuriale</div>
        <button onClick={() => setModal(true)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Ajouter un produit
        </button>
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..." style={{ width:'100%', marginBottom:'16px', padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', outline:'none' }} />

        {loading ? (
          <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucun produit. Cliquez sur "Ajouter un produit".</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr>
                {['Réf','Désignation','Fournisseur','Catégorie','Prix HT/kg','Allergènes',''].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign: h==='Prix HT/kg' ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                  <td style={{ padding:'10px 12px', color:'#888780', fontFamily:'monospace', fontSize:'12px' }}>{p.reference || '—'}</td>
                  <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</td>
                  <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{p.fournisseurs?.nom || '—'}</td>
                  <td style={{ padding:'10px 12px' }}>
                    {p.categorie && <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:'#eeedfe', color:'#3c3489', fontWeight:'500' }}>{p.categorie}</span>}
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'500', color:'#2c2c2a', fontFamily:'monospace' }}>{parseFloat(p.prix_ht).toFixed(2)} €</td>
                  <td style={{ padding:'10px 12px' }}>
                    {p.allergenes && p.allergenes.length > 0
                      ? p.allergenes.map(a => <span key={a} style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'6px', background:'#fcebeb', color:'#791f1f', fontWeight:'500', marginRight:'4px' }}>{a}</span>)
                      : <span style={{ fontSize:'12px', color:'#b4b2a9' }}>—</span>
                    }
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>
                    <button onClick={() => supprimerProduit(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop:'14px', padding:'10px 16px', background:'#f8f7f4', borderRadius:'8px', display:'flex', justifyContent:'space-between', fontSize:'13px' }}>
          <span style={{ color:'#888780' }}>{filtered.length} produit(s) affiché(s)</span>
          <span style={{ color:'#888780' }}>{produits.length} produits au total</span>
        </div>
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'440px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>Ajouter un produit</div>
            <div style={{ fontSize:'13px', color:'#888780', marginBottom:'16px' }}>Le produit sera ajouté à votre mercuriale.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Désignation *" value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Référence" value={form.reference} onChange={e => setForm({...form, reference:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Prix HT/kg *" type="number" step="0.01" value={form.prix_ht} onChange={e => setForm({...form, prix_ht:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <select value={form.fournisseur_id} onChange={e => setForm({...form, fournisseur_id:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
              <select value={form.categorie} onChange={e => setForm({...form, categorie:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="">Sélectionner une catégorie</option>
                <option>Viandes</option><option>Légumes</option><option>Crèmerie</option><option>Épicerie</option>
              </select>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Annuler</button>
              <button onClick={ajouterProduit} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
