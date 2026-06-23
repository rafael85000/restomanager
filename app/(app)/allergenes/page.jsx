'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { getEtablissementActif } from '../../../lib/etablissement'

const ALGS = [
  {id:'a1',nom:'Gluten'},{id:'a2',nom:'Crustacés'},{id:'a3',nom:'Oeufs'},
  {id:'a4',nom:'Poissons'},{id:'a5',nom:'Arachides'},{id:'a6',nom:'Soja'},
  {id:'a7',nom:'Lait'},{id:'a8',nom:'Fruits à coque'},{id:'a9',nom:'Céleri'},
  {id:'a10',nom:'Moutarde'},{id:'a11',nom:'Sésame'},{id:'a12',nom:'Sulfites'},
  {id:'a13',nom:'Lupin'},{id:'a14',nom:'Mollusques'}
]

function Toast({msg,type}) {
  if (!msg) return null
  return <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:type==='err'?'#a32d2d':'#27500a',color:'#fff',padding:'10px 18px',borderRadius:10,fontSize:13,zIndex:9999,whiteSpace:'nowrap',boxShadow:'0 4px 12px rgba(0,0,0,0.2)'}}>{msg}</div>
}

// Génère le HTML pur du tableau pour impression/PDF
function genererHTML(items, affMode, sections, etabNom, getAlgItem) {
  const css = [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 16px; background: #fff; }',
    'h2 { font-size: 13px; font-weight: 600; color: #2c2c2a; margin: 20px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #2c2c2a; }',
    'table { border-collapse: collapse; width: 100%; font-size: 12px; margin-bottom: 8px; }',
    'th, td { border: 0.5px solid #e2e0d8; }',
    'th { padding: 6px 4px; font-size: 9px; font-weight: 500; color: #888780; text-transform: uppercase; background: #f8f7f4; text-align: center; }',
    'th.nc { text-align: left; min-width: 160px; padding: 8px 12px; font-size: 10px; }',
    'td { padding: 8px 4px; text-align: center; vertical-align: middle; }',
    'td.n { padding: 10px 12px; font-weight: 500; color: #2c2c2a; font-size: 13px; text-align: left; }',
    '.y { width: 16px; height: 16px; border-radius: 4px; background: #a32d2d; margin: 0 auto; }',
    '.no { width: 16px; height: 16px; border-radius: 4px; background: #f1efe8; margin: 0 auto; }',
    '.alt { background: #fafaf8; }',
    '.leg { margin-top: 12px; font-size: 11px; color: #888780; display: flex; gap: 16px; }',
    '.ly { width: 12px; height: 12px; border-radius: 3px; background: #a32d2d; display: inline-block; margin-right: 4px; }',
    '.ln { width: 12px; height: 12px; border-radius: 3px; background: #f1efe8; border: 0.5px solid #e2e0d8; display: inline-block; margin-right: 4px; }',
    '@page { size: A4 landscape; margin: 8mm; }',
    '@media print { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }'
  ].join('\n')

  const buildTable = (rows, titre) => {
    let h = ''
    if (titre) h += '<h2>' + titre + '</h2>'
    h += '<table><thead><tr>'
    h += '<th class="nc">' + (etabNom || 'Allergènes') + '</th>'
    ALGS.forEach(a => {
      h += '<th style="writing-mode:vertical-rl;transform:rotate(180deg);height:80px">' + a.nom + '</th>'
    })
    h += '</tr></thead><tbody>'
    rows.forEach((item, i) => {
      const algIds = getAlgItem(item)
      h += '<tr' + (i % 2 === 1 ? ' class="alt"' : '') + '>'
      h += '<td class="n">' + item.nom + '</td>'
      ALGS.forEach(a => {
        h += '<td><div class="' + (algIds.includes(a.id) ? 'y' : 'no') + '"></div></td>'
      })
      h += '</tr>'
    })
    h += '</tbody></table>'
    return h
  }

  let body = ''
  if (affMode === 'simple') {
    body = buildTable(items, null)
  } else {
    sections.forEach(s => {
      const sItems = s.items.map(id => items.find(x => x._type + x.id === id)).filter(Boolean)
      if (sItems.length) body += buildTable(sItems, s.nom || 'Section')
    })
  }
  body += '<div class="leg"><span><span class="ly"></span>Contient</span><span><span class="ln"></span>Ne contient pas</span></div>'

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Allergènes</title><style>' + css + '</style></head><body>' + body + '</body></html>'
}

