'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { getEtablissementActif } from '../../../lib/etablissement'

function Toast({ msg, type }) {
  if (!msg) return null
  return <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background: type==='err' ? '#a32d2d' : '#27500a', color:'#fff', padding:'10px 18px', borderRadius:10, fontSize:13, zIndex:9999, whiteSpace:'nowrap' }}>{msg}</div>
}

function fmt(n, d=2) { return Number(n).toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d}) }

// DropIng DOIT être en dehors de Couts pour éviter le bug de focus
const DropIng = ({search, setSearch, onAdd, getSugg, badge, sg, inp}) => {
  const [open, setOpen] = useState(false)
  const sugg = getSugg(search)
  return (
    <div style={{position:'relative',marginBottom:14}}>
      <input value={search}
        onChange={e=>{setSearch(e.target.value);setOpen(true)}}
        onClick={()=>setOpen(true)}
        placeholder="Rechercher un produit ou une fiche recette…"
        style={{...inp,paddingRight:36}} autoComplete="off"/>
      <i className="ti ti-search" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',color:'#888780',pointerEvents:'none'}}/>
      {open && search.length>=1 && (
        <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'0.5px solid #d3d1c7',borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',zIndex:500,marginTop:3,maxHeight:260,overflowY:'auto'}}>
          {sugg.length===0
            ? <div style={{padding:12,color:'#888780',fontSize:13}}>Aucun résultat</div>
            : <>
              {sugg.filter(x=>x.type==='recette').length>0 && <>
                <div style={sg}>Fiches recettes</div>
                {sugg.filter(x=>x.type==='recette').map(r=>(
                  <div key={r.id}
                    onMouseDown={e=>{e.preventDefault();onAdd({...r,itemId:r.id,poids:0});setSearch('');setOpen(false)}}
                    style={{padding:'9px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,borderBottom:'0.5px solid #f1efe8'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8f7f4'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <span>{r.nom}<span style={badge('recette')}>Recette</span></span>
                    <span style={{fontSize:11,color:'#888780'}}>{fmt(r.prixUnit,2)} €/kg</span>
                  </div>
                ))}
              </>}
              {sugg.filter(x=>x.type==='produit').length>0 && <>
                <div style={sg}>Produits mercuriale</div>
                {sugg.filter(x=>x.type==='produit').map(p=>(
                  <div key={p.id}
                    onMouseDown={e=>{e.preventDefault();onAdd({...p,itemId:p.id,poids:0});setSearch('');setOpen(false)}}
                    style={{padding:'9px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,borderBottom:'0.5px solid #f1efe8'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8f7f4'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <span>{p.nom}<span style={badge('produit')}>Produit</span></span>
                    <span style={{fontSize:11,color:'#888780'}}>{fmt(p.prixUnit,2)} €/kg</span>
                  </div>
                ))}
              </>}
            </>
          }
        </div>
      )}
    </div>
  )
}


const TableIng = ({arr,setArr,readOnly,coutLigne,fmt,badge}) => {
  const tot = arr.reduce((s,l)=>s+coutLigne(l),0)
  if (!arr.length) return <div style={{textAlign:'center',color:'#888780',fontSize:13,padding:24}}>{readOnly?'Aucun ingrédient':'Recherchez et ajoutez des ingrédients ci-dessus'}</div>
  return (
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
      <thead><tr>
        {['Ingrédient','Poids (kg)','Prix unitaire','Coût',readOnly?'%':''].map(h=>(
          <th key={h} style={{padding:'8px 12px',textAlign:h==='Ingrédient'?'left':'center',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8'}}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {arr.map((l,i)=>{
          const c=coutLigne(l); const pct=tot>0?c/tot*100:0
          return (
            <tr key={i} style={{borderBottom:'0.5px solid #f1efe8'}}>
              <td style={{padding:'10px 12px',fontWeight:500,color:'#2c2c2a'}}>{l.nom}<span style={badge(l.type)}>{l.type==='produit'?'Produit':'Recette'}</span></td>
              <td style={{padding:'8px 12px',textAlign:'center'}}>
                {readOnly
                  ? <span style={{color:'#5f5e5a'}}>{fmt(l.poids,3)}</span>
                  : <input type="number" step="0.001" min="0" placeholder="0,100" value={l.poids===0?'':l.poids}
                      onChange={e=>setArr(prev=>prev.map((x,n)=>n===i?{...x,poids:e.target.value}:x))} style={{width:90,padding:"6px 8px",borderRadius:6,border:"1.5px solid #534ab7",fontSize:13,textAlign:"center",outline:"none",background:"#f0effe"}}/>
                }
              </td>
              <td style={{padding:'10px 12px',textAlign:'center',color:'#5f5e5a',fontSize:12}}>{fmt(l.prixUnit,2)} €/kg</td>
              <td style={{padding:'10px 12px',textAlign:'center',fontWeight:500,fontFamily:'monospace'}}>{fmt(c,3)} €</td>
              {readOnly
                ? <td style={{padding:'10px 12px',textAlign:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}>
                      <div style={{width:50,height:5,background:'#f1efe8',borderRadius:3,overflow:'hidden'}}><div style={{width:Math.min(pct,100)+'%',height:'100%',background:'#534ab7',borderRadius:3}}/></div>
                      <span style={{fontSize:11,color:'#888780',minWidth:28}}>{fmt(pct,0)}%</span>
                    </div>
                  </td>
                : <td style={{padding:'10px 12px',textAlign:'center'}}>
                    <button onClick={()=>setArr(prev=>prev.filter((_,n)=>n!==i))} style={{background:'none',border:'none',cursor:'pointer',color:'#a32d2d',fontSize:16}}>✕</button>
                  </td>
              }
            </tr>
          )
        })}
      </tbody>
      <tfoot><tr style={{background:'#f8f7f4'}}>
        <td colSpan={3} style={{padding:'10px 12px',fontSize:12,fontWeight:500,color:'#888780'}}>Total coût matières</td>
        <td style={{padding:'10px 12px',textAlign:'center',fontWeight:600,color:'#534ab7',fontFamily:'monospace'}}>{fmt(tot,3)} €</td>
        <td/>
      </tr></tfoot>
    </table>
  )
}

export default function Couts() {
  const etabId = getEtablissementActif()
  const [view, setView] = useState('liste')
  const [fiches, setFiches] = useState([])
  const [produits, setProduits] = useState([])
  const [recettes, setRecettes] = useState([]) // {id, nom, cout}
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({msg:'',type:'ok'})

  const [nomFiche, setNomFiche] = useState('')
  const [prixTTC, setPrixTTC] = useState('')
  const [tva, setTva] = useState('10')
  const [compo, setCompo] = useState([])
  const [searchIng, setSearchIng] = useState('')

  const [searchFiche, setSearchFiche] = useState('')
  const [ficheActive, setFicheActive] = useState(null)
  const [lignes, setLignes] = useState([])
  const [modeModif, setModeModif] = useState(false)
  const [nomMod, setNomMod] = useState('')
  const [prixMod, setPrixMod] = useState('')
  const [tvaMod, setTvaMod] = useState('')
  const [compoMod, setCompoMod] = useState([])
  const [searchIngMod, setSearchIngMod] = useState('')
  const [editPrix, setEditPrix] = useState(false)
  const [prixRapide, setPrixRapide] = useState('')

  const toast2 = (m,t='ok') => { setToast({msg:m,type:t}); setTimeout(()=>setToast({msg:'',type:'ok'}),3000) }

  useEffect(()=>{ charger() },[])

  const charger = async () => {
    setLoading(true)
    // Charger fiches, produits, recettes en parallèle
    const [{data:fi},{data:pr},{data:re}] = await Promise.all([
      supabase.from('couts_revient').select('*').eq('etablissement_id',etabId).order('nom'),
      supabase.from('produits').select('id,nom,prix_ht').eq('etablissement_id',etabId).order('nom'),
      supabase.from('recettes').select('id,nom').eq('etablissement_id',etabId).order('nom'),
    ])
    setFiches(fi||[])
    setProduits(pr||[])

    // Calculer le coût de chaque recette via requête séparée
    if (re?.length) {
      const recIds = re.map(r=>r.id)
      // Charger les ingrédients
      const {data:ings} = await supabase.from('recette_ingredients')
        .select('recette_id,poids,produit_id,recette_id_lie')
        .in('recette_id',recIds)
      // Charger les prix des produits utilisés
      const prodIdsNeed = [...new Set((ings||[]).map(i=>i.produit_id).filter(Boolean))]
      const {data:prods} = prodIdsNeed.length
        ? await supabase.from('produits').select('id,prix_ht').in('id',prodIdsNeed)
        : {data:[]}
      const prixMap = Object.fromEntries((prods||[]).map(p=>[p.id,parseFloat(p.prix_ht)||0]))
      // Calcul récursif coût/kg (gère sous-recettes)
      const calcKg = (recetteId, visited=new Set()) => {
        if (visited.has(recetteId)) return 0
        visited.add(recetteId)
        const ingRec = (ings||[]).filter(i=>i.recette_id===recetteId)
        const coutTot = ingRec.reduce((s,i)=>{
          if (i.produit_id) return s+(parseFloat(i.poids)||0)*(prixMap[i.produit_id]||0)
          if (i.recette_id_lie) return s+(parseFloat(i.poids)||0)*calcKg(i.recette_id_lie, new Set(visited))
          return s
        },0)
        const poidsTot = ingRec.filter(i=>i.produit_id||i.recette_id_lie).reduce((s,i)=>s+(parseFloat(i.poids)||0),0)
        return poidsTot>0 ? coutTot/poidsTot : 0
      }
      setRecettes(re.map(r => ({...r, cout: calcKg(r.id)})))
    } else {
      setRecettes([])
    }
    setLoading(false)
  }

  const coutLigne = (l) => (parseFloat(l.poids)||0) * (parseFloat(l.prixUnit)||0)
  const coutTotal = (arr) => arr.reduce((s,l)=>s+coutLigne(l),0)

  const calculs = (cHT, pvTTC, tvaPct) => {
    const t = parseFloat(tvaPct)||10
    const pH = pvTTC/(1+t/100)
    const cTTC = cHT*(1+t/100)
    return {
      coutHT:cHT, coutTTC:cTTC, prixHT:pH, prixTTC:pvTTC,
      margeHT:pH-cHT, margeTTC:pvTTC-cTTC,
      txHT:pH>0?(pH-cHT)/pH*100:0,
      txTTC:pvTTC>0?(pvTTC-cTTC)/pvTTC*100:0,
      coefHT:cHT>0?pH/cHT:0,
      coefTTC:cTTC>0?pvTTC/cTTC:0,
      fc:pH>0?cHT/pH*100:0
    }
  }

  const getSugg = (s) => {
    if (!s||s.length<1) return []
    const q = s.toLowerCase()
    return [
      ...recettes.filter(r=>r.nom.toLowerCase().includes(q)).map(r=>({type:'recette',id:r.id,nom:r.nom,prixUnit:r.cout||0})),
      ...produits.filter(p=>p.nom.toLowerCase().includes(q)).map(p=>({type:'produit',id:p.id,nom:p.nom,prixUnit:parseFloat(p.prix_ht)||0}))
    ]
  }

  const sauvegarder = async () => {
    if (!nomFiche.trim()) { toast2('Nom requis','err'); return }
    if (!prixTTC) { toast2('Prix requis','err'); return }
    if (!compo.length) { toast2('Ajoutez au moins un ingrédient','err'); return }
    const {data:f,error} = await supabase.from('couts_revient')
      .insert([{nom:nomFiche.trim(),prix_vente_ttc:parseFloat(prixTTC),tva:parseFloat(tva),etablissement_id:etabId}])
      .select().single()
    if (error) { toast2('Erreur: '+error.message,'err'); return }
    const rows = compo.map(l=>({
      cout_revient_id:f.id, type:l.type,
      produit_id:l.type==='produit'?l.id:null,
      recette_id:l.type==='recette'?l.id:null,
      poids_grammes:Math.round((parseFloat(l.poids)||0)*1000)
    }))
    if (rows.length) await supabase.from('couts_revient_lignes').insert(rows)
    toast2('Fiche créée !')
    setNomFiche('');setPrixTTC('');setTva('10');setCompo([])
    await charger(); setView('liste')
  }

  const chargerFiche = async (f) => {
    setFicheActive(f); setSearchFiche(f.nom)
    setModeModif(false); setPrixRapide(String(f.prix_vente_ttc)); setEditPrix(false)
    const {data:ls} = await supabase.from('couts_revient_lignes')
      .select('*').eq('cout_revient_id',f.id).order('created_at')
    if (!ls?.length) { setLignes([]); return }
    const prodIds = ls.filter(l=>l.type==='produit'&&l.produit_id).map(l=>l.produit_id)
    const recIds = ls.filter(l=>l.type==='recette'&&l.recette_id).map(l=>l.recette_id)
    const [pRes,rRes] = await Promise.all([
      prodIds.length?supabase.from('produits').select('id,nom,prix_ht').in('id',prodIds):{data:[]},
      recIds.length?supabase.from('recettes').select('id,nom').in('id',recIds):{data:[]}
    ])
    const pm = Object.fromEntries((pRes.data||[]).map(p=>[p.id,p]))
    // Pour les recettes dans les lignes, récupérer leur coût depuis l'état recettes
    const recMap = Object.fromEntries((rRes.data||[]).map(r=>[r.id,r]))
    const recettesState = recettes
    setLignes(ls.map(l=>{
      if (l.type==='produit') {
        const p = pm[l.produit_id]
        return {id:l.id,type:'produit',itemId:l.produit_id,nom:p?.nom||'?',prixUnit:parseFloat(p?.prix_ht)||0,poids:(l.poids_grammes||0)/1000}
      } else {
        const rState = recettesState.find(r=>r.id===l.recette_id)
        const rBase = recMap[l.recette_id]
        return {id:l.id,type:'recette',itemId:l.recette_id,nom:rState?.nom||rBase?.nom||'?',prixUnit:rState?.cout||0,poids:(l.poids_grammes||0)/1000}
      }
    }))
  }

  const savePrixRapide = async () => {
    const p = parseFloat(prixRapide); if (!p) return
    await supabase.from('couts_revient').update({prix_vente_ttc:p}).eq('id',ficheActive.id)
    const upd = {...ficheActive,prix_vente_ttc:p}
    setFicheActive(upd); setFiches(prev=>prev.map(f=>f.id===ficheActive.id?upd:f))
    setEditPrix(false); toast2('Prix mis à jour !')
  }

  const ouvrirModif = () => {
    setNomMod(ficheActive.nom); setPrixMod(String(ficheActive.prix_vente_ttc))
    setTvaMod(String(ficheActive.tva)); setCompoMod(lignes.map(l=>({...l}))); setModeModif(true)
  }

  const saveModif = async () => {
    if (!nomMod.trim()) { toast2('Nom requis','err'); return }
    await supabase.from('couts_revient').update({nom:nomMod.trim(),prix_vente_ttc:parseFloat(prixMod),tva:parseFloat(tvaMod)}).eq('id',ficheActive.id)
    await supabase.from('couts_revient_lignes').delete().eq('cout_revient_id',ficheActive.id)
    if (compoMod.length) {
      const rows = compoMod.map(l=>({
        cout_revient_id:ficheActive.id, type:l.type,
        produit_id:l.type==='produit'?(l.itemId||l.id):null,
        recette_id:l.type==='recette'?(l.itemId||l.id):null,
        poids_grammes:Math.round((parseFloat(l.poids)||0)*1000)
      }))
      await supabase.from('couts_revient_lignes').insert(rows)
    }
    toast2('Enregistré !'); setModeModif(false); await charger()
    const upd = {...ficheActive,nom:nomMod.trim(),prix_vente_ttc:parseFloat(prixMod),tva:parseFloat(tvaMod)}
    setFicheActive(upd); await chargerFiche(upd)
  }

  const supprimerFiche = async () => {
    if (!window.confirm('Supprimer cette fiche ?')) return
    await supabase.from('couts_revient').delete().eq('id',ficheActive.id)
    toast2('Supprimée'); setFicheActive(null); setLignes([]); setSearchFiche(''); setModeModif(false); charger()
  }

  const card = {background:'#fff',borderRadius:12,border:'0.5px solid #e2e0d8',padding:20}
  const btn = {padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',border:'0.5px solid #d3d1c7',background:'#fff',color:'#5f5e5a',display:'inline-flex',alignItems:'center',gap:6}
  const btnP = {...btn,background:'#534ab7',color:'#fff',border:'none'}
  const inp = {width:'100%',padding:'10px 12px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',boxSizing:'border-box'}
  const inpKg = {width:90,padding:'6px 8px',borderRadius:6,border:'1.5px solid #534ab7',fontSize:13,textAlign:'center',outline:'none',background:'#f0effe'}
  const badge = (t) => ({fontSize:10,padding:'1px 6px',borderRadius:8,fontWeight:500,background:t==='recette'?'#eeedfe':'#e6f1fb',color:t==='recette'?'#3c3489':'#0c447c',marginLeft:5})
  const sg = {padding:'5px 10px',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',background:'#f8f7f4',letterSpacing:'0.5px'}


  const Calculs = ({c}) => {
    if (!c) return null
    return (
      <div style={card}>
        <div style={{fontSize:12,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}>Calculs de marge</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:'#f8f7f4'}}>
            {['','Coût de revient','Taux de marge','Marge','Coefficient multiplicateur','Prix de vente'].map(h=>(
              <th key={h} style={{padding:'10px 14px',textAlign:h===''?'left':'center',fontSize:11,fontWeight:600,color:'#5f5e5a',textTransform:'uppercase',letterSpacing:'0.4px',borderBottom:'0.5px solid #e2e0d8'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[['HT',c.coutHT,c.txHT,c.margeHT,c.coefHT,c.prixHT],['TTC',c.coutTTC,c.txTTC,c.margeTTC,c.coefTTC,c.prixTTC]].map(([lb,cout,tx,marge,coef,prix],ri)=>(
              <tr key={lb} style={{background:ri===1?'#f8f7f4':'#fff'}}>
                <td style={{padding:'12px 14px',fontWeight:600,color:'#2c2c2a',borderBottom:ri===0?'0.5px solid #f1efe8':'none'}}>{lb}</td>
                <td style={{padding:'12px 14px',textAlign:'center',fontWeight:500,borderBottom:ri===0?'0.5px solid #f1efe8':'none'}}>{fmt(cout)} €</td>
                <td style={{padding:'12px 14px',textAlign:'center',fontWeight:600,borderBottom:ri===0?'0.5px solid #f1efe8':'none',color:tx>65?'#27500a':tx>50?'#534ab7':'#a32d2d'}}>{fmt(tx)}%</td>
                <td style={{padding:'12px 14px',textAlign:'center',borderBottom:ri===0?'0.5px solid #f1efe8':'none'}}>{fmt(marge)} €</td>
                <td style={{padding:'12px 14px',textAlign:'center',borderBottom:ri===0?'0.5px solid #f1efe8':'none'}}>{fmt(coef)}</td>
                <td style={{padding:'12px 14px',textAlign:'center',fontWeight:500,color:'#534ab7',borderBottom:ri===0?'0.5px solid #f1efe8':'none'}}>{fmt(prix)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:12,display:'flex',gap:10}}>
          <div style={{padding:'8px 14px',borderRadius:8,background:c.fc>35?'#fcebeb':'#eaf3de',fontSize:12}}>
            Food cost HT : <strong style={{color:c.fc>35?'#a32d2d':'#27500a'}}>{fmt(c.fc)}%</strong>
            <span style={{color:'#888780',marginLeft:6}}>{c.fc>35?'⚠ Trop élevé':'✓ Correct'}</span>
          </div>
        </div>
      </div>
    )
  }

  const calcDetail = ficheActive?calculs(coutTotal(lignes),parseFloat(ficheActive.prix_vente_ttc)||0,ficheActive.tva):null
  const calcMod = modeModif?calculs(coutTotal(compoMod),parseFloat(prixMod)||0,tvaMod):null

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"/>

      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #e2e0d8',padding:'14px 20px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:18,fontWeight:500,color:'#2c2c2a'}}>Coût de revient</div>
          <div style={{fontSize:12,color:'#888780',marginTop:2}}>Calculez vos marges — prix liés à la mercuriale</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {view!=='liste'&&<button onClick={()=>{setView('liste');setModeModif(false)}} style={btn}>← Retour</button>}
          <button onClick={()=>{setCompo([]);setNomFiche('');setPrixTTC('');setTva('10');setView('creer')}} style={btnP}>
            <i className="ti ti-plus"/> Créer un coût de revient
          </button>
        </div>
      </div>

      {view==='liste'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={card}>
            <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a',marginBottom:10}}>Consulter un coût de revient</div>
            <div style={{position:'relative',maxWidth:420}}>
              <input value={searchFiche} onChange={e=>setSearchFiche(e.target.value)}
                placeholder="Rechercher une fiche…" style={{...inp,paddingRight:36}} autoComplete="off"/>
              <i className="ti ti-search" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',color:'#888780',pointerEvents:'none'}}/>
              {searchFiche.length>=1&&(
                <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'0.5px solid #d3d1c7',borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',zIndex:300,marginTop:3,maxHeight:240,overflowY:'auto'}}>
                  {fiches.filter(f=>f.nom.toLowerCase().includes(searchFiche.toLowerCase())).map(f=>(
                    <div key={f.id} onClick={()=>{chargerFiche(f);setSearchFiche('')}}
                      style={{padding:'9px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',fontSize:13,borderBottom:'0.5px solid #f1efe8'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8f7f4'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                      <span style={{fontWeight:500}}>{f.nom}</span>
                      <span style={{fontSize:11,color:'#888780'}}>{fmt(f.prix_vente_ttc)} € TTC</span>
                    </div>
                  ))}
                  {!fiches.filter(f=>f.nom.toLowerCase().includes(searchFiche.toLowerCase())).length&&<div style={{padding:12,color:'#888780',fontSize:13}}>Aucune fiche</div>}
                </div>
              )}
            </div>
          </div>

          {ficheActive&&(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{...card,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:500,color:'#2c2c2a'}}>{ficheActive.nom}</div>
                    <div style={{fontSize:12,color:'#888780',marginTop:2}}>TVA {ficheActive.tva}%</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:12,color:'#888780'}}>Prix TTC :</span>
                    {editPrix?(
                      <>
                        <input type="number" step="0.01" value={prixRapide} onChange={e=>setPrixRapide(e.target.value)}
                          onKeyDown={e=>e.key==='Enter'&&savePrixRapide()}
                          style={{width:80,padding:'5px 8px',borderRadius:6,border:'1.5px solid #534ab7',fontSize:13,outline:'none',background:'#f0effe'}} autoFocus/>
                        <button onMouseDown={e=>{e.preventDefault();savePrixRapide()}} style={{...btn,padding:'4px 10px',fontSize:12,background:'#534ab7',color:'#fff',border:'none'}}>✓</button>
                        <button onClick={()=>setEditPrix(false)} style={{...btn,padding:'4px 10px',fontSize:12}}>✕</button>
                      </>
                    ):(
                      <span onClick={()=>setEditPrix(true)} style={{fontSize:15,fontWeight:600,color:'#534ab7',cursor:'pointer',borderBottom:'1px dashed #afa9ec',paddingBottom:1}} title="Cliquer pour modifier">
                        {fmt(ficheActive.prix_vente_ttc)} € ✏️
                      </span>
                    )}
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  {!modeModif?(
                    <>
                      <button onClick={ouvrirModif} style={btn}><i className="ti ti-pencil"/> Modifier</button>
                      <button onClick={supprimerFiche} style={{...btn,color:'#a32d2d',background:'#fcebeb',border:'0.5px solid #f09595'}}><i className="ti ti-trash"/></button>
                    </>
                  ):(
                    <>
                      <button onClick={()=>setModeModif(false)} style={btn}>Annuler</button>
                      <button onClick={saveModif} style={btnP}><i className="ti ti-check"/> Enregistrer</button>
                    </>
                  )}
                </div>
              </div>

              {modeModif&&(
                <div style={card}>
                  <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a',marginBottom:12}}>Modifier les informations</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 160px 130px',gap:12}}>
                    <div><div style={{fontSize:12,color:'#888780',marginBottom:5}}>Nom</div><input value={nomMod} onChange={e=>setNomMod(e.target.value)} style={inp}/></div>
                    <div><div style={{fontSize:12,color:'#888780',marginBottom:5}}>Prix TTC (€)</div><input type="number" step="0.01" value={prixMod} onChange={e=>setPrixMod(e.target.value)} style={inp}/></div>
                    <div><div style={{fontSize:12,color:'#888780',marginBottom:5}}>TVA</div>
                      <select value={tvaMod} onChange={e=>setTvaMod(e.target.value)} style={inp}>
                        <option value="2.1">2.1%</option><option value="5.5">5.5%</option><option value="10">10%</option><option value="20">20%</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <Calculs c={modeModif?calcMod:calcDetail}/>

              <div style={card}>
                <div style={{fontSize:12,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}>Composition — 1 portion</div>
                {modeModif&&<DropIng search={searchIngMod} setSearch={setSearchIngMod} onAdd={item=>setCompoMod(prev=>[...prev,item])} getSugg={getSugg} badge={badge} sg={sg} inp={inp}/>}
                <TableIng arr={modeModif?compoMod:lignes} setArr={modeModif?setCompoMod:setLignes} readOnly={!modeModif} coutLigne={coutLigne} fmt={fmt} badge={badge}/>
              </div>
            </div>
          )}

          {fiches.length>0&&(
            <div style={card}>
              <div style={{fontSize:12,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:12}}>Toutes les fiches ({fiches.length})</div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {fiches.map(f=>(
                  <div key={f.id} onClick={()=>{chargerFiche(f);setSearchFiche('')}}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:8,cursor:'pointer',background:ficheActive?.id===f.id?'#eeedfe':'#f8f7f4',border:`0.5px solid ${ficheActive?.id===f.id?'#afa9ec':'#e2e0d8'}`}}
                    onMouseEnter={e=>{if(ficheActive?.id!==f.id)e.currentTarget.style.background='#f1efe8'}}
                    onMouseLeave={e=>{if(ficheActive?.id!==f.id)e.currentTarget.style.background='#f8f7f4'}}>
                    <span style={{fontSize:13,fontWeight:500,color:ficheActive?.id===f.id?'#3c3489':'#2c2c2a'}}>{f.nom}</span>
                    <span style={{fontSize:12,color:'#888780'}}>{fmt(f.prix_vente_ttc)} € TTC</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view==='creer'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={card}>
            <div style={{fontSize:14,fontWeight:500,color:'#2c2c2a',marginBottom:16}}>Informations</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 160px 130px',gap:12}}>
              <div><div style={{fontSize:12,color:'#888780',marginBottom:5}}>Nom *</div><input placeholder="ex: Paris-Brest…" value={nomFiche} onChange={e=>setNomFiche(e.target.value)} style={inp}/></div>
              <div><div style={{fontSize:12,color:'#888780',marginBottom:5}}>Prix TTC (€) *</div><input type="number" step="0.01" placeholder="12.00" value={prixTTC} onChange={e=>setPrixTTC(e.target.value)} style={inp}/></div>
              <div><div style={{fontSize:12,color:'#888780',marginBottom:5}}>TVA</div>
                <select value={tva} onChange={e=>setTva(e.target.value)} style={inp}>
                  <option value="2.1">2.1%</option><option value="5.5">5.5%</option><option value="10">10%</option><option value="20">20%</option>
                </select>
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={{fontSize:14,fontWeight:500,color:'#2c2c2a',marginBottom:12}}>Ingrédients de la portion</div>
            <DropIng search={searchIng} setSearch={setSearchIng} onAdd={item=>setCompo(prev=>[...prev,item])} getSugg={getSugg} badge={badge} sg={sg} inp={inp}/>
            <TableIng arr={compo} setArr={setCompo} readOnly={false} coutLigne={coutLigne} fmt={fmt} badge={badge}/>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button onClick={()=>setView('liste')} style={btn}>Annuler</button>
            <button onClick={sauvegarder} style={btnP}><i className="ti ti-check"/> Enregistrer</button>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  )
}