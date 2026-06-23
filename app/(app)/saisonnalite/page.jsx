'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { getEtablissementActif } from '../../../lib/etablissement'

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const moisActuel = new Date().getMonth()

function Toast({msg,type}) {
  if (!msg) return null
  return <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:type==='err'?'#a32d2d':'#27500a',color:'#fff',padding:'10px 18px',borderRadius:10,fontSize:13,zIndex:9999,whiteSpace:'nowrap',boxShadow:'0 4px 12px rgba(0,0,0,0.2)'}}>{msg}</div>
}

export default function Saisonnalite() {
  const etabId = getEtablissementActif()
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({msg:'',type:'ok'})
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState(null)
  const [tempMois, setTempMois] = useState([])
  const [tempMode, setTempMode] = useState('cases')
  const [saving, setSaving] = useState(false)

  const showToast = (m,t='ok') => { setToast({msg:m,type:t}); setTimeout(()=>setToast({msg:'',type:'ok'}),3000) }

  useEffect(()=>{ charger() },[])

  const charger = async () => {
    setLoading(true)
    const [{data:pr},{data:sais}] = await Promise.all([
      supabase.from('produits').select('id,nom,fournisseurs(nom)').eq('etablissement_id',etabId).order('nom'),
      supabase.from('saisonnalite_produits').select('*').eq('etablissement_id',etabId)
    ])
    const saisMap = Object.fromEntries((sais||[]).map(s=>[s.produit_id,s]))
    setProduits((pr||[]).map(p=>({
      id: p.id,
      nom: p.nom,
      fourn: p.fournisseurs?.nom||'',
      mode: saisMap[p.id]?.mode || 'nc',
      mois: saisMap[p.id]?.mois || []
    })))
    setLoading(false)
  }

  const getMoisProduit = (p) => {
    if (p.mode==='all') return [0,1,2,3,4,5,6,7,8,9,10,11]
    if (p.mode==='cases') return p.mois||[]
    return []
  }

  const getStatut = (p) => {
    if (p.mode==='nc') return 'nc'
    if (p.mode==='all') return 'all'
    return getMoisProduit(p).includes(moisActuel) ? 'saison' : 'hors'
  }

  const ouvrirEdit = (p) => {
    setEditId(p.id)
    setTempMode(p.mode==='nc'?'cases':p.mode)
    setTempMois([...p.mois])
  }

  const toggleMois = (i) => {
    setTempMois(prev => prev.includes(i) ? prev.filter(m=>m!==i) : [...prev,i])
  }

  const sauvegarder = async () => {
    if (!editId) return
    setSaving(true)
    const payload = { produit_id:editId, etablissement_id:etabId, mode:tempMode, mois:tempMode==='all'?[]:tempMois }
    const {error} = await supabase.from('saisonnalite_produits').upsert(payload, {onConflict:'produit_id,etablissement_id'})
    if (error) { showToast('Erreur: '+error.message,'err') }
    else { showToast('Saisonnalité enregistrée !'); await charger() }
    setEditId(null); setSaving(false)
  }

  const filtres = produits.filter(p=>!search||p.nom.toLowerCase().includes(search.toLowerCase()))
  const horsS = produits.filter(p=>getStatut(p)==='hors')
  const nonConf = produits.filter(p=>p.mode==='nc')

  const card = {background:'#fff',borderRadius:12,border:'0.5px solid #e2e0d8',padding:20}
  const btn = {padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',border:'0.5px solid #d3d1c7',background:'#fff',color:'#5f5e5a',display:'inline-flex',alignItems:'center',gap:6}
  const btnP = {...btn,background:'#534ab7',color:'#fff',border:'none'}

  const statutStyle = (s) => {
    if(s==='all') return {background:'#eeedfe',color:'#3c3489'}
    if(s==='saison') return {background:'#eaf3de',color:'#27500a'}
    if(s==='hors') return {background:'#fcebeb',color:'#a32d2d'}
    return {background:'#f8f7f4',color:'#888780'}
  }
  const statutLabel = (s) => {
    if(s==='all') return "Toute l'année"
    if(s==='saison') return 'En saison'
    if(s==='hors') return 'Hors saison'
    return 'Non configuré'
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'#888780',fontSize:14}}>Chargement…</div>

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"/>

      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #e2e0d8',padding:'14px 20px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:500,color:'#2c2c2a'}}>Saisonnalité des produits</div>
          <div style={{fontSize:12,color:'#888780',marginTop:2}}>Cliquez sur un produit pour configurer ses mois de saison</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          {nonConf.length>0 && <span style={{fontSize:12,background:'#faeeda',color:'#854f0b',padding:'4px 10px',borderRadius:8,fontWeight:500}}>{nonConf.length} non configuré(s)</span>}
          {horsS.length>0 && <span style={{fontSize:12,background:'#fcebeb',color:'#a32d2d',padding:'4px 10px',borderRadius:8,fontWeight:500}}>{horsS.length} hors saison</span>}
        </div>
      </div>

      {horsS.length>0 && (
        <div style={{background:'#fcebeb',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
          <i className="ti ti-alert-triangle" style={{color:'#a32d2d',fontSize:18,flexShrink:0}}/>
          <div style={{fontSize:13,color:'#791f1f'}}>
            <strong>{horsS.length} produit(s) hors saison en {MOIS[moisActuel]} :</strong> {horsS.map(p=>p.nom).join(', ')}
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            style={{width:280,padding:'9px 12px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none'}}/>
          <span style={{fontSize:12,color:'#888780'}}>{produits.length} produits · {horsS.length} hors saison · mois actuel : <strong>{MOIS[moisActuel]}</strong></span>
        </div>

        <div style={{display:'flex',alignItems:'center',paddingLeft:230,marginBottom:6}}>
          {MOIS.map((m,i)=>(
            <div key={i} style={{flex:1,fontSize:9,textTransform:'uppercase',textAlign:'center',color:i===moisActuel?'#d85a30':'#888780',fontWeight:i===moisActuel?700:500}}>{m}</div>
          ))}
          <div style={{width:120}}/>
        </div>

        {filtres.length===0 && <div style={{textAlign:'center',color:'#b4b2a9',padding:24,fontSize:13}}>Aucun produit trouvé</div>}
        {filtres.map(p=>{
          const moisP = getMoisProduit(p)
          const statut = getStatut(p)
          const isEditing = editId===p.id
          return (
            <React.Fragment key={p.id}>
              <div onClick={()=>isEditing?setEditId(null):ouvrirEdit(p)}
                style={{display:'flex',alignItems:'center',padding:'8px 0',borderBottom:isEditing?'none':'0.5px solid #f1efe8',cursor:'pointer'}}>
                <div style={{width:230,flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{p.nom}</div>
                  {p.fourn && <div style={{fontSize:11,color:'#888780'}}>{p.fourn}</div>}
                </div>
                <div style={{display:'flex',gap:3,flex:1}}>
                  {MOIS.map((_,i)=>(
                    <div key={i} style={{
                      flex:1,height:22,borderRadius:4,
                      background:p.mode==='nc'?'#f8f7f4':moisP.includes(i)?'#534ab7':'#f1efe8',
                      border:i===moisActuel?'2px solid #d85a30':'0.5px solid transparent',
                      opacity:p.mode==='nc'?0.5:1
                    }}/>
                  ))}
                </div>
                <div style={{width:120,textAlign:'right',flexShrink:0,paddingLeft:12}}>
                  <span style={{fontSize:11,padding:'2px 8px',borderRadius:8,fontWeight:500,...statutStyle(statut)}}>
                    {statutLabel(statut)}
                  </span>
                </div>
              </div>

              {isEditing && (
                <div style={{background:'#f8f7f4',borderRadius:'0 0 10px 10px',padding:'14px 16px',marginBottom:4,border:'0.5px solid #e2e0d8',borderTop:'none'}}>
                  <div style={{fontSize:12,fontWeight:500,color:'#5f5e5a',marginBottom:10}}>
                    Configuration — <strong>{p.nom}</strong>
                  </div>
                  <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                    {[{v:'all',l:"Toute l'année"},{v:'cases',l:'Mois spécifiques'},{v:'nc',l:'Non défini'}].map(opt=>(
                      <label key={opt.v} onClick={()=>setTempMode(opt.v)}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:`0.5px solid ${tempMode===opt.v?'#afa9ec':'#d3d1c7'}`,background:tempMode===opt.v?'#eeedfe':'#fff',cursor:'pointer',fontSize:12,color:tempMode===opt.v?'#3c3489':'#5f5e5a',fontWeight:tempMode===opt.v?500:400}}>
                        <input type="radio" checked={tempMode===opt.v} readOnly style={{accentColor:'#534ab7'}}/>{opt.l}
                      </label>
                    ))}
                  </div>
                  {tempMode==='cases' && (
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:'#888780',marginBottom:8}}>Cliquez sur les mois de saison :</div>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        {MOIS.map((m,i)=>{
                          const sel=tempMois.includes(i)
                          return (
                            <button key={i} onClick={()=>toggleMois(i)}
                              style={{padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:sel?600:400,cursor:'pointer',border:`1.5px solid ${sel?'#534ab7':'#d3d1c7'}`,background:sel?'#534ab7':'#fff',color:sel?'#fff':'#5f5e5a',minWidth:48,position:'relative'}}>
                              {m}
                              {i===moisActuel && <span style={{position:'absolute',top:-3,right:-3,width:6,height:6,borderRadius:'50%',background:'#d85a30'}}/>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                    <button onClick={()=>setEditId(null)} style={btn}>Annuler</button>
                    <button onClick={sauvegarder} disabled={saving} style={btnP}>
                      {saving?'Enregistrement…':<><i className="ti ti-check"/> Enregistrer</>}
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  )
}