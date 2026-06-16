'use client';
import { useState } from 'react';

export default function Rapport() {
  const [tab, setTab] = useState('apercu');

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Rapport mensuel</div>
        <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-refresh" /> Générer le rapport de juin 2026
        </button>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'apercu',label:'Aperçu du rapport'},{id:'params',label:'Paramètres'},{id:'histo',label:'Historique'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'apercu' && (
        <div style={{ border:'0.5px solid #e2e0d8', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ background:'#f8f7f4', borderBottom:'0.5px solid #e2e0d8', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:'500', color:'#5f5e5a' }}>
              <i className="ti ti-file-type-pdf" style={{ color:'#a32d2d', fontSize:'16px' }} />
              Rapport — juin 2026 — Le Bistrot du Coin
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a', display:'flex', alignItems:'center', gap:'5px' }}>
                <i className="ti ti-mail" /> Envoyer
              </button>
              <button style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'5px' }}>
                <i className="ti ti-download" /> Télécharger PDF
              </button>
            </div>
          </div>

          <div style={{ padding:'28px 32px', background:'#fff' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', paddingBottom:'16px', borderBottom:'2px solid #2c2c2a' }}>
              <div>
                <div style={{ fontSize:'20px', fontWeight:'500', color:'#2c2c2a' }}>Rapport mensuel — juin 2026</div>
                <div style={{ fontSize:'13px', color:'#534ab7', fontWeight:'500', marginTop:'4px' }}>Période : 1er juin → 30 juin 2026</div>
                <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Le Bistrot du Coin · La Roche-sur-Yon</div>
              </div>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#534ab7', textAlign:'right' }}>Le Bistrot<br/>du Coin</div>
            </div>

            <div style={{ marginBottom:'20px' }}>
              <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Indicateurs clés du mois</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
                {[
                  {label:'Valeur du stock', val:'3 240 €', delta:'-4,2% vs mai', bad:true},
                  {label:'Marge moyenne', val:'68,5%', delta:'-1,8 pt vs mai', bad:true},
                  {label:'Commandes fournisseurs', val:'4 860 €', delta:'-6% vs mai', bad:false},
                  {label:'Pertes & gaspillage', val:'187 €', delta:'+12% vs mai', bad:true},
                ].map((c,i) => (
                  <div key={i} style={{ background:'#f8f7f4', borderRadius:'8px', padding:'10px 12px' }}>
                    <div style={{ fontSize:'9px', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'3px' }}>{c.label}</div>
                    <div style={{ fontSize:'16px', fontWeight:'500', color:'#2c2c2a' }}>{c.val}</div>
                    <div style={{ fontSize:'10px', color: c.bad ? '#a32d2d' : '#27500a', marginTop:'2px' }}>{c.delta}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:'20px' }}>
              <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Évolution des coûts matières premières</div>
              {[
                {nom:'Poulet fermier LR', pct:86, val:'+8,6%', bad:true},
                {nom:'Vin rouge CDR', pct:71, val:'+7,1%', bad:true},
                {nom:'Noisettes torréfiées', pct:32, val:'+3,2%', bad:true},
                {nom:'Pommes de terre', pct:15, val:'-1,5%', bad:false},
                {nom:'Crème fleurette 35%', pct:8, val:'-0,8%', bad:false},
              ].map((b,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', fontSize:'12px' }}>
                  <div style={{ width:'140px', flexShrink:0, color:'#2c2c2a' }}>{b.nom}</div>
                  <div style={{ flex:1, height:'8px', background:'#f1efe8', borderRadius:'4px', overflow:'hidden' }}>
                    <div style={{ width:b.pct+'%', height:'100%', borderRadius:'4px', background: b.bad ? '#e24b4a' : '#97c459' }} />
                  </div>
                  <div style={{ width:'50px', textAlign:'right', fontWeight:'500', color: b.bad ? '#a32d2d' : '#27500a' }}>{b.val}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
              <div>
                <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Top 3 — Plats les plus rentables</div>
                {[{nom:'Tarte au citron',marge:'78,4%'},{nom:'Magret de canard',marge:'74,1%'},{nom:'Fondant chocolat',marge:'71,8%'}].map((p,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid #f1efe8' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#faeeda', color:'#854f0b', fontSize:'9px', fontWeight:'500', display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</div>
                      <span style={{ fontSize:'12px', color:'#2c2c2a' }}>{p.nom}</span>
                    </div>
                    <span style={{ fontSize:'10px', padding:'1px 7px', borderRadius:'8px', background:'#eaf3de', color:'#27500a', fontWeight:'500' }}>{p.marge}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Bottom 3 — À surveiller</div>
                {[{nom:'Salade César',marge:'-5,2%',bad:true},{nom:'Burger maison',marge:'38,2%',bad:true},{nom:'Tartare de boeuf',marge:'48,7%',bad:false}].map((p,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid #f1efe8' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#fcebeb', color:'#a32d2d', fontSize:'9px', fontWeight:'500', display:'flex', alignItems:'center', justifyContent:'center' }}>!</div>
                      <span style={{ fontSize:'12px', color:'#2c2c2a' }}>{p.nom}</span>
                    </div>
                    <span style={{ fontSize:'10px', padding:'1px 7px', borderRadius:'8px', fontWeight:'500', background: p.bad ? '#fcebeb' : '#eaf3de', color: p.bad ? '#a32d2d' : '#27500a' }}>{p.marge}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Pertes & gaspillage du mois (187 €)</div>
              {[
                {nom:'Poulet fermier label rouge — DLC dépassée', val:'−62 €'},
                {nom:'Mousse Praliné — rendement cuisson', val:'−48 €'},
                {nom:'Tomates cerises — accident cuisine', val:'−31 €'},
                {nom:'Crème fleurette — DLC dépassée', val:'−28 €'},
                {nom:'Autres pertes diverses', val:'−18 €'},
              ].map((p,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'0.5px solid #f1efe8', fontSize:'12px' }}>
                  <span style={{ color:'#2c2c2a' }}>{p.nom}</span>
                  <span style={{ fontWeight:'500', color:'#a32d2d' }}>{p.val}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop:'0.5px solid #e2e0d8', paddingTop:'8px', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#b4b2a9' }}>
              <span>Le Bistrot du Coin · Rapport généré automatiquement par RestoManager</span>
              <span>Généré le 1er juillet 2026 · Confidentiel</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'params' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Envoi automatique</div>
            {[
              {label:'Envoi automatique le 1er de chaque mois', sub:'Le rapport du mois précédent est généré et envoyé automatiquement', checked:true},
            ].map((p,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'0.5px solid #f1efe8' }}>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{p.label}</div>
                  <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>{p.sub}</div>
                </div>
                <div style={{ width:'40px', height:'22px', borderRadius:'11px', background:'#534ab7', position:'relative', cursor:'pointer', flexShrink:0 }}>
                  <div style={{ position:'absolute', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', top:'3px', right:'3px' }} />
                </div>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>Destinataires</div>
                <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Propriétaire + managers de l établissement</div>
              </div>
              <span style={{ fontSize:'12px', color:'#534ab7', fontWeight:'500' }}>2 destinataires</span>
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Contenu du rapport</div>
            {['Valeur du stock','Évolution des coûts matières premières','Top & bottom plats','Pertes & gaspillage'].map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom: i<3 ? '0.5px solid #f1efe8' : 'none' }}>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{item}</div>
                <div style={{ width:'40px', height:'22px', borderRadius:'11px', background:'#534ab7', position:'relative', cursor:'pointer', flexShrink:0 }}>
                  <div style={{ position:'absolute', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', top:'3px', right:'3px' }} />
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'16px' }}>
              <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'histo' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Rapports générés</div>
          {[
            {mois:'Rapport — juin 2026', date:'Généré le 1er juillet 2026', auto:true},
            {mois:'Rapport — mai 2026', date:'Généré le 1er juin 2026', auto:true},
            {mois:'Rapport — avril 2026', date:'Généré manuellement le 15 mai 2026', auto:false},
            {mois:'Rapport — mars 2026', date:'Généré le 1er avril 2026', auto:true},
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f8f7f4', borderRadius:'8px', marginBottom:'8px' }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>{r.mois}</div>
                <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>{r.date} · Envoyé à 2 destinataires</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: r.auto ? '#eeedfe' : '#f1efe8', color: r.auto ? '#3c3489' : '#5f5e5a' }}>
                  {r.auto ? 'Automatique' : 'Manuel'}
                </span>
                <button style={{ background:'none', border:'0.5px solid #d3d1c7', borderRadius:'6px', cursor:'pointer', color:'#888780', fontSize:'14px', padding:'5px 8px' }}>
                  <i className="ti ti-download" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
