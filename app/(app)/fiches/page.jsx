'use client';
import { useState } from 'react';

const recettes = [
  {
    id:'r1', nom:'Burger maison', portions:4, prep:'25 min', cuisson:'10 min',
    ingredients:[
      {nom:'Pain burger artisanal', qte:'150 g', t:'m'},
      {nom:'Steak haché façon maison', qte:'180 g', t:'m'},
      {nom:'Cheddar affiné', qte:'40 g', t:'m'},
      {nom:'Salade iceberg', qte:'30 g', t:'m'},
      {nom:'Tomates cerises', qte:'60 g', t:'m'},
      {nom:'Sauce burger maison', qte:'30 g', t:'r'},
    ],
    allergenes:['Gluten','Lait','Oeufs','Moutarde','Sésame'],
    steps:[
      'Préchauffer la plancha à 180°C. Assaisonner le steak sel et poivre des deux côtés.',
      'Cuire le steak 3 min par face. Déposer le cheddar 1 min avant la fin pour le faire fondre.',
      'Toaster le pain côté intérieur 1 min sur la plancha jusqu\'à légère coloration.',
      'Dresser : pain bas → sauce burger → salade → steak/cheddar → tomates cerises → pain haut.',
    ],
    cout:3.85, pv:16.50
  },
  {
    id:'r2', nom:'Mousse Praliné', portions:8, prep:'40 min', cuisson:'0 min',
    ingredients:[
      {nom:'Crème fleurette 35%', qte:'400 g', t:'m'},
      {nom:'Praliné noisettes', qte:'200 g', t:'r'},
      {nom:'Gélatine feuilles', qte:'6 g', t:'m'},
      {nom:'Sucre semoule', qte:'80 g', t:'m'},
      {nom:'Oeufs (jaunes)', qte:'4 pièces', t:'m'},
    ],
    allergenes:['Lait','Oeufs','Fruits à coque'],
    steps:[
      'Faire ramollir la gélatine 10 min dans de l\'eau froide.',
      'Chauffer 100g de crème avec le praliné à feu doux jusqu\'à fonte complète. Incorporer la gélatine essorée hors du feu.',
      'Monter les 300g de crème restants en chantilly souple. Fouetter les jaunes avec le sucre jusqu\'à blanchiment.',
      'Incorporer délicatement les jaunes sucrés au mélange praliné, puis la chantilly en trois fois. Couler en verrines. Réserver 3h minimum au froid.',
    ],
    cout:1.47, pv:8.50
  },
  {
    id:'r3', nom:'Magret de canard, jus réduit', portions:2, prep:'15 min', cuisson:'12 min',
    ingredients:[
      {nom:'Magret de canard Label Rouge', qte:'400 g', t:'m'},
      {nom:'Fond de veau', qte:'150 ml', t:'r'},
      {nom:'Miel acacia', qte:'20 g', t:'m'},
      {nom:'Vinaigre balsamique', qte:'30 ml', t:'m'},
    ],
    allergenes:['Sulfites'],
    steps:[
      'Quadriller la peau du magret au couteau sans atteindre la chair. Assaisonner sel et poivre.',
      'Démarrer à froid côté peau dans une poêle sans matière grasse. Cuire 8 min à feu moyen.',
      'Retourner et cuire 3 min côté chair. Laisser reposer 5 min sous papier alu.',
      'Déglacer au vinaigre balsamique, ajouter le fond et le miel. Réduire 3 min. Trancher et dresser en éventail.',
    ],
    cout:8.20, pv:28.00
  },
];

