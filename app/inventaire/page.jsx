'use client';
import { useState } from 'react';

const mercuriale = [
  { id:'p1', nom:'Poulet fermier label rouge', fourn:'Metro', prix:6.95, poids:0, expr:'' },
  { id:'p2', nom:'Carottes', fourn:'Pomona', prix:1.50, poids:0, expr:'' },
  { id:'p3', nom:'Crème fleurette 35%', fourn:'Pomona', prix:3.00, poids:0, expr:'' },
  { id:'p4', nom:'Pommes de terre Agata', fourn:'Pomona', prix:1.20, poids:0, expr:'' },
  { id:'p5', nom:'Noisettes torréfiées', fourn:'Brake France', prix:12.00, poids:0, expr:'' },
  { id:'p6', nom:'Fond de veau', fourn:'Metro', prix:4.80, poids:0, expr:'' },
  { id:'p7', nom:'Beurre doux', fourn:'Metro', prix:8.00, poids:0, expr:'' },
];

const recettes = [
  { id:'r1', nom:'Mousse Praliné', prix:4.27, poids:0, expr:'' },
  { id:'r2', nom:'Sauce burger maison', prix:5.80, poids:0, expr:'' },
  { id:'r3', nom:'Fond de tarte', prix:3.20, poids:0, expr:'' },
];

const contenants = [
  { id:'c1', nom:'Bac Gilac avec couvercle', poids:0.320 },
  { id:'c2', nom:'Bac Gastro 2,5L sans couvercle', poids:0.850 },
  { id:'c3', nom:'Caisse plastique verte', poids:1.200 },
  { id:'c4', nom:'Saladier inox 3L', poids:0.480 },
];

function evalExpr(str) {
  try {
    const clean = (str||'').replace(/,/g,'.').replace(/[^0-9.+]/g,'');
    return clean.split('+').reduce((s,p) => s+(parseFloat(p)||0), 0);
  } catch(e) { return 0; }
}

