'use client';
import { useState } from 'react';

const commandes = [
  { id:1, fourn:'Metro', date:'10 juin 2026', montant:1840, statut:'Livré', nb:8 },
  { id:2, fourn:'Pomona', date:'8 juin 2026', montant:1220, statut:'Livré', nb:5 },
  { id:3, fourn:'Brake France', date:'5 juin 2026', montant:640, statut:'Livré', nb:3 },
  { id:4, fourn:'Metro', date:'25 mai 2026', montant:1650, statut:'Livré', nb:7 },
  { id:5, fourn:'Pomona', date:'20 mai 2026', montant:980, statut:'Livré', nb:4 },
];

const panier = [
  { nom:'Poulet fermier label rouge', fourn:'Metro', qte:10, unite:'kg', prix:6.95 },
  { nom:'Beurre doux', fourn:'Metro', qte:5, unite:'kg', prix:8.00 },
  { nom:'Crème fleurette 35%', fourn:'Pomona', qte:8, unite:'kg', prix:3.00 },
  { nom:'Carottes', fourn:'Pomona', qte:15, unite:'kg', prix:1.50 },
];

export default function Commandes() {
  const [tab, setTab] = useState('panier');

  const total = panier.reduce((s,p) => s + p.qte * p.prix, 0);
  const byFourn = panier.reduce((acc,p) => {
    acc[p.fourn] = (acc[p.fourn]||0) + p.qte * p.prix;
    return acc;
  }, {});

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Bons de commande</div>
        <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Nouvelle commande
        </button>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'panier', label:'Panier en cours'}, {id:'historique', label:'Historique'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'panier' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Produits à commander</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr>
                  {['Produit','Fournisseur','Qté','Unité','Prix/kg','Total',''].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign: ['Qté','Prix/kg','Total'].includes(h) ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {panier.map((p,i) => (
                  <tr key={i} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                    <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</td>
                    <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{p.fourn}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right' }}>
                      <input defaultValue={p.qte} type="number" style={{ width:'60px', padding:'4px 8px', borderRadius:'6px', border:'0.5px solid #d3d1c7', fontSize:'13px', textAlign:'right', fontFamily:'monospace' }} />
                    </td>
                    <td style={{ padding:'10px 12px', color:'#888780' }}>{p.unite}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'#5f5e5a' }}>{p.prix.toFixed(2)} €</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'500', fontFamily:'monospace', color:'#2c2c2a' }}>{(p.qte*p.prix).toFixed(2)} €</td>
                    <td style={{ padding:'10px 12px', textAlign:'right' }}>
                      <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ background:'#534ab7', borderRadius:'12px', padding:'16px', color:'#fff' }}>
              <div style={{ fontSize:'11px', color:'#cecbf6', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Total commande</div>
              <div style={{ fontSize:'26px', fontWeight:'500', marginBottom:'12px' }}>{total.toFixed(2)} €</div>
              {Object.entries(byFourn).map(([f,v]) => (
                <div key={f} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'4px 0', borderTop:'0.5px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ color:'#cecbf6' }}>{f}</span>
                  <span style={{ fontWeight:'500' }}>{v.toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <button style={{ padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <i className="ti ti-mail" /> Envoyer aux fournisseurs
            </button>
            <button style={{ padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <i className="ti ti-file-type-pdf" /> Télécharger PDF
            </button>
          </div>
        </div>
      )}

      {tab === 'historique' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr>
                {['Fournisseur','Date','Nb produits','Montant HT','Statut',''].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign: h==='Montant HT' ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandes.map(c => (
                <tr key={c.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                  <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{c.fourn}</td>
                  <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{c.date}</td>
                  <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{c.nb} produits</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'500', fontFamily:'monospace', color:'#534ab7' }}>{c.montant.toFixed(2)} €</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:'#eaf3de', color:'#27500a', fontWeight:'500' }}>{c.statut}</span>
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>
                    <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-eye" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