export default function Fiches() {
  const [actif, setActif] = useState(recettes[0]);
  const [ver, setVer] = useState('cuisine');

  const pvht = actif.pv / 1.10;
  const marge = (((pvht - actif.cout) / pvht) * 100).toFixed(1);

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Fiches techniques imprimables</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:'16px' }}>

        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'14px' }}>
          <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Recettes & plats</div>
          {recettes.map(r => (
            <div key={r.id} onClick={() => setActif(r)} style={{ padding:'10px 12px', borderRadius:'8px', marginBottom:'4px', cursor:'pointer', border:'0.5px solid', borderColor: actif.id===r.id ? '#534ab7' : '#e2e0d8', background: actif.id===r.id ? '#eeedfe' : '#fff' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color: actif.id===r.id ? '#3c3489' : '#2c2c2a' }}>{r.nom}</div>
              <div style={{ fontSize:'11px', color:'#888780', marginTop:'2px' }}>{r.portions} portions · {r.prep}</div>
            </div>
          ))}
        </div>

        <div style={{ border:'0.5px solid #e2e0d8', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ background:'#f8f7f4', borderBottom:'0.5px solid #e2e0d8', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ display:'flex', border:'0.5px solid #d3d1c7', borderRadius:'8px', overflow:'hidden' }}>
                <button onClick={() => setVer('cuisine')} style={{ padding:'6px 14px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'none', background: ver==='cuisine' ? '#534ab7' : '#fff', color: ver==='cuisine' ? '#fff' : '#5f5e5a' }}>Version cuisine</button>
                <button onClick={() => setVer('gestion')} style={{ padding:'6px 14px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'none', background: ver==='gestion' ? '#534ab7' : '#fff', color: ver==='gestion' ? '#fff' : '#5f5e5a' }}>Version gestion</button>
              </div>
              <span style={{ fontSize:'11px', color:'#888780' }}>{ver==='cuisine' ? 'Sans prix — pour la brigade' : 'Avec prix & marges'}</span>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a', display:'flex', alignItems:'center', gap:'5px' }}>
                <i className="ti ti-mail" /> Email
              </button>
              <button style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'5px' }}>
                <i className="ti ti-printer" /> Imprimer
              </button>
            </div>
          </div>

          <div style={{ padding:'24px 28px' }}>
            <div style={{ display:'flex', gap:'18px', alignItems:'flex-start', marginBottom:'20px', paddingBottom:'16px', borderBottom:'2px solid #2c2c2a' }}>
              <div style={{ width:'130px', height:'100px', borderRadius:'8px', background:'#f8f7f4', border:'0.5px solid #e2e0d8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'5px', flexShrink:0, cursor:'pointer' }}>
                <i className="ti ti-camera" style={{ fontSize:'24px', color:'#d3d1c7' }} />
                <div style={{ fontSize:'10px', color:'#b4b2a9', textAlign:'center' }}>Cliquer pour<br/>ajouter une photo</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'20px', fontWeight:'500', color:'#2c2c2a', marginBottom:'8px' }}>{actif.nom}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px' }}>
                  {[['Portions', actif.portions+' pers.'],['Préparation', actif.prep],['Cuisson', actif.cuisson],['Date', new Date().toLocaleDateString('fr-FR')]].map(([l,v]) => (
                    <div key={l} style={{ fontSize:'12px', color:'#5f5e5a' }}><strong style={{ color:'#2c2c2a' }}>{l} :</strong> {v}</div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'#534ab7', textAlign:'right', lineHeight:'1.5' }}>Le Bistrot<br/>du Coin</div>
            </div>

            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Ingrédients (par portion)</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead><tr>
                  <th style={{ padding:'5px 8px', textAlign:'left', fontSize:'9px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>Désignation</th>
                  <th style={{ padding:'5px 8px', textAlign:'right', fontSize:'9px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>Quantité</th>
                </tr></thead>
                <tbody>
                  {actif.ingredients.map((ing,i) => (
                    <tr key={i} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                      <td style={{ padding:'5px 8px', color:'#2c2c2a' }}>
                        {ing.nom}
                        {ing.t==='r' && <span style={{ fontSize:'9px', padding:'1px 5px', borderRadius:'5px', background:'#eeedfe', color:'#3c3489', fontWeight:'500', marginLeft:'5px' }}>Recette</span>}
                      </td>
                      <td style={{ padding:'5px 8px', textAlign:'right', color:'#5f5e5a' }}>{ing.qte}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Allergènes</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {actif.allergenes.map(a => <span key={a} style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'10px', background:'#fcebeb', color:'#791f1f', fontWeight:'500' }}>{a}</span>)}
              </div>
            </div>

            <div style={{ marginBottom: ver==='gestion' ? '16px' : '0' }}>
              <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Mode opératoire</div>
              {actif.steps.map((s,i) => (
                <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'7px', fontSize:'12px', color:'#2c2c2a', lineHeight:'1.6', alignItems:'flex-start' }}>
                  <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#534ab7', color:'#fff', fontSize:'9px', fontWeight:'500', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>{i+1}</div>
                  <div>{s}</div>
                </div>
              ))}
            </div>

            {ver === 'gestion' && (
              <div>
                <div style={{ fontSize:'10px', fontWeight:'500', color:'#534ab7', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', paddingBottom:'3px', borderBottom:'0.5px solid #534ab7' }}>Coût de revient</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {[['Coût / portion', actif.cout.toFixed(2)+' €', '#f8f7f4', '#2c2c2a'],['Taux de marge', marge+'%', '#eeedfe', '#3c3489'],['Prix vente TTC', actif.pv.toFixed(2)+' €', '#f8f7f4', '#2c2c2a']].map(([l,v,bg,col]) => (
                    <div key={l} style={{ background:bg, borderRadius:'8px', padding:'8px 12px', textAlign:'center' }}>
                      <div style={{ fontSize:'9px', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'3px' }}>{l}</div>
                      <div style={{ fontSize:'15px', fontWeight:'500', color:col }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop:'0.5px solid #e2e0d8', paddingTop:'8px', marginTop:'16px', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#b4b2a9' }}>
              <span>Le Bistrot du Coin — Fiche technique : {actif.nom}</span>
              <span>{new Date().toLocaleDateString('fr-FR')} — {ver==='cuisine' ? 'Version cuisine' : 'Version gestion'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
