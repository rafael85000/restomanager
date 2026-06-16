'use client';
import { useState } from 'react';

const produits = [
  { id:1, nom:'Poulet fermier label rouge', type:'mercuriale', dlc:'2026-06-15', ouverture:'2026-06-12', statut:'depasse' },
  { id:2, nom:'Crème fleurette 35%', type:'mercuriale', dlc:'2026-06-16', ouverture:'2026-06-13', statut:'depasse' },
  { id:3, nom:'Mousse Praliné', type:'preparation', dlc:'2026-06-18', ouverture:'2026-06-15', statut:'urgent' },
  { id:4, nom:'Sauce burger maison', type:'preparation', dlc:'2026-06-19', ouverture:'2026-06-16', statut:'urgent' },
  { id:5, nom:'Fond de tarte', type:'preparation', dlc:'2026-06-21', ouverture:'2026-06-18', statut:'ok' },
  { id:6, nom:'Beurre doux', type:'mercuriale', dlc:'2026-06-25', ouverture:'2026-06-20', statut:'ok' },
  { id:7, nom:'Noisettes torréfiées', type:'mercuriale', dlc:'2026-07-15', ouverture:'2026-06-01', statut:'ok' },
];

const statutConfig = {
  depasse: { label:'DLC dépassée', bg:'#fcebeb', col:'#a32d2d', icon:'ti-alert-circle' },
  urgent: { label:'Urgent — < 3 jours', bg:'#faeeda', col:'#854f0b', icon:'ti-alert-triangle' },
  ok: { label:'OK', bg:'#eaf3de', col:'#27500a', icon:'ti-check' },
};

export default function DLC() {
  const [tab, setTab] = useState('tous');

  const filtered = tab === 'tous' ? produits : produits.filter(p => p.statut === tab);
  const nbDepasse = produits.filter(p => p.statut === 'depasse').length;
  const nbUrgent = produits.filter(p => p.statut === 'urgent').length;

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Suivi des DLC</div>
        <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Ajouter un produit
        </button>
      </div>

      {nbDepasse > 0 && (
        <div style={{ background:'#fcebeb', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
          <i className="ti ti-alert-circle" style={{ color:'#a32d2d', fontSize:'18px', flexShrink:0 }} />
          <div style={{ fontSize:'13px', color:'#791f1f' }}>
            <strong>{nbDepasse} produit(s) avec DLC dépassée</strong> — à retirer immédiatement du service et à enregistrer dans les pertes.
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
        {[
          { label:'DLC dépassées', val:nbDepasse, bg:'#fcebeb', col:'#a32d2d' },
          { label:'Urgents (< 3j)', val:nbUrgent, bg:'#faeeda', col:'#854f0b' },
          { label:'OK', val:produits.filter(p=>p.statut==='ok').length, bg:'#eaf3de', col:'#27500a' },
        ].map((c,i) => (
          <div key={i} style={{ background:c.bg, borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px' }}>
            <div style={{ fontSize:'11px', color:c.col, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>{c.label}</div>
            <div style={{ fontSize:'28px', fontWeight:'500', color:c.col }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
          {[{id:'tous',label:'Tous'},{id:'depasse',label:'DLC dépassée'},{id:'urgent',label:'Urgent'},{id:'ok',label:'OK'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'7px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
              {t.label}
            </button>
          ))}
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr>
              {['Produit','Type','Date ouverture','DLC','Statut','Actions'].map(h => (
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const s = statutConfig[p.statut];
              return (
                <tr key={p.id} style={{ borderBottom:'0.5px solid #f1efe8', background: p.statut==='depasse' ? '#fff8f8' : '#fff' }}>
                  <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background: p.type==='preparation' ? '#eeedfe' : '#f1efe8', color: p.type==='preparation' ? '#3c3489' : '#5f5e5a', fontWeight:'500' }}>
                      {p.type === 'preparation' ? 'Préparation' : 'Mercuriale'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{new Date(p.ouverture).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding:'10px 12px', fontWeight:'500', color: p.statut==='depasse' ? '#a32d2d' : '#2c2c2a' }}>{new Date(p.dlc).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:s.bg, color:s.col, fontWeight:'500', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                      <i className={"ti "+s.icon} style={{ fontSize:'11px' }} />{s.label}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <button style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Consommé</button>
                      <button style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #f09595', background:'#fcebeb', color:'#a32d2d' }}>Jeter → Perte</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
