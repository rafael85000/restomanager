'use client';
import { useState } from 'react';

const coefficients = [
  { id:1, nom:'Poulet fermier label rouge', type:'produit', coeff:0.75, perte:25 },
  { id:2, nom:'Carottes', type:'produit', coeff:0.85, perte:15 },
  { id:3, nom:'Magret de canard', type:'produit', coeff:0.80, perte:20 },
  { id:4, nom:'Pommes de terre Agata', type:'produit', coeff:0.88, perte:12 },
  { id:5, nom:'Burger maison', type:'recette', coeff:0.95, perte:5 },
  { id:6, nom:'Mousse Praliné', type:'recette', coeff:0.90, perte:10 },
  { id:7, nom:'Magret de canard jus réduit', type:'recette', coeff:0.82, perte:18 },
];

const historique = [
  { id:1, nom:'Poulet fermier label rouge', date:'15 juin 2026', type:'DLC', poids:1.2, cout:6.95, total:8.34 },
  { id:2, nom:'Mousse Praliné', date:'14 juin 2026', type:'Rendement', poids:0.8, cout:4.27, total:3.42 },
  { id:3, nom:'Tomates cerises', date:'13 juin 2026', type:'Accident', poids:0.5, cout:4.20, total:2.10 },
  { id:4, nom:'Crème fleurette 35%', date:'12 juin 2026', type:'DLC', poids:0.9, cout:3.00, total:2.70 },
  { id:5, nom:'Fond de tarte', date:'10 juin 2026', type:'Rendement', poids:0.3, cout:3.20, total:0.96 },
];

const typeColors = {
  DLC: { bg:'#fcebeb', col:'#a32d2d' },
  Rendement: { bg:'#faeeda', col:'#854f0b' },
  Accident: { bg:'#eeedfe', col:'#3c3489' },
  Cuisson: { bg:'#f1efe8', col:'#5f5e5a' },
};

export default function Pertes() {
  const [tab, setTab] = useState('coefficients');

  const totalPertes = historique.reduce((s,p) => s+p.total, 0);

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Pertes & Rendements</div>
        <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Enregistrer une perte
        </button>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'coefficients',label:'Coefficients de rendement'},{id:'historique',label:'Historique des pertes'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'coefficients' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', color:'#5f5e5a', marginBottom:'16px', lineHeight:'1.6' }}>
            Les coefficients de rendement sont appliqués automatiquement dans les coûts de revient. Un coefficient de 0,75 signifie que 1 kg acheté donne 750 g utilisables.
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr>
                {['Produit / Recette','Type','Coefficient','% de perte','Impact coût',''].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign: h==='Impact coût' ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coefficients.map(c => (
                <tr key={c.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                  <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{c.nom}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background: c.type==='recette' ? '#eeedfe' : '#f1efe8', color: c.type==='recette' ? '#3c3489' : '#5f5e5a', fontWeight:'500' }}>
                      {c.type === 'recette' ? 'Recette' : 'Produit'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <input defaultValue={c.coeff} type="number" step="0.01" min="0" max="1" style={{ width:'70px', padding:'4px 8px', borderRadius:'6px', border:'0.5px solid #d3d1c7', fontSize:'13px', fontFamily:'monospace' }} />
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background: c.perte > 20 ? '#fcebeb' : c.perte > 10 ? '#faeeda' : '#eaf3de', color: c.perte > 20 ? '#a32d2d' : c.perte > 10 ? '#854f0b' : '#27500a', fontWeight:'500' }}>
                      {c.perte}%
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:'12px', color:'#888780' }}>
                    +{(100/c.coeff - 100).toFixed(1)}% sur le coût
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>
                    <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-edit" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'historique' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
            <div style={{ background:'#fcebeb', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px' }}>
              <div style={{ fontSize:'11px', color:'#a32d2d', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Total pertes ce mois</div>
              <div style={{ fontSize:'24px', fontWeight:'500', color:'#a32d2d' }}>{totalPertes.toFixed(2)} €</div>
            </div>
            <div style={{ background:'#faeeda', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px' }}>
              <div style={{ fontSize:'11px', color:'#854f0b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Principale cause</div>
              <div style={{ fontSize:'18px', fontWeight:'500', color:'#854f0b' }}>DLC dépassée</div>
            </div>
            <div style={{ background:'#f8f7f4', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px' }}>
              <div style={{ fontSize:'11px', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Nb enregistrements</div>
              <div style={{ fontSize:'24px', fontWeight:'500', color:'#2c2c2a' }}>{historique.length}</div>
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr>
                  {['Produit','Date','Type de perte','Poids perdu','Coût/kg','Perte valorisée',''].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign: ['Poids perdu','Coût/kg','Perte valorisée'].includes(h) ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historique.map(p => {
                  const tc = typeColors[p.type] || typeColors.Cuisson;
                  return (
                    <tr key={p.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                      <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</td>
                      <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{p.date}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:tc.bg, color:tc.col, fontWeight:'500' }}>{p.type}</span>
                      </td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'#5f5e5a' }}>{p.poids} kg</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'#5f5e5a' }}>{p.cout.toFixed(2)} €</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'500', color:'#a32d2d', fontFamily:'monospace' }}>−{p.total.toFixed(2)} €</td>
                      <td style={{ padding:'10px 12px', textAlign:'right' }}>
                        <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop:'12px', padding:'10px 16px', background:'#fcebeb', borderRadius:'8px', display:'flex', justifyContent:'space-between', fontSize:'13px' }}>
              <span style={{ color:'#791f1f', fontWeight:'500' }}>Total pertes ce mois</span>
              <span style={{ fontWeight:'500', color:'#a32d2d' }}>−{totalPertes.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
