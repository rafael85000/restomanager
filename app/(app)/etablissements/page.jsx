'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function Etablissements() {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom:'', adresse:'', ville:'', plan:'starter' });

  useEffect(() => { charger(); }, []);

  async function charger() {
    setLoading(true);
    const { data } = await supabase.from('etablissements').select('*').order('created_at');
    setEtablissements(data || []);
    setLoading(false);
  }

  async function ajouter() {
    if (!form.nom) { alert('Le nom est obligatoire'); return; }
    const { error } = await supabase.from('etablissements').insert([form]);
    if (error) { alert('Erreur : ' + error.message); return; }
    setModal(false);
    setForm({ nom:'', adresse:'', ville:'', plan:'starter' });
    charger();
  }

  const planInfo = {
    starter: { label:'Starter', prix:'29€/mois', col:'#5f5e5a', bg:'#f1efe8' },
    pro: { label:'Pro', prix:'49€/mois', col:'#3c3489', bg:'#eeedfe' },
    multi: { label:'Multi', prix:'79€/mois', col:'#854f0b', bg:'#faeeda' },
  };

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Établissements</div>
        <button onClick={() => setModal(true)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Ajouter un établissement
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Chargement...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'12px' }}>
          {etablissements.map(et => {
            const pi = planInfo[et.plan] || planInfo.starter;
            return (
              <div key={et.id} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                  <div>
                    <div style={{ fontSize:'15px', fontWeight:'500', color:'#2c2c2a' }}>{et.nom}</div>
                    <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>{et.ville}</div>
                  </div>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: et.actif ? '#639922' : '#d3d1c7' }} />
                </div>
                <div style={{ background:pi.bg, borderRadius:'8px', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'12px', fontWeight:'500', color:pi.col }}>Plan {pi.label}</span>
                  <span style={{ fontSize:'12px', color:pi.col }}>{pi.prix}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'420px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'16px' }}>Nouvel établissement</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Nom du restaurant *" value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <input placeholder="Adresse" value={form.adresse} onChange={e => setForm({...form, adresse:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <input placeholder="Ville" value={form.ville} onChange={e => setForm({...form, ville:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <select value={form.plan} onChange={e => setForm({...form, plan:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="starter">Starter — 29€/mois</option>
                <option value="pro">Pro — 49€/mois</option>
                <option value="multi">Multi — 79€/mois</option>
              </select>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={ajouter} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
