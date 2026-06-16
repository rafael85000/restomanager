'use client';
import { useState } from 'react';

const plats = [
  { id:1, nom:'Burger maison', categorie:'Plats', cout:3.85, pv:16.50, tva:10, ingredients:[ {nom:'Pain burger artisanal', qte:0.15, prix:3.50}, {nom:'Steak haché', qte:0.18, prix:9.80}, {nom:'Cheddar affiné', qte:0.04, prix:14.00}, {nom:'Salade iceberg', qte:0.03, prix:2.50}, {nom:'Sauce burger maison', qte:0.03, prix:5.80} ] },
  { id:2, nom:'Mousse Praliné', categorie:'Desserts', cout:1.47, pv:8.50, tva:10, ingredients:[ {nom:'Crème fleurette 35%', qte:0.40, prix:3.00}, {nom:'Praliné noisettes', qte:0.20, prix:12.00}, {nom:'Gélatine', qte:0.006, prix:18.00}, {nom:'Sucre semoule', qte:0.08, prix:1.20} ] },
  { id:3, nom:'Magret de canard', categorie:'Plats', cout:8.20, pv:28.00, tva:10, ingredients:[ {nom:'Magret de canard LR', qte:0.40, prix:18.50}, {nom:'Fond de veau', qte:0.15, prix:4.80}, {nom:'Miel acacia', qte:0.02, prix:8.00}, {nom:'Vinaigre balsamique', qte:0.03, prix:6.00} ] },
  { id:4, nom:'Salade César', categorie:'Entrées', cout:4.20, pv:13.50, tva:10, ingredients:[ {nom:'Laitue romaine', qte:0.20, prix:3.50}, {nom:'Poulet fermier LR', qte:0.16, prix:6.95}, {nom:'Parmesan AOP', qte:0.03, prix:22.00}, {nom:'Sauce César maison', qte:0.06, prix:5.80} ] },
];

export default function Couts() {
  const [selected, setSelected] = useState(plats[0]);

  const pvht = selected.pv / (1 + selected.tva/100);
  const marge = pvht - selected.cout;
  const txMarge = (marge / pvht * 100);
  const foodcost = (selected.cout / pvht * 100);

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Coût de revient & marges</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'16px' }}>

        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'14px' }}>
          <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Sélectionner un plat</div>
          {plats.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} style={{ padding:'10px 12px', borderRadius:'8px', marginBottom:'4px', cursor:'pointer', border:'0.5px solid', borderColor: selected.id===p.id ? '#534ab7' : '#e2e0d8', background: selected.id===p.id ? '#eeedfe' : '#fff' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color: selected.id===p.id ? '#3c3489' : '#2c2c2a' }}>{p.nom}</div>
              <div style={{ fontSize:'11px', color:'#888780', marginTop:'2px' }}>{p.categorie} — {p.cout.toFixed(2)} € / portion</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
            {[
              { label:'Coût / portion', val: selected.cout.toFixed(2)+' €', bg:'#f8f7f4', col:'#2c2c2a' },
              { label:'Prix vente TTC', val: selected.pv.toFixed(2)+' €', bg:'#f8f7f4', col:'#2c2c2a' },
              { label:'Taux de marge', val: txMarge.toFixed(1)+'%', bg:'#eeedfe', col:'#3c3489' },
              { label:'Food cost', val: foodcost.toFixed(1)+'%', bg: foodcost > 35 ? '#fcebeb' : '#eaf3de', col: foodcost > 35 ? '#a32d2d' : '#27500a' },
            ].map((c,i) => (
              <div key={i} style={{ background:c.bg, borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px' }}>
                <div style={{ fontSize:'11px', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>{c.label}</div>
                <div style={{ fontSize:'22px', fontWeight:'500', color:c.col }}>{c.val}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Détail des ingrédients — {selected.nom}</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr>
                  {['Ingrédient','Quantité','Prix/kg','Coût','% du total'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign: h==='Ingrédient' ? 'left' : 'right', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.ingredients.map((ing,i) => {
                  const cout = ing.qte * ing.prix;
                  const pct = (cout / selected.cout * 100);
                  return (
                    <tr key={i} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                      <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{ing.nom}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', color:'#5f5e5a' }}>{(ing.qte*1000).toFixed(0)} g</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', color:'#5f5e5a', fontFamily:'monospace' }}>{ing.prix.toFixed(2)} €</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'500', fontFamily:'monospace', color:'#2c2c2a' }}>{cout.toFixed(3)} €</td>
                      <td style={{ padding:'10px 12px', textAlign:'right' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'flex-end' }}>
                          <div style={{ width:'60px', height:'6px', background:'#f1efe8', borderRadius:'3px', overflow:'hidden' }}>
                            <div style={{ width:pct+'%', height:'100%', background:'#534ab7', borderRadius:'3px' }} />
                          </div>
                          <span style={{ fontSize:'11px', color:'#888780', minWidth:'32px' }}>{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop:'12px', padding:'10px 16px', background:'#f8f7f4', borderRadius:'8px', display:'flex', justifyContent:'space-between', fontSize:'13px' }}>
              <span style={{ color:'#888780' }}>Total coût matières</span>
              <span style={{ fontWeight:'500', color:'#534ab7' }}>{selected.cout.toFixed(2)} €</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
