'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

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
  const [showSugg, setShowSugg] = useState(false);

  const [produits, setProduits] = useState([]);
  const [recettes, setRecettes] = useState([]);
  const [contenants, setContenants] = useState([]);
  const [lignesMerc, setLignesMerc] = useState([]);
  const [lignesRec, setLignesRec] = useState([]);
  const [lignesAutre, setLignesAutre] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [historiqueDetail, setHistoriqueDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalHors, setModalHors] = useState(false);
  const [formHors, setFormHors] = useState({ nom:'', prix:'' });
  const [modalContenant, setModalContenant] = useState(false);
  const [formContenant, setFormContenant] = useState({ nom:'', poids_vide:'' });

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    setLoading(true);
    const { data: prod } = await supabase.from('produits').select('*, fournisseurs(nom)');
    const { data: rec } = await supabase.from('recettes').select('*');
    const { data: cont } = await supabase.from('contenants').select('*');
    const { data: histo } = await supabase.from('inventaires').select('*').order('date_inventaire', { ascending: false });
    setProduits(prod || []);
    setRecettes(rec || []);
    setContenants(cont || []);
    setHistorique(histo || []);
    setLoading(false);
  }

  const tous = [
    ...produits.map(p => ({ id:p.id, nom:p.nom, prix:p.prix_ht, fourn:p.fournisseurs?.nom, cat:'merc' })),
    ...recettes.map(r => ({ id:r.id, nom:r.nom, prix:0, cat:'rec' })),
  ];

  function onSearch(val) {
    setSearch(val);
    if (!val) { setShowSugg(false); return; }
    setShowSugg(true);
  }

  const suggestions = tous.filter(p => search && p.nom.toLowerCase().includes(search.toLowerCase()));

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
      return s + (c ? parseFloat(c.poids_vide) * (contSel[cid]||0) : 0);
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
    const ligne = { id:Date.now()+'', produit_id: selectionne.cat==='merc' ? selectionne.id : null, recette_id: selectionne.cat==='rec' ? selectionne.id : null, nom:selectionne.nom, fourn:selectionne.fourn||null, prix:selectionne.prix, poids_net:net, contenants_detail:contLabel, categorie:selectionne.cat };

    if (selectionne.cat==='merc') setLignesMerc(prev => [ligne,...prev]);
    else if (selectionne.cat==='rec') setLignesRec(prev => [ligne,...prev]);

    setSelectionne(null);
    setSearch('');
    setPoidsBrut('');
    setContSel({});
  }

  function ajouterHorsMercuriale() {
    if (!formHors.nom) return;
    const ligne = { id:Date.now()+'', produit_id:null, recette_id:null, nom:formHors.nom, fourn:null, prix: parseFloat(formHors.prix)||0, poids_net:0, contenants_detail:'', categorie:'autre' };
    setLignesAutre(prev => [...prev, ligne]);
    setModalHors(false);
    setFormHors({ nom:'', prix:'' });
  }

  function supprimerLigne(cat, id) {
    if (cat==='merc') setLignesMerc(prev => prev.filter(l => l.id !== id));
    if (cat==='rec') setLignesRec(prev => prev.filter(l => l.id !== id));
    if (cat==='autre') setLignesAutre(prev => prev.filter(l => l.id !== id));
  }

  async function ajouterContenant() {
    if (!formContenant.nom || !formContenant.poids_vide) return;
    await supabase.from('contenants').insert([{ nom: formContenant.nom, poids_vide: parseFloat(formContenant.poids_vide) }]);
    setModalContenant(false);
    setFormContenant({ nom:'', poids_vide:'' });
    chargerDonnees();
  }

  async function archiver() {
    const toutesLignes = [...lignesMerc, ...lignesRec, ...lignesAutre];
    if (toutesLignes.length === 0) { alert('Aucun produit saisi.'); return; }
    if (!confirm('Archiver l inventaire ? Cette action est irréversible.')) return;

    const total = toutesLignes.reduce((s,l) => s+l.poids_net*l.prix, 0);

    const { data: inv, error } = await supabase.from('inventaires').insert([{
      date_inventaire: new Date().toISOString().split('T')[0],
      statut: 'archive',
      valeur_totale: total,
      archive_par: 'Rafael Colonnello',
    }]).select().single();

    if (error) { alert('Erreur : ' + error.message); return; }

    const lignesAInserer = toutesLignes.map(l => ({
      inventaire_id: inv.id,
      produit_id: l.produit_id,
      recette_id: l.recette_id,
      nom: l.nom,
      poids_net: l.poids_net,
      prix: l.prix,
      contenants_detail: l.contenants_detail,
      categorie: l.categorie,
    }));
    await supabase.from('inventaire_lignes').insert(lignesAInserer);

    setLignesMerc([]);
    setLignesRec([]);
    setLignesAutre([]);
    chargerDonnees();
    alert('Inventaire archivé — ' + total.toFixed(2) + ' €');
  }

  async function voirDetailHistorique(invId) {
    const { data: lignes } = await supabase.from('inventaire_lignes').select('*').eq('inventaire_id', invId);
    const inv = historique.find(h => h.id === invId);
    setHistoriqueDetail({ inv, lignes: lignes || [] });
  }

  const total = [...lignesMerc,...lignesRec,...lignesAutre].reduce((s,l) => s+l.poids_net*l.prix, 0);
  const byFourn = lignesMerc.reduce((acc,l) => {
    if (l.fourn) acc[l.fourn] = (acc[l.fourn]||0) + l.poids_net*l.prix;
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
        <button onClick={archiver} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-archive" /> Archiver l inventaire
        </button>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[{id:'saisie',label:'Saisie'},{id:'contenants',label:'Contenants'},{id:'historique',label:'Historique'}].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setHistoriqueDetail(null); }} style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
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
                          <div style={{ fontSize:'11px', color:'#888780' }}>{p.cat==='merc' ? (p.fourn||'')+' — '+parseFloat(p.prix).toFixed(2)+' €/kg' : 'Recette'}</div>
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
                    <input value={poidsBrut} onChange={e => setPoidsBrut(e.target.value)} placeholder="Poids brut (ex: 5+3+2)" style={{ flex:1, padding:'10px 12px', borderRadius:'8px', border:'1.5px solid rgba(255,255,255,0.4)', fontSize:'16px', fontWeight:'500', background:'rgba(255,255,255,0.15)', color:'#fff', outline:'none', fontFamily:'monospace' }} />
                    <span style={{ color:'#cecbf6', fontSize:'13px' }}>kg brut</span>
                  </div>

                  <div style={{ fontSize:'11px', color:'#cecbf6', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'6px' }}>Contenants (optionnel)</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'10px' }}>
                    {contenants.map(c => {
                      const qty = contSel[c.id]||0;
                      const sel = qty > 0;
                      return (
                        <div key={c.id} onClick={() => {
                          setContSel(prev => { const n = {...prev}; if (n[c.id]) delete n[c.id]; else n[c.id]=1; return n; });
                        }} style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 10px', borderRadius:'8px', border:'0.5px solid', borderColor: sel ? '#fff' : 'rgba(255,255,255,0.3)', background: sel ? '#fff' : 'rgba(255,255,255,0.1)', cursor:'pointer', fontSize:'12px', color: sel ? '#3c3489' : '#fff' }}>
                          <span>{c.nom}</span>
                          <span style={{ opacity:0.7, fontSize:'10px' }}>({c.poids_vide} kg)</span>
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
            </div>

            {[
              {titre:'Produits mercuriale', lignes:lignesMerc, cat:'merc'},
              {titre:'Recettes / Préparations', lignes:lignesRec, cat:'rec'},
              {titre:'Hors mercuriale', lignes:lignesAutre, cat:'autre'},
            ].map((section,si) => (
              <div key={si} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px', marginBottom:'12px' }}>
                <div style={{ fontSize:'12px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px', paddingBottom:'8px', borderBottom:'0.5px solid #e2e0d8', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span>{section.titre} <span style={{ background:'#eeedfe', color:'#3c3489', borderRadius:'10px', padding:'1px 8px', fontSize:'11px', fontWeight:'400', textTransform:'none' }}>{section.lignes.length}</span></span>
                  {section.cat === 'autre' && (
                    <button onClick={() => setModalHors(true)} style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>+ Ajouter</button>
                  )}
                </div>
                {section.lignes.length === 0 ? (
                  <div style={{ fontSize:'12px', color:'#b4b2a9', textAlign:'center', padding:'12px' }}>Aucun produit saisi</div>
                ) : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <tbody>
                      {section.lignes.map(l => (
                        <tr key={l.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                          <td style={{ padding:'8px 10px', fontWeight:'500', color:'#2c2c2a' }}>{l.nom}</td>
                          <td style={{ padding:'8px 10px', color:'#888780', fontSize:'12px' }}>{l.fourn||'—'}</td>
                          <td style={{ padding:'8px 10px', fontSize:'11px', color:'#534ab7' }}>{l.contenants_detail||'—'}</td>
                          <td style={{ padding:'8px 10px', fontFamily:'monospace', color:'#2c2c2a' }}>{l.poids_net.toFixed(3)} kg</td>
                          <td style={{ padding:'8px 10px', color:'#888780', fontSize:'12px' }}>{parseFloat(l.prix).toFixed(2)} €</td>
                          <td style={{ padding:'8px 10px', fontWeight:'500', color:'#534ab7' }}>{(l.poids_net*l.prix).toFixed(2)} €</td>
                          <td style={{ padding:'8px 10px' }}><button onClick={() => supprimerLigne(l.categorie, l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'14px' }}><i className="ti ti-x" /></button></td>
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
                <div style={{ fontSize:'22px', fontWeight:'500', color:'#534ab7' }}>{c.poids_vide} kg</div>
                <div style={{ fontSize:'11px', color:'#888780' }}>Poids vide</div>
              </div>
            ))}
            <div onClick={() => setModalContenant(true)} style={{ border:'2px dashed #d3d1c7', borderRadius:'10px', padding:'14px', minHeight:'90px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', color:'#534ab7', fontSize:'13px', fontWeight:'500' }}>
              <i className="ti ti-plus" style={{ fontSize:'18px' }} /> Ajouter
            </div>
          </div>
        </div>
      )}

      {tab === 'historique' && !historiqueDetail && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Inventaires archivés</div>
          {historique.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucun inventaire archivé pour le moment.</div>
          ) : historique.map(h => (
            <div key={h.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f8f7f4', borderRadius:'8px', marginBottom:'8px' }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>Inventaire du {new Date(h.date_inventaire).toLocaleDateString('fr-FR')}</div>
                <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Archivé par {h.archive_par}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ fontSize:'16px', fontWeight:'500', color:'#534ab7' }}>{parseFloat(h.valeur_totale).toFixed(2)} €</div>
                <button onClick={() => voirDetailHistorique(h.id)} style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Voir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'historique' && historiqueDetail && (
        <div>
          <button onClick={() => setHistoriqueDetail(null)} style={{ marginBottom:'12px', padding:'7px 14px', borderRadius:'8px', fontSize:'13px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>
            <i className="ti ti-arrow-left" style={{ marginRight:'4px' }} /> Retour à la liste
          </button>
          <div style={{ background:'#534ab7', borderRadius:'12px', padding:'16px', color:'#fff', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>Inventaire du {new Date(historiqueDetail.inv.date_inventaire).toLocaleDateString('fr-FR')}</div>
            <div style={{ fontSize:'22px', fontWeight:'500' }}>{parseFloat(historiqueDetail.inv.valeur_totale).toFixed(2)} €</div>
          </div>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead><tr>{['Produit','Catégorie','Poids net','Prix','Valeur'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>)}</tr></thead>
              <tbody>
                {historiqueDetail.lignes.map(l => (
                  <tr key={l.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                    <td style={{ padding:'8px 12px', fontWeight:'500', color:'#2c2c2a' }}>{l.nom}</td>
                    <td style={{ padding:'8px 12px', color:'#888780' }}>{l.categorie}</td>
                    <td style={{ padding:'8px 12px', fontFamily:'monospace' }}>{parseFloat(l.poids_net).toFixed(3)} kg</td>
                    <td style={{ padding:'8px 12px' }}>{parseFloat(l.prix).toFixed(2)} €</td>
                    <td style={{ padding:'8px 12px', fontWeight:'500', color:'#534ab7' }}>{(l.poids_net*l.prix).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalHors && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'400px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'16px' }}>Produit hors mercuriale</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Nom du produit" value={formHors.nom} onChange={e => setFormHors({...formHors, nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Prix estimé (€/kg)" type="number" step="0.01" value={formHors.prix} onChange={e => setFormHors({...formHors, prix:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModalHors(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Annuler</button>
              <button onClick={ajouterHorsMercuriale} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {modalContenant && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'400px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'16px' }}>Nouveau contenant</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Nom du contenant" value={formContenant.nom} onChange={e => setFormContenant({...formContenant, nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Poids vide (kg)" type="number" step="0.001" value={formContenant.poids_vide} onChange={e => setFormContenant({...formContenant, poids_vide:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModalContenant(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Annuler</button>
              <button onClick={ajouterContenant} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
