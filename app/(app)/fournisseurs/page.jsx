'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { getEtablissementActif } from '../../../lib/etablissement';

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom:'', contact:'', email:'', telephone:'', ville:'', delai_livraison:'' });

  useEffect(() => {
    chargerFournisseurs();
  }, []);

  async function chargerFournisseurs() {
    setLoading(true);
    const etId = getEtablissementActif();
    let query = supabase.from('fournisseurs').select('*').order('created_at', { ascending: false });
    if (etId) query = query.eq('etablissement_id', etId);
    const { data, error } = await query;
    if (!error) setFournisseurs(data);
    setLoading(false);
  }

  async function ajouterFournisseur() {
    if (!form.nom) { alert('Le nom est obligatoire'); return; }
    const etId = getEtablissementActif();
    const { error } = await supabase.from('fournisseurs').insert([{ ...form, etablissement_id: etId }]);
    if (error) { alert('Erreur : ' + error.message); return; }
    setModal(false);
    setForm({ nom:'', contact:'', email:'', telephone:'', ville:'', delai_livraison:'' });
    chargerFournisseurs();
  }

  async function supprimerFournisseur(id) {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    const { error } = await supabase.from('fournisseurs').delete().eq('id', id);
    if (error) { alert('Erreur : ' + error.message); return; }
    chargerFournisseurs();
  }

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Fournisseurs</div>
        <button onClick={() => setModal(true)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Ajouter un fournisseur
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#888780' }}>Chargement...</div>
      ) : fournisseurs.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'40px', textAlign:'center', color:'#888780' }}>
          Aucun fournisseur pour cet établissement. Cliquez sur "Ajouter un fournisseur" pour commencer.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'12px' }}>
          {fournisseurs.map(f => (
            <div key={f.id} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>{f.nom}</div>
                  <div style={{ fontSize:'12px', color:'#888780' }}>{f.ville || '—'}</div>
                </div>
                <button onClick={() => supprimerFournisseur(f.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}><i className="ti ti-user" style={{ color:'#888780', fontSize:'14px' }} />{f.contact || '—'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}><i className="ti ti-mail" style={{ color:'#888780', fontSize:'14px' }} />{f.email || '—'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}><i className="ti ti-phone" style={{ color:'#888780', fontSize:'14px' }} />{f.telephone || '—'}</div>
              </div>
              <div style={{ background:'#f8f7f4', borderRadius:'8px', padding:'8px 12px', textAlign:'center' }}>
                <div style={{ fontSize:'10px', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>Délai livraison</div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>{f.delai_livraison || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'440px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'16px' }}>Ajouter un fournisseur</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Nom du fournisseur *" value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <input placeholder="Nom du contact" value={form.contact} onChange={e => setForm({...form, contact:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <input placeholder="Téléphone" value={form.telephone} onChange={e => setForm({...form, telephone:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <input placeholder="Ville" value={form.ville} onChange={e => setForm({...form, ville:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <select value={form.delai_livraison} onChange={e => setForm({...form, delai_livraison:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="">Délai de livraison</option>
                <option>J+1</option><option>J+2</option><option>J+3</option>
              </select>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={ajouterFournisseur} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