export default function Inventaire() {
  const [tab, setTab] = useState('saisie');
  const [search, setSearch] = useState('');
  const [selectionne, setSelectionne] = useState(null);
  const [poidsBrut, setPoidsBrut] = useState('');
  const [contSel, setContSel] = useState({});
  const [lignesMerc, setLignesMerc] = useState([]);
  const [lignesRec, setLignesRec] = useState([]);
  const [lignesAutre, setLignesAutre] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);

  const tous = [
    ...mercuriale.map(p => ({...p, cat:'merc'})),
    ...recettes.map(r => ({...r, cat:'rec'})),
  ];

  function onSearch(val) {
    setSearch(val);
    if (!val) { setShowSugg(false); return; }
    const q = val.toLowerCase();
    setSuggestions(tous.filter(p => p.nom.toLowerCase().includes(q)));
    setShowSugg(true);
  }

  function selectionner(p) {
    setSelectionne(p);
    setSearch(p.nom);
    setPoidsBrut('');
    setContSel({});
    setShowSugg(false);
  }

  function getPoidsConts() {
    return Object.keys(contSel).reduce((s,cid) => {
      const c = contenants.find(x => x.id===cid);
      return s + (c ? c.poids * (contSel[cid]||0) : 0);
    }, 0);
  }

  function valider() {
    if (!selectionne || !poidsBrut) return;
    const brut = evalExpr(poidsBrut);
    const cont = getPoidsConts();
    const net = Math.max(0, brut - cont);
    const contLabel = Object.keys(contSel).map(cid => {
      const c = contenants.find(x => x.id===cid);
      return contSel[cid]+'x '+c.nom;
    }).join(', ');
    const ligne = { id:Date.now(), nom:selectionne.nom, fourn:selectionne.fourn||null, prix:selectionne.prix, poids:net, cont:contLabel, cat:selectionne.cat };
    if (selectionne.cat==='merc') setLignesMerc(prev => [ligne,...prev]);
    else if (selectionne.cat==='rec') setLignesRec(prev => [ligne,...prev]);
    setSelectionne(null);
    setSearch('');
    setPoidsBrut('');
    setContSel({});
  }

  const total = [...lignesMerc,...lignesRec,...lignesAutre].reduce((s,l) => s+l.poids*l.prix, 0);
  const byFourn = lignesMerc.reduce((acc,l) => {
    if (l.fourn) acc[l.fourn] = (acc[l.fourn]||0) + l.poids*l.prix;
    return acc;
  }, {});

  const poidsConts = getPoidsConts();
  const brut = evalExpr(poidsBrut);
  const net = Math.max(0, brut - poidsConts);

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Inventaire — {new Date().toLocaleDateString('fr-FR')}</div>
        <button style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-archive" /> Archiver l inventaire
        </button>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'saisie',label:'Saisie'},{id:'contenants',label:'Contenants'},{id:'historique',label:'Historique'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'saisie' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px' }}>
          <div>
            <div style={{ background:'#534ab7', borderRadius:'12px', padding:'16px', marginBottom:'16px', position:'relative' }}>
              <div style={{ position:'relative' }}>
                <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Rechercher un produit ou une recette..." style={{ width:'100%', padding:'11px 14px', borderRadius:'8px', border:'1.5px solid rgba(255,255,255,0.4)', fontSize:'14px', outline:'none', background:'rgba(255,255,255,0.15)', color:'#fff' }} />
                {showSugg && suggestions.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', borderRadius:'10px', boxShadow:'0 4px 16px rgba(0,0,0,0.12)', zIndex:50, marginTop:'6px', maxHeight:'240px', overflowY:'auto' }}>
                    {suggestions.map(p => (
                      <div key={p.id} onClick={() => selectionner(p)} style={{ padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'0.5px solid #f1efe8' }}>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</div>
                          <div style={{ fontSize:'11px', color:'#888780' }}>{p.cat==='merc' ? p.fourn+' — '+p.prix.toFixed(2)+' €/kg' : 'Recette — '+p.prix.toFixed(2)+' €/kg'}</div>
                        </div>
                        <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'6px', fontWeight:'500', background: p.cat==='merc' ? '#eeedfe' : '#eaf3de', color: p.cat==='merc' ? '#3c3489' : '#27500a' }}>
                          {p.cat==='merc' ? 'Mercuriale' : 'Recette'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectionne && (
                <div style={{ marginTop:'12px' }}>
                  <div style={{ fontSize:'12px', color:'#cecbf6', marginBottom:'6px' }}>→ {selectionne.nom}</div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'10px' }}>
                    <input value={poidsBrut} onChange={e => { setPoidsBrut(e.target.value); }} placeholder="Poids brut (ex: 5+3+2)" style={{ flex:1, padding:'10px 12px', borderRadius:'8px', border:'1.5px solid rgba(255,255,255,0.4)', fontSize:'16px', fontWeight:'500', background:'rgba(255,255,255,0.15)', color:'#fff', outline:'none', fontFamily:'monospace' }} />
                    <span style={{ color:'#cecbf6', fontSize:'13px' }}>kg brut</span>
                  </div>

                  <div style={{ fontSize:'11px', color:'#cecbf6', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'6px' }}>Contenants (optionnel)</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'10px' }}>
                    {contenants.map(c => {
                      const qty = contSel[c.id]||0;
                      const sel = qty > 0;
                      return (
                        <div key={c.id} onClick={() => {
                          setContSel(prev => {
                            const n = {...prev};
                            if (n[c.id]) delete n[c.id]; else n[c.id]=1;
                            return n;
                          });
                        }} style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 10px', borderRadius:'8px', border:'0.5px solid', borderColor: sel ? '#fff' : 'rgba(255,255,255,0.3)', background: sel ? '#fff' : 'rgba(255,255,255,0.1)', cursor:'pointer', fontSize:'12px', color: sel ? '#3c3489' : '#fff' }}>
                          <span>{c.nom}</span>
                          <span style={{ opacity:0.7, fontSize:'10px' }}>({c.poids} kg)</span>
                          {sel && (
                            <div style={{ display:'inline-flex', alignItems:'center', gap:'2px', background:'rgba(83,74,183,0.2)', borderRadius:'5px', padding:'0 3px' }}>
                              <button onClick={e => { e.stopPropagation(); setContSel(prev => { const n={...prev}; n[c.id]=Math.max(0,(n[c.id]||1)-1); if(!n[c.id]) delete n[c.id]; return n; }); }} style={{ background:'none', border:'none', color:'#3c3489', cursor:'pointer', fontSize:'14px', fontWeight:'700', padding:'0 2px' }}>−</button>
                              <span style={{ fontSize:'12px', fontWeight:'600', minWidth:'14px', textAlign:'center', color:'#3c3489' }}>{qty}</span>
                              <button onClick={e => { e.stopPropagation(); setContSel(prev => ({...prev, [c.id]:(prev[c.id]||0)+1})); }} style={{ background:'none', border:'none', color:'#3c3489', cursor:'pointer', fontSize:'14px', fontWeight:'700', padding:'0 2px' }}>+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {brut > 0 && (
                    <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', color:'#fff', marginBottom:'10px' }}>
                      <span>{brut.toFixed(3)} kg brut</span>
                      {poidsConts > 0 && <span style={{ color:'#fac775' }}> — contenants : {poidsConts.toFixed(3)} kg</span>}
                      <span style={{ fontWeight:'600' }}> → NET : {net.toFixed(3)} kg</span>
                    </div>
                  )}

                  <button onClick={valider} style={{ width:'100%', padding:'10px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#fff', color:'#3c3489', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    <i className="ti ti-plus" /> Ajouter à l inventaire
                  </button>
                </div>
              )}

              <div style={{ marginTop:'8px', display:'flex', gap:'12px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'11px', color:'#cecbf6' }}>Additions : 5+3+2</span>
                <span style={{ fontSize:'11px', color:'#cecbf6' }}>Contenants déduits auto</span>
              </div>
            </div>

            {[
              {titre:'Produits mercuriale', lignes:lignesMerc, cols:['Produit','Fournisseur','Contenants','Poids net','Prix/kg','Valeur']},
              {titre:'Recettes / Préparations', lignes:lignesRec, cols:['Recette','—','Contenants','Poids net','Coût/kg','Valeur']},
              {titre:'Hors mercuriale', lignes:lignesAutre, cols:['Produit','—','Contenants','Poids net','Prix/kg','Valeur']},
            ].map((section,si) => (
              <div key={si} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px', marginBottom:'12px' }}>
                <div style={{ fontSize:'12px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px', paddingBottom:'8px', borderBottom:'0.5px solid #e2e0d8' }}>
                  {section.titre} <span style={{ background:'#eeedfe', color:'#3c3489', borderRadius:'10px', padding:'1px 8px', fontSize:'11px', fontWeight:'400', textTransform:'none' }}>{section.lignes.length}</span>
                </div>
                {section.lignes.length === 0 ? (
                  <div style={{ fontSize:'12px', color:'#b4b2a9', textAlign:'center', padding:'12px' }}>Aucun produit saisi</div>
                ) : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <thead><tr>{section.cols.map(c => <th key={c} style={{ padding:'6px 10px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{c}</th>)}<th /></tr></thead>
                    <tbody>
                      {section.lignes.map(l => (
                        <tr key={l.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                          <td style={{ padding:'8px 10px', fontWeight:'500', color:'#2c2c2a' }}>{l.nom}</td>
                          <td style={{ padding:'8px 10px', color:'#888780', fontSize:'12px' }}>{l.fourn||'—'}</td>
                          <td style={{ padding:'8px 10px', fontSize:'11px', color:'#534ab7' }}>{l.cont||'—'}</td>
                          <td style={{ padding:'8px 10px', fontFamily:'monospace', color:'#2c2c2a' }}>{l.poids.toFixed(3)} kg</td>
                          <td style={{ padding:'8px 10px', color:'#888780', fontSize:'12px' }}>{l.prix.toFixed(2)} €</td>
                          <td style={{ padding:'8px 10px', fontWeight:'500', color:'#534ab7' }}>{(l.poids*l.prix).toFixed(2)} €</td>
                          <td style={{ padding:'8px 10px' }}><button style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'14px' }}><i className="ti ti-x" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>

          <div>
            <div style={{ background:'#534ab7', borderRadius:'12px', padding:'16px', color:'#fff', marginBottom:'12px' }}>
              <div style={{ fontSize:'11px', color:'#cecbf6', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Valeur totale</div>
              <div style={{ fontSize:'28px', fontWeight:'500' }}>{total.toFixed(2)} €</div>
            </div>
            <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Par fournisseur</div>
              {Object.keys(byFourn).length === 0 ? (
                <div style={{ fontSize:'12px', color:'#b4b2a9', textAlign:'center', padding:'8px' }}>Aucun produit</div>
              ) : Object.entries(byFourn).map(([f,v]) => (
                <div key={f} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'5px 0', borderBottom:'0.5px solid #f1efe8' }}>
                  <span style={{ color:'#888780' }}>{f}</span>
                  <span style={{ fontWeight:'500', color:'#534ab7' }}>{v.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'contenants' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Mes contenants</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'12px' }}>
            {contenants.map(c => (
              <div key={c.id} style={{ border:'0.5px solid #e2e0d8', borderRadius:'10px', padding:'14px' }}>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>{c.nom}</div>
                <div style={{ fontSize:'22px', fontWeight:'500', color:'#534ab7' }}>{c.poids} kg</div>
                <div style={{ fontSize:'11px', color:'#888780', marginBottom:'10px' }}>Poids vide</div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button style={{ padding:'5px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Modifier</button>
                </div>
              </div>
            ))}
            <div style={{ border:'2px dashed #d3d1c7', borderRadius:'10px', padding:'14px', minHeight:'110px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', color:'#534ab7', fontSize:'13px', fontWeight:'500' }}>
              <i className="ti ti-plus" style={{ fontSize:'18px' }} /> Ajouter
            </div>
          </div>
        </div>
      )}

      {tab === 'historique' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Inventaires archivés</div>
          {[
            {date:'11 juin 2026', nb:14, val:3180, par:'Rafael'},
            {date:'12 mai 2026', nb:11, val:2940, par:'Marco Bianchi'},
            {date:'14 avril 2026', nb:13, val:3050, par:'Rafael'},
          ].map((h,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f8f7f4', borderRadius:'8px', marginBottom:'8px' }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>Inventaire du {h.date}</div>
                <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>{h.nb} produits — Archivé par {h.par}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ fontSize:'16px', fontWeight:'500', color:'#534ab7' }}>{h.val.toLocaleString('fr-FR')} €</div>
                <button style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Voir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
