'use client';
import { useState } from 'react';

const produits = [
  { id:1, ref:'P001', nom:'Poulet fermier label rouge', fourn:'Metro', categorie:'Viandes', prix:6.95, allergenes:[] },
  { id:2, ref:'P002', nom:'Carottes', fourn:'Pomona', categorie:'Légumes', prix:1.50, allergenes:[] },
  { id:3, ref:'P003', nom:'Crème fleurette 35%', fourn:'Pomona', categorie:'Crèmerie', prix:3.00, allergenes:['Lait'] },
  { id:4, ref:'P004', nom:'Pommes de terre Agata', fourn:'Pomona', categorie:'Légumes', prix:1.20, allergenes:[] },
  { id:5, ref:'P005', nom:'Noisettes torréfiées', fourn:'Brake France', categorie:'Épicerie', prix:12.00, allergenes:['Fruits à coque'] },
  { id:6, ref:'P006', nom:'Fond de veau', fourn:'Metro', categorie:'Épicerie', prix:4.80, allergenes:[] },
  { id:7, ref:'P007', nom:'Beurre doux', fourn:'Metro', categorie:'Crèmerie', prix:8.00, allergenes:['Lait'] },
  { id:8, ref:'P008', nom:'Magret de canard LR', fourn:'Metro', categorie:'Viandes', prix:18.50, allergenes:[] },
];

const categories = ['Toutes', 'Viandes', 'Légumes', 'Crèmerie', 'Épicerie'];
const fournisseurs = ['Tous', 'Metro', 'Pomona', 'Brake France'];

export default function Mercuriale() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Toutes');
  const [fourn, setFourn] = useState('Tous');
  const [modal, setModal] = useState(false);

  const filtered = produits.filter(p => {
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && !p.ref.toLowerCase().includes(search.toLowerCase())) return false;
    if (cat !== 'Toutes' && p.categorie !== cat) return false;
    if (fourn !== 'Tous' && p.fourn !== fourn) return false;
    return true;
  });

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Mercuriale</div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a', display:'flex', alignItems:'center', gap:'6px' }}>
            <i className="ti ti-upload" /> Importer Excel / CSV
          </button>
          <button onClick={() => setModal(true)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
            <i className="ti ti-plus" /> Ajouter un produit
          </button>
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
        <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit ou une référence..." style={{ flex:1, minWidth:'200px', padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', outline:'none' }} />
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', background:'#fff' }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={fourn} onChange={e => setFourn(e.target.value)} style={{ padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', background:'#fff' }}>
            {fournisseurs.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr>
              <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>Réf</th>
              <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>Désignation</th>
              <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>Fournisseur</th>
              <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>Catégorie</th>
              <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>Prix HT/kg</th>
              <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>Allergènes</th>
              <th style={{ padding:'8px 12px', borderBottom:'0.5px solid #e2e0d8' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                <td style={{ padding:'10px 12px', color:'#888780', fontFamily:'monospace', fontSize:'12px' }}>{p.ref}</td>
                <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</td>
                <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{p.fourn}</td>
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:'#eeedfe', color:'#3c3489', fontWeight:'500' }}>{p.categorie}</span>
                </td>
                <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'500', color:'#2c2c2a', fontFamily:'monospace' }}>{p.prix.toFixed(2)} €</td>
                <td style={{ padding:'10px 12px' }}>
                  {p.allergenes.length > 0
                    ? p.allergenes.map(a => <span key={a} style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'6px', background:'#fcebeb', color:'#791f1f', fontWeight:'500', marginRight:'4px' }}>{a}</span>)
                    : <span style={{ fontSize:'12px', color:'#b4b2a9' }}>—</span>
                  }
                </td>
                <td style={{ padding:'10px 12px', textAlign:'right' }}>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px', marginRight:'6px' }}><i className="ti ti-edit" /></button>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
              <input placeholder="Désignation *" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Référence" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Prix HT/kg *" type="number" step="0.01" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <select style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option>Sélectionner un fournisseur</option>
                <option>Metro</option><option>Pomona</option><option>Brake France</option>
              </select>
              <select style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option>Sélectionner une catégorie</option>
                <option>Viandes</option><option>Légumes</option><option>Crèmerie</option><option>Épicerie</option>
              </select>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Annuler</button>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
