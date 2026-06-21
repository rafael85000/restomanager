'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { getEtablissementActif } from '../../../lib/etablissement';

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nom:'', contact:'', email:'', telephone:'', ville:'', delai_livraison:'' });

  useEffect(() => {
    chargerFournisseurs();
  }, []);

  async function chargerFournisseurs() {
    setLoading(true);
    const etId = getEtablissementActif();
    let query = supabase.from('fournisseurs').select('*').order('nom', { ascending: true });
    if (etId) query = query.eq('etablissement_id', etId);
    const { data, error } = await query;
    if (!error) setFournisseurs(data);
    setLoading(false);
  }

  function ouvrirAjout() {
    setEditId(null);
    setForm({ nom:'', contact:'', email:'', telephone:'', ville:'', delai_livraison:'' });
    setModal(true);
  }

  function ouvrirModif(f) {
    setEditId(f.id);
    setForm({ nom: f.nom || '', contact: f.contact || '', email: f.email || '', telephone: f.telephone || '', ville: f.ville || '', delai_livraison: f.delai_livraison || '' });
    setModal(true);
  }

  async function sauvegarder() {
    if (!form.nom) { alert('Le nom est obligatoire'); return; }
    const etId = getEtablissementActif();
    if (editId) {
      const { error } = await supabase.from('fournisseurs').update({ ...form }).eq('id', editId);
      if (error) { alert('Erreur : ' + error.message); return; }
    } else {
      const { error } = await supabase.from('fournisseurs').insert([{ ...form, etablissement_id: etId }]);
      if (error) { alert('Erreur : ' + error.message); return; }
    }
    setModal(false);
    setEditId(null);
    setForm({ nom:'', contact:'', email:'', telephone:'', ville:'', delai_livraison:'' });
    chargerFournisseurs();
  }

  async function supprimerFournisseur(id, nom) {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    const { error } = await supabase.from('fournisseurs').delete().eq('id', id);
    if (error) { alert('Erreur : ' + error.message); return; }
    chargerFournisseurs();
  }

  const liste = fournisseurs.filter(f =>
    !search || f.nom?.toLowerCase().includes(search.toLowerCase()) ||
    f.ville?.toLowerCase().includes(search.toLowerCase()) ||
    f.contact?.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = { padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none', width:'100%' };

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* HEADER */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Fournisseurs</div>
          <div style={{ fontSize:'12px', color:'#888780', marginTop:2 }}>{fournisseurs.length} fournisseur{fournisseurs.length !== 1 ? 's' : ''}</div>
        </div>
        <button onClick={ouvrirAjout} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Ajouter un fournisseur
        </button>
      </div>

      {/* BARRE DE RECHERCHE */}
      {fournisseurs.length > 0 && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'12px 16px', marginBottom:'16px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher par nom, ville ou contact…"
            style={{ ...inputStyle, fontSize:'13px' }}
          />
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#888780' }}>Chargement...</div>
      ) : liste.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'40px', textAlign:'center', color:'#888780' }}>
          {search ? `Aucun fournisseur trouvé pour "${search}"` : 'Aucun fournisseur. Cliquez sur "Ajouter un fournisseur" pour commencer.'}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'12px' }}>
          {liste.map(f => (
            <div key={f.id} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>{f.nom}</div>
                  <div style={{ fontSize:'12px', color:'#888780' }}>{f.ville || '—'}</div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button
                    onClick={() => ouvrirModif(f)}
                    title="Modifier"
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px', padding:'4px 6px', borderRadius:'6px' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#eeedfe'; e.currentTarget.style.color='#534ab7' }}
                    onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#888780' }}>
                    <i className="ti ti-pencil" />
                  </button>
                  <button
                    onClick={() => supprimerFournisseur(f.id, f.nom)}
                    title="Supprimer"
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px', padding:'4px 6px', borderRadius:'6px' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#fcebeb'; e.currentTarget.style.color='#a32d2d' }}
                    onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#888780' }}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                  <i className="ti ti-user" style={{ color:'#888780', fontSize:'14px' }} />{f.contact || '—'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                  <i className="ti ti-mail" style={{ color:'#888780', fontSize:'14px' }} />
                  {f.email ? <a href={`mailto:${f.email}`} style={{ color:'#534ab7', textDecoration:'none' }}>{f.email}</a> : '—'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                  <i className="ti ti-phone" style={{ color:'#888780', fontSize:'14px' }} />
                  {f.telephone ? <a href={`tel:${f.telephone}`} style={{ color:'#534ab7', textDecoration:'none' }}>{f.telephone}</a> : '—'}
                </div>
              </div>
              <div style={{ background:'#f8f7f4', borderRadius:'8px', padding:'8px 12px', textAlign:'center' }}>
                <div style={{ fontSize:'10px', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>Délai livraison</div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>{f.delai_livraison || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL AJOUT / MODIFICATION */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'440px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'16px' }}>
              {editId ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:4 }}>Nom *</label>
                <input placeholder="Nom du fournisseur" value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:4 }}>Contact</label>
                <input placeholder="Nom du contact" value={form.contact} onChange={e => setForm({...form, contact:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:4 }}>Email</label>
                <input placeholder="email@fournisseur.fr" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:4 }}>Téléphone</label>
                <input placeholder="06 00 00 00 00" value={form.telephone} onChange={e => setForm({...form, telephone:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:4 }}>Ville</label>
                <input placeholder="Paris" value={form.ville} onChange={e => setForm({...form, ville:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:4 }}>Délai de livraison</label>
                <select value={form.delai_livraison} onChange={e => setForm({...form, delai_livraison:e.target.value})} style={{ ...inputStyle, background:'#fff' }}>
                  <option value="">— Sélectionner —</option>
                  <option>J+1</option>
                  <option>J+2</option>
                  <option>J+3</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Annuler</button>
              <button onClick={sauvegarder} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', fontWeight:500 }}>
                {editId ? 'Enregistrer les modifications' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}