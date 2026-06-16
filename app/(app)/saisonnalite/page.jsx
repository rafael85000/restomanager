'use client';
import { useState } from 'react';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const moisActuel = 5;

const produits = [
  { id:1, nom:'Tomates cerises', fourn:'Pomona', mode:'cases', mois:[4,5,6,7,8] },
  { id:2, nom:'Fraises Gariguette', fourn:'Pomona', mode:'periode', debut:3, fin:6 },
  { id:3, nom:'Agneau de lait', fourn:'Metro', mode:'cases', mois:[1,2,3,4] },
  { id:4, nom:'Girolles', fourn:'Brake France', mode:'cases', mois:[5,6,7,8,9] },
  { id:5, nom:'Poulet fermier label rouge', fourn:'Metro', mode:'all', mois:[] },
  { id:6, nom:'Pommes de terre Agata', fourn:'Pomona', mode:'cases', mois:[6,7,8,9,10,11] },
  { id:7, nom:'Crème fleurette 35%', fourn:'Pomona', mode:'all', mois:[] },
];

function getMois(p) {
  if (p.mode === 'all') return [0,1,2,3,4,5,6,7,8,9,10,11];
  if (p.mode === 'periode') {
    const arr = [];
    for (let i = p.debut; i <= p.fin; i++) arr.push(i);
    return arr;
  }
  return p.mois || [];
}

function getStatut(p) {
  if (p.mode === 'all') return 'all';
  return getMois(p).includes(moisActuel) ? 'saison' : 'hors';
}

export default function Saisonnalite() {
  const [search, setSearch] = useState('');

  const filtered = produits.filter(p => !search || p.nom.toLowerCase().includes(search.toLowerCase()));
  const horsS = produits.filter(p => getStatut(p) === 'hors');

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Saisonnalité des produits</div>
        <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Configurer un produit
        </button>
      </div>

      {horsS.length > 0 && (
        <div style={{ background:'#fcebeb', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
          <i className="ti ti-alert-triangle" style={{ color:'#a32d2d', fontSize:'18px', flexShrink:0 }} />
          <div style={{ fontSize:'13px', color:'#791f1f' }}>
            <strong>{horsS.length} produit(s) hors saison en juin :</strong> {horsS.map(p => p.nom).join(', ')}
          </div>
        </div>
      )}

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..." style={{ width:'280px', padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', outline:'none' }} />
          <span style={{ fontSize:'12px', color:'#888780' }}>{produits.length} produits · {horsS.length} hors saison ce mois-ci</span>
        </div>

        <div style={{ display:'flex', gap:'3px', paddingLeft:'220px', marginBottom:'4px' }}>
          {MOIS.map(m => (
            <div key={m} style={{ flex:1, fontSize:'9px', fontWeight:'500', color:'#888780', textTransform:'uppercase', textAlign:'center' }}>{m}</div>
          ))}
        </div>

        {filtered.map(p => {
          const moisP = getMois(p);
          const statut = getStatut(p);
          return (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'0', padding:'8px 0', borderBottom:'0.5px solid #f1efe8' }}>
              <div style={{ width:'220px', flexShrink:0 }}>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</div>
                <div style={{ fontSize:'11px', color:'#888780' }}>{p.fourn}</div>
              </div>
              <div style={{ display:'flex', gap:'3px', flex:1 }}>
                {MOIS.map((m,i) => (
                  <div key={i} style={{ flex:1, height:'22px', borderRadius:'4px', background: moisP.includes(i) ? '#534ab7' : '#f1efe8', border: i === moisActuel ? '2px solid #d85a30' : '0.5px solid transparent', cursor:'pointer' }} title={m} />
                ))}
              </div>
              <div style={{ width:'110px', textAlign:'right', flexShrink:0, paddingLeft:'12px' }}>
                <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: statut==='all' ? '#eeedfe' : statut==='saison' ? '#eaf3de' : '#fcebeb', color: statut==='all' ? '#3c3489' : statut==='saison' ? '#27500a' : '#a32d2d' }}>
                  {statut==='all' ? 'Toute l\'année' : statut==='saison' ? 'En saison' : 'Hors saison'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