export default function Allergenes() {
  const etabId = getEtablissementActif()
  const [tab, setTab] = useState('mercuriale')
  const [produits, setProduits] = useState([])
  const [recettes, setRecettes] = useState([])
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({msg:'',type:'ok'})
  const [etabNom, setEtabNom] = useState('')

  // Mercuriale
  const [searchMerc, setSearchMerc] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [tempAlg, setTempAlg] = useState([])

  // Recettes & fiches
  const [searchRec, setSearchRec] = useState('')
  const [modalRid, setModalRid] = useState(null)
  const [modalType, setModalType] = useState('recette')
  const [modalAlgSel, setModalAlgSel] = useState([])

  // Affichage
  const [selProd, setSelProd] = useState({})
  const [selRec, setSelRec] = useState({})
  const [selFiche, setSelFiche] = useState({})
  const [searchAff, setSearchAff] = useState('')
  const [sections, setSections] = useState([{id:1,nom:'',items:[]}])
  const [affMode, setAffMode] = useState('simple')

  const apercuRef = useRef(null)
  const showToast = (m,t='ok') => { setToast({msg:m,type:t}); setTimeout(()=>setToast({msg:'',type:'ok'}),3000) }

  useEffect(()=>{ charger() },[])

  const charger = async () => {
    setLoading(true)
    const {data:etab} = await supabase.from('etablissements').select('nom').eq('id',etabId).single()
    if (etab?.nom) setEtabNom(etab.nom)
    const [{data:pr},{data:re},{data:fi},{data:ings}] = await Promise.all([
      supabase.from('produits').select('id,nom,allergenes').eq('etablissement_id',etabId).order('nom'),
      supabase.from('recettes').select('id,nom,allergenes_manuels').eq('etablissement_id',etabId).order('nom'),
      supabase.from('couts_revient').select('id,nom,allergenes_manuels').eq('etablissement_id',etabId).order('nom'),
      supabase.from('recette_ingredients').select('recette_id,produit_id').not('produit_id','is',null)
    ])
    const prodsOk = (pr||[]).map(p=>({...p,allergenes:p.allergenes||[]}))
    const recsOk = (re||[]).map(r=>({...r,allergenes_manuels:r.allergenes_manuels||[],ingredients:(ings||[]).filter(i=>i.recette_id===r.id).map(i=>i.produit_id)}))
    const fichesOk = (fi||[]).map(f=>({...f,allergenes_manuels:f.allergenes_manuels||[]}))
    setProduits(prodsOk)
    setRecettes(recsOk)
    setFiches(fichesOk)
    setSelProd(prev=>{ const n={}; prodsOk.forEach(p=>n[p.id]=prev[p.id]||false); return n })
    setSelRec(prev=>{ const n={}; recsOk.forEach(r=>n[r.id]=prev[r.id]||false); return n })
    setSelFiche(prev=>{ const n={}; fichesOk.forEach(f=>n[f.id]=prev[f.id]||false); return n })
    setLoading(false)
  }

  const getAlgAutoRec = (r) => {
    const auto = []
    ;(r.ingredients||[]).forEach(pid=>{
      const p = produits.find(x=>x.id===pid)
      if(p) p.allergenes.forEach(aid=>{ if(!auto.includes(aid)) auto.push(aid) })
    })
    return auto
  }

  const getAlgItem = (item) => {
    if(item._type==='produit') return item.allergenes||[]
    if(item._type==='recette') return [...new Set([...getAlgAutoRec(item),...(item.allergenes_manuels||[])])]
    return item.allergenes_manuels||[]
  }

  const saveProdAlg = async (pid) => {
    await supabase.from('produits').update({allergenes:tempAlg}).eq('id',pid)
    setProduits(prev=>prev.map(p=>p.id===pid?{...p,allergenes:tempAlg}:p))
    setEditingId(null); showToast('Allergènes enregistrés !')
  }

  const saveManuel = async (id, type, newManuel) => {
    const table = type==='recette'?'recettes':'couts_revient'
    await supabase.from(table).update({allergenes_manuels:newManuel}).eq('id',id)
    if(type==='recette') setRecettes(prev=>prev.map(r=>r.id===id?{...r,allergenes_manuels:newManuel}:r))
    else setFiches(prev=>prev.map(f=>f.id===id?{...f,allergenes_manuels:newManuel}:f))
    showToast('Allergènes mis à jour !')
  }

  const removeManuel = (id, type, aid) => {
    const item = type==='recette'?recettes.find(x=>x.id===id):fiches.find(x=>x.id===id)
    saveManuel(id, type, (item.allergenes_manuels||[]).filter(a=>a!==aid))
  }

  const ouvrirModal = (id, type) => { setModalRid(id); setModalType(type); setModalAlgSel([]) }

  const genHTML = () => {
    const buildSection = (items, titre) => {
      let h = ''
      if (titre) h += '<div style="font-size:13px;font-weight:600;color:#2c2c2a;margin:20px 0 8px;padding-bottom:6px;border-bottom:2px solid #2c2c2a">' + titre + '</div>'
      h += '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:12px">'
      h += '<thead><tr>'
      h += '<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:500;color:#888780;text-transform:uppercase;border:0.5px solid #e2e0d8;background:#f8f7f4;min-width:160px">' + (etabNom||'Allergènes') + '</th>'
      ALGS.forEach(a => {
        h += '<th style="padding:6px 4px;text-align:center;font-size:9px;font-weight:500;color:#888780;text-transform:uppercase;border:0.5px solid #e2e0d8;background:#f8f7f4;writing-mode:vertical-rl;transform:rotate(180deg);height:80px;white-space:nowrap">' + a.nom + '</th>'
      })
      h += '</tr></thead><tbody>'
      items.forEach((item, i) => {
        const algIds = getAlgItem(item)
        const bg = i % 2 === 1 ? '#fafaf8' : '#fff'
        h += '<tr style="background-color:' + bg + ';-webkit-print-color-adjust:exact;print-color-adjust:exact">'
        h += '<td style="padding:10px 12px;font-weight:500;color:#2c2c2a;font-size:13px;border:0.5px solid #e2e0d8">' + item.nom + '</td>'
        ALGS.forEach(a => {
          if (algIds.includes(a.id)) {
            h += '<td style="padding:8px 4px;border:0.5px solid #e2e0d8;text-align:center;vertical-align:middle;background-color:'+ bg +'"><div style="width:16px;height:16px;border-radius:50%;background-color:#a32d2d;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div></td>'
          } else {
            h += '<td style="padding:8px 4px;border:0.5px solid #e2e0d8;text-align:center;vertical-align:middle;background-color:'+ bg +'"><div style="width:16px;height:16px;border-radius:50%;background-color:#f1efe8;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div></td>'
          }
        })
        h += '</tr>'
      })
      h += '</tbody></table></div>'
      return h
    }
    let body = ''
    if (affMode === 'simple') {
      body = buildSection(itemsAffiches, null)
    } else {
      sections.forEach(s => {
        const sItems = s.items.map(id => itemsAffiches.find(x => x._type+x.id === id)).filter(Boolean)
        if (sItems.length) body += buildSection(sItems, s.nom||'Section')
      })
    }
    body += '<div style="margin-top:12px;font-size:11px;color:#888780;display:flex;gap:16px">'
    body += '<span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#a32d2d;margin-right:4px;vertical-align:-2px"></span>Contient</span>'
    body += '<span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#f1efe8;border:0.5px solid #e2e0d8;margin-right:4px;vertical-align:-2px"></span>Ne contient pas</span>'
    body += '</div>'
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + '* { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; color-adjust:exact!important; }'
      + 'body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; padding:16px; background:#fff; }'
      + 'div[style*="border-radius"] { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }'
      + '@page { size:A4 landscape; margin:8mm; }'
      + '@media print { * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; color-adjust:exact!important; } }'
      + '</style></head><body>' + body + '</body></html>'
  }

  const lancerImpression = () => {
    if (!itemsAffiches.length) { showToast('Sélectionnez des éléments','err'); return }
    // Iframe caché pour imprimer sans ouvrir de nouvelle page
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none'
    document.body.appendChild(iframe)
    iframe.contentDocument.open()
    iframe.contentDocument.write(genHTML())
    iframe.contentDocument.close()
    iframe.onload = () => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 2000)
    }
  }
  const exporterPDF = () => {
    if (!itemsAffiches.length) { showToast('Sélectionnez des éléments','err'); return }
    // Blob PDF via Blob + URL pour déclencher le téléchargement
    const html = genHTML()
    const blob = new Blob([html], {type:'text/html'})
    const url = URL.createObjectURL(blob)
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none'
    iframe.src = url
    document.body.appendChild(iframe)
    iframe.onload = () => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url) }, 2000)
    }
  }

  const card = {background:'#fff',borderRadius:12,border:'0.5px solid #e2e0d8',padding:20}
  const btn = {padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',border:'0.5px solid #d3d1c7',background:'#fff',color:'#5f5e5a',display:'inline-flex',alignItems:'center',gap:6}
  const btnP = {...btn,background:'#534ab7',color:'#fff',border:'none'}
  const inp = {width:'100%',padding:'10px 12px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',boxSizing:'border-box'}
  const pill = {fontSize:10,padding:'2px 7px',borderRadius:10,background:'#fcebeb',color:'#791f1f',fontWeight:500}

  const prodFiltres = produits.filter(p=>p.nom.toLowerCase().includes(searchMerc.toLowerCase()))
  const recFiltrees = recettes.filter(r=>r.nom.toLowerCase().includes(searchRec.toLowerCase()))
  const fichesFiltrees = fiches.filter(f=>f.nom.toLowerCase().includes(searchRec.toLowerCase()))

  const allAffItems = [
    ...produits.filter(p=>p.nom.toLowerCase().includes(searchAff.toLowerCase())).map(p=>({...p,_type:'produit'})),
    ...recettes.filter(r=>r.nom.toLowerCase().includes(searchAff.toLowerCase())).map(r=>({...r,_type:'recette'})),
    ...fiches.filter(f=>f.nom.toLowerCase().includes(searchAff.toLowerCase())).map(f=>({...f,_type:'fiche'}))
  ]
  const getSelState = (item) => item._type==='produit'?selProd[item.id]||false:item._type==='recette'?selRec[item.id]||false:selFiche[item.id]||false
  const toggleSel = (item) => {
    if(item._type==='produit') setSelProd(prev=>({...prev,[item.id]:!prev[item.id]}))
    else if(item._type==='recette') setSelRec(prev=>({...prev,[item.id]:!prev[item.id]}))
    else setSelFiche(prev=>({...prev,[item.id]:!prev[item.id]}))
  }
  const itemsAffiches = [
    ...produits.filter(p=>selProd[p.id]).map(p=>({...p,_type:'produit'})),
    ...recettes.filter(r=>selRec[r.id]).map(r=>({...r,_type:'recette'})),
    ...fiches.filter(f=>selFiche[f.id]).map(f=>({...f,_type:'fiche'}))
  ]
  const nbSel = Object.values({...selProd,...selRec,...selFiche}).filter(Boolean).length

  // Tableau aperçu (même rendu que l'impression)
  const TableauApercu = ({items, titre}) => (
    <div style={{marginBottom:titre?24:0}}>
      {titre && <div style={{fontSize:13,fontWeight:600,color:'#2c2c2a',marginBottom:8,paddingBottom:6,borderBottom:'2px solid #2c2c2a'}}>{titre}</div>}
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
          <thead>
            <tr>
              <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',border:'0.5px solid #e2e0d8',background:'#f8f7f4',minWidth:160}}>{etabNom||'Allergènes'}</th>
              {ALGS.map(a=><th key={a.id} style={{padding:'6px 4px',textAlign:'center',fontSize:9,fontWeight:500,color:'#888780',textTransform:'uppercase',border:'0.5px solid #e2e0d8',background:'#f8f7f4',writingMode:'vertical-rl',transform:'rotate(180deg)',height:80}}>{a.nom}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((item,i)=>{
              const algIds=getAlgItem(item)
              return (
                <tr key={item._type+item.id} style={{background:i%2===1?'#fafaf8':'#fff'}}>
                  <td style={{padding:'10px 12px',fontWeight:500,color:'#2c2c2a',fontSize:13,border:'0.5px solid #e2e0d8'}}>{item.nom}</td>
                  {ALGS.map(a=>(
                    <td key={a.id} style={{padding:'8px 4px',border:'0.5px solid #e2e0d8',textAlign:'center',verticalAlign:'middle'}}>
                      {algIds.includes(a.id)
                        ? <div style={{width:16,height:16,borderRadius:4,background:'#a32d2d',margin:'0 auto'}}/>
                        : <div style={{width:16,height:16,borderRadius:4,background:'#f1efe8',margin:'0 auto'}}/>
                      }
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  const ModalAlg = () => {
    if (!modalRid) return null
    const item = modalType==='recette'?recettes.find(x=>x.id===modalRid):fiches.find(x=>x.id===modalRid)
    const autoIds = modalType==='recette'?getAlgAutoRec(item||{ingredients:[]}) : []
    const dispo = ALGS.filter(a=>!autoIds.includes(a.id)&&!(item?.allergenes_manuels||[]).includes(a.id))
    return (
      <div onClick={e=>e.target===e.currentTarget&&setModalRid(null)}
        style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:16}}>
        <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:460}}>
          <div style={{fontSize:15,fontWeight:500,color:'#2c2c2a',marginBottom:4}}>Ajouter des allergènes</div>
          <div style={{fontSize:13,color:'#888780',marginBottom:14,lineHeight:1.6}}>Cochez un ou plusieurs allergènes :</div>
          {dispo.length===0
            ? <div style={{fontSize:13,color:'#888780',marginBottom:14}}>Tous les allergènes sont déjà ajoutés.</div>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:6,marginBottom:14}}>
                {dispo.map(a=>{
                  const sel=modalAlgSel.includes(a.id)
                  return (
                    <label key={a.id} onClick={()=>setModalAlgSel(prev=>prev.includes(a.id)?prev.filter(x=>x!==a.id):[...prev,a.id])}
                      style={{display:'flex',alignItems:'center',gap:7,padding:'8px 10px',borderRadius:8,border:`0.5px solid ${sel?'#f09595':'#e2e0d8'}`,cursor:'pointer',fontSize:12,color:sel?'#791f1f':'#5f5e5a',background:sel?'#fcebeb':'#fff',fontWeight:sel?500:400}}>
                      <input type="checkbox" checked={sel} readOnly style={{accentColor:'#a32d2d',width:13,height:13}}/>{a.nom}
                    </label>
                  )
                })}
              </div>
          }
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button onClick={()=>setModalRid(null)} style={btn}>Annuler</button>
            {dispo.length>0&&modalAlgSel.length>0&&(
              <button onClick={()=>{ if(item){ const n=[...new Set([...(item.allergenes_manuels||[]),...modalAlgSel])]; saveManuel(item.id,modalType,n); setModalRid(null) } }} style={btnP}>
                Ajouter ({modalAlgSel.length})
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'#888780',fontSize:14}}>Chargement…</div>

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"/>


      {/* Header */}
      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #e2e0d8',padding:'14px 20px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:500,color:'#2c2c2a'}}>Gestion des allergènes</div>
          <div style={{fontSize:12,color:'#888780',marginTop:2}}>14 allergènes réglementaires — Directive UE 1169/2011</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {[{id:'mercuriale',label:'Mercuriale'},{id:'recettes',label:'Fiches & préparations'},{id:'affichage',label:'Affichage restaurant'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{...btn,background:tab===t.id?'#534ab7':'#fff',color:tab===t.id?'#fff':'#5f5e5a',borderColor:tab===t.id?'#534ab7':'#d3d1c7'}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MERCURIALE ── */}
      {tab==='mercuriale' && (
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:13,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px'}}>Produits — allergènes</div>
            <span style={{fontSize:11,color:'#3c3489',background:'#eeedfe',padding:'2px 10px',borderRadius:10}}>Cliquez sur une ligne pour éditer</span>
          </div>
          <input value={searchMerc} onChange={e=>setSearchMerc(e.target.value)} placeholder="Rechercher un produit…" style={{...inp,marginBottom:14}}/>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr>
                <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8',width:'35%'}}>Produit</th>
                <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8'}}>Allergènes</th>
                <th style={{padding:'8px 12px',textAlign:'center',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8',width:50}}>Nb</th>
              </tr>
            </thead>
            <tbody>
              {prodFiltres.length===0&&<tr><td colSpan={3} style={{padding:20,textAlign:'center',color:'#b4b2a9',fontSize:13}}>Aucun produit</td></tr>}
              {prodFiltres.map(p=>(
                <React.Fragment key={p.id}>
                  <tr onClick={()=>{ if(editingId===p.id){setEditingId(null)}else{setTempAlg([...p.allergenes]);setEditingId(p.id)} }}
                    style={{cursor:'pointer',borderBottom:editingId===p.id?'none':'0.5px solid #f1efe8',background:editingId===p.id?'#fafaf8':'#fff'}}>
                    <td style={{padding:'10px 12px',fontWeight:500,color:'#2c2c2a'}}>{p.nom}</td>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {p.allergenes.length===0
                          ? <span style={{fontSize:12,color:'#b4b2a9'}}>Aucun</span>
                          : p.allergenes.map(aid=>{ const a=ALGS.find(x=>x.id===aid); return <span key={aid} style={pill}>{a?.nom||aid}</span> })
                        }
                      </div>
                    </td>
                    <td style={{padding:'10px 12px',textAlign:'center',color:'#888780'}}>{p.allergenes.length}</td>
                  </tr>
                  {editingId===p.id && (
                    <tr>
                      <td colSpan={3} style={{padding:0,background:'#f8f7f4',borderBottom:'0.5px solid #e2e0d8'}}>
                        <div style={{padding:'14px 16px'}}>
                          <div style={{fontSize:12,fontWeight:500,color:'#5f5e5a',marginBottom:10}}>Sélectionnez les allergènes de ce produit :</div>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:6}}>
                            {ALGS.map(a=>{
                              const checked=tempAlg.includes(a.id)
                              return (
                                <label key={a.id} onClick={e=>{e.stopPropagation();setTempAlg(prev=>prev.includes(a.id)?prev.filter(x=>x!==a.id):[...prev,a.id])}}
                                  style={{display:'flex',alignItems:'center',gap:7,padding:'6px 10px',borderRadius:8,border:`0.5px solid ${checked?'#f09595':'#e2e0d8'}`,cursor:'pointer',fontSize:12,color:checked?'#791f1f':'#5f5e5a',background:checked?'#fcebeb':'#fff',fontWeight:checked?500:400}}>
                                  <input type="checkbox" checked={checked} readOnly style={{accentColor:'#a32d2d',width:13,height:13}}/>{a.nom}
                                </label>
                              )
                            })}
                          </div>
                          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                            <button onClick={e=>{e.stopPropagation();setEditingId(null)}} style={btn}>Annuler</button>
                            <button onClick={e=>{e.stopPropagation();saveProdAlg(p.id)}} style={btnP}><i className="ti ti-check"/> Enregistrer</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FICHES & PRÉPARATIONS ── */}
      {tab==='recettes' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <input value={searchRec} onChange={e=>setSearchRec(e.target.value)} placeholder="Rechercher…" style={inp}/>
          <div style={card}>
            <div style={{fontSize:13,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}>Fiches recettes</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr>
                <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8',width:'28%'}}>Recette</th>
                <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8'}}>Allergènes (auto + ajoutés)</th>
                <th style={{padding:'8px 12px',width:110,borderBottom:'0.5px solid #e2e0d8'}}></th>
              </tr></thead>
              <tbody>
                {recFiltrees.length===0&&<tr><td colSpan={3} style={{padding:20,textAlign:'center',color:'#b4b2a9',fontSize:13}}>Aucune recette</td></tr>}
                {recFiltrees.map(r=>{
                  const auto=getAlgAutoRec(r); const manuel=r.allergenes_manuels||[]
                  return (
                    <tr key={r.id} style={{borderBottom:'0.5px solid #f1efe8'}}>
                      <td style={{padding:'10px 12px',fontWeight:500,color:'#2c2c2a'}}>{r.nom}</td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,alignItems:'center'}}>
                          {auto.map(aid=>{ const a=ALGS.find(x=>x.id===aid); return <span key={'a'+aid} style={pill}>{a?.nom||aid}</span> })}
                          {manuel.map(aid=>{ const a=ALGS.find(x=>x.id===aid); return (
                            <span key={'m'+aid} style={{display:'inline-flex',alignItems:'center',gap:2}}>
                              <span style={{...pill,background:'#faeeda',color:'#633806'}}>{a?.nom||aid}</span>
                              <button onClick={()=>removeManuel(r.id,'recette',aid)} style={{background:'none',border:'none',cursor:'pointer',color:'#a32d2d',fontSize:11,padding:'0 2px'}}>✕</button>
                            </span>
                          )})}
                          {auto.length===0&&manuel.length===0&&<span style={{fontSize:12,color:'#b4b2a9'}}>Aucun allergène détecté</span>}
                        </div>
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'center'}}>
                        <button onClick={()=>ouvrirModal(r.id,'recette')} style={{padding:'5px 10px',borderRadius:6,border:'1.5px dashed #d3d1c7',background:'transparent',color:'#888780',fontSize:11,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4}}>
                          <i className="ti ti-plus" style={{fontSize:11}}/> Ajouter
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={card}>
            <div style={{fontSize:13,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}>Coûts de revient</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr>
                <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8',width:'28%'}}>Préparation</th>
                <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8'}}>Allergènes</th>
                <th style={{padding:'8px 12px',width:110,borderBottom:'0.5px solid #e2e0d8'}}></th>
              </tr></thead>
              <tbody>
                {fichesFiltrees.length===0&&<tr><td colSpan={3} style={{padding:20,textAlign:'center',color:'#b4b2a9',fontSize:13}}>Aucune préparation</td></tr>}
                {fichesFiltrees.map(f=>{
                  const manuel=f.allergenes_manuels||[]
                  return (
                    <tr key={f.id} style={{borderBottom:'0.5px solid #f1efe8'}}>
                      <td style={{padding:'10px 12px',fontWeight:500,color:'#2c2c2a'}}>{f.nom}</td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                          {manuel.map(aid=>{ const a=ALGS.find(x=>x.id===aid); return (
                            <span key={aid} style={{display:'inline-flex',alignItems:'center',gap:2}}>
                              <span style={pill}>{a?.nom||aid}</span>
                              <button onClick={()=>removeManuel(f.id,'fiche',aid)} style={{background:'none',border:'none',cursor:'pointer',color:'#a32d2d',fontSize:11,padding:'0 2px'}}>✕</button>
                            </span>
                          )})}
                          {manuel.length===0&&<span style={{fontSize:12,color:'#b4b2a9'}}>Aucun allergène</span>}
                        </div>
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'center'}}>
                        <button onClick={()=>ouvrirModal(f.id,'fiche')} style={{padding:'5px 10px',borderRadius:6,border:'1.5px dashed #d3d1c7',background:'transparent',color:'#888780',fontSize:11,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4}}>
                          <i className="ti ti-plus" style={{fontSize:11}}/> Ajouter
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AFFICHAGE RESTAURANT ── */}
      {tab==='affichage' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={card}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
              <div style={{fontSize:13,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px'}}>Sélection des éléments</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{ allAffItems.forEach(item=>{ if(item._type==='produit') setSelProd(prev=>({...prev,[item.id]:true})); else if(item._type==='recette') setSelRec(prev=>({...prev,[item.id]:true})); else setSelFiche(prev=>({...prev,[item.id]:true})) }) }} style={{...btn,padding:'5px 10px',fontSize:12}}>Tout cocher</button>
                <button onClick={()=>{ setSelProd({}); setSelRec({}); setSelFiche({}) }} style={{...btn,padding:'5px 10px',fontSize:12}}>Tout décocher</button>
              </div>
            </div>
            <input value={searchAff} onChange={e=>setSearchAff(e.target.value)} placeholder="Rechercher produit, recette, préparation…" style={{...inp,marginBottom:10}}/>
            <div style={{fontSize:11,color:'#888780',marginBottom:8}}>{nbSel} élément(s) sélectionné(s)</div>
            <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:280,overflowY:'auto'}}>
              {allAffItems.map(item=>{
                const sel=getSelState(item)
                const tc = item._type==='produit'?{bg:'#e6f1fb',c:'#0c447c'}:item._type==='recette'?{bg:'#eeedfe',c:'#3c3489'}:{bg:'#eaf3de',c:'#27500a'}
                const tn = item._type==='produit'?'Produit':item._type==='recette'?'Recette':'Coût revient'
                return (
                  <label key={item._type+item.id} onClick={()=>toggleSel(item)}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,border:`0.5px solid ${sel?'#afa9ec':'#e2e0d8'}`,cursor:'pointer',fontSize:13,color:sel?'#3c3489':'#5f5e5a',background:sel?'#eeedfe':'#fff',fontWeight:sel?500:400}}>
                    <input type="checkbox" checked={sel} readOnly style={{accentColor:'#534ab7'}}/>
                    <span style={{flex:1}}>{item.nom}</span>
                    <span style={{fontSize:9,padding:'1px 6px',borderRadius:6,fontWeight:500,background:tc.bg,color:tc.c}}>{tn}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {itemsAffiches.length > 0 && (
            <>
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                  <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>Organisation :</div>
                  <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}}>
                    <input type="radio" checked={affMode==='simple'} onChange={()=>setAffMode('simple')} style={{accentColor:'#534ab7'}}/>
                    Tableau unique
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}}>
                    <input type="radio" checked={affMode==='sections'} onChange={()=>setAffMode('sections')} style={{accentColor:'#534ab7'}}/>
                    Découper en sections (Entrées, Plats, Desserts…)
                  </label>
                </div>
                {affMode==='sections' && (
                  <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:12}}>
                    {sections.map((sec,si)=>(
                      <div key={sec.id} style={{background:'#f8f7f4',borderRadius:10,padding:12}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                          <input value={sec.nom} onChange={e=>setSections(prev=>prev.map((s,i)=>i===si?{...s,nom:e.target.value}:s))}
                            placeholder="Nom de la section (ex : Entrées, Pâtisseries…)"
                            style={{...inp,flex:1,padding:'7px 10px',fontSize:13}}/>
                          {sections.length>1&&<button onClick={()=>setSections(prev=>prev.filter((_,i)=>i!==si))} style={{...btn,color:'#a32d2d',background:'#fcebeb',border:'0.5px solid #f09595',padding:'6px 10px'}}>✕</button>}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:180,overflowY:'auto'}}>
                          {itemsAffiches.map(item=>{
                            const inSec=sec.items.includes(item._type+item.id)
                            return (
                              <label key={item._type+item.id} onClick={()=>setSections(prev=>prev.map((s,i)=>i===si?{...s,items:inSec?s.items.filter(x=>x!==item._type+item.id):[...s.items,item._type+item.id]}:s))}
                                style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:6,border:`0.5px solid ${inSec?'#afa9ec':'#e2e0d8'}`,cursor:'pointer',fontSize:12,background:inSec?'#eeedfe':'#fff',color:inSec?'#3c3489':'#5f5e5a'}}>
                                <input type="checkbox" checked={inSec} readOnly style={{accentColor:'#534ab7'}}/>{item.nom}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <button onClick={()=>setSections(prev=>[...prev,{id:Date.now(),nom:'',items:[]}])} style={{...btn,width:'100%',justifyContent:'center',border:'1.5px dashed #d3d1c7',padding:'10px'}}>
                      <i className="ti ti-plus"/> Ajouter une section
                    </button>
                  </div>
                )}
              </div>

              <div style={card}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                  <div style={{fontSize:13,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px'}}>Aperçu</div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={lancerImpression} style={{...btn,background:'#eaf3de',color:'#27500a',border:'0.5px solid #97c459'}}>
                      <i className="ti ti-printer"/> Imprimer
                    </button>
                    <button onClick={exporterPDF} style={{...btn,background:'#e6f1fb',color:'#0c447c',border:'0.5px solid #85b7eb'}}>
  <i className="ti ti-file-type-pdf"/> Télécharger PDF <span style={{fontSize:10,opacity:0.7}}>(→ Enregistrer en PDF)</span>
</button>
                  </div>
                </div>
                <div ref={apercuRef}>
                {affMode==='simple'
                  ? <TableauApercu items={itemsAffiches}/>
                  : sections.map(s=>(
                    <TableauApercu key={s.id}
                      items={s.items.map(id=>itemsAffiches.find(x=>x._type+x.id===id)).filter(Boolean)}
                      titre={s.nom||'Section'}/>
                  ))
                }
                <div style={{marginTop:12,fontSize:12,color:'#888780',display:'flex',gap:16}}>
                  <span><span style={{display:'inline-block',width:14,height:14,borderRadius:3,background:'#a32d2d',marginRight:4,verticalAlign:-2}}/> Contient</span>
                  <span><span style={{display:'inline-block',width:14,height:14,borderRadius:3,background:'#f1efe8',marginRight:4,verticalAlign:-2}}/> Ne contient pas</span>
                </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}


      <ModalAlg/>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  )
}