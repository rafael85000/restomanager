'use client';

const indicateurs = [
  { label: 'Valeur du stock', valeur: '3 240 €', delta: '-4,2%', down: true, icon: 'ti-package' },
  { label: 'Marge moyenne', valeur: '68,5%', delta: '-1,8 pt', down: true, icon: 'ti-chart-pie' },
  { label: 'Commandes du mois', valeur: '4 860 €', delta: '-6%', down: false, icon: 'ti-shopping-cart' },
  { label: 'Pertes & gaspillage', valeur: '187 €', delta: '+12%', down: true, icon: 'ti-trending-down' },
];

const alertes = [
  { type: 'danger', icon: 'ti-alert-triangle', texte: '3 produits avec DLC dépassée — Poulet fermier, Crème fleurette, Tomates cerises' },
  { type: 'warning', icon: 'ti-trending-up', texte: 'Poulet fermier label rouge : +8,6% ce mois-ci chez Metro' },
  { type: 'warning', icon: 'ti-plant', texte: '2 ingrédients hors saison utilisés dans vos recettes' },
  { type: 'info', icon: 'ti-file-analytics', texte: 'Rapport mensuel de juin disponible — cliquez pour télécharger' },
];

const topPlats = [
  { nom: 'Tarte au citron', marge: '78,4%' },
  { nom: 'Magret de canard', marge: '74,1%' },
  { nom: 'Fondant chocolat', marge: '71,8%' },
];

const bottomPlats = [
  { nom: 'Salade César', marge: '-5,2%', bad: true },
  { nom: 'Burger maison', marge: '38,2%', bad: true },
  { nom: 'Tartare de boeuf', marge: '48,7%', bad: false },
];

const commandes = [
  { fourn: 'Metro', date: '10 juin', montant: '1 840 €' },
  { fourn: 'Pomona', date: '8 juin', montant: '1 220 €' },
  { fourn: 'Brake France', date: '5 juin', montant: '640 €' },
];

export default function Dashboard() {
  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Tableau de bord</div>
          <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Juin 2026 — Le Bistrot du Coin</div>
        </div>
        <div style={{ fontSize:'12px', color:'#888780' }}>
          <i className="ti ti-clock" style={{ marginRight:'5px' }} />
          Mis à jour à l instant
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px' }}>
        {indicateurs.map((ind, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <div style={{ fontSize:'12px', color:'#888780' }}>{ind.label}</div>
              <i className={"ti " + ind.icon} style={{ fontSize:'16px', color:'#888780' }} />
            </div>
            <div style={{ fontSize:'22px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>{ind.valeur}</div>
            <div style={{ fontSize:'11px', fontWeight:'500', color: ind.down ? '#a32d2d' : '#27500a' }}>
              {ind.delta} vs mois dernier
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'16px', marginBottom:'16px' }}>
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Alertes du jour</div>
          {alertes.map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', borderRadius:'8px', marginBottom:'8px', background: a.type==='danger' ? '#fcebeb' : a.type==='warning' ? '#faeeda' : '#eeedfe' }}>
              <i className={"ti " + a.icon} style={{ fontSize:'15px', color: a.type==='danger' ? '#a32d2d' : a.type==='warning' ? '#854f0b' : '#534ab7', flexShrink:0, marginTop:'1px' }} />
              <div style={{ fontSize:'12px', color: a.type==='danger' ? '#791f1f' : a.type==='warning' ? '#6b3f09' : '#3c3489', lineHeight:'1.5' }}>{a.texte}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Dernières commandes</div>
          {commandes.map((c, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom: i < commandes.length-1 ? '0.5px solid #f1efe8' : 'none' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{c.fourn}</div>
                <div style={{ fontSize:'11px', color:'#888780', marginTop:'1px' }}>{c.date}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#534ab7' }}>{c.montant}</div>
                <div style={{ fontSize:'10px', padding:'1px 7px', borderRadius:'8px', background:'#eaf3de', color:'#27500a', fontWeight:'500', marginTop:'2px', display:'inline-block' }}>Livré</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Top 3 — Plats les plus rentables</div>
          {topPlats.map((p, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom: i < topPlats.length-1 ? '0.5px solid #f1efe8' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#faeeda', color:'#854f0b', fontSize:'10px', fontWeight:'500', display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</div>
                <span style={{ fontSize:'13px', color:'#2c2c2a' }}>{p.nom}</span>
              </div>
              <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background:'#eaf3de', color:'#27500a' }}>{p.marge}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Bottom 3 — A surveiller</div>
          {bottomPlats.map((p, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom: i < bottomPlats.length-1 ? '0.5px solid #f1efe8' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#fcebeb', color:'#a32d2d', fontSize:'10px', fontWeight:'500', display:'flex', alignItems:'center', justifyContent:'center' }}>!</div>
                <span style={{ fontSize:'13px', color:'#2c2c2a' }}>{p.nom}</span>
              </div>
              <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: p.bad ? '#fcebeb' : '#eaf3de', color: p.bad ? '#a32d2d' : '#27500a' }}>{p.marge}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
