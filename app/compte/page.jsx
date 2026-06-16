'use client';
import { useState } from 'react';

export default function Compte() {
  const [tab, setTab] = useState('restaurant');

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Mon compte</div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'restaurant',label:'Restaurant'},{id:'profil',label:'Mon profil'},{id:'notifications',label:'Notifications'},{id:'export',label:'Export données'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'restaurant' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'24px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'20px' }}>Informations du restaurant</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
            {[
              {label:'Nom du restaurant', val:'Le Bistrot du Coin'},
              {label:'Siret', val:'123 456 789 00012'},
              {label:'Adresse', val:'12 rue de la Paix'},
              {label:'Code postal', val:'85000'},
              {label:'Ville', val:'La Roche-sur-Yon'},
              {label:'Téléphone', val:'02 51 00 00 00'},
              {label:'Email', val:'contact@bistrotducoin.fr'},
              {label:'Site web', val:'www.bistrotducoin.fr'},
            ].map((f,i) => (
              <div key={i}>
                <div style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', marginBottom:'5px' }}>{f.label}</div>
                <input defaultValue={f.val} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none', color:'#2c2c2a' }} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
          </div>
        </div>
      )}

      {tab === 'profil' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'24px', paddingBottom:'20px', borderBottom:'0.5px solid #e2e0d8' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#eeedfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:'500', color:'#534ab7' }}>RC</div>
            <div>
              <div style={{ fontSize:'16px', fontWeight:'500', color:'#2c2c2a' }}>Rafael Colonnello</div>
              <div style={{ fontSize:'13px', color:'#888780' }}>Propriétaire · Le Bistrot du Coin</div>
              <button style={{ fontSize:'12px', color:'#534ab7', background:'none', border:'none', cursor:'pointer', fontWeight:'500', marginTop:'4px', padding:0 }}>Changer la photo</button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
            {[
              {label:'Prénom', val:'Rafael'},
              {label:'Nom', val:'Colonnello'},
              {label:'Email', val:'rafael@bistrotducoin.fr'},
              {label:'Téléphone', val:'06 12 34 56 78'},
            ].map((f,i) => (
              <div key={i}>
                <div style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', marginBottom:'5px' }}>{f.label}</div>
                <input defaultValue={f.val} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none', color:'#2c2c2a' }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#5f5e5a', marginBottom:'10px' }}>Changer le mot de passe</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <input type="password" placeholder="Mot de passe actuel" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input type="password" placeholder="Nouveau mot de passe" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input type="password" placeholder="Confirmer le nouveau mot de passe" style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'24px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>Préférences de notifications</div>
          {[
            {label:'Alertes DLC dépassées', sub:'Notification immédiate quand une DLC est dépassée', on:true},
            {label:'Rapport mensuel disponible', sub:'Email le 1er de chaque mois avec le rapport', on:true},
            {label:'Hausse de prix fournisseur', sub:'Alerte quand un prix augmente de plus de 5%', on:true},
            {label:'Stock bas', sub:'Notification quand un produit passe sous le seuil minimum', on:false},
            {label:'Bon de commande livré', sub:'Confirmation de réception des commandes', on:true},
          ].map((n,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom: i<4 ? '0.5px solid #f1efe8' : 'none' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{n.label}</div>
                <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>{n.sub}</div>
              </div>
              <div style={{ width:'40px', height:'22px', borderRadius:'11px', background: n.on ? '#534ab7' : '#d3d1c7', position:'relative', cursor:'pointer', flexShrink:0 }}>
                <div style={{ position:'absolute', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', top:'3px', right: n.on ? '3px' : 'auto', left: n.on ? 'auto' : '3px' }} />
              </div>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'16px' }}>
            <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'24px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>Exporter vos données</div>
          {[
            {label:'Mercuriale complète', sub:'Tous vos produits avec prix et fournisseurs', icon:'ti-list'},
            {label:'Fiches recettes', sub:'Toutes vos recettes avec ingrédients et coûts', icon:'ti-tools-kitchen-2'},
            {label:'Historique des inventaires', sub:'Tous vos inventaires archivés', icon:'ti-clipboard-list'},
            {label:'Historique des commandes', sub:'Tous vos bons de commande', icon:'ti-shopping-cart'},
            {label:'Données HACCP', sub:'Températures, nettoyage, traçabilité', icon:'ti-shield-check'},
          ].map((e,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom: i<4 ? '0.5px solid #f1efe8' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#eeedfe', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={"ti "+e.icon} style={{ color:'#534ab7', fontSize:'16px' }} />
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{e.label}</div>
                  <div style={{ fontSize:'12px', color:'#888780', marginTop:'1px' }}>{e.sub}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>CSV</button>
                <button style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Excel</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
