'use client';
import { useState } from 'react';

const ALLERGENES = ['Gluten','Crustacés','Oeufs','Poissons','Arachides','Soja','Lait','Fruits à coque','Céleri','Moutarde','Sésame','Sulfites','Lupin','Mollusques'];

const produits = [
  { nom:'Pain burger artisanal', allergenes:['Gluten','Sésame'] },
  { nom:'Crème fleurette 35%', allergenes:['Lait'] },
  { nom:'Noisettes torréfiées', allergenes:['Fruits à coque'] },
  { nom:'Beurre doux', allergenes:['Lait'] },
  { nom:'Poulet fermier label rouge', allergenes:[] },
  { nom:'Fond de veau', allergenes:[] },
];

const recettes = [
  { nom:'Burger maison', allergenes:['Gluten','Lait','Oeufs','Moutarde','Sésame'] },
  { nom:'Mousse Praliné', allergenes:['Lait','Fruits à coque','Oeufs'] },
  { nom:'Magret de canard', allergenes:['Sulfites'] },
  { nom:'Salade César', allergenes:['Gluten','Lait','Oeufs','Poissons','Moutarde'] },
  { nom:'Tarte au citron', allergenes:['Gluten','Lait','Oeufs'] },
];

export default function Allergenes() {
  const [tab, setTab] = useState('mercuriale');

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Gestion des allergènes</div>
        <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>14 allergènes réglementaires — Directive UE 1169/2011</div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'mercuriale',label:'Produits mercuriale'},{id:'recettes',label:'Fiches recettes'},{id:'affichage',label:'Affichage restaurant'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mercuriale' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Allergènes par produit</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr>
                <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8', width:'200px' }}>Produit</th>
                {ALLERGENES.map(a => (
                  <th key={a} style={{ padding:'6px 4px', fontSize:'9px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8', textAlign:'center', writingMode:'vertical-rl', transform:'rotate(180deg)', height:'80px' }}>{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produits.map((p,i) => (
                <tr key={i} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                  <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</td>
                  {ALLERGENES.map(a => (
                    <td key={a} style={{ padding:'8px 4px', textAlign:'center' }}>
                      {p.allergenes.includes(a)
                        ? <div style={{ width:'16px', height:'16px', borderRadius:'4px', background:'#a32d2d', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="ti ti-check" style={{ color:'#fff', fontSize:'10px' }} /></div>
                        : <div style={{ width:'16px', height:'16px', borderRadius:'4px', background:'#f1efe8', margin:'0 auto' }} />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'recettes' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Allergènes par recette</div>
          {recettes.map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 0', borderBottom: i<recettes.length-1 ? '0.5px solid #f1efe8' : 'none' }}>
              <div style={{ width:'180px', fontSize:'13px', fontWeight:'500', color:'#2c2c2a', flexShrink:0 }}>{r.nom}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {r.allergenes.map(a => (
                  <span key={a} style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'10px', background:'#fcebeb', color:'#791f1f', fontWeight:'500' }}>{a}</span>
                ))}
                {r.allergenes.length === 0 && <span style={{ fontSize:'12px', color:'#b4b2a9' }}>Aucun allergène</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'affichage' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Affichage restaurant — Carte des allergènes</div>
          <div style={{ border:'2px solid #2c2c2a', borderRadius:'12px', padding:'24px', maxWidth:'600px' }}>
            <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px', textAlign:'center' }}>Le Bistrot du Coin</div>
            <div style={{ fontSize:'13px', color:'#888780', textAlign:'center', marginBottom:'20px' }}>Informations allergènes — Juin 2026</div>
            {recettes.map((r,i) => (
              <div key={i} style={{ marginBottom:'12px', paddingBottom:'12px', borderBottom: i<recettes.length-1 ? '0.5px solid #e2e0d8' : 'none' }}>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a', marginBottom:'6px' }}>{r.nom}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {r.allergenes.length > 0
                    ? r.allergenes.map(a => <span key={a} style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'8px', background:'#fcebeb', color:'#791f1f', fontWeight:'500' }}>{a}</span>)
                    : <span style={{ fontSize:'11px', color:'#888780' }}>Sans allergènes majeurs</span>
                  }
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
            <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
              <i className="ti ti-printer" /> Imprimer
            </button>
            <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a', display:'flex', alignItems:'center', gap:'6px' }}>
              <i className="ti ti-file-type-pdf" /> Télécharger PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
