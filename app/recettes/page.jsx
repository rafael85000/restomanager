'use client';
import { useState } from 'react';

const recettes = [
  { id:1, nom:'Burger maison', categorie:'Plats', portions:4, cout:3.85, pv:16.50, marge:74.2, temps:'35 min', allergenes:['Gluten','Lait','Oeufs'] },
  { id:2, nom:'Mousse Praliné', categorie:'Desserts', portions:8, cout:1.47, pv:8.50, marge:82.7, temps:'40 min', allergenes:['Lait','Fruits à coque'] },
  { id:3, nom:'Magret de canard', categorie:'Plats', portions:2, cout:8.20, pv:28.00, marge:70.7, temps:'27 min', allergenes:['Sulfites'] },
  { id:4, nom:'Salade César', categorie:'Entrées', portions:2, cout:4.20, pv:13.50, marge:68.9, temps:'15 min', allergenes:['Gluten','Lait','Oeufs','Anchois'] },
  { id:5, nom:'Tarte au citron', categorie:'Desserts', portions:6, cout:1.20, pv:7.50, marge:84.0, temps:'50 min', allergenes:['Gluten','Lait','Oeufs'] },
  { id:6, nom:'Fondant chocolat', categorie:'Desserts', portions:6, cout:1.35, pv:7.00, marge:80.7, temps:'30 min', allergenes:['Gluten','Lait','Oeufs'] },
];

const categories = ['Toutes','Plats','Entrées','Desserts'];

export default function Recettes() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Toutes');

  const filtered = recettes.filter(r => {
    if (search && !r.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (cat !== 'Toutes' && r.categorie !== cat) return false;
    return true;
  });

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Fiches recettes</div>
        <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Nouvelle recette
        </button>
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
        <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une recette..." style={{ flex:1, padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', outline:'none' }} />
          <div style={{ display:'flex', gap:'6px' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: cat===c ? '#afa9ec' : '#d3d1c7', background: cat===c ? '#eeedfe' : '#fff', color: cat===c ? '#3c3489' : '#5f5e5a' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr>
              {['Nom','Catégorie','Portions','Temps','Coût/portion','Prix vente','Marge','Allergènes',''].map(h => (
                <th key={h} style={{ padding:'8px 12px', textAlign: ['Coût/portion','Prix vente','Marge'].includes(h) ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{r.nom}</td>
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background: r.categorie==='Plats' ? '#eeedfe' : r.categorie==='Desserts' ? '#faeeda' : '#eaf3de', color: r.categorie==='Plats' ? '#3c3489' : r.categorie==='Desserts' ? '#854f0b' : '#27500a', fontWeight:'500' }}>{r.categorie}</span>
                </td>
                <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{r.portions} pers.</td>
                <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{r.temps}</td>
                <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'#2c2c2a' }}>{r.cout.toFixed(2)} €</td>
                <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'#2c2c2a' }}>{r.pv.toFixed(2)} €</td>
                <td style={{ padding:'10px 12px', textAlign:'right' }}>
                  <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: r.marge >= 70 ? '#eaf3de' : r.marge >= 50 ? '#faeeda' : '#fcebeb', color: r.marge >= 70 ? '#27500a' : r.marge >= 50 ? '#854f0b' : '#a32d2d' }}>{r.marge}%</span>
                </td>
                <td style={{ padding:'10px 12px' }}>
                  {r.allergenes.slice(0,2).map(a => <span key={a} style={{ fontSize:'10px', padding:'1px 5px', borderRadius:'5px', background:'#fcebeb', color:'#791f1f', fontWeight:'500', marginRight:'3px' }}>{a}</span>)}
                  {r.allergenes.length > 2 && <span style={{ fontSize:'10px', color:'#888780' }}>+{r.allergenes.length-2}</span>}
                </td>
                <td style={{ padding:'10px 12px', textAlign:'right' }}>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px', marginRight:'6px' }}><i className="ti ti-eye" /></button>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px', marginRight:'6px' }}><i className="ti ti-edit" /></button>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-printer" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop:'14px', padding:'10px 16px', background:'#f8f7f4', borderRadius:'8px', display:'flex', justifyContent:'space-between', fontSize:'13px' }}>
          <span style={{ color:'#888780' }}>{filtered.length} recette(s) affichée(s)</span>
          <span style={{ color:'#888780' }}>Marge moyenne : <strong style={{ color:'#534ab7' }}>{(filtered.reduce((s,r) => s+r.marge, 0)/filtered.length).toFixed(1)}%</strong></span>
        </div>
      </div>
    </div>
  );
}
