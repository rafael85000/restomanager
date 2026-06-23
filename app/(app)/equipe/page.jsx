'use client';
import { useState } from 'react';

const membres = [
  { id:1, nom:'Rafael Colonnello', role:'Propriétaire', email:'rafael@bistrotducoin.fr', tel:'06 12 34 56 78', acces:'Tout', actif:true, initiales:'RC' },
  { id:2, nom:'Marco Bianchi', role:'Manager', email:'marco@bistrotducoin.fr', tel:'06 23 45 67 89', acces:'Tout sauf facturation', actif:true, initiales:'MB' },
  { id:3, nom:'Sophie Martin', role:'Chef de cuisine', email:'sophie@bistrotducoin.fr', tel:'06 34 56 78 90', acces:'Recettes, HACCP, Inventaire', actif:true, initiales:'SM' },
  { id:4, nom:'Lucas Dupont', role:'Commis', email:'lucas@bistrotducoin.fr', tel:'06 45 67 89 01', acces:'HACCP uniquement', actif:true, initiales:'LD' },
  { id:5, nom:'Emma Leroy', role:'Serveuse', email:'emma@bistrotducoin.fr', tel:'06 56 78 90 12', acces:'Allergènes uniquement', actif:false, initiales:'EL' },
];

const roleColors = {
  'Propriétaire': { bg:'#eeedfe', col:'#3c3489' },
  'Manager': { bg:'#eaf3de', col:'#27500a' },
  'Chef de cuisine': { bg:'#faeeda', col:'#854f0b' },
  'Commis': { bg:'#f1efe8', col:'#5f5e5a' },
  'Serveuse': { bg:'#f1efe8', col:'#5f5e5a' },
};

export default function Equipe() {
  const [modal, setModal] = useState(false);

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Équipe & Utilisateurs</div>
        <button onClick={() => setModal(true)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Inviter un membre
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'12px' }}>
        {membres.map(m => {
          const rc = roleColors[m.role] || roleColors['Commis'];
          return (
            <div key={m.id} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px', opacity: m.actif ? 1 : 0.6 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#eeedfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'500', color:'#534ab7', flexShrink:0 }}>
                    {m.initiales}
                  </div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>{m.nom}</div>
                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background:rc.bg, color:rc.col }}>{m.role}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'4px' }}>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-edit" /></button>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#5f5e5a' }}>
                  <i className="ti ti-mail" style={{ color:'#888780', fontSize:'13px' }} />{m.email}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#5f5e5a' }}>
                  <i className="ti ti-phone" style={{ color:'#888780', fontSize:'13px' }} />{m.tel}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#5f5e5a' }}>
                  <i className="ti ti-shield" style={{ color:'#888780', fontSize:'13px' }} />{m.acces}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: m.actif ? '#eaf3de' : '#f1efe8', color: m.actif ? '#27500a' : '#888780' }}>
                  {m.actif ? 'Actif' : 'Inactif'}
                </span>
                <button style={{ fontSize:'12px', color:'#534ab7', background:'none', border:'none', cursor:'pointer', fontWeight:'500' }}>
                  Modifier les accès
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'440px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>Inviter un membre</div>
            <div style={{ fontSize:'13px', color:'#888780', marginBottom:'16px' }}>Un email d invitation sera envoyé automatiquement.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Nom complet *" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Email *" type="email" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Téléphone" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <select style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option>Sélectionner un rôle</option>
                <option>Manager</option>
                <option>Chef de cuisine</option>
                <option>Commis</option>
                <option>Serveur / Serveuse</option>
              </select>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Annuler</button>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Envoyer l invitation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
