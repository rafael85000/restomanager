'use client';
import { useState } from 'react';

export default function HACCP() {
  const [tab, setTab] = useState('etiquetage');

  const tabs = [
    {id:'etiquetage', label:'Étiquetage'},
    {id:'temperatures', label:'Températures'},
    {id:'nettoyage', label:'Nettoyage'},
    {id:'cuissons', label:'Cuissons & Refroidissements'},
    {id:'tracabilite', label:'Traçabilité'},
    {id:'reception', label:'Réception'},
    {id:'pms', label:'PMS'},
  ];

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Module HACCP</div>
        <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Gestion de la sécurité alimentaire — Valeur légale équivalente ePack/Octopus HACCP</div>
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'etiquetage' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>Nouvelle étiquette</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <div style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', marginBottom:'5px' }}>Produit</div>
                <input placeholder="Saisir ou sélectionner une recette..." style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              </div>
              <div>
                <div style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', marginBottom:'5px' }}>Date de fabrication</div>
                <input type="date" defaultValue="2026-06-16" style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              </div>
              <div>
                <div style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', marginBottom:'8px' }}>DLC — Raccourcis</div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  {['J+1','J+3','J+5','J+7','J+14','J+30'].map(j => (
                    <button key={j} style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>{j}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', marginBottom:'5px' }}>Format d étiquette</div>
                <select style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                  <option>Brother QL — Standard</option>
                  <option>Brother QL — Large</option>
                  <option>Brother QL — Petite</option>
                  <option>Zebra — Small</option>
                  <option>Zebra — Large</option>
                  <option>Dymo</option>
                </select>
              </div>
              <button style={{ padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <i className="ti ti-printer" /> Imprimer l étiquette
              </button>
            </div>
          </div>
          <div style={{ background:'#f8f7f4', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>Aperçu étiquette</div>
            <div style={{ background:'#fff', border:'2px dashed #d3d1c7', borderRadius:'8px', padding:'16px', width:'180px', textAlign:'center' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a', marginBottom:'6px' }}>Mousse Praliné</div>
              <div style={{ fontSize:'11px', color:'#888780', marginBottom:'4px' }}>Fabriqué le : 16/06/2026</div>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'#a32d2d' }}>DLC : 19/06/2026</div>
              <div style={{ fontSize:'10px', color:'#888780', marginTop:'6px' }}>Le Bistrot du Coin</div>
              <div style={{ fontSize:'10px', color:'#888780' }}>Allergènes : Lait, Oeufs</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'temperatures' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>Relevés de températures</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'12px' }}>
            {[
              {nom:'Chambre froide positive', type:'froid', temp:3.2, min:0, max:4, ok:true},
              {nom:'Congélateur', type:'froid', temp:-18.5, min:-22, max:-18, ok:true},
              {nom:'Vitrine desserts', type:'froid', temp:5.8, min:0, max:4, ok:false},
              {nom:'Bain-marie service', type:'chaud', temp:68.0, min:63, max:80, ok:true},
              {nom:'Plonge', type:'plonge', temp:82.0, min:80, max:90, ok:true},
            ].map((eq,i) => (
              <div key={i} style={{ border:'0.5px solid', borderColor: eq.ok ? '#e2e0d8' : '#f09595', borderRadius:'10px', padding:'14px', background: eq.ok ? '#fff' : '#fff8f8' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{eq.nom}</div>
                  <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'6px', fontWeight:'500', background: eq.ok ? '#eaf3de' : '#fcebeb', color: eq.ok ? '#27500a' : '#a32d2d' }}>
                    {eq.ok ? 'OK' : 'HORS NORME'}
                  </span>
                </div>
                <div style={{ fontSize:'28px', fontWeight:'500', color: eq.ok ? '#2c2c2a' : '#a32d2d', marginBottom:'6px' }}>{eq.temp}°C</div>
                <div style={{ fontSize:'11px', color:'#888780' }}>Plage : {eq.min}°C → {eq.max}°C</div>
                <button style={{ marginTop:'10px', width:'100%', padding:'7px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>
                  Saisir un relevé
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'nettoyage' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Planning nettoyage — 16 juin 2026</div>
          <div style={{ background:'#f8f7f4', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'13px', color:'#5f5e5a' }}>Progression du jour</span>
            <span style={{ fontSize:'13px', fontWeight:'500', color:'#534ab7' }}>3 / 6 tâches</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[
              {zone:'Plan de travail cuisine', freq:'Quotidien', fait:true, heure:'08:30'},
              {zone:'Friteuse', freq:'Quotidien', fait:true, heure:'09:15'},
              {zone:'Sol cuisine', freq:'Quotidien', fait:true, heure:'11:00'},
              {zone:'Chambre froide positive', freq:'Hebdomadaire', fait:false, heure:null},
              {zone:'Hottes et filtres', freq:'Hebdomadaire', fait:false, heure:null},
              {zone:'Vestiaires', freq:'Hebdomadaire', fait:false, heure:null},
            ].map((t,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:'8px', background: t.fait ? '#eaf3de' : '#f8f7f4', border:'0.5px solid', borderColor: t.fait ? '#97c459' : '#e2e0d8' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'50%', background: t.fait ? '#639922' : '#d3d1c7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {t.fait && <i className="ti ti-check" style={{ color:'#fff', fontSize:'11px' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{t.zone}</div>
                    <div style={{ fontSize:'11px', color:'#888780' }}>{t.freq}{t.heure ? ' — Validé à '+t.heure : ''}</div>
                  </div>
                </div>
                {!t.fait && (
                  <button style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Valider</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {['cuissons','tracabilite','reception','pms'].includes(tab) && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'40px', textAlign:'center' }}>
          <i className="ti ti-shield-check" style={{ fontSize:'40px', color:'#534ab7', display:'block', marginBottom:'12px' }} />
          <div style={{ fontSize:'16px', fontWeight:'500', color:'#2c2c2a', marginBottom:'6px' }}>
            {tab === 'cuissons' ? 'Cuissons & Refroidissements' : tab === 'tracabilite' ? 'Traçabilité' : tab === 'reception' ? 'Réception marchandises' : 'PMS — Plan de Maîtrise Sanitaire'}
          </div>
          <div style={{ fontSize:'13px', color:'#888780' }}>Cette section sera disponible dans la prochaine mise à jour.</div>
        </div>
      )}
    </div>
  );
}
