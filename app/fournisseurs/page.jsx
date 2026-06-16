'use client';
import { useState } from 'react';

const fournisseurs = [
  { id:1, nom:'Metro', contact:'Jean Dupont', email:'jdupont@metro.fr', tel:'02 51 00 11 22', ville:'La Roche-sur-Yon', delai:'J+1', actif:true, nb:12 },
  { id:2, nom:'Pomona', contact:'Marie Leroy', email:'mleroy@pomona.fr', tel:'02 51 00 33 44', ville:'Nantes', delai:'J+2', actif:true, nb:8 },
  { id:3, nom:'Brake France', contact:'Paul Martin', email:'pmartin@brake.fr', tel:'02 51 00 55 66', ville:'La Roche-sur-Yon', delai:'J+2', actif:true, nb:5 },
];

export default function Fournisseurs() {
  const [modal, setModal] = useState(false);

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Fournisseurs</div>
        <button onClick={() => setModal(true)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Ajouter un fournisseur
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'12px' }}>
        {fournisseurs.map(f => (
          <div key={f.id} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
              <div>
                <div style={{ fontSize:'16px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>{f.nom}</div>
                <div style={{ fontSize:'12px', color:'#888780' }}>{f.ville}</div>
              </div>
              <div style={{ display:'flex', gap:'4px' }}>
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-edit" /></button>
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                <i className="ti ti-user" style={{ color:'#888780', fontSize:'14px' }} />
                {f.contact}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                <i className="ti ti-mail" style={{ color:'#888780', fontSize:'14px' }} />
                {f.email}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                <i className="ti ti-phone" style={{ color:'#888780', fontSize:'14px' }} />
                {f.tel}
              </div>
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
              <div style={{ flex:1, background:'#f8f7f4', borderRadius:'8px', padding:'8px 12px', textAlign:'center' }}>
                <div style={{ fontSize:'10px', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>Délai livraison</div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>{f.delai}</div>
              </div>
              <div style={{ flex:1, background:'#eeedfe', borderRadius:'8px', padding:'8px 12px', textAlign:'center' }}>
                <div style={{ fontSize:'10px', color:'#3c3489', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>Produits</div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#3c3489' }}>{f.nb} réf.</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'440px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>Ajouter un fournisseur</div>
            <div style={{ fontSize:'13px', color:'#888780', marginBottom:'16px' }}>Renseignez les coordonnées du fournisseur.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Nom du fournisseur *" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Nom du contact" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Email" type="email" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Téléphone" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Ville" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <select style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option>Délai de livraison</option>
                <option>J+1</option><option>J+2</option><option>J+3</option>
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
