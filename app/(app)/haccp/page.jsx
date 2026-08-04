'use client'
import { useState, useEffect, useRef } from 'react'

const ALLERGENES_14 = [
  {id:'a1',nom:'Gluten'},{id:'a2',nom:'Crustaces'},{id:'a3',nom:'Oeufs'},
  {id:'a4',nom:'Poissons'},{id:'a5',nom:'Arachides'},{id:'a6',nom:'Soja'},
  {id:'a7',nom:'Lait'},{id:'a8',nom:'Fruits a coque'},{id:'a9',nom:'Celeri'},
  {id:'a10',nom:'Moutarde'},{id:'a11',nom:'Sesame'},{id:'a12',nom:'Sulfites'},
  {id:'a13',nom:'Lupin'},{id:'a14',nom:'Mollusques'}
]
import { supabase } from '../../../lib/supabase'
import { getEtablissementActif } from '../../../lib/etablissement'

function Toast({msg,type}) {
  if (!msg) return null
  return <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:type==='err'?'#a32d2d':'#27500a',color:'#fff',padding:'10px 18px',borderRadius:10,fontSize:13,zIndex:9999,whiteSpace:'nowrap',boxShadow:'0 4px 12px rgba(0,0,0,0.2)'}}>{msg}</div>
}

function Modal({onClose,title,subtitle,children,footer,maxWidth=440}) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400,padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{fontSize:16,fontWeight:500,color:'#2c2c2a',marginBottom:subtitle?4:16}}>{title}</div>
        {subtitle&&<div style={{fontSize:13,color:'#888780',marginBottom:16,lineHeight:1.5}}>{subtitle}</div>}
        {children}
        {footer&&<div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>{footer}</div>}
      </div>
    </div>
  )
}


const FORMATS_ETIQ = [
  // Gprinter GP-2120TF
  {id:'f7', nom:'Gprinter 55×30', dim:'55×30mm',   orient:'portrait',  imprimante:'Gprinter GP-2120TF'},
  {id:'f8', nom:'Gprinter 58×40', dim:'58×40mm',   orient:'portrait',  imprimante:'Gprinter GP-2120TF'},
  {id:'f9', nom:'Gprinter 58×60', dim:'58×60mm',   orient:'portrait',  imprimante:'Gprinter GP-2120TF'},
  // Nelko PL80E
  {id:'f10',nom:'Nelko 102×152',  dim:'102×152mm',  orient:'landscape', imprimante:'Nelko PL80E'},
  {id:'f11',nom:'Nelko 102×76',   dim:'102×76mm',   orient:'landscape', imprimante:'Nelko PL80E'},
  {id:'f12',nom:'Nelko 102×51',   dim:'102×51mm',   orient:'landscape', imprimante:'Nelko PL80E'},
  // Brother QL
  {id:'f1', nom:'Brother 62×29',  dim:'62×29mm',    orient:'portrait',  imprimante:'Brother QL-800'},
  {id:'f2', nom:'Brother 62×50',  dim:'62×50mm',    orient:'portrait',  imprimante:'Brother QL-800'},
  {id:'f3', nom:'Brother 29×19',  dim:'29×19mm',    orient:'portrait',  imprimante:'Brother QL-800'},
  // Zebra ZD
  {id:'f4', nom:'Zebra 57×32',    dim:'57×32mm',    orient:'portrait',  imprimante:'Zebra ZD421'},
  {id:'f5', nom:'Zebra 102×50',   dim:'102×50mm',   orient:'landscape', imprimante:'Zebra ZD421'},
  {id:'f6', nom:'Zebra 100×100',  dim:'100×100mm',  orient:'portrait',  imprimante:'Zebra ZD421'},
  // Dymo
  {id:'f13',nom:'Dymo 89×36',     dim:'89×36mm',    orient:'landscape', imprimante:'Dymo LabelWriter 450'},
  {id:'f14',nom:'Dymo 57×32',     dim:'57×32mm',    orient:'portrait',  imprimante:'Dymo LabelWriter 450'},
  // Avery / Universel
  {id:'f15',nom:'Avery 70×37',    dim:'70×37mm',    orient:'landscape', imprimante:'Avery / Universel'},
  {id:'f16',nom:'A4 (test)',       dim:'210×297mm',  orient:'portrait',  imprimante:'Imprimante A4'},
]

export default function HACCP() {
  const etabId = getEtablissementActif()
  const [tab,setTab] = useState(()=>{ try { if(typeof window!=='undefined'&&localStorage.getItem('haccp_refroid_timer')) return 'cuissons' } catch(e){} return 'accueil' })
  const [loading,setLoading] = useState(true)
  const [toast,setToast] = useState({msg:'',type:'ok'})
  const [recettes,setRecettes] = useState([])
  const [produits,setProduits] = useState([])
  const [fournisseurs,setFournisseurs] = useState([])
  const [equipements,setEquipements] = useState([])
  const [zones,setZones] = useState([])  // zones de nettoyage
  const [taches,setTaches] = useState([])  // taches par zone
  const [tacheLog,setTacheLog] = useState([])  // validations aujourd'hui
  const [tacheLogAll,setTacheLogAll] = useState([])  // toutes les validations
  const [tacheRefreshKey,setTacheRefreshKey] = useState(0)
  const [etiquettes,setEtiquettes] = useState([])
  const [cuissons,setCuissons] = useState([])
  const [lots,setLots] = useState([])
  const [receptions,setReceptions] = useState([])
  const [documents,setDocuments] = useState([])
  const [nettoyageLog,setNettoyageLog] = useState([])

  const [userConnecte,setUserConnecte] = useState('')
  // Etiquetage
  const [huiles,setHuiles] = useState([])
  const [modalAddHuile,setModalAddHuile] = useState(false)
  const [formHuile,setFormHuile] = useState({nom:'',type:'changement',tgp_ok:true,tgp_valeur:'',commentaire:''})
  const [etiqModeles,setEtiqModeles] = useState([])
  const [modalAddModele,setModalAddModele] = useState(false)
  const [modalListModeles,setModalListModeles] = useState(false)
  const [searchMod,setSearchMod] = useState('')
  const [editModele,setEditModele] = useState(null)
  const [formEditModele,setFormEditModele] = useState({nom:'',dlc_jours:3,dlc_libre:''})
  const [formModele,setFormModele] = useState({nom:'',dlc_jours:3})
  const [formEtiq,setFormEtiq] = useState({produit_nom:'',date_fabrication:new Date().toISOString().split('T')[0],jours_dlc:3,dlc_libre:'',format_id:'f1',nb_exemplaires:1,poids:'',unite_poids:'g',lot_id:'',lot_numero:'',lot_recette:'',afficher_ingredients:false})
  const [etiqIngredients,setEtiqIngredients] = useState([]) // [{nom, poids, allergenes:[]}]
  // Températures
  const [equipe,setEquipe] = useState([])
  const [tempTab,setTempTab] = useState('releves')
  const [relevesAujourdhui,setRelevesAujourdhui] = useState([])
  const [relevesTous,setRelevesTous] = useState([])
  const [tempMoment,setTempMoment] = useState('Matin')
  const [tempPar,setTempPar] = useState('')
  const [tempActionCorrective,setTempActionCorrective] = useState('')
  const [modalTemp,setModalTemp] = useState(null)
  const [tempVal,setTempVal] = useState('')
  const [modalAddEquip,setModalAddEquip] = useState(false)
  const [editEquip,setEditEquip] = useState(null) // equip to edit
  const [formEquip,setFormEquip] = useState({nom:'',type:'froid',temp_min:'',temp_max:'',frequence_jours:1,frequence_fois:2})
  const [historiqueDebut,setHistoriqueDebut] = useState('')
  const [historiqueFin,setHistoriqueFin] = useState('')
  const [historiqueEquipId,setHistoriqueEquipId] = useState('')
  const [nettoyageDebut,setNettoyageDebut] = useState('')
  const [nettoyageFin,setNettoyageFin] = useState('')
  const [nettoyageZoneId,setNettoyageZoneId] = useState('')
  const [cuissonDebut,setCuissonDebut] = useState('')
  const [cuissonFin,setCuissonFin] = useState('')
  const [cuissonTypeF,setCuissonTypeF] = useState('')
  const [refreshKey,setRefreshKey] = useState(0)
  // Nettoyage
  const [nettoyageTab,setNettoyageTab] = useState('dashboard')
  const [zoneSelectee,setZoneSelectee] = useState(null)
  const [modalAddZoneNett,setModalAddZoneNett] = useState(false)
  const [modalAddTache,setModalAddTache] = useState(null) // zone_id
  const [formTache,setFormTache] = useState({nom:'',frequence:'quotidien',description:''})
  const [formZoneNett,setFormZoneNett] = useState({nom:'',description:''})
  const [editZoneNett,setEditZoneNett] = useState(null)
  const [editTache,setEditTache] = useState(null)
  const [modalValiderTache,setModalValiderTache] = useState(null)
  const [checklistDone,setChecklistDone] = useState([])
  const [modalConfirm,setModalConfirm] = useState(null) // {title, message, onConfirm}
  const [modalAddZone,setModalAddZone] = useState(false)
  const [formZone,setFormZone] = useState({nom:'',frequence:'quotidien'})
  const [modalValiderZone,setModalValiderZone] = useState(null) // zone object
  const [validerPar,setValiderPar] = useState('')
  // Cuissons
  const [cuissonTab,setCuissonTab] = useState(()=>{ try { if(typeof window!=='undefined'&&localStorage.getItem('haccp_refroid_timer')) return 'timer' } catch(e){} return 'saisie' })
  const [formCuisson,setFormCuisson] = useState({produit_nom:'',type:'cuisson',temperature:'',commentaire:''})
  const [refroidTimers,setRefroidTimers] = useState([]) // liste de timers
  const [refroidTimer,setRefroidTimer] = useState(null) // compat legacy
  const [refroidTempFinale,setRefroidTempFinale] = useState('')
  const [refroidInterval,setRefroidInterval] = useState(null)
  const [modalTerminerTimer,setModalTerminerTimer] = useState(null)
  // Traçabilité
  const [tracaTab,setTracaTab] = useState('saisie')
  const [formLot,setFormLot] = useState({numero_lot:'',date_production:new Date().toISOString().split('T')[0]})
  const [lignesProduits,setLignesProduits] = useState([]) // [{type:'produit'|'recette'|'libre', id:'', nom:''}]
  const [selectRecetteId,setSelectRecetteId] = useState('')
  const [photosCapturees,setPhotosCapturees] = useState([]) // array de base64
  const [cameraActive,setCameraActive] = useState(false)
  const [cameraStream,setCameraStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [uploadingPhoto,setUploadingPhoto] = useState(false)
  const [modalViewPhoto,setModalViewPhoto] = useState(null)
  const [modalCarousel,setModalCarousel] = useState(null) // {urls:[], idx:0}
  const [searchLot,setSearchLot] = useState('')
  // Réception
  const [recepTab,setRecepTab] = useState('saisie')
  const [formRecep,setFormRecep] = useState({fournisseur:'',produit_nom:'',date_reception:new Date().toISOString().split('T')[0],bon_livraison:'',commentaire:'',lignesTemp:[],emballage:null,dlc:null,odeur:null,aspect:null,vehicule:null,etiquetage:null})
  const [recepPhoto,setRecepPhoto] = useState(null)
  const [recepCameraActive,setRecepCameraActive] = useState(false)
  const [recepCameraStream,setRecepCameraStream] = useState(null)
  const [cameraPermissionGranted,setCameraPermissionGranted] = useState(false)
  const recepVideoRef = useRef(null)
  const recepCanvasRef = useRef(null)
  const [retourLignes,setRetourLignes] = useState([]) // [{produit_id,produit_nom,quantite,raison}]
  const [recepHistoFiltre,setRecepHistoFiltre] = useState({fournisseur:'',debut:'',fin:'',statut:''})
  const [modalRecepDetail,setModalRecepDetail] = useState(null)
  const [modalEnvoiRetour,setModalEnvoiRetour] = useState(null)
  const [emailRetour,setEmailRetour] = useState('')
  const [membreRetourId,setMembreRetourId] = useState('')
  const [sendingRetour,setSendingRetour] = useState(false)
  // PMS
  const [modalDoc,setModalDoc] = useState(false)
  const [formDoc,setFormDoc] = useState({nom:'',categorie:'',date_expiration:'',commentaire:'',responsable:'',categorie_autre:''})
  const [pmsUploadFile,setPmsUploadFile] = useState(null)
  const [pmsUploading,setPmsUploading] = useState(false)
  const [modalDocDetail,setModalDocDetail] = useState(null) // document ouvert en detail

  const showToast=(m,t='ok')=>{ setToast({msg:m,type:t}); setTimeout(()=>setToast({msg:'',type:'ok'}),3000) }

  const localDateStr = (d) => {
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
  }

  const rechargerReleves = async () => {
    try {
      const {data:eqs} = await supabase.from('haccp_equipements').select('id').eq('etablissement_id',etabId)
      const eqIds = (eqs||[]).map(e=>e.id)
      if (!eqIds.length) return
      const {data:relTous} = await supabase.from('haccp_releves_temperature').select('*').order('releve_le',{ascending:false}).limit(200)
      // Date locale (pas UTC) pour éviter les décalages horaires
      const now = new Date()
      const todayLocal = localDateStr(now)
      const filtered = (relTous||[]).filter(r=>eqIds.includes(r.equipement_id))
      const todayR = filtered.filter(r=>{
        if (!r.releve_le) return false
        return localDateStr(new Date(r.releve_le)) === todayLocal
      })
      setRelevesAujourdhui(todayR)
      setRelevesTous(filtered)
      setRefreshKey(k=>k+1)
    } catch(e) { console.error('rechargerReleves error:', e) }
  }

  useEffect(()=>{
    charger()
    try { const m=JSON.parse(localStorage.getItem('membre_actif')||'{}'); setUserConnecte(m.nom||m.email||'') } catch(e){}
    // Charger l'équipe séparément comme dans inventaire
    const chargerEquipe = async () => {
      const {data, error} = await supabase.from('equipe').select('id,nom,email').eq('etablissement_id',etabId).order('nom')
      console.log('equipe loaded:', data, error)
      if(data) setEquipe(data)
    }
    chargerEquipe()
    // Restaurer tous les timers de refroidissement
    let iv = null
    try {
      const saved = JSON.parse(localStorage.getItem('haccp_refroid_timers')||'[]')
      const valid = saved.map(t=>({...t, elapsed:Math.floor((Date.now()-new Date(t.debut).getTime())/1000)})).filter(t=>t.elapsed<10800)
      if (valid.length>0) {
        setRefroidTimers(valid)
        setCuissonTab('refroidissements')
        iv = setInterval(()=>setRefroidTimers(prev=>prev.map(t=>({...t,elapsed:Math.floor((Date.now()-new Date(t.debut).getTime())/1000)}))),1000)
        setRefroidInterval(iv)
      }
    } catch(e){}
    return () => { if (iv) clearInterval(iv) }
  },[])

  const [etabNom, setEtabNom] = useState('')

  const charger = async () => {
    setLoading(true)
    const todayStr = new Date().toISOString().split('T')[0]
    const _dn = new Date(); const localNow = _dn.getFullYear()+'-'+String(_dn.getMonth()+1).padStart(2,'0')+'-'+String(_dn.getDate()).padStart(2,'0')
    const [{data:etab},{data:rec},{data:prod},{data:fourn},{data:eq},{data:zn},{data:tach},{data:tlog},{data:huil},{data:etiqMod},{data:etiq},{data:cuiss},{data:lotsD},{data:recepts},{data:docs},{data:logToday},{data:eqp},{data:relTous}] = await Promise.all([
      supabase.from('etablissements').select('nom').eq('id',etabId).single(),
      supabase.from('recettes').select('id,nom').eq('etablissement_id',etabId).order('nom'),
      supabase.from('produits').select('id,nom,fournisseur_id').eq('etablissement_id',etabId).order('nom'),
      supabase.from('fournisseurs').select('id,nom').eq('etablissement_id',etabId).order('nom'),
      supabase.from('haccp_equipements').select('*').eq('etablissement_id',etabId),
      supabase.from('haccp_zones_nettoyage').select('id,nom,description,etablissement_id,created_at').eq('etablissement_id',etabId).order('nom'),
      supabase.from('haccp_taches_nettoyage').select('*').eq('etablissement_id',etabId).order('nom'),
      supabase.from('haccp_tache_log').select('*').eq('etablissement_id',etabId).order('valide_le',{ascending:false}).limit(2000),
      supabase.from('haccp_huiles').select('*').eq('etablissement_id',etabId).order('created_at',{ascending:false}).limit(50),
      supabase.from('haccp_etiq_modeles').select('*').eq('etablissement_id',etabId).order('nom'),
      supabase.from('haccp_etiquettes').select('*').eq('etablissement_id',etabId).order('created_at',{ascending:false}).limit(15),
      supabase.from('haccp_cuissons').select('*').eq('etablissement_id',etabId).order('date_releve',{ascending:false}).limit(30),
      supabase.from('haccp_lots').select('*,produits(nom),recettes(nom)').eq('etablissement_id',etabId).order('created_at',{ascending:false}).limit(100),
      supabase.from('haccp_receptions').select('*,fournisseurs(nom)').eq('etablissement_id',etabId).order('date_reception',{ascending:false}).limit(30),
      supabase.from('haccp_documents').select('*').eq('etablissement_id',etabId).order('date_expiration',{ascending:true}),
      supabase.from('haccp_nettoyage_log').select('*').eq('etablissement_id',etabId).gte('created_at',todayStr+'T00:00:00'),
      supabase.from('equipe').select('id,nom,email').eq('etablissement_id',etabId).order('nom'),
      supabase.from('haccp_releves_temperature').select('*').order('releve_le', {ascending: false}).limit(200)
    ])
    if(etab?.nom) setEtabNom(etab.nom)
    setRecettes(rec||[]); setProduits(prod||[]); setFournisseurs(fourn||[])
    const eqIds = (eq||[]).map(e=>e.id)
    setEquipements(eq||[]); setZones(zn||[]); setTaches(tach||[])
    const _dn2 = new Date(); const todayLocal2 = _dn2.getFullYear()+'-'+String(_dn2.getMonth()+1).padStart(2,'0')+'-'+String(_dn2.getDate()).padStart(2,'0')
    const allLogs = (tlog||[])
    const todayLogs = allLogs.filter(l=>{
      if(!l.valide_le) return false
      const d = new Date(l.valide_le)
      return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') === todayLocal2
    })
    setTacheLog(todayLogs)
    setTacheLogAll(allLogs)
    setHuiles(huil||[])
    setEtiqModeles(etiqMod||[])
    setEtiquettes(etiq||[])
    setCuissons(cuiss||[]); setLots(lotsD||[]); setReceptions(recepts||[])
    setDocuments(docs||[]); setNettoyageLog(logToday||[])
    setEquipe(eqp||[])
    const relevesFiltered = (relTous||[]).filter(r=>eqIds.includes(r.equipement_id))
    // Date locale pour éviter décalage UTC
    const nowLocal = new Date()
    const todayLocal = nowLocal.getFullYear()+'-'+String(nowLocal.getMonth()+1).padStart(2,'0')+'-'+String(nowLocal.getDate()).padStart(2,'0')
    const todayReleves = relevesFiltered.filter(r=>{
      if(!r.releve_le) return false
      const d = new Date(r.releve_le)
      return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') === todayLocal
    })
    setRelevesAujourdhui(todayReleves)
    setRelevesTous(relevesFiltered)
    setLoading(false)
  }

  const dlcDate=(fab,j)=>{ if(!fab||!j) return ''; const d=new Date(fab); if(isNaN(d.getTime())) return ''; d.setDate(d.getDate()+parseInt(j)||0); return d.toISOString().split('T')[0] }
  const fmt=(s)=>s?new Date(s).toLocaleDateString('fr-FR'):'-'
  const estValide=(zid)=>nettoyageLog.some(l=>l.zone_id===zid)
  const estExpire=(d)=>d&&new Date(d)<new Date()
  const expireBientot=(d)=>{ if(!d) return false; const j=(new Date(d)-new Date())/86400000; return j>0&&j<30 }
  const genNumLot=()=>{ const d=new Date(); return 'L'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+Math.floor(Math.random()*900+100) }

  const updateModeleEtiq = async () => {
    if (!formEditModele.nom||!editModele) return
    await supabase.from('haccp_etiq_modeles').update({nom:formEditModele.nom, dlc_jours:formEditModele.dlc_libre?null:parseInt(formEditModele.dlc_jours)}).eq('id',editModele.id)
    setEditModele(null); charger(); showToast('Modèle modifié !')
  }

  const enregistrerHuile = async () => {
    if (!formHuile.nom) { showToast('Saisissez un nom de bac/friteuse','err'); return }
    const {error} = await supabase.from('haccp_huiles').insert({
      nom: formHuile.nom,
      type: formHuile.type,
      tgp_ok: formHuile.tgp_ok,
      tgp_valeur: formHuile.tgp_valeur ? parseFloat(formHuile.tgp_valeur) : null,
      commentaire: formHuile.commentaire,
      etablissement_id: etabId,
      fait_le: new Date(new Date().getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,-1),
      fait_par: userConnecte||'Equipe'
    })
    if (error) { showToast('Erreur: '+error.message,'err'); return }
    setModalAddHuile(false)
    setFormHuile({nom:'',type:'changement',tgp_ok:true,tgp_valeur:'',commentaire:''})
    charger(); showToast('Enregistre !')
  }

  const uploadDocPms = async (file) => {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const fname = 'pms/'+etabId+'/'+Date.now()+'.'+ext
    const {error} = await supabase.storage.from('tracabilite').upload(fname, file, {upsert:true})
    if (error) { showToast('Erreur upload: '+error.message,'err'); return null }
    const {data} = supabase.storage.from('tracabilite').getPublicUrl(fname)
    return data.publicUrl
  }

  const ajouterModeleEtiq = async () => {
    if (!formModele.nom) { showToast('Saisissez un nom','err'); return }
    const {error} = await supabase.from('haccp_etiq_modeles').insert({nom:formModele.nom, dlc_jours:parseInt(formModele.dlc_jours), etablissement_id:etabId})
    if (error) { showToast('Erreur: '+error.message,'err'); return }
    setModalAddModele(false); setFormModele({nom:'',dlc_jours:3}); charger(); showToast('Modèle créé !')
  }

  const supprimerModeleEtiq = async (id) => {
    setModalConfirm({title:"Supprimer ce modele ?",message:"Cette action est irreversible.",onConfirm:async()=>{ await supabase.from('haccp_etiq_modeles').delete().eq('id',id); charger(); showToast('Modele supprime') }})
  }

  const imprimerEtiquette = async () => {
    if (!formEtiq.produit_nom) { showToast('Saisissez un nom','err'); return }
    const dlc = formEtiq.dlc_libre || dlcDate(formEtiq.date_fabrication, formEtiq.jours_dlc)
    const format = FORMATS_ETIQ.find(f=>f.id===formEtiq.format_id) || FORMATS_ETIQ[0]
    const nb = formEtiq.nb_exemplaires || 1
    const fabFr = new Date(formEtiq.date_fabrication+'T12:00:00').toLocaleDateString('fr-FR')
    const dlcFr = new Date(dlc+'T12:00:00').toLocaleDateString('fr-FR')
    const poids = formEtiq.poids ? formEtiq.poids+' '+(formEtiq.unite_poids||'g') : null
    const lotNum = formEtiq.lot_numero || ''
    const lotRecette = formEtiq.lot_recette || ''
    // Ingrédients triés par poids décroissant avec allergènes en gras
    const ingList = (formEtiq.afficher_ingredients && etiqIngredients.length>0)
      ? [...etiqIngredients].sort((a,b)=>(parseFloat(b.poids)||0)-(parseFloat(a.poids)||0))
      : []

    const dimMatch = (format.dim||'').match(/([0-9.]+)[xX]([0-9.]+)/) || (format.dim||'').match(/([0-9.]+).([0-9.]+)/)
    const w1 = dimMatch ? parseFloat(dimMatch[1]) : 62
    const h1 = dimMatch ? parseFloat(dimMatch[2]) : 29
    const docW = Math.max(w1,h1)
    const docH = Math.min(w1,h1)
    const orientation = docW >= docH ? 'landscape' : 'portrait'

    await supabase.from('haccp_etiquettes').insert([{produit_nom:formEtiq.produit_nom,date_fabrication:formEtiq.date_fabrication,date_dlc:dlc,etablissement_id:etabId,responsable:userConnecte,format_nom:format.nom+' '+format.dim,nb_exemplaires:nb}])
    await supabase.from('dlc_produits').insert([{nom:formEtiq.produit_nom,type:'preparation',date_ouverture:formEtiq.date_fabrication,date_dlc:dlc,statut:'ok',etablissement_id:etabId}])

    try {
      const {default:jsPDF} = await import('jspdf')
      const doc = new jsPDF({ orientation, unit:'mm', format:[docW, docH] })
      const toP = mm => mm * 2.835
      const normPdf = s => (s||'').replace(/\u0152/g,'OE').replace(/\u0153/g,'oe').replace(/\u2019/g,"'").replace(/\u201C/g,'"').replace(/\u201D/g,'"')

      // MÊMES calculs que la prévisualisation
      const headerH = docH * 0.28
      const footerH = Math.max(4, docH * 0.06)
      const bodyH   = docH - headerH - footerH
      const padH    = Math.max(2, Math.min(5, docW * 0.04))

      const lBase = Math.max(2, Math.min(5, docH * 0.07))
      const dBase = Math.max(5, Math.min(12, docH * 0.13))
      const dlcBase = Math.max(8, Math.min(22, docH * 0.20))
      const pBase = Math.max(6, Math.min(18, docH * 0.16))
      const gBase = Math.max(1.5, Math.min(4, docH * 0.04))

      const hasPoids = !!poids
      const hasLot = !!lotNum
      const hasIng = ingList.length>0
      const ingMmBase = Math.max(4.0, Math.min(6.2, docH*0.068))
      const neededSansIng = lBase+dBase*1.2 + gBase + lBase+dlcBase*1.2 + (hasPoids?gBase*2+lBase+pBase*1.2:0) + (hasLot?gBase*2+lBase+dBase*1.2:0)
      const needed = neededSansIng + (hasIng?gBase*2+lBase*0.85+ingMmBase*1.6*2:0)
      const asc = Math.min(0.95, (bodyH*0.82)/needed)
      const espacePourIng = Math.max(0, bodyH*0.82 - neededSansIng*asc - (hasIng?gBase*asc*2+lBase*asc*0.85:0))
      const totalCharsIng = ingList.filter(ing=>ing.produits&&(ing.produits.nom||'').trim()!=='').reduce((acc,ing,i)=>acc+(ing.produits.nom||'').length+(i>0?2:0),0)
     const charsParLigne = Math.max(1, Math.floor((docW-padH*2)/(ingMmBase*asc*0.48)))
      const nbLignesIngEst = Math.max(1, Math.ceil(totalCharsIng/charsParLigne))
     const ingMmAuto = hasIng ? Math.min(ingMmBase*asc, Math.max(1.6, espacePourIng/(nbLignesIngEst*3.0))) : ingMmBase*asc

      const lMm = lBase * asc
      const dMm = dBase * asc
      const dlcMm = dlcBase * asc
      const pMm = pBase * asc
      const gMm = gBase * asc

      // Taille titre
      const titleMm = Math.min(12, Math.max(4, docW / Math.max(formEtiq.produit_nom.length * 0.65, 4)))

      for (let i=0; i<nb; i++) {
        if (i>0) doc.addPage([docW, docH], orientation)

        // HEADER NOIR
        doc.setFillColor(44,44,42)
        doc.rect(0,0,docW,headerH,'F')
        doc.setTextColor(255,255,255)
        doc.setFont('helvetica','bold')
        doc.setFontSize(toP(titleMm))
        const nomLines = doc.splitTextToSize(normPdf(formEtiq.produit_nom).toUpperCase(), docW-padH*2)
        const lineH = titleMm*1.25
        const sy = headerH/2 - (nomLines.length-1)*lineH/2 + titleMm*0.35
        nomLines.forEach((l,li)=>doc.text(l, docW/2, sy+li*lineH, {align:'center'}))

        // CENTRAGE VERTICAL du corps
        const totalH =
          lMm + dMm*1.2 + gMm +
          lMm + dlcMm*1.2 +
          (hasPoids ? gMm*2 + lMm + pMm*1.2 : 0) +
          (hasLot ? gMm*2 + lMm + dMm*1.2 : 0) +
          (ingList.length>0 ? gMm*2 + lMm*0.85 + (ingMmBase*asc)*1.6*2 : 0)
        let y = headerH + (bodyH - totalH)/2 + lMm

        // FABRIQUE LE
        doc.setFontSize(toP(lMm)); doc.setFont('helvetica','bold'); doc.setTextColor(136,135,128)
        doc.text('FABRIQU\u00C9 LE', docW/2, y, {align:'center'})
        y += lMm*0.8
        doc.setFontSize(toP(dMm)); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,26)
        doc.text(fabFr, docW/2, y+dMm*0.75, {align:'center'})
        y += dMm*1.1 + gMm + lMm

        // DLC
        doc.setFontSize(toP(lMm)); doc.setFont('helvetica','bold'); doc.setTextColor(136,135,128)
        doc.text('DLC', docW/2, y, {align:'center'})
        y += lMm*0.8
        doc.setFontSize(toP(dlcMm)); doc.setFont('helvetica','bold'); doc.setTextColor(180,30,30)
        doc.text(dlcFr, docW/2, y+dlcMm*0.75, {align:'center'})
        y += dlcMm*1.1

        // POIDS NET
        if (hasPoids) {
          y += gMm*2
         doc.setDrawColor(160,160,160); doc.setLineWidth(0.2); doc.line(padH,y,docW-padH,y)
          y += gMm + lMm
          doc.setFontSize(toP(lMm)); doc.setFont('helvetica','bold'); doc.setTextColor(136,135,128)
          doc.text('POIDS NET', docW/2, y, {align:'center'})
          y += lMm*0.8
          doc.setFontSize(toP(pMm)); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,26)
          doc.text(poids, docW/2, y+pMm*0.75, {align:'center'})
          y += pMm*1.1
        }

        // LOT
        if (hasLot) {
          y += gMm*1
          doc.setDrawColor(160,160,160); doc.setLineWidth(0.2); doc.line(padH,y,docW-padH,y)
          y += gMm + lMm
          doc.setFontSize(toP(lMm)); doc.setFont('helvetica','bold'); doc.setTextColor(136,135,128)
          doc.text('LOT', docW/2, y, {align:'center'})
          y += lMm*0.8
         doc.setFontSize(toP(dMm)); doc.setFont('helvetica','bold'); doc.setTextColor(83,74,183)
          doc.text(lotNum, docW/2, y+dMm*0.75, {align:'center'})
         y += hasIng ? dMm*1.1 : dMm*2.2
        }

        // INGRÉDIENTS
        if (ingList.length > 0) {
          y += gMm*2
         doc.setDrawColor(160,160,160); doc.setLineWidth(0.2); doc.line(padH,y,docW-padH,y)
          y += gMm + lMm*0.8
          doc.setFontSize(toP(lMm*0.8)); doc.setFont('helvetica','bold'); doc.setTextColor(136,135,128)
          doc.text('INGREDIENTS', docW/2, y, {align:'center'})
          y += lMm
          // Ingredients: construire puis rendre
          const ingMmFinal = ingMmAuto
          const ingFiltered2 = ingList.filter(ing=>ing.produits&&(ing.produits.nom||'').trim()!=='')
          // Build segments - virgule collée au nom (même segment = même font = pas de bug encodage jsPDF)
          const ingSegs = []
          ingFiltered2.forEach((ing, idx2) => {
            const nm = (ing.produits.nom||'').trim()
            const isA = (ing.produits.allergenes||[]).length > 0
            const raw = isA ? normPdf(nm).toUpperCase() : normPdf(nm).charAt(0).toUpperCase()+normPdf(nm).slice(1).toLowerCase()
            const disp = idx2 > 0 ? ', ' + raw : raw
            ingSegs.push({t:disp, b:isA})
          })
          // Render segments
let rx = padH, ry = y + ingMmFinal*0.9
const rLineH = ingMmFinal * 1.6
const rMaxW = docW - padH*2
for (let ti = 0; ti < ingSegs.length; ti++) {
            const seg = ingSegs[ti]
            doc.setFontSize(toP(ingMmFinal))
            doc.setFont('helvetica', seg.b ? 'bold' : 'normal') // font SET AVANT getTextWidth
            doc.setTextColor(44,44,42)
            const sw = doc.getTextWidth(seg.t)
            if (rx > padH && rx + sw > padH + rMaxW) {
              if (seg.t === ', ') { rx = padH; ry += rLineH; continue } // virgule en fin de ligne → sautée
              rx = padH; ry += rLineH
            }
            doc.text(seg.t, rx, ry)
            rx += sw
          }
        }
        // FOOTER
        doc.setFillColor(235,235,235); doc.rect(0,docH-footerH,docW,footerH,'F')
        doc.setDrawColor(160,160,160); doc.setLineWidth(0.2); doc.line(0,docH-footerH,docW,docH-footerH)
        const footerFontMm = Math.max(3.2, footerH * 0.38)
        const footerY = docH - footerH*0.5 + footerFontMm*0.35
        doc.setFontSize(toP(footerFontMm)); doc.setFont('helvetica','bold'); doc.setTextColor(40,40,40)
        if(userConnecte) doc.text(normPdf(userConnecte), padH, footerY)
        doc.setFont('helvetica','normal'); doc.setTextColor(100,100,100)
        doc.text(format.dim, docW-padH, footerY, {align:'right'})
      }

      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        const pdfBase64 = doc.output('datauristring')
        // Ouvrir dans une nouvelle page avec bouton imprimer intégré
        const w = window.open('', '_blank')
        if (w) {
          w.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Etiquette</title>
              <style>
                body { margin:0; background:#111; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; }
                iframe { width:100vw; height:70vh; border:none; }
                button { margin-top:16px; padding:14px 32px; background:#534ab7; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:600; cursor:pointer; }
              </style>
            </head>
            <body>
              <iframe src="${pdfBase64}"></iframe>
              <button onclick="window.print()">🖨️ Imprimer</button>
            </body>
            </html>
          `)
          w.document.close()
        }
        showToast('Appuyez sur Imprimer')
      }else {
        // Sur desktop : impression directe via iframe
        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none'
        iframe.src = pdfUrl
        document.body.appendChild(iframe)
        iframe.onload = () => {
          iframe.contentWindow.focus(); iframe.contentWindow.print()
          setTimeout(()=>{ try{document.body.removeChild(iframe);URL.revokeObjectURL(pdfUrl)}catch(e){} },5000)
        }
        showToast('Impression lancee !')
      }
    } catch(e) { showToast('Erreur: '+e.message,'err'); console.error(e) }

    setFormEtiq(prev=>({...prev,produit_nom:'',date_fabrication:new Date().toISOString().split('T')[0],jours_dlc:3,dlc_libre:'',nb_exemplaires:1,poids:'',unite_poids:'g',lot_id:'',lot_numero:'',lot_recette:'',afficher_ingredients:false}))
    setEtiqIngredients([])
    charger()
  }

  const updateEquipement = async () => {
    if (!formEquip.nom||formEquip.temp_min===''||formEquip.temp_max==='') { showToast('Remplissez tous les champs','err'); return }
    await supabase.from('haccp_equipements').update({
      nom:formEquip.nom, type:formEquip.type,
      temp_min:parseFloat(formEquip.temp_min), temp_max:parseFloat(formEquip.temp_max),
      frequence:formEquip.frequence_fois+'x/jour tous les '+formEquip.frequence_jours+' jour(s)'
    }).eq('id',editEquip.id)
    setEditEquip(null); setFormEquip({nom:'',type:'froid',temp_min:'',temp_max:'',frequence_jours:1,frequence_fois:2})
    charger(); showToast('Équipement modifié !')
  }

  const supprimerEquipement = async (id) => {
    setModalConfirm({title:"Supprimer cet equipement ?",message:"Les releves associes seront aussi supprimes.",onConfirm:async()=>{ await supabase.from('haccp_releves_temperature').delete().eq('equipement_id',id); await supabase.from('haccp_equipements').delete().eq('id',id); charger(); showToast('Equipement supprime') }})
  }

  const ajouterEquipement = async () => {
    if (!formEquip.nom||formEquip.temp_min===''||formEquip.temp_max==='') { showToast('Remplissez tous les champs','err'); return }
    const freq = (formEquip.frequence_fois||2)+'x/jour tous les '+(formEquip.frequence_jours||1)+' jour(s)'
    await supabase.from('haccp_equipements').insert([{nom:formEquip.nom,type:formEquip.type,temp_min:parseFloat(formEquip.temp_min),temp_max:parseFloat(formEquip.temp_max),frequence:freq,etablissement_id:etabId}])
    setModalAddEquip(false); setFormEquip({nom:'',type:'froid',temp_min:'',temp_max:'',frequence_jours:1,frequence_fois:2}); charger(); showToast('Équipement ajouté !')
  }

  const validerTemperature = async () => {
    if (!modalTemp) return
    // Stockage sec — pas de température obligatoire
    if (modalTemp.type === 'sec') {
      const payload = {
        equipement_id: modalTemp.id,
        temperature: tempVal ? parseFloat(tempVal) : null,
        conforme: true, // sec = toujours OK sauf commentaire
        moment: tempMoment,
        releve_par: userConnecte || 'Equipe',
        action_corrective: tempActionCorrective || null,
        releve_le: new Date(new Date().getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,-1)
      }
      const {error} = await supabase.from('haccp_releves_temperature').insert(payload)
      if (error) { showToast('Erreur: '+error.message,'err'); return }
      setModalTemp(null); setTempVal(''); setTempMoment('Matin'); setTempActionCorrective('')
      rechargerReleves()
      showToast('Relevé stockage sec enregistré !')
      return
    }
    if (!tempVal) { showToast('Saisissez une température','err'); return }
    const t = parseFloat(tempVal)
    if (isNaN(t)) { showToast('Température invalide','err'); return }
    const conforme = t >= parseFloat(modalTemp.temp_min) && t <= parseFloat(modalTemp.temp_max)
    // Capturer les valeurs AVANT de fermer le modal
    const equipId = modalTemp.id
    const momentCapture = tempMoment
    const actionCapture = tempActionCorrective
    // Fermer le modal et vider les champs IMMÉDIATEMENT
    setModalTemp(null)
    setTempVal('')
    setTempMoment('Matin')
    setTempActionCorrective('')
    setRefreshKey(k=>k+1) // force re-render immédiat des cards
    // Insérer avec toutes les valeurs capturées
    const res = await supabase.from('haccp_releves_temperature').insert({
      equipement_id: equipId,
      temperature: t,
      conforme: conforme,
      moment: momentCapture,
      releve_par: userConnecte || 'Equipe',
      action_corrective: (!conforme && actionCapture) ? actionCapture : null,
      releve_le: new Date(new Date().getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,-1)
    })
    if (res.error) {
      showToast('Erreur enregistrement: ' + res.error.message, 'err')
      console.error('Releve error:', res.error)
      return
    }
    showToast(conforme ? '✓ Relevé enregistré !' : '⚠️ Température hors norme !')
    rechargerReleves()
  }

  const ajouterZone = async () => {
    if (!formZone.nom) { showToast('Saisissez un nom','err'); return }
    await supabase.from('haccp_zones_nettoyage').insert([{...formZone,etablissement_id:etabId}])
    setModalAddZone(false); setFormZone({nom:'',frequence:'quotidien'}); charger(); showToast('Zone ajoutée !')
  }

  const exporterRelevesCSV = (releves, eqList) => { // uses etabNom from closure
    const sep = ';'
    const nl = String.fromCharCode(10)
    const headers = ['Etablissement','Date','Heure','Moment','Equipement','Temperature (C)','Plage min','Plage max','Conforme','Releve par','Action corrective'].join(sep)
    const rows = releves.map(r => {
      const eq = eqList.find(e => e.id === r.equipement_id)
      const d = r.releve_le ? new Date(r.releve_le) : null
      return [
        etabNom,
        d ? d.toLocaleDateString('fr-FR') : '',
        d ? d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '',
        r.moment || '',
        eq ? eq.nom : '',
        r.temperature,
        eq ? eq.temp_min : '',
        eq ? eq.temp_max : '',
        r.conforme ? 'Oui' : 'Non',
        r.releve_par || '',
        r.action_corrective || ''
      ].join(sep)
    })
    const csv = [headers, ...rows].join(nl)
    const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    const fname = (etabNom?etabNom.replace(/[^a-zA-Z0-9]/g,'_')+'_':'')+'releves_temperature_' + new Date().toISOString().slice(0, 10) + '.csv'
    const a = document.createElement('a')
    a.href = uri; a.download = fname; a.click()
  }

  const exporterNettoyageCSV = () => {
    const sep = ';'
    const nl = String.fromCharCode(10)
    const headers = ['Date','Heure','Zone','Frequence','Valide par'].join(sep)
    const rows = nettoyageLog.map(l => {
      const z = zones.find(x => x.id === l.zone_id)
      const d = new Date(l.valide_le || l.created_at)
      return [
        d.toLocaleDateString('fr-FR'),
        d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}),
        z ? z.nom : '',
        z ? z.frequence : '',
        l.valide_par || ''
      ].join(sep)
    })
    const csv = [headers, ...rows].join(nl)
    const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    const fname = 'nettoyage_' + new Date().toISOString().slice(0, 10) + '.csv'
    const a = document.createElement('a')
    a.href = uri
    a.download = fname
    a.click()
  }

  const validerNettoyage = async () => {
    if (!modalValiderZone) return
    await supabase.from('haccp_nettoyage_log').insert([{zone_id:modalValiderZone.id,valide_par:validerPar||'Gérant',etablissement_id:etabId,valide_le:new Date().toISOString()}])
    setModalValiderZone(null); setValiderPar('')
    charger(); showToast('Zone validée !')
  }

  const demarrerCameraRecep = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false})
      setRecepCameraStream(stream)
      setRecepCameraActive(true)
      setCameraPermissionGranted(true)
      setTimeout(()=>{ if(recepVideoRef.current) recepVideoRef.current.srcObject=stream },100)
    } catch(e) { showToast('Camera indisponible: '+e.message,'err') }
  }
  const arreterCameraRecep = () => {
    if(recepCameraStream) recepCameraStream.getTracks().forEach(t=>t.stop())
    setRecepCameraStream(null); setRecepCameraActive(false)
  }
  const prendrePhotoRecep = () => {
    if(!recepVideoRef.current||!recepCanvasRef.current) return
    const v=recepVideoRef.current; const cv=recepCanvasRef.current
    cv.width=v.videoWidth; cv.height=v.videoHeight
    cv.getContext('2d').drawImage(v,0,0)
    setRecepPhoto(cv.toDataURL('image/jpeg',0.85))
    arreterCameraRecep(); showToast('Photo BL capturée !')
  }

  const demarrerTimer = (type) => {
    if (!formCuisson.produit_nom || !formCuisson.temperature) { showToast('Saisissez le produit et la temperature','err'); return }
    const tDepart = parseFloat(formCuisson.temperature)
    if (isNaN(tDepart)) { showToast('Saisissez une temperature valide','err'); return }
    const limiteMin = type === 'refroidissement' ? 120 : 60   // 2h pour refroid, 1h pour remise
    const limiteLabel = type === 'refroidissement' ? '2h' : '1h'
    const objectif = type === 'refroidissement' ? 'atteindre < 10°C' : 'atteindre >= 63°C'
    const nouveau = {
      id: Date.now().toString(),
      type,
      produit_nom: formCuisson.produit_nom,
      temp_depart: tDepart,
      commentaire: formCuisson.commentaire || '',
      debut: new Date().toISOString(),
      elapsed: 0,
      fait_par: userConnecte || 'Equipe',
      limiteMin,
      limiteLabel,
      objectif
    }
    setRefroidTimers(prev => {
      const updated = [...prev, nouveau]
      try { localStorage.setItem('haccp_refroid_timers', JSON.stringify(updated)) } catch(e) {}
      return updated
    })
    if (!refroidInterval) {
      const iv = setInterval(() => {
        setRefroidTimers(prev => prev.map(t => ({...t, elapsed: Math.floor((Date.now()-new Date(t.debut).getTime())/1000)})))
      }, 1000)
      setRefroidInterval(iv)
    }
    setFormCuisson({produit_nom:'', type:formCuisson.type, temperature:'', commentaire:''})
    setCuissonTab('refroidissements')
    showToast('Timer lance !')
  }

  const demarrerRefroid = () => demarrerTimer('refroidissement')
  const demarrerRemise = () => demarrerTimer('remise')

  const terminerRefroid = async () => {
    if (!refroidTempFinale || !modalTerminerTimer) { showToast('Saisissez la temperature finale','err'); return }
    const timer = modalTerminerTimer
    const tFin = parseFloat(refroidTempFinale)
    if (isNaN(tFin)) { showToast('Temperature invalide','err'); return }
    const dureeMin = Math.floor(timer.elapsed / 60)
    const timerType = timer.type || 'refroidissement'
    const limiteMin = timer.limiteMin || 120
    let conforme = false
    if (timerType === 'refroidissement') conforme = tFin <= 10 && dureeMin <= limiteMin && timer.temp_depart >= 63
    else conforme = tFin >= 63 && dureeMin <= limiteMin && timer.temp_depart <= 10  // remise: depart <= 10C, finale >= 63C en 1h
    const autoComment = 'Depart: '+timer.temp_depart+'°C — Fin: '+tFin+'°C — Duree: '+dureeMin+' min — Par: '+(timer.fait_par||'')
    const finalComment = timer.commentaire ? timer.commentaire+' | '+autoComment : autoComment
    const {error} = await supabase.from('haccp_cuissons').insert({
      produit_nom: timer.produit_nom,
      type: timerType,
      temperature: tFin,
      conforme,
      etablissement_id: etabId,
      commentaire: finalComment
    })
    if (error) { showToast('Erreur: '+error.message,'err'); return }
    setRefroidTimers(prev => {
      const updated = prev.filter(t => t.id !== timer.id)
      try { localStorage.setItem('haccp_refroid_timers', JSON.stringify(updated)) } catch(e) {}
      if (updated.length === 0 && refroidInterval) { clearInterval(refroidInterval); setRefroidInterval(null) }
      return updated
    })
    setModalTerminerTimer(null)
    setRefroidTempFinale('')
    charger()
    showToast(conforme ? '✓ Refroidissement conforme !' : '⚠️ Non-conformite !', conforme?'ok':'err')
  }

  const annulerRefroid = () => {
    if (refroidInterval) { clearInterval(refroidInterval); setRefroidInterval(null) }
    setRefroidTimer(null)
    try{localStorage.removeItem('haccp_refroid_timer')}catch(e){}
    setRefroidTempFinale('')
    setCuissonTab('saisie')
    setFormCuisson({produit_nom:'',type:'cuisson',temperature:'',commentaire:''})
  }

  const formatTimer = (sec) => {
    const h = Math.floor(sec/3600)
    const m = Math.floor((sec%3600)/60)
    const s = sec%60
    return (h>0?h+'h ':'') + String(m).padStart(2,'0')+'m '+String(s).padStart(2,'0')+'s'
  }

  const enregistrerCuisson = async () => {
    if (!formCuisson.produit_nom||!formCuisson.temperature) { showToast('Remplissez tous les champs','err'); return }
    const t = parseFloat(formCuisson.temperature)
    const conforme = formCuisson.type==='refroidissement' ? t<=10 : t>=63
    await supabase.from('haccp_cuissons').insert([{produit_nom:formCuisson.produit_nom,type:formCuisson.type,temperature:t,conforme,commentaire:formCuisson.commentaire||null,etablissement_id:etabId}])
    setFormCuisson({produit_nom:'',type:'cuisson',temperature:'',commentaire:''})
    setCuissonTab('historique'); charger()
    conforme ? showToast('Relevé enregistré !') : showToast('⚠️ Non-conformité détectée !','err')
  }

  const demarrerCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false})
      setCameraStream(stream)
      setCameraActive(true)
      setCameraPermissionGranted(true)
      setTimeout(()=>{ if(videoRef.current) videoRef.current.srcObject=stream },100)
    } catch(e) { showToast('Impossible d\'activer la camera: '+e.message,'err') }
  }

  const arreterCamera = () => {
    if(cameraStream) cameraStream.getTracks().forEach(t=>t.stop())
    setCameraStream(null)
    setCameraActive(false)
  }

  const prendrePhoto = () => {
    if(!videoRef.current||!canvasRef.current) return
    const v=videoRef.current; const cv=canvasRef.current
    cv.width=v.videoWidth; cv.height=v.videoHeight
    cv.getContext('2d').drawImage(v,0,0)
    const dataUrl=cv.toDataURL('image/jpeg',0.85)
    setPhotosCapturees(prev=>{ const next=[...prev,dataUrl]; showToast('Photo '+next.length+' capturée !'); return next })
    // Camera reste active
  }

  const uploadPhoto = async (dataUrl, idx=0) => {
    if(!dataUrl) return null
    try {
      const blob=await fetch(dataUrl).then(r=>r.blob())
      const fname='tracabilite/'+etabId+'/'+Date.now()+'_'+idx+'_'+Math.random().toString(36).slice(2,7)+'.jpg'
      const {error}=await supabase.storage.from('tracabilite').upload(fname,blob,{contentType:'image/jpeg',upsert:true})
      if(error) { showToast('Erreur upload photo: '+error.message,'err'); return null }
      const {data}=supabase.storage.from('tracabilite').getPublicUrl(fname)
      return data.publicUrl
    } catch(e) { showToast('Erreur upload: '+e.message,'err'); return null }
  }

  const creerLot = async () => {
    const num = formLot.numero_lot||genNumLot()
    // Pas de validation obligatoire — tout est optionnel
    // Produits liés
    const prodNom = lignesProduits.filter(l=>l.type==='produit').map(l=>l.nom).join(', ')
    // Recette liée (première recette sélectionnée)
    const recetteLigne = lignesProduits.find(l=>l.type==='recette')
    const recetteId = recetteLigne?.id || null
    const recetteNom = recetteLigne?.nom || null
    console.log('creerLot - recetteLigne:', recetteLigne, 'recetteId:', recetteId)

    // Upload toutes les photos avec index unique
    let photoUrl = null
    let photosUrlsJson = null
    if(photosCapturees.length>0) {
      setUploadingPhoto(true)
      const urls = []
      for(let i=0; i<photosCapturees.length; i++) {
        const url = await uploadPhoto(photosCapturees[i], i)
        if(url) urls.push(url)
      }
      setUploadingPhoto(false)
      photoUrl = urls[0]||null
      photosUrlsJson = urls.length>0 ? JSON.stringify(urls) : null
      showToast(urls.length+' photo(s) uploadée(s) !')
    }

    const {error} = await supabase.from('haccp_lots').insert([{
      numero_lot: num,
      produit_nom: prodNom||null, // Ne pas mettre le nom de la recette dans produit_nom
      recette_id: recetteId,
      date_production: formLot.date_production||null,
      photo_url: photoUrl,
      photos_urls: photosUrlsJson,
      etablissement_id: etabId
    }])

    if(error) { showToast('Erreur: '+error.message,'err'); return }

    setFormLot({numero_lot:'',date_production:new Date().toISOString().split('T')[0]})
    setLignesProduits([])
    setSelectRecetteId('')
    setPhotosCapturees([])
    arreterCamera()
    setTracaTab('lots'); charger(); showToast('Lot enregistré !')
  }

  const basculerRappel = async (id,etat) => {
    await supabase.from('haccp_lots').update({rappele:!etat}).eq('id',id)
    charger()
  }

  const enregistrerReception = async () => {
    // handled inline in JSX
    setRecepTab('historique'); charger()
    conforme ? showToast('Réception conforme enregistrée !') : showToast('⚠️ Non-conformité enregistrée !','err')
  }

  const ajouterDocument = async () => {
    if (!formDoc.nom) { showToast('Le nom est obligatoire','err'); return }
    await supabase.from('haccp_documents').insert([{nom:formDoc.nom,categorie:formDoc.categorie,date_expiration:formDoc.date_expiration||null,etablissement_id:etabId}])
    setModalDoc(false); setFormDoc({nom:'',categorie:'',date_expiration:''}); charger(); showToast('Document ajouté !')
  }

  // ── STATUT TEMPÉRATURE PAR ÉQUIPEMENT ──
  const getStatutEquipement = (eq) => {
    // Stockage sec — statut simplifié
    if (eq.type === 'sec') {
      const faitAujourd = relevesTous.filter(r=>r.equipement_id===eq.id).some(r=>{
        if(!r.releve_le) return false
        const d=new Date(r.releve_le)
        const ld=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
        const now=new Date(); const today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')
        return ld===today
      })
      if(faitAujourd) return {statut:'fait',label:'Vérifié aujourd\'hui',dernierReleve:null}
      return {statut:'afaire',label:'À vérifier',dernierReleve:null}
    }
    const match = (eq.frequence||'').match(/(\d+)x\/jour/)
    const foisParJour = match ? parseInt(match[1]) : 1

    // Date/heure simulée ou réelle
    const now = new Date()
    const heure = now.getHours()

    // Helper: date locale string YYYY-MM-DD
    const localStr = (d) => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
    const localToday = localStr(now)
    const hierDate = new Date(now); hierDate.setDate(hierDate.getDate()-1)
    const localHier = localStr(hierDate)

    // Relevés de cet équipement
    const relevesEq = relevesTous.filter(r => r.equipement_id === eq.id)

    // Helper: date locale d'un relevé
    const dateReleve = (r) => {
      if (!r.releve_le) return ''
      return localStr(new Date(r.releve_le))
    }

    const relevesAujourd = relevesEq.filter(r => dateReleve(r) === localToday)
    const relevesHier    = relevesEq.filter(r => dateReleve(r) === localHier)
    const dernierReleve  = relevesAujourd.length > 0
      ? relevesAujourd.slice().sort((a,b) => new Date(b.releve_le)-new Date(a.releve_le))[0]
      : null

    // Créneaux
    const creneaux = []
    if (foisParJour === 1) {
      creneaux.push({label:"Journee", debut:6, fin:22})
    } else if (foisParJour === 2) {
      creneaux.push({label:'Matin', debut:6, fin:14})
      creneaux.push({label:'Soir', debut:14, fin:23})
    } else if (foisParJour === 3) {
      creneaux.push({label:'Matin', debut:6, fin:11})
      creneaux.push({label:'Midi', debut:11, fin:16})
      creneaux.push({label:'Soir', debut:16, fin:23})
    } else {
      for (let i=0; i<foisParJour; i++) {
        creneaux.push({label:'Creneau '+(i+1), debut:6+Math.floor(i*16/foisParJour), fin:6+Math.floor((i+1)*16/foisParJour)})
      }
    }

    // Un relevé couvre-t-il un créneau ?
    // On vérifie : heure réelle du relevé dans la plage OU champ moment correspondant
    const relEveCouvreCreneauPar = (r, cr) => {
      // Par heure réelle du relevé (heure locale)
      const h = new Date(r.releve_le).getHours()
      if (h >= cr.debut && h < cr.fin) return true
      // Par moment sélectionné (saisie rétroactive)
      const m = (r.moment||'').toLowerCase()
      if (cr.label==='Matin' && m==='matin') return true
      if (cr.label==='Midi'  && m==='midi')  return true
      if (cr.label==='Soir'  && (m==='soir'||m==='service')) return true
      if (cr.label==='Nuit'  && m==='nuit')  return true
      if (cr.label==='Journée' || cr.label==='Journee') return true
      return false
    }

    const faitDansCreneau = (cr) => relevesAujourd.some(r => relEveCouvreCreneauPar(r, cr))

    const creneauActuel  = creneaux.find(cr => heure >= cr.debut && heure < cr.fin)
    const creneauxPasses = creneaux.filter(cr => cr.fin <= heure)

    // Label du dernier relevé fait
    const labelFait = (cr) => {
      const h = dernierReleve ? new Date(dernierReleve.releve_le).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : ''
      const m = dernierReleve?.moment || (cr?.label||'')
      return 'Fait '+m+(h?' a '+h:'')
    }

    // 1. URGENT : pas de relevé hier + équipement utilisé récemment + rien encore aujourd'hui
    if (relevesHier.length === 0 && relevesAujourd.length === 0) {
      const il7j = new Date(now); il7j.setDate(il7j.getDate()-7)
      const recent = relevesEq.some(r => r.releve_le && new Date(r.releve_le) >= il7j && dateReleve(r) !== localToday && dateReleve(r) !== localHier)
      if (recent) return {statut:'urgent', label:'Non fait hier !', dernierReleve}
    }

    // 2. RETARD : créneau passé sans relevé
    const creneauEnRetard = creneauxPasses.find(cr => !faitDansCreneau(cr))
    if (creneauEnRetard) {
      return {statut:'retard', label:creneauEnRetard.label+' non fait', dernierReleve}
    }

    // 3. FAIT : créneau actuel couvert
    if (creneauActuel && faitDansCreneau(creneauActuel)) {
      return {statut:'fait', label:labelFait(creneauActuel), dernierReleve}
    }

    // 4. FAIT : tous les créneaux couverts (pas de créneau actuel = hors plage)
    if (!creneauActuel && creneaux.every(cr => faitDansCreneau(cr))) {
      return {statut:'fait', label:labelFait(null), dernierReleve}
    }

    // 5. A FAIRE
    if (creneauActuel) {
      return {statut:'afaire', label:creneauActuel.label+' - A relever', dernierReleve}
    }

    return {statut:'afaire', label:'A relever', dernierReleve}
  }

  const couleurStatut = (statut) => {
    if (statut==='fait')   return {bg:'#f8f7f4', border:'#d3d1c7', badge:'#f1efe8', badgeC:'#888780'}
    if (statut==='afaire') return {bg:'#fffbf0', border:'#fac775', badge:'#faeeda', badgeC:'#854f0b'}
    if (statut==='retard') return {bg:'#fff5f5', border:'#f09595', badge:'#fcebeb', badgeC:'#a32d2d'}
    if (statut==='urgent') return {bg:'#fff0f0', border:'#e53e3e', badge:'#fed7d7', badgeC:'#c53030'}
    return {bg:'#f8f7f4', border:'#e2e0d8', badge:'#f1efe8', badgeC:'#888780'}
  }

  // ── NETTOYAGE HELPERS ──
  const localNowStr = () => {
    const d = new Date()
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
  }

  const tacheStatut = (tache) => {
    const freq = tache.frequence || 'quotidien'
    const now = new Date()
    const h = now.getHours()
    // Toujours comparer en date locale (pas UTC)
    const localStr = (d) => {
      const dt = new Date(d)
      return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')
    }
    const today = localStr(now)

    // Chercher le dernier log de cette tâche
    const logsT = tacheLogAll.filter(l => l.tache_id === tache.id)
    const lastLog = logsT.slice().sort((a,b)=>new Date(b.valide_le)-new Date(a.valide_le))[0]

    if (freq === '2x/jour') {
      const todayLogs = logsT.filter(l=>localStr(l.valide_le)===today)
      if (todayLogs.length >= 2) return 'fait'
      if (todayLogs.length === 1) return h >= 14 ? 'afaire' : 'fait'
      return h >= 20 ? 'retard' : 'afaire'
    }
    if (freq === 'quotidien') {
      const faitAujourd = logsT.some(l => localStr(l.valide_le) === today)
      if (faitAujourd) return 'fait'
      // Pas fait aujourd'hui — rouge si hier pas fait non plus
      if (lastLog) {
        const diffJ = Math.floor((new Date(today) - new Date(localStr(new Date(lastLog.valide_le)))) / 86400000)
        if (diffJ > 1) return 'retard' // pas fait hier non plus = rouge
      }
      return h >= 20 ? 'retard' : 'afaire'
    }
    // Pour toutes les fréquences basées sur nb de jours
    // Comparer les DATES LOCALES (pas les timestamps) pour éviter décalage UTC
    const diffJoursLocaux = (d1, d2) => {
      const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())
      const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate())
      return Math.floor((a - b) / 86400000)
    }
    if (freq === '2jours') {
      if (!lastLog) return 'afaire'
      const diffJ = diffJoursLocaux(now, new Date(lastLog.valide_le))
      return diffJ < 2 ? 'fait' : 'retard'
    }
    if (freq === 'hebdomadaire') {
      if (!lastLog) return 'afaire'
      const diffJ = diffJoursLocaux(now, new Date(lastLog.valide_le))
      return diffJ < 7 ? 'fait' : 'retard'
    }
    if (freq === '2semaines') {
      if (!lastLog) return 'afaire'
      const diffJ = diffJoursLocaux(now, new Date(lastLog.valide_le))
      return diffJ < 14 ? 'fait' : 'retard'
    }
    if (freq === 'mensuel') {
      if (!lastLog) return 'afaire'
      const diffJ = diffJoursLocaux(now, new Date(lastLog.valide_le))
      return diffJ < 30 ? 'fait' : 'retard'
    }
    // Fréquence personnalisée en jours (ex: "5j", "10j")
    const matchJ = freq.match(/^(\d+)j$/)
    if (matchJ) {
      const nbJ = parseInt(matchJ[1])
      if (!lastLog) return 'afaire'
      const diffJ = (now - new Date(lastLog.valide_le)) / 86400000
      if (diffJ < nbJ) return 'fait'
      return 'retard'
    }
    return 'afaire'
  }

  const validerTache = async (tache) => {
    const res = await supabase.from('haccp_tache_log').insert({
      tache_id: tache.id,
      zone_id: tache.zone_id,
      etablissement_id: etabId,
      valide_par: userConnecte || 'Equipe',
      valide_le: new Date(new Date().getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,-1)
    })
    if (res.error) { showToast('Erreur: '+res.error.message,'err'); return }
    showToast('Tâche validée !')
    // Reload tache log only
    const {data:tlog} = await supabase.from('haccp_tache_log').select('*').eq('etablissement_id',etabId).order('valide_le',{ascending:false}).limit(500)
    const _d2 = new Date(); const td2 = _d2.getFullYear()+'-'+String(_d2.getMonth()+1).padStart(2,'0')+'-'+String(_d2.getDate()).padStart(2,'0')
    const allL = tlog||[]
    const todL = allL.filter(l=>{ if(!l.valide_le) return false; const d=new Date(l.valide_le); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')===td2 })
    setTacheLog(todL)
    setTacheLogAll(allL)
    setTacheRefreshKey(k=>k+1)
  }

  const updateZoneNett = async () => {
    if (!formZoneNett.nom||!editZoneNett) return
    await supabase.from('haccp_zones_nettoyage').update({nom:formZoneNett.nom, description:formZoneNett.description||null}).eq('id',editZoneNett.id)
    setModalAddZoneNett(false); setEditZoneNett(null); setFormZoneNett({nom:'',description:''}); charger(); showToast('Zone modifiée !')
  }

  const updateTache = async () => {
    if (!formTache.nom||!editTache) return
    await supabase.from('haccp_taches_nettoyage').update({nom:formTache.nom,frequence:formTache.frequence,description:formTache.description}).eq('id',editTache.id)
    setModalAddTache(null); setEditTache(null); setFormTache({nom:'',frequence:'quotidien',description:''}); charger(); showToast('Tâche modifiée !')
  }

  const ajouterZoneNett = async () => {
    if (!formZoneNett.nom) { showToast('Saisissez un nom','err'); return }
    const {error} = await supabase.from('haccp_zones_nettoyage').insert({nom:formZoneNett.nom, description:formZoneNett.description||null, etablissement_id:etabId})
    if (error) { showToast('Erreur: '+error.message,'err'); return }
    setModalAddZoneNett(false); setFormZoneNett({nom:'',description:''}); charger(); showToast('Zone ajoutée !')
  }

  const ajouterTache = async () => {
    if (!formTache.nom || !modalAddTache) { showToast('Saisissez un nom','err'); return }
    const {error} = await supabase.from('haccp_taches_nettoyage').insert({nom:formTache.nom, frequence:formTache.frequence, zone_id:modalAddTache, etablissement_id:etabId})
    if (error) { showToast('Erreur: '+error.message,'err'); return }
    setModalAddTache(null); setFormTache({nom:'',frequence:'quotidien',description:''}); charger(); showToast('Tâche ajoutée !')
  }

  const supprimerTache = (id) => {
    setModalConfirm({title:'Supprimer cette tâche ?',message:'L historique de validation sera aussi supprimé.',onConfirm:async()=>{ await supabase.from('haccp_tache_log').delete().eq('tache_id',id); await supabase.from('haccp_taches_nettoyage').delete().eq('id',id); charger(); showToast('Tache supprimee') }})
  }

  const supprimerZoneNett = (id) => {
    setModalConfirm({title:"Supprimer cette zone ?",message:"Toutes les taches et historique associes seront supprimes.",onConfirm:async()=>{ const tz=taches.filter(t=>t.zone_id===id); for(const t of tz){await supabase.from('haccp_tache_log').delete().eq('tache_id',t.id);await supabase.from('haccp_taches_nettoyage').delete().eq('id',t.id)} await supabase.from('haccp_zones_nettoyage').delete().eq('id',id); charger(); showToast('Zone supprimee') }})
  }

  const lotsFiltres = lots.filter(l=>!searchLot||l.numero_lot.toLowerCase().includes(searchLot.toLowerCase())||(l.produits?.nom||l.produit_nom||'').toLowerCase().includes(searchLot.toLowerCase()))
  const lotsRappeles = lots.filter(l=>l.rappele)
  const docsExpires = documents.filter(d=>estExpire(d.date_expiration))
  const docsBientot = documents.filter(d=>expireBientot(d.date_expiration))

  // Styles
  const card={background:'#fff',borderRadius:12,border:'0.5px solid #e2e0d8',padding:20}
  const btn={padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',border:'0.5px solid #d3d1c7',background:'#fff',color:'#5f5e5a',display:'inline-flex',alignItems:'center',gap:6}
  const btnP={...btn,background:'#534ab7',color:'#fff',border:'none'}
  const btnSm={...btn,padding:'6px 12px',fontSize:12}
  const btnSmP={...btnSm,background:'#534ab7',color:'#fff',border:'none'}
  const inp={width:'100%',padding:'10px 14px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:14,outline:'none',boxSizing:'border-box',background:'#fff'}
  const th={padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:500,color:'#888780',textTransform:'uppercase',borderBottom:'0.5px solid #e2e0d8',whiteSpace:'nowrap'}
  const td={padding:'9px 10px',borderBottom:'0.5px solid #f1efe8',verticalAlign:'middle',fontSize:13}
  const badge=(ok)=>({fontSize:10,padding:'2px 8px',borderRadius:8,fontWeight:500,background:ok?'#eaf3de':'#fcebeb',color:ok?'#27500a':'#a32d2d'})
  const ct={fontSize:13,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px'}
  const innerTab=(active)=>({...btnSm,background:active?'#eeedfe':'#fff',color:active?'#3c3489':'#5f5e5a',borderColor:active?'#afa9ec':'#d3d1c7'})

  const TABS=[
    {id:'etiquetage',label:'Étiquetage',icon:'ti-tag'},
    {id:'temperatures',label:"Temperatures",icon:'ti-thermometer'},
    {id:'nettoyage',label:'Nettoyage',icon:'ti-wash'},
    {id:'cuissons',label:'Cuissons',icon:'ti-flame'},
    {id:'tracabilite',label:"Tracabilite",icon:'ti-barcode'},
    {id:'reception',label:"Reception",icon:'ti-truck'},
    {id:'pms',label:'PMS',icon:'ti-file-text'},
    {id:'huiles',label:'Huiles de friture',icon:'ti-droplet'},
  ]

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'#888780',fontSize:14}}>Chargement…</div>

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"/>

      {/* Header simplifié — bouton retour si pas accueil */}
      {tab!=='accueil'&&(
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <button onClick={()=>setTab('accueil')} style={{...btnSm,padding:'6px 12px',color:'#534ab7',borderColor:'#afa9ec',background:'#eeedfe'}}>
            <i className="ti ti-arrow-left"/>Accueil HACCP
          </button>
          <div style={{fontSize:16,fontWeight:600,color:'#2c2c2a'}}>
            {TABS.find(t=>t.id===tab)?.label||'HACCP'}
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            {docsExpires.length>0&&<span style={{fontSize:12,background:'#fcebeb',color:'#a32d2d',padding:'4px 10px',borderRadius:8,fontWeight:500}}>{docsExpires.length} doc(s) expiré(s)</span>}
            {lotsRappeles.length>0&&<span onClick={()=>setTab('tracabilite')} style={{fontSize:12,background:'#fcebeb',color:'#a32d2d',padding:'4px 10px',borderRadius:8,fontWeight:500,cursor:'pointer'}}>{lotsRappeles.length} lot(s) rappelé(s)</span>}
          </div>
        </div>
      )}

      {/* Barre de navigation sections (cachée sur accueil) */}
      {tab!=='accueil'&&(
        <div style={{display:'flex',gap:4,marginBottom:16,flexWrap:'wrap',
          background:'#fff',borderRadius:12,padding:'6px',border:'0.5px solid #e2e0d8',
          boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{...btn,
                background:tab===t.id?'#534ab7':'transparent',
                color:tab===t.id?'#fff':'#5f5e5a',
                borderColor:'transparent',
                fontSize:12,padding:'6px 12px',
                borderRadius:8,
                boxShadow:tab===t.id?'0 1px 4px rgba(83,74,183,0.3)':'none'}}>
              <i className={'ti '+t.icon}/>{t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── PAGE ACCUEIL HACCP ── */}
      {tab==='accueil' && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          {/* Hero header */}
          <div style={{background:'linear-gradient(135deg,#534ab7 0%,#3c3489 100%)',borderRadius:16,padding:'24px 28px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
            <div>
              <div style={{fontSize:22,fontWeight:700,marginBottom:4,display:'flex',alignItems:'center',gap:10}}>
                <i className="ti ti-shield-check" style={{fontSize:26}}/>
                Module HACCP
              </div>
              <div style={{fontSize:13,opacity:0.8}}>{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
              <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
                {equipements.filter(eq=>getStatutEquipement(eq).statut==='fait').length>0&&(
                  <span style={{background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'4px 12px',fontSize:12,fontWeight:500}}>
                    ✓ {equipements.filter(eq=>getStatutEquipement(eq).statut==='fait').length} temp. relevée(s)
                  </span>
                )}
                {taches.filter(t=>tacheStatut(t)==='fait').length>0&&(
                  <span style={{background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'4px 12px',fontSize:12,fontWeight:500}}>
                    ✓ {taches.filter(t=>tacheStatut(t)==='fait').length} tâche(s) validée(s)
                  </span>
                )}
                {cuissons.length>0&&(
                  <span style={{background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'4px 12px',fontSize:12,fontWeight:500}}>
                    ✓ {cuissons.length} cuisson(s) du jour
                  </span>
                )}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              {(()=>{
                const nbProblemes = 
                  equipements.filter(eq=>['urgent','retard'].includes(getStatutEquipement(eq).statut)).length +
                  taches.filter(t=>['urgent','retard'].includes(tacheStatut(t))).length +
                  lotsRappeles.length + docsExpires.length
                const alertes = [
                  ...equipements.filter(eq=>getStatutEquipement(eq).statut==='urgent').map(eq=>({label:eq.nom,msg:'Non relevé hier',color:'#c53030',tab:'temperatures'})),
                  ...equipements.filter(eq=>getStatutEquipement(eq).statut==='retard').map(eq=>({label:eq.nom,msg:'Relevé en retard',color:'#a32d2d',tab:'temperatures'})),
                  ...taches.filter(t=>tacheStatut(t)==='retard').map(t=>({label:t.nom,msg:'Tache en retard',color:'#a32d2d',tab:'nettoyage'})),
                  ...lotsRappeles.map(l=>({label:l.numero_lot,msg:'Lot rappele',color:'#c53030',tab:'tracabilite'})),
                  ...docsExpires.map(d=>({label:d.nom,msg:'Document expire',color:'#854f0b',tab:'pms'})),
                ]
                return nbProblemes === 0 ? (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <i className="ti ti-check" style={{fontSize:28,color:'#fff'}}/>
                    </div>
                    <div style={{fontSize:12,opacity:0.9}}>Tout est conforme</div>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(255,100,100,0.3)',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid rgba(255,255,255,0.5)'}}>
                        <span style={{fontSize:24,fontWeight:700}}>{nbProblemes}</span>
                      </div>
                      <div style={{fontSize:12,opacity:0.9}}>alerte(s)</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:4,maxWidth:200}}>
                      {alertes.slice(0,3).map((a,i)=>(
                        <div key={i} onClick={()=>setTab(a.tab)}
                          style={{background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'4px 10px',fontSize:11,cursor:'pointer',display:'flex',gap:6,alignItems:'center'}}>
                          <i className="ti ti-alert-circle" style={{fontSize:10,color:'#ffc9c9'}}/>
                          <span style={{fontWeight:500}}>{a.label}</span>
                          <span style={{opacity:0.7}}>— {a.msg}</span>
                        </div>
                      ))}
                      {alertes.length>3&&<div style={{fontSize:10,opacity:0.7,textAlign:'right'}}>+{alertes.length-3} autres...</div>}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Alertes actives */}
          {(lotsRappeles.length>0||docsExpires.length>0)&&(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {lotsRappeles.length>0&&(
                <div onClick={()=>setTab('tracabilite')} style={{background:'#fff0f0',border:'1.5px solid #e53e3e',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',boxShadow:'0 2px 8px rgba(229,62,62,0.15)'}}>
                  <div style={{width:36,height:36,borderRadius:10,background:'#e53e3e',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <i className="ti ti-alert-triangle" style={{color:'#fff',fontSize:18}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#c53030'}}>RAPPEL DE LOT EN COURS</div>
                    <div style={{fontSize:12,color:'#791f1f',marginTop:1}}>{lotsRappeles.map(l=>l.numero_lot+' ('+(l.produits?.nom||l.produit_nom||'')+')').join(' • ')}</div>
                  </div>
                  <i className="ti ti-chevron-right" style={{color:'#c53030'}}/>
                </div>
              )}
              {docsExpires.length>0&&(
                <div onClick={()=>setTab('pms')} style={{background:'#fffbf0',border:'1.5px solid #fac775',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                  <div style={{width:36,height:36,borderRadius:10,background:'#fac775',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <i className="ti ti-file-alert" style={{color:'#fff',fontSize:18}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#854f0b'}}>{docsExpires.length} document(s) expiré(s)</div>
                  </div>
                  <i className="ti ti-chevron-right" style={{color:'#854f0b'}}/>
                </div>
              )}
            </div>
          )}

          {/* Grille des sections */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
            {(()=>{
              // Calcul statuts pour chaque section
              const tempUrgents = equipements.filter(eq=>getStatutEquipement(eq).statut==='urgent').length
              const tempRetards = equipements.filter(eq=>getStatutEquipement(eq).statut==='retard').length
              const tempAfaire  = equipements.filter(eq=>getStatutEquipement(eq).statut==='afaire').length
              const tempFaits   = equipements.filter(eq=>getStatutEquipement(eq).statut==='fait').length

              const nettRetard = taches.filter(t=>tacheStatut(t)==='retard').length
              const nettAfaire = taches.filter(t=>tacheStatut(t)==='afaire').length
              const nettFaits  = taches.filter(t=>tacheStatut(t)==='fait').length

              const sections = [
                {id:"etiquetage", label:"Etiquetage", icon:"ti-tag",
                  desc:"Impression d etiquettes DLC et gestion des modeles",
                  statut:"ok",
                  info: (()=>{ const today=new Date().toISOString().split("T")[0]; return etiquettes.filter(e=>e.created_at&&e.created_at.startsWith(today)).length })()+" etiquette(s) imprimee(s) aujourd hui",
                  couleur:{bg:"#fff",border:"#e2e0d8",ic:"#eeedfe",icC:"#534ab7"}},
                {id:"temperatures", label:"Temperatures", icon:"ti-thermometer",
                  desc:"Releves des equipements froids et chauds",
                  statut: tempUrgents>0?"urgent": tempRetards>0?"retard": tempAfaire>0?"afaire":"ok",
                  info: tempUrgents>0?tempUrgents+" equipement(s) non releve(s) hier"
                      : tempRetards>0?tempRetards+" releve(s) en retard"
                      : tempAfaire>0?tempAfaire+" releve(s) a effectuer"
                      : tempFaits+" equipement(s) a jour",
                  couleur: tempUrgents>0?{bg:"#fff0f0",border:"#e53e3e",ic:"#fed7d7",icC:"#c53030"}
                         : tempRetards>0?{bg:"#fff5f5",border:"#f09595",ic:"#fcebeb",icC:"#a32d2d"}
                         : tempAfaire>0?{bg:"#fffbf0",border:"#fac775",ic:"#faeeda",icC:"#854f0b"}
                         : {bg:"#f6fdf0",border:"#97c459",ic:"#eaf3de",icC:"#27500a"}},
                {id:"nettoyage", label:"Nettoyage", icon:"ti-wash",
                  desc:"Zones et taches de nettoyage planifiees",
                  statut: nettRetard>0?"retard": nettAfaire>0?"afaire":"ok",
                  info: nettRetard>0?nettRetard+" tache(s) en retard"
                      : nettAfaire>0?nettAfaire+" tache(s) a valider"
                      : nettFaits+" tache(s) validee(s)",
                  couleur: nettRetard>0?{bg:"#fff5f5",border:"#f09595",ic:"#fcebeb",icC:"#a32d2d"}
                         : nettAfaire>0?{bg:"#fffbf0",border:"#fac775",ic:"#faeeda",icC:"#854f0b"}
                         : {bg:"#f6fdf0",border:"#97c459",ic:"#eaf3de",icC:"#27500a"}},
                {id:"cuissons", label:"Cuissons", icon:"ti-flame",
                  desc:"Temperatures a coeur, refroidissements et remises",
                  statut: refroidTimers.length>0?"afaire":"ok",
                  info: refroidTimers.length>0?refroidTimers.length+" refroidissement(s) en cours"
                      : cuissons.length+" releve(s) enregistre(s)",
                  couleur: refroidTimers.length>0?{bg:"#fffbf0",border:"#fac775",ic:"#faeeda",icC:"#854f0b"}
                         : {bg:"#fff",border:"#e2e0d8",ic:"#eeedfe",icC:"#534ab7"}},
                {id:"tracabilite", label:"Tracabilite", icon:"ti-barcode",
                  desc:"Lots, numeros et rappels de produits",
                  statut: lotsRappeles.length>0?"urgent":"ok",
                  info: lotsRappeles.length>0?"🚨 "+lotsRappeles.length+" lot(s) rappele(s) !"
                      : lots.length+" lot(s) enregistre(s)",
                  couleur: lotsRappeles.length>0?{bg:"#fff0f0",border:"#e53e3e",ic:"#fed7d7",icC:"#c53030"}
                         : {bg:"#fff",border:"#e2e0d8",ic:"#eeedfe",icC:"#534ab7"}},
                {id:"reception", label:"Reception", icon:"ti-truck",
                  desc:"Controles de conformite a la livraison",
                  statut:"ok",
                  info: receptions.length+" reception(s) enregistree(s)",
                  couleur:{bg:"#fff",border:"#e2e0d8",ic:"#eeedfe",icC:"#534ab7"}},
                {id:"pms", label:"PMS / Documents", icon:"ti-file-text",
                  desc:"Plans de maitrise sanitaire et documents",
                  statut: docsExpires.length>0?"retard":"ok",
                  info: docsExpires.length>0?docsExpires.length+" document(s) expire(s)"
                      : documents.length+" document(s) actif(s)",
                  couleur: docsExpires.length>0?{bg:"#fffbf0",border:"#fac775",ic:"#faeeda",icC:"#854f0b"}
                         : {bg:"#fff",border:"#e2e0d8",ic:"#eeedfe",icC:"#534ab7"}},
                {id:"huiles", label:"Huiles de friture", icon:"ti-droplet",
                  desc:"Controle TGP et suivi des changements d huile",
                  statut: huiles.some(h=>!h.tgp_ok)?"retard":"ok",
                  info: huiles.some(h=>!h.tgp_ok)?"Non-conformite huile detectee"
                      : huiles.length+" enregistrement(s)",
                  couleur: huiles.some(h=>!h.tgp_ok)?{bg:"#fffbf0",border:"#fac775",ic:"#faeeda",icC:"#854f0b"}
                         : {bg:"#fff",border:"#e2e0d8",ic:"#eeedfe",icC:"#534ab7"}},
              ]
              const statutIcon = {ok:'ti-check',afaire:'ti-clock',retard:'ti-alert-triangle',urgent:'ti-alert-circle'}
              const statutLabel = {ok:'À jour',afaire:'À faire',retard:'En retard',urgent:'Urgent'}
              const statutColor = {ok:'#27500a',afaire:'#854f0b',retard:'#a32d2d',urgent:'#c53030'}
              const statutBg    = {ok:'#eaf3de',afaire:'#faeeda',retard:'#fcebeb',urgent:'#fed7d7'}

              return sections.map(s=>(
                <div key={s.id} onClick={()=>setTab(s.id)}
                  style={{background:s.couleur.bg,border:`1.5px solid ${s.couleur.border}`,borderRadius:16,padding:0,cursor:'pointer',
                    display:'flex',flexDirection:'column',overflow:'hidden',
                    boxShadow:s.statut==='ok'?'0 1px 4px rgba(0,0,0,0.05)':'0 2px 8px rgba(0,0,0,0.08)'}}>
                  {/* Bande couleur en haut */}
                  <div style={{height:4,background:s.couleur.border,width:'100%'}}/>
                  <div style={{padding:18,display:'flex',flexDirection:'column',gap:14,flex:1}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                      <div style={{width:48,height:48,borderRadius:14,background:s.couleur.ic,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}>
                        <i className={'ti '+s.icon} style={{fontSize:24,color:s.couleur.icC}}/>
                      </div>
                      <span style={{fontSize:10,padding:'4px 10px',borderRadius:20,fontWeight:700,letterSpacing:'0.3px',textTransform:'uppercase',
                        background:statutBg[s.statut],color:statutColor[s.statut],
                        display:'flex',alignItems:'center',gap:3}}>
                        <i className={'ti '+statutIcon[s.statut]} style={{fontSize:9}}/>
                        {statutLabel[s.statut]}
                      </span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#2c2c2a',marginBottom:4}}>{s.label}</div>
                      <div style={{fontSize:12,color:'#888780',lineHeight:1.5}}>{s.desc}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:`0.5px solid ${s.couleur.border}`}}>
                      <span style={{fontSize:11,color:statutColor[s.statut],fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
                        <i className={'ti '+statutIcon[s.statut]} style={{fontSize:11}}/>
                        {s.info}
                      </span>
                      <div style={{width:26,height:26,borderRadius:8,background:s.couleur.ic,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <i className="ti ti-chevron-right" style={{color:s.couleur.icC,fontSize:13}}/>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* ── ÉTIQUETAGE ── */}
      {tab==='etiquetage' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Colonne gauche */}
            <div style={{display:'flex',flexDirection:'column',gap:16}}>

              {/* Infos étiquette */}
              <div style={card}>
                <div style={{...ct,marginBottom:14}}>Informations de l'étiquette</div>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Produit / Préparation *</div>
                    <input value={formEtiq.produit_nom} onChange={e=>{
                        const val=e.target.value
                        const modele=etiqModeles.find(m=>m.nom===val)
                        if(modele) setFormEtiq(prev=>({...prev,produit_nom:val,jours_dlc:modele.dlc_jours,dlc_libre:''}))
                        else setFormEtiq(prev=>({...prev,produit_nom:val}))
                      }}
                      placeholder="Tapez un nom ou choisissez une recette/produit…" style={inp}
                      list="etiq-suggestions"/>
                    <datalist id="etiq-suggestions">
                      {etiqModeles.map(m=><option key={'m'+m.id} value={m.nom}/>)}
                      {recettes.map(r=><option key={'r'+r.id} value={r.nom}/>)}
                      {produits.map(p=><option key={'p'+p.id} value={p.nom}/>)}
                    </datalist>
                    <div style={{fontSize:11,color:'#888780',marginTop:3}}>Saisie libre ou sélection depuis vos recettes et produits mercuriale</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div>
                      <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Date de fabrication</div>
                      <input type="date" value={formEtiq.date_fabrication} onChange={e=>setFormEtiq({...formEtiq,date_fabrication:e.target.value})} style={inp}/>
                    </div>
                    <div>
                      <div style={{fontSize:12,color:'#888780',marginBottom:5}}>DLC calculée</div>
                      <input type="date" value={dlcDate(formEtiq.date_fabrication,formEtiq.jours_dlc)} readOnly style={{...inp,background:'#f8f7f4',color:'#a32d2d',fontWeight:500}}/>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:8}}>DLC rapide</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {[1,3,5,7,14,30].map(j=>(
                        <button key={j} onClick={()=>setFormEtiq({...formEtiq,jours_dlc:j})}
                          style={{...btnSm,background:formEtiq.jours_dlc===j?'#eeedfe':'#fff',borderColor:formEtiq.jours_dlc===j?'#afa9ec':'#d3d1c7',color:formEtiq.jours_dlc===j?'#3c3489':'#5f5e5a',fontWeight:formEtiq.jours_dlc===j?600:400}}>
                          J+{j}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Ou DLC en saisie libre</div>
                    <input type="date" value={formEtiq.dlc_libre} onChange={e=>setFormEtiq({...formEtiq,dlc_libre:e.target.value,jours_dlc:0})}
                      style={inp} placeholder="Choisir une date précise"/>
                    {formEtiq.dlc_libre&&<div style={{fontSize:11,color:'#888780',marginTop:3}}>Date libre active — les boutons J+ sont ignorés</div>}
                  </div>

                </div>
              </div>

              {/* Format + exemplaires */}
              <div style={card}>
                <div style={{...ct,marginBottom:12}}>Format d'étiquette</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:14}}>
                  {FORMATS_ETIQ.map(f=>(
                    <div key={f.id} onClick={()=>setFormEtiq({...formEtiq,format_id:f.id})}
                      style={{border:`0.5px solid ${formEtiq.format_id===f.id?'#534ab7':'#e2e0d8'}`,borderRadius:10,padding:12,cursor:'pointer',textAlign:'center',background:formEtiq.format_id===f.id?'#eeedfe':'#fff'}}>
                      <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a',marginBottom:4}}>{f.nom}</div>
                      <div style={{fontSize:11,color:'#888780'}}>{f.dim}</div>
                      <div style={{fontSize:10,color:'#534ab7',background:'#eeedfe',padding:'1px 6px',borderRadius:6,marginTop:6,display:'inline-block'}}>{f.imprimante}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Lier à un lot <span style={{fontWeight:400,fontSize:11}}>(optionnel — affiche le n° sur l'étiquette)</span></div>
                  <select value={formEtiq.lot_id||''} onChange={e=>{
                    const lot=lots.find(l=>l.id===e.target.value)
                    const recetteNom=lot?.recettes?.nom||''
                    setFormEtiq({...formEtiq,lot_id:e.target.value,lot_numero:lot?lot.numero_lot:'',lot_recette:recetteNom})
                    // Charger les ingrédients via recette_id du lot
                    const rid = lot?.recette_id || null
                    if(rid) {
                      supabase.from('recette_ingredients')
                        .select('*,produits!recette_ingredients_produit_id_fkey(id,nom,allergenes)')
                        .eq('recette_id',rid)
                        .order('poids',{ascending:false})
                        .then(async ({data,error})=>{
                          console.log('ingredients loaded:', data, error)
                          const normalized = await Promise.all((data||[]).map(async (ing) => {
                            if (ing.produits) return ing
                            // Sous-recette : récupérer nom + allergènes via recette_id_lie
                            const srId = ing.recette_id_lie || ing.sous_recette_id
                            if (!srId) return ing
                            const {data:srData} = await supabase.from('recettes').select('id,nom').eq('id',srId).single()
                            const {data:srIngs} = await supabase.from('recette_ingredients')
                              .select('produits!recette_ingredients_produit_id_fkey(allergenes)')
                              .eq('recette_id', srId)
                            const allergenesAuto = (srIngs||[]).flatMap(si=>si.produits?.allergenes||[])
                            // Charger aussi les allergènes manuels de la recette elle-même
                            const {data:srRecette} = await supabase.from('recettes').select('allergenes,allergenes_manuels').eq('id',srId).single()
                            const allergenesManuels = srRecette?.allergenes_manuels||[]
                            // Convertir les IDs manuels ("a5") en noms ("Arachides") pour cohérence
                            const ALERG_MAP = {a1:'Gluten',a2:'Crustaces',a3:'Oeufs',a4:'Poissons',a5:'Arachides',a6:'Soja',a7:'Lait',a8:'Fruits a coque',a9:'Celeri',a10:'Moutarde',a11:'Sesame',a12:'Sulfites',a13:'Lupin',a14:'Mollusques'}
                            const allergenesManuelsNoms = allergenesManuels.map(id=>ALERG_MAP[id]||id).filter(Boolean)
                            const allergenes = [...new Set([...allergenesAuto, ...allergenesManuelsNoms])]
                            return {...ing, produits:{id:srId, nom:srData?.nom||'Sous-recette', allergenes}}
                          }))
                          setEtiqIngredients(normalized)
                        })
                    } else {
                      setEtiqIngredients([])
                    }
                  }} style={inp}>
                    <option value="">Aucun lot</option>
                    {lots.slice(0,50).map(l=>(
                      <option key={l.id} value={l.id}>{l.numero_lot}{l.recettes?.nom?' — Production: '+l.recettes.nom:l.produit_nom?' — '+l.produit_nom:''}</option>
                    ))}
                  </select>
                  {formEtiq.lot_id&&<div style={{fontSize:11,color:'#534ab7',marginTop:3,lineHeight:1.6}}>
                    N° lot : <strong>{formEtiq.lot_numero}</strong>{formEtiq.lot_recette?' — '+formEtiq.lot_recette:''}
                  </div>}
                {formEtiq.lot_id&&formEtiq.lot_recette===''&&<div style={{fontSize:11,color:'#b4b2a9',marginTop:4}}>Ce lot n'est pas lié à une production — pas d'ingrédients disponibles</div>}
                {formEtiq.lot_id&&etiqIngredients.length>0&&(
                  <div style={{marginTop:8}}>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'#2c2c2a'}}>
                      <input type="checkbox" checked={formEtiq.afficher_ingredients||false}
                        onChange={e=>setFormEtiq({...formEtiq,afficher_ingredients:e.target.checked})}
                        style={{width:16,height:16,cursor:'pointer'}}/>
                      Afficher les ingrédients (allergènes en GRAS MAJUSCULES)
                    </label>
                    {formEtiq.afficher_ingredients&&(
                      <div style={{marginTop:6,background:'#f8f7f4',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#5f5e5a',lineHeight:1.6}}>
                        {[...etiqIngredients].sort((a,b)=>(parseFloat(b.poids)||0)-(parseFloat(a.poids)||0)).map((ing,i)=>{
                          const isAlerg = (ing.produits?.allergenes||[]).length>0
                          return <span key={i}>
                            {i>0&&', '}
                            <span style={{fontWeight:isAlerg?700:400,color:'#2c2c2a',textTransform:isAlerg?'uppercase':'none'}}>
                              {ing.produits?.nom||''}
                            </span>
                          </span>
                        })}
                      </div>
                    )}
                  </div>
                )}
                </div>
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Poids <span style={{fontWeight:400,fontSize:11}}>(optionnel)</span></div>
                  <div style={{display:'flex',gap:8}}>
                    <input type="number" step="0.001" value={formEtiq.poids||''} onChange={e=>setFormEtiq({...formEtiq,poids:e.target.value})}
                      placeholder="Ex: 250" style={{...inp,flex:2}}/>
                    <select value={formEtiq.unite_poids||'g'} onChange={e=>setFormEtiq({...formEtiq,unite_poids:e.target.value})}
                      style={{...inp,flex:1,padding:'8px 6px'}}>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="cl">cl</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                      <option value="portions">portions</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:8}}>Nombre d'exemplaires</div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <button onClick={()=>setFormEtiq({...formEtiq,nb_exemplaires:Math.max(1,(formEtiq.nb_exemplaires||1)-1)})}
                      style={{width:34,height:34,borderRadius:'50%',border:'0.5px solid #d3d1c7',background:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#2c2c2a'}}>−</button>
                    <span style={{fontSize:20,fontWeight:500,color:'#2c2c2a',minWidth:30,textAlign:'center'}}>{formEtiq.nb_exemplaires||1}</span>
                    <button onClick={()=>setFormEtiq({...formEtiq,nb_exemplaires:(formEtiq.nb_exemplaires||1)+1})}
                      style={{width:34,height:34,borderRadius:'50%',border:'0.5px solid #d3d1c7',background:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#2c2c2a'}}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite — aperçu */}
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{...card,display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
                <div style={ct}>Aperçu de l'étiquette</div>
                {(()=>{
                  const fmt_ = FORMATS_ETIQ.find(f=>f.id===formEtiq.format_id)||FORMATS_ETIQ[0]
                  const dm = (fmt_.dim||'').match(/([0-9.]+)[xX]([0-9.]+)/) || (fmt_.dim||'').match(/([0-9.]+).([0-9.]+)/)
                  const wMm = dm?parseFloat(dm[1]):62
                  const hMm = dm?parseFloat(dm[2]):29
                  const isLand = fmt_.orient==='landscape'
                  const docW = isLand?Math.max(wMm,hMm):wMm
                  const docH = isLand?Math.min(wMm,hMm):hMm
                  const maxW=260, maxH=180
                  const sc = Math.min(maxW/docW, maxH/docH)
                  const pxW = Math.round(docW*sc)
                  const pxH = Math.round(docH*sc)
                  const headerPx = Math.round(pxH*0.28)
                  const footerPx = Math.max(5, Math.round(pxH*0.06))
                  const bodyPx = pxH - headerPx - footerPx
                  const lBase = Math.max(2.5, Math.min(5, docH*0.07))*sc
                  const dBase = Math.max(4, Math.min(9, docH*0.13))*sc
                  const dlcBase = Math.max(6, Math.min(18, docH*0.20))*sc
                  const pBase = Math.max(5, Math.min(14, docH*0.16))*sc
                  const gBase = Math.max(1.5, Math.min(4, docH*0.04))*sc
                  const hasPoids = !!(formEtiq.poids&&formEtiq.poids!=='')
                  const hasLot = !!formEtiq.lot_numero
                  const ingListPrev = (formEtiq.afficher_ingredients&&etiqIngredients.length>0) ? [...etiqIngredients].sort((a,b)=>(parseFloat(b.poids)||0)-(parseFloat(a.poids)||0)) : []
                  const ingPx = Math.max(6, Math.min(10, pxH*0.045))
                  const hasIng = ingListPrev.length>0
                  const ingMmBase = Math.max(4.0, Math.min(6.2, docH*0.068))
                  const ingPxBase = Math.max(8, Math.min(14, pxH*0.068))
                  const neededSansIng = lBase+dBase*1.2 + gBase + lBase+dlcBase*1.2 + (hasPoids?gBase*2+lBase+pBase*1.2:0) + (hasLot?gBase*2+lBase+dBase*1.2:0)
                  const needed = neededSansIng + (hasIng?gBase*2+lBase*0.85+ingPxBase*1.6*2:0)
                  const asc = Math.min(0.95, (bodyPx*0.82)/needed)
                  const espacePourIngPx = Math.max(0, bodyPx*0.82 - neededSansIng*asc - (hasIng?gBase*asc*2+lBase*asc*0.85:0))
                  const padPx = Math.max(2, Math.round(pxW*0.04))
                  const nbLignesEstPx = Math.max(1, Math.ceil((ingListPrev.length||1) / Math.max(1, Math.floor((pxW-padPx*2) / (ingPxBase*asc*3.5)))))
                  const ingPxAuto = hasIng ? Math.min(ingPxBase*asc, Math.max(6, espacePourIngPx/(nbLignesEstPx*1.8))) : ingPxBase*asc
                  const lPx = lBase*asc
                  const dPx = dBase*asc
                  const dlcPx = dlcBase*asc
                  const pPx = pBase*asc
                  const gPx = gBase*asc
                  const pH = Math.max(2, Math.round(pxW*0.04))
                  const prodNom = formEtiq.produit_nom||'Nom du produit'
                  const dlcPrev = fmt(formEtiq.dlc_libre||dlcDate(formEtiq.date_fabrication,formEtiq.jours_dlc))
                  return (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,width:'100%'}}>
                      <div style={{fontSize:11,color:'#888780'}}>{fmt_.nom} — {fmt_.dim}</div>
                      <div style={{width:pxW,height:pxH,display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:'Arial,Helvetica,sans-serif',border:'1.5px solid #2c2c2a',boxShadow:'0 4px 16px rgba(0,0,0,0.15)',flexShrink:0}}>
                        <div style={{background:'#2c2c2a',height:headerPx,display:'flex',alignItems:'center',justifyContent:'center',padding:'2px '+pH+'px',flexShrink:0}}>
                          <div style={{color:'#fff',fontWeight:900,fontSize:Math.min(14*sc,Math.max(5*sc,(docW*sc)/(Math.max(prodNom.length*0.6,4)))),textTransform:'uppercase',textAlign:'center',lineHeight:1.1,wordBreak:'break-word'}}>{prodNom}</div>
                        </div>
                        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',padding:'2px '+pH+'px',gap:gPx,background:'#fff',overflow:'hidden'}}>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,width:'100%'}}>
                            <span style={{fontSize:lPx,fontWeight:700,color:'#888',textTransform:'uppercase'}}>FABRIQUE LE</span>
                            <span style={{fontSize:dPx,fontWeight:700,color:'#1a1a1a'}}>{fmt(formEtiq.date_fabrication)}</span>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,width:'100%'}}>
                            <span style={{fontSize:lPx,fontWeight:700,color:'#888',textTransform:'uppercase'}}>DLC</span>
                            <span style={{fontSize:dlcPx,fontWeight:900,color:'#cc2222'}}>{dlcPrev}</span>
                          </div>
                          {hasPoids&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,borderTop:'1px solid #aaa',paddingTop:Math.max(2,gPx),width:'100%'}}>
                            <span style={{fontSize:lPx,fontWeight:700,color:'#888',textTransform:'uppercase'}}>POIDS NET</span>
                            <span style={{fontSize:pPx,fontWeight:900,color:'#1a1a1a'}}>{formEtiq.poids} {formEtiq.unite_poids||'g'}</span>
                          </div>}
                          {hasLot&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,borderTop:'1px solid #aaa',paddingTop:Math.max(2,gPx),width:'100%'}}>
                            <span style={{fontSize:lPx,fontWeight:700,color:'#888',textTransform:'uppercase'}}>LOT</span>
                            <span style={{fontSize:dPx,fontWeight:700,color:'#534ab7'}}>{formEtiq.lot_numero}</span>
                          </div>}
                          {hasIng&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,borderTop:'1px solid #aaa',paddingTop:Math.max(2,gPx),width:'100%'}}>
                            <span style={{fontSize:lPx*0.85,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.3px'}}>INGREDIENTS</span>
                            <div style={{fontSize:ingPxAuto,lineHeight:1.3,textAlign:'center',color:'#2c2c2a',padding:'0 2px',wordBreak:'break-word'}}>
                              {ingListPrev.filter(ing=>ing.produits&&(ing.produits.nom||'').trim()!=='').map((ing,i)=>{
                                const nm=(ing.produits?.nom||'').trim()
                                const isAlerg=(ing.produits?.allergenes||[]).length>0
                                const nmDisp=isAlerg?nm.toUpperCase():nm.charAt(0).toUpperCase()+nm.slice(1).toLowerCase()
                                return <span key={i}>{i>0&&<span style={{fontWeight:400}}>, </span>}<span style={{fontWeight:isAlerg?700:400}}>{nmDisp}</span></span>
                              })}
                            </div>
                          </div>}
                        </div>
                        <div style={{height:footerPx,background:'#f5f5f5',borderTop:'0.5px solid #ddd',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 '+pH+'px',flexShrink:0}}>
                          <span style={{fontSize:Math.max(8,footerPx*0.38),color:'#222',fontWeight:700}}>{userConnecte||''}</span>
                          <span style={{fontSize:Math.max(8,footerPx*0.38),color:'#888'}}>{fmt_.dim}</span>
                        </div>
                      </div>
                      <div style={{fontSize:10,color:'#b4b2a9'}}>{fmt_.imprimante}</div>
                    </div>
                  )
                })()}
                <div style={{display:'flex',flexDirection:'column',gap:8,width:'100%'}}>
                  <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setModalListModeles(true)} style={{...btn,flex:1,justifyContent:'center',borderColor:'#afa9ec',background:'#eeedfe',color:'#3c3489'}}>
                    <i className="ti ti-bookmark"/> Mes étiquettes ({etiqModeles.length})
                  </button>
                  <button onClick={()=>setModalAddModele(true)} style={{...btn,padding:'8px 10px',borderColor:'#afa9ec',background:'#eeedfe',color:'#3c3489'}}>
                    <i className="ti ti-plus"/>
                  </button>
                </div>
                <button onClick={imprimerEtiquette} style={{...btnP,padding:12,justifyContent:'center'}}>
                    <i className="ti ti-printer"/> Imprimer l'étiquette {(formEtiq.nb_exemplaires||1)>1?'('+formEtiq.nb_exemplaires+'x)':''}
                  </button>
                </div>
              </div>
              <div style={{...card,background:'#eeedfe',borderColor:'#afa9ec'}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <i className="ti ti-info-circle" style={{fontSize:16,color:'#534ab7',marginTop:1}}/>
                  <div style={{fontSize:12,color:'#3c3489',lineHeight:1.6}}>
                    <strong>Impression WiFi</strong> : compatible Brother QL, Zebra ZD, Dymo LabelWriter connectés au réseau.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des impressions */}
          <div style={card}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={ct}>Historique des impressions</div>
              <span style={{fontSize:11,color:'#3c3489',background:'#eeedfe',padding:'2px 10px',borderRadius:10,fontWeight:400}}>7 derniers jours</span>
            </div>
            {etiquettes.length===0&&<div style={{color:'#b4b2a9',fontSize:13,textAlign:'center',padding:20}}>Aucune étiquette imprimée</div>}
            {etiquettes.length>0&&(
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr>
                    {['Produit','Fabrication','DLC','Équipe','Format','Nb','Imprimé le'].map(h=><th key={h} style={th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {etiquettes.map(e=>(
                      <tr key={e.id}>
                        <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{e.produit_nom}</td>
                        <td style={{...td,color:'#888780'}}>{fmt(e.date_fabrication)}</td>
                        <td style={{...td,color:'#a32d2d',fontWeight:500}}>{fmt(e.date_dlc)}</td>
                        <td style={{...td,color:'#5f5e5a'}}>{e.responsable||'—'}</td>
                        <td style={{...td,color:'#888780'}}>{e.format_nom||'—'}</td>
                        <td style={{...td,textAlign:'center',fontWeight:500}}>{e.nb_exemplaires||1}</td>
                        <td style={{...td,color:'#888780',fontSize:12}}>{e.created_at?new Date(e.created_at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab==='temperatures' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[{id:'releves',label:"Releves du jour",icon:'ti-thermometer'},{id:'historique',label:'Historique',icon:'ti-history'},{id:'config',label:'Configurer',icon:'ti-settings'}].map(t=>(
              <button key={t.id} onClick={()=>setTempTab(t.id)} style={innerTab(tempTab===t.id)}>
                <i className={'ti '+t.icon}/>{t.label}
              </button>
            ))}
          </div>

          {/* Alertes relevés manquants */}
          {tempTab==='releves' && (()=>{
            const urgents = equipements.filter(eq=>getStatutEquipement(eq).statut==='urgent')
            const retards = equipements.filter(eq=>getStatutEquipement(eq).statut==='retard')
            const afaire = equipements.filter(eq=>getStatutEquipement(eq).statut==='afaire')
            return (
              <>
                {urgents.length>0&&(
                  <div style={{background:'#fed7d7',border:'1.5px solid #e53e3e',borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
                    <i className="ti ti-alert-circle" style={{color:'#c53030',fontSize:20,flexShrink:0}}/>
                    <div style={{fontSize:13,color:'#c53030',fontWeight:500}}>
                      🚨 <strong>{urgents.length} équipement(s) non relevé(s) hier</strong> : {urgents.map(e=>e.nom).join(', ')}
                    </div>
                  </div>
                )}
                {retards.length>0&&(
                  <div style={{background:'#fcebeb',border:'0.5px solid #f09595',borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
                    <i className="ti ti-alert-triangle" style={{color:'#a32d2d',fontSize:18,flexShrink:0}}/>
                    <div style={{fontSize:13,color:'#a32d2d'}}>
                      <strong>{retards.length} relevé(s) en retard</strong> : {retards.map(e=>e.nom).join(', ')}
                    </div>
                  </div>
                )}
                {afaire.length>0&&!urgents.length&&!retards.length&&(
                  <div style={{background:'#faeeda',border:'0.5px solid #fac775',borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
                    <i className="ti ti-clock" style={{color:'#854f0b',fontSize:18,flexShrink:0}}/>
                    <div style={{fontSize:13,color:'#854f0b'}}>
                      <strong>{afaire.length} relevé(s) à effectuer</strong> : {afaire.map(e=>e.nom).join(', ')}
                    </div>
                  </div>
                )}
              </>
            )
          })()}

          {tempTab==='releves' && (
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <div style={ct}>Équipements — {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
                <button onClick={()=>setTempTab('config')} style={{...btnSm,borderColor:'#534ab7',color:'#534ab7',background:'#eeedfe'}}>
                  <i className="ti ti-settings"/>Gérer les équipements
                </button>
              </div>
              {equipements.length===0
                ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun équipement — allez dans "Configurer"</div>
                : <div key={refreshKey} style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
                    {equipements.map(eq=>{
                      const info = getStatutEquipement(eq)
                      const col = couleurStatut(info.statut)
                      const typeIcon = eq.type==='froid'?'ti-snowflake':eq.type==='plonge'?'ti-droplet':eq.type==='sec'?'ti-box':'ti-flame'
                      const derReleve = relevesAujourdhui.filter(r=>r.equipement_id===eq.id).sort((a,b)=>new Date(b.releve_le)-new Date(a.releve_le))[0]
                      const conforme = derReleve ? (derReleve.temperature>=eq.temp_min&&derReleve.temperature<=eq.temp_max) : null
                      return (
                        <div key={eq.id} style={{border:`1.5px solid ${col.border}`,borderRadius:12,padding:16,background:col.bg}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                            <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a',flex:1}}>{eq.nom}</div>
                            <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:eq.type==='froid'?'#e6f1fb':eq.type==='plonge'?'#eeedfe':eq.type==='sec'?'#f1efe8':'#fcebeb',color:eq.type==='froid'?'#0c447c':eq.type==='plonge'?'#3c3489':eq.type==='sec'?'#5f5e5a':'#a32d2d',fontWeight:500}}>
                              <i className={'ti '+typeIcon} style={{marginRight:3}}/>{eq.type}
                            </span>
                          </div>
                          {/* Température dernière mesure */}
                          <div style={{fontSize:30,fontWeight:600,color:conforme===false?'#a32d2d':conforme===true?'#27500a':'#b4b2a9',margin:'6px 0'}}>
                            {derReleve?derReleve.temperature+'°C':'— °C'}
                          </div>
                          <div style={{fontSize:11,color:'#888780',marginBottom:6}}>Plage : {eq.temp_min}°C → {eq.temp_max}°C</div>
                          {derReleve&&<div style={{fontSize:11,color:'#888780',marginBottom:4}}>{derReleve.moment||''}{derReleve.releve_par?' — '+derReleve.releve_par:''}</div>}
                          {/* Badge statut planning */}
                          <div style={{marginBottom:10}}>
                            <span style={{fontSize:11,padding:'3px 10px',borderRadius:8,fontWeight:600,background:col.badge,color:col.badgeC,display:'inline-flex',alignItems:'center',gap:4}}>
                              {info.statut==='fait'&&<i className="ti ti-check" style={{fontSize:11}}/>}
                              {info.statut==='afaire'&&<i className="ti ti-clock" style={{fontSize:11}}/>}
                              {info.statut==='retard'&&<i className="ti ti-alert-triangle" style={{fontSize:11}}/>}
                              {info.statut==='urgent'&&<i className="ti ti-alert-circle" style={{fontSize:11}}/>}
                              {info.label}
                            </span>
                            {conforme===false&&<span style={{marginLeft:6,fontSize:10,padding:'2px 7px',borderRadius:8,background:'#fcebeb',color:'#a32d2d',fontWeight:500}}>Non conforme</span>}
                          </div>
                          <div style={{fontSize:10,color:'#888780',marginBottom:8}}>{eq.frequence||'Fréquence non définie'}</div>
                          <button onClick={()=>setModalTemp(eq)} style={{...btnSm,width:'100%',justifyContent:'center',
                            borderColor:info.statut==='fait'?'#97c459':info.statut==='urgent'?'#e53e3e':'#534ab7',
                            background:info.statut==='fait'?'#eaf3de':info.statut==='urgent'?'#fed7d7':'#eeedfe',
                            color:info.statut==='fait'?'#27500a':info.statut==='urgent'?'#c53030':'#3c3489'}}>
                            <i className="ti ti-thermometer"/>
                            {info.statut==='fait'?'Nouveau relevé':'Saisir le relevé'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}

          {tempTab==='historique' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <div style={ct}>Filtres</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <select value={historiqueEquipId} onChange={e=>setHistoriqueEquipId(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}>
                      <option value="">Tous les équipements</option>
                      {equipements.map(eq=><option key={eq.id} value={eq.id}>{eq.nom}</option>)}
                    </select>
                    <input type="date" value={historiqueDebut} onChange={e=>setHistoriqueDebut(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <span style={{fontSize:12,color:'#888780'}}>→</span>
                    <input type="date" value={historiqueFin} onChange={e=>setHistoriqueFin(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <button onClick={()=>{setHistoriqueDebut('');setHistoriqueFin('');setHistoriqueEquipId('')}} style={{...btnSm,color:'#888780'}}>Tout</button>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>{
                    const filtered = relevesTous.filter(r=>{
                      if(historiqueEquipId&&r.equipement_id!==historiqueEquipId) return false
                      if(historiqueDebut&&r.releve_le<historiqueDebut) return false
                      if(historiqueFin&&r.releve_le>historiqueFin+'T23:59:59') return false
                      return true
                    })
                    exporterRelevesCSV(filtered, equipements)
                  }} style={{...btnSm,background:'#eaf3de',color:'#27500a',borderColor:'#97c459'}}>
                    <i className="ti ti-download"/>Télécharger CSV (sélection)
                  </button>
                  <button onClick={()=>exporterRelevesCSV(relevesTous, equipements)} style={{...btnSm,background:'#e6f1fb',color:'#0c447c',borderColor:'#85b7eb'}}>
                    <i className="ti ti-download"/>Tout télécharger
                  </button>
                </div>
              </div>
              <div style={card}>
                {(()=>{
                  const filtered = relevesTous.filter(r=>{
                    if(historiqueEquipId&&r.equipement_id!==historiqueEquipId) return false
                    if(historiqueDebut&&r.releve_le<historiqueDebut) return false
                    if(historiqueFin&&r.releve_le>historiqueFin+'T23:59:59') return false
                    return true
                  })
                  const filteredSorted = [...filtered].sort((a,b)=>new Date(b.releve_le)-new Date(a.releve_le))
                  if(filteredSorted.length===0) return <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun relevé pour ces critères</div>
                  return (
                    <div style={{overflowX:'auto'}}>
                      <div style={{fontSize:12,color:'#888780',marginBottom:10}}>{filteredSorted.length} relevé(s)</div>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                        <thead><tr>
                          {['Date','Moment','Équipement','Température','Plage','Statut','Relevé par','Action corrective'].map(h=><th key={h} style={th}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {filteredSorted.map(r=>{
                            const eq = equipements.find(e=>e.id===r.equipement_id)
                            return (
                              <tr key={r.id} style={{background:r.conforme?'#fff':'#fff8f8'}}>
                                <td style={{...td,color:'#888780'}}>{r.releve_le?new Date(r.releve_le).toLocaleDateString('fr-FR')+' '+new Date(r.releve_le).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'-'}</td>
                                <td style={{...td,color:'#5f5e5a'}}>{r.moment||'—'}</td>
                                <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{eq?.nom||'—'}</td>
                                <td style={{...td,fontFamily:'monospace',fontWeight:500,color:r.conforme?'#27500a':'#a32d2d'}}>{r.temperature}°C</td>
                                <td style={{...td,color:'#888780',fontSize:11}}>{eq?eq.temp_min+'→'+eq.temp_max+'°C':'—'}</td>
                                <td style={td}><span style={badge(r.conforme)}>{r.conforme?'Conforme':'Non conforme'}</span></td>
                                <td style={{...td,color:'#5f5e5a'}}>{r.releve_par||'—'}</td>
                                <td style={{...td,color:r.action_corrective?'#854f0b':'#b4b2a9',fontSize:12,fontWeight:r.action_corrective?500:400}}>{r.action_corrective||'—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {tempTab==='config' && (
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div style={ct}>Équipements configurés</div>
                <button onClick={()=>{setEditEquip(null);setFormEquip({nom:'',type:'froid',temp_min:'',temp_max:'',frequence_jours:1,frequence_fois:2});setModalAddEquip(true)}} style={btnSmP}><i className="ti ti-plus"/>Ajouter</button>
              </div>
              {equipements.length===0
                ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun équipement</div>
                : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {equipements.map(eq=>(
                      <div key={eq.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:10,border:'0.5px solid #e2e0d8',background:'#f8f7f4'}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{eq.nom}</div>
                          <div style={{fontSize:11,color:'#888780',marginTop:2}}>
                            {eq.type} — {eq.temp_min}°C → {eq.temp_max}°C — {eq.frequence||'Fréquence non définie'}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:eq.type==='froid'?'#e6f1fb':eq.type==='plonge'?'#eeedfe':eq.type==='sec'?'#f1efe8':'#fcebeb',color:eq.type==='froid'?'#0c447c':eq.type==='plonge'?'#3c3489':eq.type==='sec'?'#5f5e5a':'#a32d2d',fontWeight:500}}>{eq.type}</span>
                          <button onClick={()=>{
                            const parts = (eq.frequence||'').match(/(\d+)x\/jour tous les (\d+)/)
                            setFormEquip({nom:eq.nom,type:eq.type,temp_min:eq.temp_min,temp_max:eq.temp_max,frequence_fois:parts?parseInt(parts[1]):2,frequence_jours:parts?parseInt(parts[2]):1})
                            setEditEquip(eq); setModalAddEquip(true)
                          }} style={{...btnSm,padding:'4px 8px',fontSize:11}}><i className="ti ti-edit"/>Modifier</button>
                          <button onClick={()=>supprimerEquipement(eq.id)} style={{...btnSm,padding:'4px 8px',fontSize:11,color:'#a32d2d',borderColor:'#f09595',background:'#fcebeb'}}><i className="ti ti-trash"/>Supprimer</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>
      )}

      {tab==='nettoyage' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* Tabs */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[
              {id:"dashboard",label:"Vue ensemble",icon:"ti-layout-dashboard"},
              {id:'taches',label:"Toutes les taches",icon:'ti-checklist'},
              {id:'config',label:'Zones & config',icon:'ti-settings'},
              {id:'historique',label:'Historique',icon:'ti-history'},
            ].map(t=>(
              <button key={t.id} onClick={()=>{setNettoyageTab(t.id);setZoneSelectee(null)}} style={innerTab(nettoyageTab===t.id&&!zoneSelectee)}>
                <i className={'ti '+t.icon}/>{t.label}
              </button>
            ))}
          </div>

          {/* ── DASHBOARD ── */}
          {nettoyageTab==='dashboard'&&!zoneSelectee && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                <div style={{fontSize:15,fontWeight:500,color:'#2c2c2a'}}>
                  <i className="ti ti-calendar" style={{marginRight:8,verticalAlign:-2}}/>
                  {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                </div>
              </div>
              {zones.length===0
                ? <div style={{...card,textAlign:'center',color:'#b4b2a9',padding:40,fontSize:13}}>Aucune zone — configurez-en dans "Zones &amp; config"</div>
                : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
                    {zones.map(z=>{
                      const tz = taches.filter(t=>t.zone_id===z.id)
                      const faites = tz.filter(t=>tacheStatut(t)==='fait').length
                      const retard = tz.filter(t=>tacheStatut(t)==='retard').length
                      const afaire = tz.filter(t=>tacheStatut(t)==='afaire').length
                      const total = tz.length
                      const pct = total>0?Math.round(faites/total*100):0
                      const st = retard>0?'retard':afaire>0?'afaire':'fait'
                      const col = st==='fait'?{bg:'#f6fdf0',border:'#97c459'}:st==='retard'?{bg:'#fff0f0',border:'#e53e3e'}:{bg:'#fffbf0',border:'#fac775'}
                      return (
                        <div key={z.id} onClick={()=>setZoneSelectee(z)}
                          style={{border:`1.5px solid ${col.border}`,borderRadius:12,padding:16,background:col.bg,cursor:'pointer'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                            <div style={{fontSize:15,fontWeight:500,color:'#2c2c2a'}}>{z.nom}</div>
                            <span style={{fontSize:20}}>{st==='fait'?'✅':st==='retard'?'🚨':'🟠'}</span>
                          </div>
                          {z.description&&<div style={{fontSize:12,color:'#888780',marginBottom:8}}>{z.description}</div>}
                          <div style={{height:6,borderRadius:3,background:'#e2e0d8',marginBottom:8,overflow:'hidden'}}>
                            <div style={{height:'100%',width:pct+'%',background:st==='fait'?'#639922':st==='retard'?'#e53e3e':'#fac775',borderRadius:3}}/>
                          </div>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12}}>
                            <span style={{color:'#5f5e5a'}}>{faites}/{total} tâches</span>
                            <span style={{fontWeight:600,color:st==='fait'?'#27500a':st==='retard'?'#c53030':'#854f0b'}}>{pct}%</span>
                          </div>
                          {retard>0&&<div style={{fontSize:11,color:'#c53030',marginTop:6,fontWeight:500}}>🚨 {retard} en retard</div>}
                          {afaire>0&&retard===0&&<div style={{fontSize:11,color:'#854f0b',marginTop:6}}>🟠 {afaire} à valider</div>}
                          {st==='fait'&&total>0&&<div style={{fontSize:11,color:'#27500a',marginTop:6}}>✓ Tout est fait</div>}
                          {total===0&&<div style={{fontSize:11,color:'#b4b2a9',marginTop:6}}>Aucune tâche</div>}
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}

          {/* ── DETAIL ZONE ── */}
          {zoneSelectee && (
            <div key={tacheRefreshKey} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={()=>setZoneSelectee(null)} style={{...btn,padding:'6px 10px'}}>
                  <i className="ti ti-arrow-left"/>Retour
                </button>
                <div>
                <div style={{fontSize:16,fontWeight:500,color:'#2c2c2a'}}>{zoneSelectee.nom}</div>
                {zoneSelectee.description&&<div style={{fontSize:12,color:'#888780',marginTop:2}}>{zoneSelectee.description}</div>}
              </div>

              </div>
              {taches.filter(t=>t.zone_id===zoneSelectee.id).length===0
                ? <div style={{...card,textAlign:'center',color:'#b4b2a9',padding:40,fontSize:13}}>Aucune tache — ajoutez-en dans Config</div>
                : (()=>{
                    const tachesZone = taches.filter(t=>t.zone_id===zoneSelectee.id)
                    const freqLabel = (f) => f==='2x/jour'?'2x par jour':f==='quotidien'?'Quotidien':f==='2jours'?'Tous les 2 jours':f==='hebdomadaire'?'Hebdomadaire':f==='2semaines'?'Toutes les 2 semaines':f==='mensuel'?'Mensuel':f
                    const freqColor = (f) => ['2x/jour','quotidien'].includes(f)?{bg:'#fcebeb',c:'#a32d2d'}:['2jours','hebdomadaire','2semaines'].includes(f)?{bg:'#faeeda',c:'#854f0b'}:{bg:'#e6f1fb',c:'#0c447c'}
                    const freqs = [...new Set(tachesZone.map(t=>t.frequence))]
                    return freqs.map(freq=>{
                    const tf = tachesZone.filter(t=>t.frequence===freq)
                    if (!tf.length) return null
                    const fLabel = freqLabel(freq)
                    const fCol = freqColor(freq)
                    return (
                      <div key={freq}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',color:'#888780'}}>{fLabel}</span>
                          <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,fontWeight:500,...fCol}}>{tf.length}</span>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:6}}>
                          {tf.map(t=>{
                            const st = tacheStatut(t)
                            const log = tacheLogAll.filter(l=>l.tache_id===t.id).sort((a,b)=>new Date(b.valide_le)-new Date(a.valide_le))[0]
                            const col = st==='fait'?{bg:'#eaf3de',border:'#97c459',c:'#27500a',icBg:'#639922',icon:'ti-check'}
                              :st==='retard'?{bg:'#fff0f0',border:'#e53e3e',c:'#c53030',icBg:'#e53e3e',icon:'ti-alert-triangle'}
                              :{bg:'#fffbf0',border:'#fac775',c:'#854f0b',icBg:'#d3d1c7',icon:'ti-clock'}
                            return (
                              <div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderRadius:10,background:col.bg,border:`0.5px solid ${col.border}`}}>
                                <div style={{display:'flex',alignItems:'center',gap:12}}>
                                  <div style={{width:28,height:28,borderRadius:8,background:col.icBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    <i className={'ti '+col.icon} style={{color:'#fff',fontSize:12}}/>
                                  </div>
                                  <div>
                                    <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{t.nom}</div>
                                    {t.description&&<div style={{fontSize:11,color:'#888780',marginTop:1}}>{t.description}</div>}
                                    {log&&<div style={{fontSize:11,color:col.c,marginTop:2}}>
                                      Validé le {new Date(log.valide_le).toLocaleDateString('fr-FR')} à {new Date(log.valide_le).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} par {log.valide_par}
                                    </div>}
                                  </div>
                                </div>
                                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                  {st!=='fait'&&<button onClick={()=>setModalValiderTache(t)} style={{...btnSmP,background:st==='retard'?'#e53e3e':'#534ab7'}}><i className="ti ti-check"/>Valider</button>}
                                  {st==='fait'&&<span style={{fontSize:12,color:'#27500a',fontWeight:500}}>✓ Fait</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                  })()
              }
            </div>
          )}

          {/* ── TOUTES LES TACHES ── */}
          {nettoyageTab==='taches'&&!zoneSelectee && (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {taches.length===0
                ? <div style={{...card,textAlign:'center',color:'#b4b2a9',padding:40,fontSize:13}}>Aucune tâche — configurez des zones</div>
                : zones.map(z=>{
                    const tf = taches.filter(t=>t.zone_id===z.id)
                    if (!tf.length) return null
                    return (
                      <div key={z.id} style={card}>
                        <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                          <i className="ti ti-map-pin" style={{color:'#534ab7'}}/>{z.nom}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:6}}>
                          {taches.filter(t=>t.zone_id===z.id).map(t=>{
                            const st = tacheStatut(t)
                            const log = tacheLogAll.filter(l=>l.tache_id===t.id).sort((a,b)=>new Date(b.valide_le)-new Date(a.valide_le))[0]
                            const col = st==='fait'?{bg:'#eaf3de',border:'#97c459',c:'#27500a'}:st==='retard'?{bg:'#fff0f0',border:'#e53e3e',c:'#c53030'}:{bg:'#fffbf0',border:'#fac775',c:'#854f0b'}
                            return (
                              <div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:8,background:col.bg,border:`0.5px solid ${col.border}`}}>
                                <div>
                                  <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{t.nom}</div>
                                  {log&&<div style={{fontSize:11,color:col.c}}>{new Date(log.valide_le).toLocaleDateString('fr-FR')} à {new Date(log.valide_le).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} — {log.valide_par}</div>}
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:['2x/jour','quotidien'].includes(t.frequence)?'#fcebeb':['hebdomadaire','2semaines'].includes(t.frequence)?'#faeeda':'#e6f1fb',color:['2x/jour','quotidien'].includes(t.frequence)?'#a32d2d':['hebdomadaire','2semaines'].includes(t.frequence)?'#854f0b':'#0c447c',fontWeight:500}}>{t.frequence}</span>
                                  {st!=='fait'&&<button onClick={()=>setModalValiderTache(t)} style={{...btnSmP,fontSize:11,padding:'4px 10px'}}><i className="ti ti-check"/>Valider</button>}
                                  {st==='fait'&&<span style={{fontSize:11,color:'#27500a',fontWeight:500}}>✓</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          )}

          {/* ── HISTORIQUE ── */}
          {nettoyageTab==='historique'&&!zoneSelectee && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Filtres */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
                  <div style={ct}>Filtres</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <select value={nettoyageZoneId} onChange={e=>setNettoyageZoneId(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}>
                      <option value="">Toutes les zones</option>
                      {zones.map(z=><option key={z.id} value={z.id}>{z.nom}</option>)}
                    </select>
                    <input type="date" value={nettoyageDebut} onChange={e=>setNettoyageDebut(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <span style={{fontSize:12,color:'#888780'}}>→</span>
                    <input type="date" value={nettoyageFin} onChange={e=>setNettoyageFin(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <button onClick={()=>{setNettoyageDebut('');setNettoyageFin('');setNettoyageZoneId('')}} style={{...btnSm,color:'#888780'}}>Tout</button>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>{
                    const sep=';'; const nl=String.fromCharCode(10)
                    const filtered=tacheLogAll.filter(l=>{
                      if(nettoyageZoneId&&l.zone_id!==nettoyageZoneId) return false
                      if(nettoyageDebut&&l.valide_le<nettoyageDebut) return false
                      if(nettoyageFin&&l.valide_le>nettoyageFin+'T23:59:59') return false
                      return true
                    })
                    const headers=['Date','Heure','Zone','Tache','Frequence','Valide par'].join(sep)
                    const rows=filtered.map(l=>{
                      const t=taches.find(x=>x.id===l.tache_id)
                      const z=zones.find(x=>x.id===l.zone_id)
                      const d=new Date(l.valide_le)
                      return [d.toLocaleDateString('fr-FR'),d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),z?.nom||'',t?.nom||'',t?.frequence||'',l.valide_par||''].join(sep)
                    })
                    const csv=(etabNom?etabNom+nl:'')+[headers,...rows].join(nl)
                    const fname=(etabNom?etabNom.replace(/[^a-zA-Z0-9]/g,'_')+'_':'')+'nettoyage'+(nettoyageDebut?'_'+nettoyageDebut:'')+'.csv'
                    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download=fname; a.click()
                  }} style={{...btnSm,background:'#eaf3de',color:'#27500a',borderColor:'#97c459'}}><i className="ti ti-download"/>Télécharger sélection</button>
                  <button onClick={()=>{
                    const sep=';'; const nl=String.fromCharCode(10)
                    const headers=['Date','Heure','Zone','Tache','Frequence','Valide par'].join(sep)
                    const rows=tacheLogAll.map(l=>{
                      const t=taches.find(x=>x.id===l.tache_id)
                      const z=zones.find(x=>x.id===l.zone_id)
                      const d=new Date(l.valide_le)
                      return [d.toLocaleDateString('fr-FR'),d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),z?.nom||'',t?.nom||'',t?.frequence||'',l.valide_par||''].join(sep)
                    })
                    const csv=(etabNom?etabNom+nl:'')+[headers,...rows].join(nl)
                    const fname=(etabNom?etabNom.replace(/[^a-zA-Z0-9]/g,'_')+'_':'')+'nettoyage_complet.csv'
                    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download=fname; a.click()
                  }} style={{...btnSm,background:'#e6f1fb',color:'#0c447c',borderColor:'#85b7eb'}}><i className="ti ti-download"/>Tout télécharger</button>
                </div>
              </div>
              {/* Tableau */}
              <div style={card}>
                {(()=>{
                  const filtered=tacheLogAll.filter(l=>{
                    if(nettoyageZoneId&&l.zone_id!==nettoyageZoneId) return false
                    if(nettoyageDebut&&l.valide_le<nettoyageDebut) return false
                    if(nettoyageFin&&l.valide_le>nettoyageFin+'T23:59:59') return false
                    return true
                  }).sort((a,b)=>new Date(b.valide_le)-new Date(a.valide_le))
                  if(filtered.length===0) return <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucune validation pour ces critères</div>
                  return (
                    <div style={{overflowX:'auto'}}>
                      <div style={{fontSize:12,color:'#888780',marginBottom:8}}>{filtered.length} validation(s)</div>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                        <thead><tr>{['Date','Heure','Zone','Tâche','Fréquence','Validé par'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {filtered.map(l=>{
                            const t=taches.find(x=>x.id===l.tache_id)
                            const z=zones.find(x=>x.id===l.zone_id)
                            const d=new Date(l.valide_le)
                            return (
                              <tr key={l.id}>
                                <td style={{...td,color:'#888780'}}>{d.toLocaleDateString('fr-FR')}</td>
                                <td style={{...td,color:'#888780'}}>{d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</td>
                                <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{z?.nom||'—'}</td>
                                <td style={{...td,color:'#5f5e5a'}}>{t?.nom||'—'}</td>
                                <td style={td}><span style={{fontSize:10,padding:'1px 7px',borderRadius:8,fontWeight:500,background:['2x/jour','quotidien'].includes(t?.frequence)?'#fcebeb':['hebdomadaire','2semaines'].includes(t?.frequence)?'#faeeda':'#e6f1fb',color:['2x/jour','quotidien'].includes(t?.frequence)?'#a32d2d':['hebdomadaire','2semaines'].includes(t?.frequence)?'#854f0b':'#0c447c'}}>{t?.frequence||'—'}</span></td>
                                <td style={{...td,color:'#5f5e5a'}}>{l.valide_par||'—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* ── CONFIG ── */}
          {nettoyageTab==='config'&&!zoneSelectee && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={ct}>Zones de nettoyage</div>
                <button onClick={()=>setModalAddZoneNett(true)} style={btnSmP}><i className="ti ti-plus"/>Ajouter une zone</button>
              </div>
              {zones.length===0
                ? <div style={{...card,textAlign:'center',color:'#b4b2a9',padding:40,fontSize:13}}>Aucune zone</div>
                : zones.map(z=>{
                    const tf = taches.filter(t=>t.zone_id===z.id)
                    return (
                      <div key={z.id} style={card}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:tf.length?12:0}}>
                          <div>
                            <div style={{fontSize:14,fontWeight:500,color:'#2c2c2a'}}>{z.nom}</div>
                            {z.description&&<div style={{fontSize:12,color:'#888780',marginTop:2}}>{z.description}</div>}
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>{setModalAddTache(z.id);setEditTache(null);setFormTache({nom:'',frequence:'quotidien',description:''})}} style={btnSmP}><i className="ti ti-plus"/>Tâche</button>
                            <button onClick={()=>{setFormZoneNett({nom:z.nom,description:z.description||''});setEditZoneNett(z);setModalAddZoneNett(true)}} style={{...btnSm,padding:'6px 8px'}}><i className="ti ti-edit"/></button>
                            <button onClick={()=>supprimerZoneNett(z.id)} style={{...btnSm,color:'#a32d2d',borderColor:'#f09595',background:'#fcebeb',padding:'6px 8px'}}><i className="ti ti-trash"/></button>
                          </div>
                        </div>
                        {tf.map(t=>(
                          <div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:8,background:'#f8f7f4',marginTop:6}}>
                            <div>
                              <span style={{fontSize:13,color:'#2c2c2a'}}>{t.nom}</span>
                              {t.description&&<span style={{fontSize:11,color:'#888780',marginLeft:8}}>{t.description}</span>}
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:['2x/jour','quotidien'].includes(t.frequence)?'#fcebeb':['hebdomadaire','2semaines'].includes(t.frequence)?'#faeeda':'#e6f1fb',color:['2x/jour','quotidien'].includes(t.frequence)?'#a32d2d':['hebdomadaire','2semaines'].includes(t.frequence)?'#854f0b':'#0c447c',fontWeight:500}}>{t.frequence}</span>
                              <button onClick={()=>{setEditTache(t);setFormTache({nom:t.nom,frequence:t.frequence,description:t.description||''});setModalAddTache(t.zone_id)}} style={{...btnSm,padding:'3px 6px',fontSize:11}}><i className="ti ti-edit"/></button>
                              <button onClick={()=>supprimerTache(t.id)} style={{...btnSm,padding:'3px 6px',fontSize:11,color:'#a32d2d',borderColor:'#f09595',background:'#fcebeb'}}><i className="ti ti-trash"/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })
              }
            </div>
          )}
        </div>
      )}
      {/* ── CUISSONS ── */}
      {tab==='cuissons' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Info réglementaire */}
          <div style={{...card,background:'#eeedfe',borderColor:'#afa9ec'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <i className="ti ti-info-circle" style={{fontSize:18,color:'#534ab7',marginTop:1,flexShrink:0}}/>
              <div style={{fontSize:13,color:'#3c3489',lineHeight:1.7}}>
                <strong>Règles réglementaires (Arrêté 21/12/2009) :</strong><br/>
                🔴 <strong>Cuisson</strong> : température à cœur minimum <strong>63°C</strong> (70°C volailles/viandes hachées)<br/>
                🔵 <strong>Refroidissement rapide</strong> : démarrer le timer à 63°C → atteindre <strong>10°C en moins de 2h</strong><br/>
                🟠 <strong>Remise en température</strong> : atteindre <strong>63°C à cœur en moins d'1h</strong>
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[{id:"saisie",label:"Nouveau releve"},{id:"refroidissements",label:"Timers actifs"+(refroidTimers.length>0?" ("+refroidTimers.length+")":"")},{id:"historique",label:"Historique"}].map(t=>(
              <button key={t.id} onClick={()=>setCuissonTab(t.id)}
                style={{...innerTab(cuissonTab===t.id),
                  ...(t.id==='refroidissements'&&refroidTimers.length>0?{background:'#e6f1fb',color:'#0c447c',borderColor:'#85b7eb'}:{})}}>
                {t.id==="refroidissements"&&refroidTimers.length>0&&<i className="ti ti-clock" style={{marginRight:4}}/>}
                {t.label}
              </button>
            ))}
          </div>

          {cuissonTab==='saisie' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={card}>
                <div style={{...ct,marginBottom:14}}>Type d operation</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                  {[{v:'cuisson',icon:'🔴',nom:'Cuisson',regle:'Min. 63°C à cœur'},{v:'refroidissement',icon:'🔵',nom:'Refroidissement',regle:'63°C → 10°C en 2h'},{v:'remise',icon:'🟠',nom:'Remise en temp.',regle:'Atteindre 63°C en 1h'}].map(t=>(
                    <div key={t.v} onClick={()=>setFormCuisson({...formCuisson,type:t.v})}
                      style={{border:`0.5px solid ${formCuisson.type===t.v?'#534ab7':'#e2e0d8'}`,borderRadius:10,padding:12,cursor:'pointer',textAlign:'center',background:formCuisson.type===t.v?'#eeedfe':'#fff'}}>
                      <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
                      <div style={{fontSize:12,fontWeight:500,color:'#2c2c2a'}}>{t.nom}</div>
                      <div style={{fontSize:10,color:formCuisson.type===t.v?'#534ab7':'#888780',marginTop:4,lineHeight:1.4}}>{t.regle}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Produit / Préparation *</div>
                    <input placeholder="Ex: Poulet rôti, Fond de veau…" value={formCuisson.produit_nom} onChange={e=>setFormCuisson({...formCuisson,produit_nom:e.target.value})} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Commentaire (optionnel)</div>
                    <input placeholder="Ex: Cuisson basse température, marinade…" value={formCuisson.commentaire} onChange={e=>setFormCuisson({...formCuisson,commentaire:e.target.value})} style={inp}/>
                  </div>
                </div>
              </div>
              <div style={card}>
                {formCuisson.type==='refroidissement' ? (
                  <>
                    <div style={{...ct,marginBottom:8}}>Température de sortie cuisson</div>
                    <div style={{fontSize:13,color:'#3c3489',marginBottom:14,lineHeight:1.8,background:'#eeedfe',border:'1px solid #afa9ec',borderRadius:8,padding:'12px 14px'}}>
                      <div style={{fontWeight:600,marginBottom:6}}>Comment utiliser le timer :</div>
                      <div>1. Sortez la preparation du feu</div>
                      <div>2. Attendez que la sonde descende a <strong>63 degres</strong></div>
                      <div>3. Entrez <strong>63</strong> ci-dessous et demarrez le timer</div>
                      <div style={{marginTop:6,fontSize:12,fontStyle:'italic'}}>Objectif : atteindre 10 degres ou moins en moins de 2h</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:16,background:'#f8f7f4',borderRadius:10,marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px'}}>Temp. sortie cuisson</div>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <input type="number" step="0.1" placeholder="—" value={formCuisson.temperature} onChange={e=>setFormCuisson({...formCuisson,temperature:e.target.value})}
                          style={{fontSize:42,fontWeight:500,textAlign:'center',border:'none',background:'transparent',width:140,color:'#2c2c2a',outline:'none'}}/>
                        <span style={{fontSize:18,color:'#888780'}}>°C</span>
                      </div>
                      {formCuisson.temperature&&(()=>{
                        const t=parseFloat(formCuisson.temperature)
                        const ok=t>=63
                        return <span style={{fontSize:12,padding:'3px 12px',borderRadius:8,fontWeight:500,background:ok?'#eaf3de':'#fcebeb',color:ok?'#27500a':'#a32d2d'}}>{ok?'✓ Cuisson suffisante (≥ 63°C)':'⚠ Cuisson insuffisante (< 63°C)'}</span>
                      })()}
                    </div>
                    <button onClick={demarrerRefroid} style={{...btn,width:'100%',justifyContent:'center',padding:12,background:'#e6f1fb',color:'#0c447c',borderColor:'#85b7eb'}}>
                      <i className="ti ti-player-play"/>Démarrer le refroidissement et le timer
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{...ct,marginBottom:14}}>{formCuisson.type==='remise'?'Température à cœur (remise)':'Température à cœur'}</div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:16,background:'#f8f7f4',borderRadius:10,marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px'}}>Température mesurée</div>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <input type="number" step="0.1" placeholder="—" value={formCuisson.temperature} onChange={e=>setFormCuisson({...formCuisson,temperature:e.target.value})}
                          style={{fontSize:42,fontWeight:500,textAlign:'center',border:'none',background:'transparent',width:140,color:'#2c2c2a',outline:'none'}}/>
                        <span style={{fontSize:18,color:'#888780'}}>°C</span>
                      </div>
                      {formCuisson.temperature&&(()=>{
                        const t=parseFloat(formCuisson.temperature)
                        const ok=formCuisson.type==='remise'?t<=10:t>=63
                        const label=formCuisson.type==='remise'?(ok?'✓ Produit froid conforme (≤ 10°C)':'✗ Produit trop chaud (> 10°C)'):(ok?'✓ Conforme (≥ 63°C)':'✗ Non conforme (< 63°C)')
                        return <span style={{fontSize:12,padding:'3px 12px',borderRadius:8,fontWeight:500,background:ok?'#eaf3de':'#fcebeb',color:ok?'#27500a':'#a32d2d'}}>{label}</span>
                      })()}
                    </div>
                    {formCuisson.type==='remise' ? (
                      <>
                        <button onClick={demarrerRemise} style={{...btn,width:'100%',justifyContent:'center',padding:12,background:'#faeeda',color:'#854f0b',borderColor:'#fac775',marginBottom:8}}>
                          <i className="ti ti-player-play"/>Demarrer le timer (1h max)
                        </button>
                        <button onClick={enregistrerCuisson} style={{...btnSm,width:'100%',justifyContent:'center',padding:10}}>
                          <i className="ti ti-check"/>Saisie directe sans timer
                        </button>
                      </>
                    ) : (
                      <button onClick={enregistrerCuisson} style={{...btnP,width:'100%',justifyContent:'center',padding:12}}>
                        <i className="ti ti-check"/>Valider et archiver
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {cuissonTab==='refroidissements' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {refroidTimers.length===0
                ? <div style={{...card,textAlign:'center',padding:40,color:'#b4b2a9',fontSize:13}}>
                    Aucun refroidissement en cours — démarrez-en un depuis "Nouveau relevé"
                  </div>
                : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                    {refroidTimers.map(t=>{
                      const p=Math.min(Math.round(t.elapsed/7200*100),100)
                      const lim = (t.limiteMin||120)*60
                      const urgent=t.elapsed>lim
                      const bientot=t.elapsed>lim*0.75
                      const colBg=urgent?'#fff0f0':bientot?'#fffbf0':'#f0f7ff'
                      const colBorder=urgent?'#e53e3e':bientot?'#fac775':'#85b7eb'
                      const colText=urgent?'#c53030':bientot?'#854f0b':'#0c447c'
                      return (
                        <div key={t.id} style={{border:`1.5px solid ${colBorder}`,borderRadius:12,padding:16,background:colBg}}>
                          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                            <div>
                              <div style={{fontSize:15,fontWeight:600,color:'#2c2c2a'}}>{t.produit_nom}</div>
                              <div style={{fontSize:11,color:'#888780',marginTop:2}}>Par {t.fait_par} — {new Date(t.debut).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
                            </div>
                            <div style={{display:'flex',gap:4,alignItems:'center'}}>
                              <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,fontWeight:500,background:t.type==='remise'?'#faeeda':'#e6f1fb',color:t.type==='remise'?'#854f0b':'#0c447c'}}>{t.type==='remise'?'Remise':'Refroid.'}</span>
                              <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,fontWeight:600,background:colBorder,color:'#fff'}}>{urgent?'URGENT':bientot?'BIENTOT':'EN COURS'}</span>
                            </div>
                          </div>
                          <div style={{textAlign:'center',marginBottom:10}}>
                            <div style={{fontSize:34,fontWeight:700,color:colText,fontFamily:'monospace'}}>{formatTimer(t.elapsed)}</div>
                            <div style={{fontSize:11,color:'#888780'}}>sur {t.limiteLabel||'2h'} maximum — objectif : {t.objectif||'< 10°C'}</div>
                          </div>
                          <div style={{height:8,borderRadius:4,background:'#e2e0d8',marginBottom:6,overflow:'hidden'}}>
                            <div style={{height:'100%',width:p+'%',background:urgent?'#e53e3e':bientot?'#fac775':'#534ab7',borderRadius:4,transition:'width 1s'}}/>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#888780',marginBottom:10}}>
                            <span>Départ : <strong style={{color:'#2c2c2a'}}>{t.temp_depart}°C</strong></span>
                            <span style={{color:colText,fontWeight:600}}>{p}%</span>
                          </div>
                          {urgent&&<div style={{background:'#fcebeb',borderRadius:8,padding:'6px 10px',fontSize:11,color:'#a32d2d',fontWeight:500,marginBottom:10,textAlign:'center'}}>⚠️ 2h dépassées</div>}
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>{setModalTerminerTimer(t);setRefroidTempFinale('')}} style={{...btnSmP,flex:1,justifyContent:'center'}}>
                              <i className="ti ti-check"/>Terminer
                            </button>
                            <button onClick={()=>setRefroidTimers(prev=>{
                              const updated=prev.filter(x=>x.id!==t.id)
                              try{localStorage.setItem('haccp_refroid_timers',JSON.stringify(updated))}catch(e){}
                              return updated
                            })} style={{...btnSm,color:'#a32d2d',borderColor:'#f09595',background:'#fcebeb',padding:'6px 8px'}}>
                              <i className="ti ti-x"/>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}

          {cuissonTab==='historique' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Filtres */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
                  <div style={ct}>Filtres</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <select value={cuissonTypeF} onChange={e=>setCuissonTypeF(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}>
                      <option value="">Tous les types</option>
                      <option value="cuisson">Cuisson</option>
                      <option value="refroidissement">Refroidissement</option>
                      <option value="remise">Remise en temp.</option>
                    </select>
                    <input type="date" value={cuissonDebut} onChange={e=>setCuissonDebut(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <span style={{fontSize:12,color:'#888780'}}>→</span>
                    <input type="date" value={cuissonFin} onChange={e=>setCuissonFin(e.target.value)} style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <button onClick={()=>{setCuissonDebut('');setCuissonFin('');setCuissonTypeF('')}} style={{...btnSm,color:'#888780'}}>Tout</button>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  {[{label:"Telecharger selection",all:false},{label:"Tout telecharger",all:true}].map(({label,all})=>(
                    <button key={label} onClick={()=>{
                      const sep=';'; const nl=String.fromCharCode(10)
                      const data=all?cuissons:cuissons.filter(x=>{
                        if(cuissonTypeF&&x.type!==cuissonTypeF) return false
                        const d=x.date_releve||x.created_at
                        if(cuissonDebut&&d<cuissonDebut) return false
                        if(cuissonFin&&d>cuissonFin+'T23:59:59') return false
                        return true
                      })
                      const headers=['Date','Heure','Produit','Type','Temperature','Statut','Commentaire'].join(sep)
                      const rows=data.map(x=>{
                        const d=new Date(x.date_releve||x.created_at)
                        return [d.toLocaleDateString('fr-FR'),d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),x.produit_nom,x.type,x.temperature+'°C',x.conforme?'Conforme':'Non conforme',x.commentaire||''].join(sep)
                      })
                      const csv=(etabNom?etabNom+nl:'')+[headers,...rows].join(nl)
                      const fname=(etabNom?etabNom.replace(/[^a-zA-Z0-9]/g,'_')+'_':'')+'cuissons'+(all?'_complet':'_selection')+'.csv'
                      const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download=fname; a.click()
                    }} style={{...btnSm,background:all?'#e6f1fb':'#eaf3de',color:all?'#0c447c':'#27500a',borderColor:all?'#85b7eb':'#97c459'}}>
                      <i className="ti ti-download"/>{label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Tableau */}
              <div style={card}>
                {(()=>{
                  const filtered=cuissons.filter(x=>{
                    if(cuissonTypeF&&x.type!==cuissonTypeF) return false
                    const d=x.date_releve||x.created_at
                    if(cuissonDebut&&d<cuissonDebut) return false
                    if(cuissonFin&&d>cuissonFin+'T23:59:59') return false
                    return true
                  })
                  if(filtered.length===0) return <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun relevé pour ces critères</div>
                  return (
                    <div style={{overflowX:'auto'}}>
                      <div style={{fontSize:12,color:'#888780',marginBottom:8}}>{filtered.length} relevé(s)</div>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                        <thead><tr>{['Date','Heure','Produit','Type','Temp.','Statut','Commentaire'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {filtered.map(row=>(
                            <tr key={row.id} style={{background:row.conforme?'#fff':'#fff8f8'}}>
                              <td style={{...td,color:'#888780'}}>{new Date(row.date_releve||row.created_at).toLocaleDateString('fr-FR')}</td>
                              <td style={{...td,color:'#888780'}}>{new Date(row.date_releve||row.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</td>
                              <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{row.produit_nom}</td>
                              <td style={td}>
                                <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,fontWeight:500,background:row.type==='cuisson'?'#fcebeb':row.type==='refroidissement'?'#e6f1fb':'#faeeda',color:row.type==='cuisson'?'#a32d2d':row.type==='refroidissement'?'#0c447c':'#854f0b'}}>
                                  {row.type==='cuisson'?'Cuisson':row.type==='refroidissement'?'Refroidissement':'Remise en temp.'}
                                </span>
                              </td>
                              <td style={{...td,fontFamily:'monospace',fontWeight:500}}>{row.temperature}°C</td>
                              <td style={td}><span style={badge(row.conforme)}>{row.conforme?'Conforme':'Non conforme'}</span></td>
                              <td style={{...td,color:'#888780',fontSize:12}}>{row.commentaire||'—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TRAÇABILITÉ ── */}
      {tab==='tracabilite' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {lotsRappeles.length>0&&(
            <div style={{background:'#fcebeb',border:'0.5px solid #f09595',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'flex-start',gap:12}}>
              <i className="ti ti-alert-triangle" style={{color:'#a32d2d',fontSize:22,flexShrink:0}}/>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:'#a32d2d',marginBottom:4}}>{lotsRappeles.length} lot(s) rappelé(s)</div>
                <div style={{fontSize:13,color:'#791f1f'}}>{lotsRappeles.map(l=>l.numero_lot).join(', ')}</div>
              </div>
            </div>
          )}

          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[{id:'saisie',label:'Enregistrer un lot',icon:'ti-plus'},{id:'lots',label:'Mes lots',icon:'ti-list'}].map(t=>(
              <button key={t.id} onClick={()=>setTracaTab(t.id)} style={innerTab(tracaTab===t.id)}>
                <i className={'ti '+t.icon}/>{t.label}
              </button>
            ))}
          </div>

          {tracaTab==='saisie' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {/* LEFT: Camera + Photo */}
              <div style={card}>
                <div style={{...ct,marginBottom:14}}>Photo traçabilité (optionnel)</div>
                {/* Camera / Photo display */}
                {/* Camera live view */}
                <div style={{position:'relative',background:'#1a1a1a',borderRadius:12,overflow:'hidden',aspectRatio:'4/3',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {cameraActive
                    ? <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <div style={{textAlign:'center',color:'#888780'}}>
                        <i className="ti ti-camera" style={{fontSize:40,display:'block',marginBottom:6}}/>
                        <div style={{fontSize:12}}>{photosCapturees.length>0?photosCapturees.length+' photo(s) prise(s)':'Activez la camera'}</div>
                      </div>
                  }
                  <canvas ref={canvasRef} style={{display:'none'}}/>
                  {photosCapturees.length>0&&<div style={{position:'absolute',top:8,right:8,background:'#534ab7',color:'#fff',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:600}}>{photosCapturees.length} photo(s)</div>}
                </div>
                {/* Controls */}
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  {!cameraActive
                    ? <button onClick={demarrerCamera} style={{...btnP,flex:1,justifyContent:'center'}}>
                        <i className="ti ti-camera"/>{photosCapturees.length>0?'Ajouter une photo':'Activer la camera'}
                      </button>
                    : <>
                        <button onClick={prendrePhoto} style={{...btnP,flex:1,justifyContent:'center',background:'#a32d2d'}}>
                          <i className="ti ti-circle-filled"/>Capturer
                        </button>
                        <button onClick={arreterCamera} style={{...btnSm,padding:'8px 12px'}}>
                          <i className="ti ti-check"/>Terminer
                        </button>
                      </>
                  }
                </div>
                {/* Miniatures photos prises */}
                {photosCapturees.length>0&&(
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                    {photosCapturees.map((p,i)=>(
                      <div key={i} style={{position:'relative'}}>
                        <img src={p} alt={'photo '+i} style={{width:52,height:52,objectFit:'cover',borderRadius:8,border:'0.5px solid #d3d1c7'}}/>
                        <button onClick={()=>setPhotosCapturees(prev=>prev.filter((_,j)=>j!==i))}
                          style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:'#a32d2d',border:'none',color:'#fff',fontSize:9,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Lot form */}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={card}>
                  <div style={{...ct,marginBottom:14}}>Informations du lot <span style={{fontWeight:400,fontSize:12,color:'#888780'}}>(optionnel)</span></div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div>
                      <div style={{fontSize:12,color:'#888780',marginBottom:5}}>N° de lot <span style={{fontWeight:400,fontSize:11}}>(auto si vide)</span></div>
                      <input placeholder="Laissez vide pour générer automatiquement" value={formLot.numero_lot||''} onChange={e=>setFormLot({...formLot,numero_lot:e.target.value})} style={inp}/>
                    </div>

                    {/* Produits mercuriale — multi-sélection */}
                    <div>
                      <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Produits mercuriale <span style={{fontWeight:400,fontSize:11}}>(optionnel — plusieurs possibles)</span></div>
                      <div style={{display:'flex',gap:6,marginBottom:6}}>
                        <input
                          placeholder="Tapez pour chercher..."
                          list="produits-list-traca"
                          id="produit-traca-input"
                          style={{...inp,flex:1}}
                          onKeyDown={e=>{
                            if(e.key==='Enter'){
                              const val=e.target.value.trim()
                              if(!val) return
                              const match=produits.find(p=>p.nom.toLowerCase()===val.toLowerCase())
                              const already=lignesProduits.some(l=>l.type==='produit'&&l.nom===val)
                              if(!already) setLignesProduits(prev=>[...prev,{type:'produit',id:match?match.id:'',nom:val}])
                              e.target.value=''
                            }
                          }}
                        />
                        <datalist id="produits-list-traca">{produits.map(p=><option key={p.id} value={p.nom}/>)}</datalist>
                        <button onClick={()=>{
                          const inp2=document.getElementById('produit-traca-input')
                          const val=inp2?.value.trim()
                          if(!val) return
                          const match=produits.find(p=>p.nom.toLowerCase()===val.toLowerCase())
                          const already=lignesProduits.some(l=>l.type==='produit'&&l.nom===val)
                          if(!already) setLignesProduits(prev=>[...prev,{type:'produit',id:match?match.id:'',nom:val}])
                          if(inp2) inp2.value=''
                        }} style={{...btnSmP,padding:'8px 12px'}}><i className="ti ti-plus"/>Ajouter</button>
                      </div>
                      {lignesProduits.filter(l=>l.type==='produit').length>0&&(
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {lignesProduits.filter(l=>l.type==='produit').map((l,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'#e6f1fb',borderRadius:8,padding:'5px 10px'}}>
                              <i className="ti ti-box" style={{color:'#0c447c',fontSize:12}}/>
                              <span style={{flex:1,fontSize:12,fontWeight:500,color:'#0c447c'}}>{l.nom}</span>
                              <button onClick={()=>setLignesProduits(prev=>prev.filter(x=>!(x.type==='produit'&&x.nom===l.nom)))}
                                style={{background:'none',border:'none',cursor:'pointer',color:'#a32d2d',fontSize:11,padding:'2px 4px'}}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fiches recettes — multi-sélection */}
                    <div>
                      <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Fiches recettes / productions <span style={{fontWeight:400,fontSize:11}}>(optionnel — plusieurs possibles)</span></div>
                      <div style={{display:'flex',gap:6,marginBottom:6}}>
                        <select value={selectRecetteId} onChange={e=>{
                          const rid=e.target.value
                          setSelectRecetteId(rid)
                          if(!rid) return
                          const r=recettes.find(x=>x.id===rid)
                          if(!r) return
                          const already=lignesProduits.some(l=>l.type==='recette'&&l.id===r.id)
                          if(!already) setLignesProduits(prev=>[...prev,{type:'recette',id:r.id,nom:r.nom}])
                          setTimeout(()=>setSelectRecetteId(''),100)
                        }} style={{...inp,flex:1}}>
                          <option value="">Sélectionner une recette...</option>
                          {recettes.map(r=><option key={r.id} value={r.id}>{r.nom}</option>)}
                        </select>
                      </div>
                      {lignesProduits.filter(l=>l.type==='recette').length>0&&(
                        <div style={{display:'flex',flexDirection:'column',gap:6}}>
                          {lignesProduits.filter(l=>l.type==='recette').map((l,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'#eeedfe',borderRadius:10,padding:'6px 12px'}}>
                              <i className="ti ti-file-text" style={{color:'#534ab7',fontSize:13}}/>
                              <span style={{flex:1,fontSize:13,fontWeight:500,color:'#534ab7'}}>{l.nom}</span>
                              <button onClick={()=>setLignesProduits(prev=>prev.filter(x=>!(x.type==='recette'&&x.id===l.id)))}
                                style={{background:'none',border:'none',cursor:'pointer',color:'#a32d2d',fontSize:12,padding:'2px 4px'}}>✕ Retirer</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Date de production</div>
                      <input type="date" value={formLot.date_production||''} onChange={e=>setFormLot({...formLot,date_production:e.target.value})} style={inp}/>
                    </div>
                  </div>
                </div>
                <button onClick={creerLot} disabled={uploadingPhoto}
                  style={{...btnP,padding:14,justifyContent:'center',opacity:uploadingPhoto?0.7:1}}>
                  <i className="ti ti-check"/>
                  {uploadingPhoto?'Upload photo...':'Enregistrer le lot'+(photosCapturees.length>0?' ('+photosCapturees.length+' photo(s))':'')}
                </button>
                <div style={{fontSize:12,color:'#888780',textAlign:'center'}}>
                  Tout est optionnel — vous pouvez enregistrer juste une photo ou juste un lot
                </div>
              </div>
            </div>
          )}

          {tracaTab==='lots' && (
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,flexWrap:'wrap'}}>
                <input value={searchLot} onChange={e=>setSearchLot(e.target.value)} placeholder="Rechercher un lot ou produit…" style={{...inp,maxWidth:300}}/>
                <span style={{fontSize:12,color:'#888780',marginLeft:'auto'}}>{lots.length} lots enregistrés</span>
              </div>
              {lotsFiltres.length===0
                ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun lot enregistré</div>
                : <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr>
                      {['N Lot','Produit(s)','Production','Date','Photos','Statut',''].map(h=><th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {lotsFiltres.map(l=>(
                        <tr key={l.id} style={{background:l.rappele?'#fff8f8':'#fff'}}>
                          <td style={{...td,fontFamily:'monospace',fontWeight:500,color:'#534ab7'}}>{l.numero_lot}</td>
                          <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{l.produit_nom||l.produits?.nom||'—'}</td>
                          <td style={{...td,color:'#534ab7',fontWeight:500}}>{l.recettes?.nom||'—'}</td>
                          <td style={{...td,color:'#888780'}}>{fmt(l.date_production)}</td>
                          <td style={td}>
                            {(()=>{
                              let urls=[]
                              try{urls=JSON.parse(l.photos_urls||'[]')}catch(e){}
                              if(urls.length===0&&l.photo_url) urls=[l.photo_url]
                              if(urls.length===0) return <span style={{color:'#d3d1c7',fontSize:11}}>—</span>
                              return <div style={{display:'flex',gap:3,alignItems:'center'}}>
                                {urls.slice(0,3).map((u,i)=>(
                                  <img key={i} src={u} alt={'p'+i}
                                    onClick={()=>setModalCarousel({urls,idx:i})}
                                    style={{width:32,height:32,objectFit:'cover',borderRadius:4,cursor:'pointer',border:'0.5px solid #d3d1c7'}}/>
                                ))}
                                {urls.length>3&&(
                                  <span onClick={()=>setModalCarousel({urls,idx:3})}
                                    style={{fontSize:11,color:'#534ab7',cursor:'pointer',fontWeight:600,padding:'2px 4px',borderRadius:4,background:'#eeedfe'}}>
                                    +{urls.length-3}
                                  </span>
                                )}
                              </div>
                            })()}
                          </td>
                          <td style={td}><span style={badge(!l.rappele)}>{l.rappele?'Rappele':'OK'}</span></td>
                          <td style={{...td,textAlign:'right'}}>
                            <button onClick={()=>basculerRappel(l.id,l.rappele)} style={{...btnSm,color:l.rappele?'#27500a':'#a32d2d',borderColor:l.rappele?'#97c459':'#f09595',background:l.rappele?'#eaf3de':'#fcebeb'}}>
                              {l.rappele?'Annuler':'Marquer rappele'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
          )}
        </div>
      )}

      {/* ── RÉCEPTION ── */}
      {tab==='reception' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[{id:'saisie',label:'Nouvelle réception'},{id:'historique',label:'Historique'}].map(t=>(
              <button key={t.id} onClick={()=>setRecepTab(t.id)} style={innerTab(recepTab===t.id)}>{t.label}</button>
            ))}
          </div>

          {recepTab==='saisie' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {/* Colonne gauche */}
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={card}>
                    <div style={{...ct,marginBottom:14}}>Livraison</div>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      <div>
                        <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Fournisseur *</div>
                        <input value={formRecep.fournisseur} onChange={e=>setFormRecep({...formRecep,fournisseur:e.target.value})}
                          list="fourn-list-r" placeholder="Nom du fournisseur..." style={inp}/>
                        <datalist id="fourn-list-r">{fournisseurs.map(f=><option key={f.id} value={f.nom}/>)}</datalist>
                      </div>
                      <div>
                        <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Description de la livraison <span style={{fontWeight:400,fontSize:11}}>(optionnel)</span></div>
                        <input value={formRecep.produit_nom} onChange={e=>setFormRecep({...formRecep,produit_nom:e.target.value})}
                          placeholder="Ex: Commande hebdo viandes, Livraison légumes du mardi..." style={inp}/>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div>
                          <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Date réception</div>
                          <input type="date" value={formRecep.date_reception||new Date().toISOString().split('T')[0]}
                            onChange={e=>setFormRecep({...formRecep,date_reception:e.target.value})} style={inp}/>
                        </div>
                        <div>
                          <div style={{fontSize:12,color:'#888780',marginBottom:5}}>N° bon de livraison</div>
                          <input value={formRecep.bon_livraison||''} onChange={e=>setFormRecep({...formRecep,bon_livraison:e.target.value})}
                            placeholder="Laissez vide pour générer automatiquement" style={inp}/>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo BL */}
                  <div style={card}>
                    <div style={{...ct,marginBottom:10}}>Photo du bon de livraison</div>
                    <div style={{position:'relative',background:'#1a1a1a',borderRadius:10,overflow:'hidden',aspectRatio:'4/3',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {recepCameraActive&&<video ref={recepVideoRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
                      {recepPhoto&&!recepCameraActive&&<img src={recepPhoto} alt="BL" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
                      {!recepCameraActive&&!recepPhoto&&<div style={{textAlign:'center',color:'#888780'}}><i className="ti ti-camera" style={{fontSize:36,display:'block',marginBottom:6}}/><div style={{fontSize:12}}>Photo du BL</div></div>}
                      <canvas ref={recepCanvasRef} style={{display:'none'}}/>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      {!recepCameraActive&&!recepPhoto&&<button onClick={demarrerCameraRecep} style={{...btnSmP,flex:1,justifyContent:'center'}}><i className="ti ti-camera"/>Photographier</button>}
                      {recepCameraActive&&<><button onClick={prendrePhotoRecep} style={{...btnSmP,flex:1,justifyContent:'center',background:'#a32d2d'}}><i className="ti ti-circle-filled"/>Capturer</button><button onClick={arreterCameraRecep} style={{...btnSm,padding:'6px 10px'}}><i className="ti ti-x"/></button></>}
                      {recepPhoto&&!recepCameraActive&&<><button onClick={demarrerCameraRecep} style={{...btnSm,flex:1,justifyContent:'center'}}><i className="ti ti-refresh"/>Reprendre</button><button onClick={()=>setRecepPhoto(null)} style={{...btnSm,color:'#a32d2d',borderColor:'#f09595',background:'#fcebeb',padding:'6px 8px'}}><i className="ti ti-trash"/></button></>}
                    </div>
                  </div>

                  {/* Températures par type de produit */}
                  <div style={card}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                      <div style={ct}>Températures à réception</div>
                      <button onClick={()=>setFormRecep({...formRecep,lignesTemp:[...(formRecep.lignesTemp||[]),{type:'frais',temperature:''}]})}
                        style={{...btnSm,fontSize:11,padding:'4px 10px'}}><i className="ti ti-plus"/>Ajouter</button>
                    </div>
                    {!(formRecep.lignesTemp?.length>0)&&(
                      <div style={{fontSize:12,color:'#b4b2a9',textAlign:'center',padding:'8px 0'}}>
                        Cliquez sur + pour ajouter un relevé de température par type de produit
                      </div>
                    )}
                    {(formRecep.lignesTemp||[]).map((ligne,i)=>{
                      const configs = {
                        sec:    {label:'Stockage sec',     max:null,  ex:'pas de temp.'},
                        frais:  {label:'Produits frais',   max:4,     ex:'ex: 3.5'},
                        charcuterie:{label:'Charcuterie',  max:8,     ex:'ex: 6'},
                        surgele:{label:'Surgelé',          max:-18,   ex:'ex: -20'},
                        chaud:  {label:'Produits chauds',  max:63,    ex:'ex: 65'},
                      }
                      const cfg = configs[ligne.type]||configs.frais
                      const t = parseFloat(ligne.temperature)
                      const ok = cfg.max===null ? true : isNaN(t) ? true : (ligne.type==='chaud' ? t>=cfg.max : t<=cfg.max)
                      const hasTemp = ligne.temperature!=='' && !isNaN(t)
                      return (
                        <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'10px 12px',borderRadius:10,background:'#f8f7f4',border:`0.5px solid ${hasTemp?(ok?'#97c459':'#f09595'):'#e2e0d8'}`,marginBottom:8}}>
                          <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                            <select value={ligne.type} onChange={e=>{const u=[...formRecep.lignesTemp];u[i]={...ligne,type:e.target.value,temperature:''};setFormRecep({...formRecep,lignesTemp:u})}} style={{...inp,fontSize:12}}>
                              <option value="sec">Stockage sec (pas de relevé)</option>
                              <option value="frais">Produits frais (max 4°C)</option>
                              <option value="charcuterie">Charcuterie / Fromage (max 8°C)</option>
                              <option value="surgele">Surgelé (max -18°C)</option>
                              <option value="chaud">Produits chauds (min 63°C)</option>
                            </select>
                            {cfg.max!==null&&(
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <input type="number" step="0.1" value={ligne.temperature}
                                  onChange={e=>{const u=[...formRecep.lignesTemp];u[i]={...ligne,temperature:e.target.value};setFormRecep({...formRecep,lignesTemp:u})}}
                                  placeholder={cfg.ex} style={{...inp,flex:1}}/>
                                <span style={{fontSize:12,color:'#888780',whiteSpace:'nowrap'}}>°C</span>
                                {hasTemp&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:6,fontWeight:500,background:ok?'#eaf3de':'#fcebeb',color:ok?'#27500a':'#a32d2d',whiteSpace:'nowrap'}}>
                                  {ok?'✓ OK':'✗ NON'}
                                </span>}
                              </div>
                            )}
                            {cfg.max===null&&<div style={{fontSize:12,color:'#888780',padding:'4px 0'}}>Pas de relevé de température requis pour le sec</div>}
                          </div>
                          <button onClick={()=>{const u=formRecep.lignesTemp.filter((_,j)=>j!==i);setFormRecep({...formRecep,lignesTemp:u})}}
                            style={{...btnSm,color:'#a32d2d',borderColor:'#f09595',background:'#fcebeb',padding:'5px 7px',flexShrink:0}}><i className="ti ti-x"/></button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Colonne droite */}
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={card}>
                    <div style={{...ct,marginBottom:14}}>Checklist de conformité</div>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {[
                        {key:'emballage',label:'Emballage intact, sans dommage'},
                        {key:'dlc',label:'DLC/DDM valide et lisible'},
                        {key:'odeur',label:'Odeur normale'},
                        {key:'aspect',label:'Aspect visuel correct'},
                        {key:'vehicule',label:'Véhicule de livraison propre'},
                        {key:'etiquetage',label:'Étiquetage réglementaire conforme'},
                      ].map(item=>{
                        const val=formRecep[item.key]
                        return (
                          <div key={item.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:10,background:'#f8f7f4',border:`0.5px solid ${val===true?'#97c459':val===false?'#f09595':'#e2e0d8'}`}}>
                            <span style={{fontSize:13,color:'#2c2c2a'}}>{item.label}</span>
                            <div style={{display:'flex',gap:5}}>
                              <button onClick={()=>setFormRecep({...formRecep,[item.key]:true})} style={{padding:'4px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,background:val===true?'#639922':'#e2e0d8',color:val===true?'#fff':'#5f5e5a'}}>✓ OK</button>
                              <button onClick={()=>setFormRecep({...formRecep,[item.key]:false})} style={{padding:'4px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,background:val===false?'#a32d2d':'#e2e0d8',color:val===false?'#fff':'#5f5e5a'}}>✗ NON</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Retours produits */}
                  <div style={card}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                      <div style={{...ct}}>Retours (optionnel)</div>
                      <button onClick={()=>setRetourLignes(prev=>[...prev,{produit_id:'',produit_nom:'',quantite:'',raison:''}])}
                        style={{...btnSm,fontSize:11,padding:'4px 10px'}}><i className="ti ti-plus"/>Ajouter</button>
                    </div>
                    {retourLignes.length===0
                      ? <div style={{fontSize:12,color:'#b4b2a9',textAlign:'center',padding:'8px 0'}}>Aucun retour — tout a été accepté</div>
                      : retourLignes.map((r,i)=>(
                          <div key={i} style={{display:'flex',flexDirection:'column',gap:6,padding:10,borderRadius:8,background:'#fff5f5',border:'0.5px solid #f09595',marginBottom:8}}>
                            <div style={{display:'flex',gap:6,alignItems:'center'}}>
                              <input value={r.produit_nom} onChange={e=>{
                                const val=e.target.value
                                const fourn=fournisseurs.find(f=>f.nom===formRecep.fournisseur)
                                const produitsFourn=fourn&&produits.some(p=>p.fournisseur_id===fourn.id)
                                  ? produits.filter(p=>p.fournisseur_id===fourn.id)
                                  : produits
                                const match=produitsFourn.find(p=>p.nom.toLowerCase()===val.toLowerCase())
                                const updated=[...retourLignes]; updated[i]={...r,produit_nom:val,produit_id:match?match.id:''}
                                setRetourLignes(updated)
                              }} list={"produits-retour-"+i} placeholder="Produit mercuriale ou nom libre..." style={{...inp,flex:2}}/>
                              <datalist id={"produits-retour-"+i}>
                                {(()=>{
                                  const fourn=fournisseurs.find(f=>f.nom===formRecep.fournisseur)
                                  // Produits liés au fournisseur en premier, puis les autres
                                  const liesFourn = fourn ? produits.filter(p=>p.fournisseur_id===fourn.id) : []
                                  const autres = fourn ? produits.filter(p=>p.fournisseur_id!==fourn.id) : produits
                                  const list = liesFourn.length>0 ? liesFourn : produits
                                  return list.map(p=><option key={p.id} value={p.nom}/>)
                                })()}
                              </datalist>
                              <input type="number" min="0" step="0.1" value={r.quantite} onChange={e=>{const u=[...retourLignes];u[i]={...r,quantite:e.target.value};setRetourLignes(u)}}
                                placeholder="Qté" style={{...inp,flex:1,minWidth:60}}/>
                              <button onClick={()=>setRetourLignes(prev=>prev.filter((_,j)=>j!==i))} style={{...btnSm,color:'#a32d2d',borderColor:'#f09595',background:'#fcebeb',padding:'6px 8px',flexShrink:0}}><i className="ti ti-x"/></button>
                            </div>
                            <select value={['DLC dépassée','Emballage abîmé','Température non conforme','Erreur de commande','Produit avarié','Quantité incorrecte'].includes(r.raison)?r.raison:r.raison?'Autre':''}
                              onChange={e=>{const u=[...retourLignes];u[i]={...r,raison:e.target.value==='Autre'?'':e.target.value};setRetourLignes(u)}}
                              style={{...inp,fontSize:12,borderColor:!r.raison?'#f09595':'#d3d1c7'}}>
                              <option value="" disabled>Raison du retour *</option>
                              <option value="DLC dépassée">DLC dépassée</option>
                              <option value="Emballage abîmé">Emballage abîmé</option>
                              <option value="Température non conforme">Température non conforme</option>
                              <option value="Erreur de commande">Erreur de commande</option>
                              <option value="Produit avarié">Produit avarié</option>
                              <option value="Quantité incorrecte">Quantité incorrecte</option>
                              <option value="Autre">Autre (préciser ci-dessous)</option>
                            </select>
                            {(!['DLC dépassée','Emballage abîmé','Température non conforme','Erreur de commande','Produit avarié','Quantité incorrecte'].includes(r.raison))&&(
                              <input value={r.raison||''} onChange={e=>{const u=[...retourLignes];u[i]={...r,raison:e.target.value};setRetourLignes(u)}}
                                placeholder="Précisez la raison..." style={{...inp,fontSize:12,marginTop:4}}/>
                            )}
                          </div>
                        ))
                    }
                  </div>

                  <div style={card}>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Commentaire / Action corrective</div>
                    <textarea value={formRecep.commentaire||''} onChange={e=>setFormRecep({...formRecep,commentaire:e.target.value})}
                      placeholder="Ex: Refus livraison, produit retourné, appel fournisseur..."
                      style={{...inp,minHeight:60,resize:'vertical',fontFamily:'inherit'}}/>
                    <div style={{fontSize:11,color:'#888780',marginTop:4}}>Reçu par : <strong>{userConnecte||'Equipe'}</strong></div>
                  </div>

                  <button onClick={async()=>{
                    if(!formRecep.fournisseur){showToast('Fournisseur requis','err');return}
                    const checkKeys=['emballage','dlc','odeur','aspect','vehicule','etiquetage']
                    const lignesTemp = formRecep.lignesTemp||[]
                    const tempOk = lignesTemp.every(l=>{
                      if(l.type==='sec') return true
                      const configs={frais:4,charcuterie:8,surgele:-18,chaud:63}
                      const max=configs[l.type]
                      const t=parseFloat(l.temperature)
                      if(!l.temperature||isNaN(t)) return true
                      return l.type==='chaud'?t>=max:t<=max
                    })
                    const checkOk=checkKeys.every(k=>formRecep[k]!==false)
                    const conforme=tempOk&&checkOk
                    let photoUrl=null
                    if(recepPhoto){
                      const blob=await fetch(recepPhoto).then(r=>r.blob())
                      const fname='tracabilite/'+etabId+'/recep_'+Date.now()+'.jpg'
                      const {error:upErr}=await supabase.storage.from('tracabilite').upload(fname,blob,{contentType:'image/jpeg',upsert:true})
                      if(!upErr){const {data:ud}=supabase.storage.from('tracabilite').getPublicUrl(fname);photoUrl=ud.publicUrl}
                    }
                    const {error}=await supabase.from('haccp_receptions').insert({
                      fournisseur:formRecep.fournisseur,produit_nom:formRecep.produit_nom,
                      date_reception:formRecep.date_reception||new Date().toISOString().split('T')[0],
                      bon_livraison:formRecep.bon_livraison||('BL-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.floor(Math.random()*900+100)),
                      temperature:null,
                      temp_max:null,conforme,
                      lignes_temp:JSON.stringify(formRecep.lignesTemp||[]),
                      commentaire:formRecep.commentaire||null,
                      checks:JSON.stringify({emballage:formRecep.emballage,dlc:formRecep.dlc,odeur:formRecep.odeur,aspect:formRecep.aspect,vehicule:formRecep.vehicule,etiquetage:formRecep.etiquetage}),
                      retours:retourLignes.length>0?JSON.stringify(retourLignes):null,
                      photo_url:photoUrl,recu_par:userConnecte||'Equipe',etablissement_id:etabId
                    })
                    if(error){showToast('Erreur: '+error.message,'err');return}
                    setFormRecep({fournisseur:'',produit_nom:'',date_reception:new Date().toISOString().split('T')[0],bon_livraison:'',commentaire:'',lignesTemp:[],emballage:null,dlc:null,odeur:null,aspect:null,vehicule:null,etiquetage:null})
                    setRetourLignes([]);setRecepPhoto(null)
                    charger();showToast(conforme?'Réception conforme !':'⚠️ Non-conformité enregistrée !',conforme?'ok':'err')
                  }} style={{...btnP,padding:14,justifyContent:'center'}}>
                    <i className="ti ti-check"/>Enregistrer la réception
                  </button>
                </div>
              </div>
            </div>
          )}

          {recepTab==='historique' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Filtres */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
                  <div style={ct}>Filtres</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <input placeholder="Fournisseur..." value={recepHistoFiltre.fournisseur}
                      onChange={e=>setRecepHistoFiltre({...recepHistoFiltre,fournisseur:e.target.value})}
                      style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <input type="date" value={recepHistoFiltre.debut} onChange={e=>setRecepHistoFiltre({...recepHistoFiltre,debut:e.target.value})}
                      style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <span style={{fontSize:12,color:'#888780'}}>→</span>
                    <input type="date" value={recepHistoFiltre.fin} onChange={e=>setRecepHistoFiltre({...recepHistoFiltre,fin:e.target.value})}
                      style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}/>
                    <select value={recepHistoFiltre.statut} onChange={e=>setRecepHistoFiltre({...recepHistoFiltre,statut:e.target.value})}
                      style={{...inp,width:'auto',padding:'6px 10px',fontSize:13}}>
                      <option value="">Tous</option>
                      <option value="conforme">Conforme</option>
                      <option value="non_conforme">Non conforme</option>
                    </select>
                    <button onClick={()=>setRecepHistoFiltre({fournisseur:'',debut:'',fin:'',statut:''})} style={{...btnSm,color:'#888780'}}>Tout</button>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>{
                    const sep=';';const nl=String.fromCharCode(10)
                    const filtered=receptions.filter(r=>{
                      if(recepHistoFiltre.fournisseur&&!r.fournisseur?.toLowerCase().includes(recepHistoFiltre.fournisseur.toLowerCase())) return false
                      if(recepHistoFiltre.debut&&r.date_reception<recepHistoFiltre.debut) return false
                      if(recepHistoFiltre.fin&&r.date_reception>recepHistoFiltre.fin) return false
                      if(recepHistoFiltre.statut==='conforme'&&!r.conforme) return false
                      if(recepHistoFiltre.statut==='non_conforme'&&r.conforme) return false
                      return true
                    })
                    const headers=['Date','Fournisseur','Description','BL','Temperatures','Conforme','Recu par','Retours','Commentaire'].join(sep)
                    const rows=filtered.map(r=>{
                      let retoursStr=''
                      try{const ret=JSON.parse(r.retours||'[]');retoursStr=ret.filter(t=>t.produit_nom).map(t=>(t.produit_nom||'')+(t.quantite?' x'+t.quantite:'')+(t.raison?' - '+t.raison:'')).join(' | ')}catch(e){retoursStr=''}
                      const clean=s=>s?String(s).replace(/[;"\n\r]/g,' '):'' 
return [r.date_reception,r.fournisseur,clean(r.produit_nom),clean(r.bon_livraison),r.temperature!=null?r.temperature+'C':'',r.conforme?'Oui':'Non',clean(r.recu_par),'"'+retoursStr.replace(/"/g,"'")+'"',clean(r.commentaire)].join(sep)
                    })
                    const csv=(etabNom?etabNom+nl:'')+[headers,...rows].join(nl)
                    const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download=(etabNom?etabNom+'_':'')+'receptions.csv';a.click()
                  }} style={{...btnSm,background:'#eaf3de',color:'#27500a',borderColor:'#97c459'}}>
                    <i className="ti ti-download"/>Télécharger CSV
                  </button>
                </div>
              </div>
              {/* Tableau */}
              <div style={card}>
                {(()=>{
                  const filtered=receptions.filter(r=>{
                    if(recepHistoFiltre.fournisseur&&!r.fournisseur?.toLowerCase().includes(recepHistoFiltre.fournisseur.toLowerCase())) return false
                    if(recepHistoFiltre.debut&&r.date_reception<recepHistoFiltre.debut) return false
                    if(recepHistoFiltre.fin&&r.date_reception>recepHistoFiltre.fin) return false
                    if(recepHistoFiltre.statut==='conforme'&&!r.conforme) return false
                    if(recepHistoFiltre.statut==='non_conforme'&&r.conforme) return false
                    return true
                  })
                  if(filtered.length===0) return <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucune réception</div>
                  return (
                    <div style={{overflowX:'auto'}}>
                      <div style={{fontSize:12,color:'#888780',marginBottom:8}}>{filtered.length} réception(s)</div>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                        <thead><tr>{['Date','Fournisseur','Description','BL','Temperatures','Retours','Statut','Photo','Recu par'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {filtered.map(r=>{
                            let lTemp=[]; try{lTemp=JSON.parse(r.lignes_temp||'[]')}catch(e){}
                            let retours=[]; try{retours=JSON.parse(r.retours||'[]')}catch(e){}
                            let checks={}; try{checks=JSON.parse(r.checks||'{}')}catch(e){}
                            const checkLabels={emballage:'Emballage',dlc:'DLC',odeur:'Odeur',aspect:'Aspect',vehicule:'Vehicule',etiquetage:'Etiquetage'}
                            const nonConf=Object.entries(checks).filter(([k,v])=>v===false).map(([k])=>checkLabels[k]||k)
                            const tempLabels={sec:'Sec',frais:'Frais',charcuterie:'Charcuterie',surgele:'Surgele',chaud:'Chaud'}
                            return (
                              <tr key={r.id} style={{background:r.conforme?'#fff':'#fff8f8',cursor:'pointer'}} onClick={()=>setModalRecepDetail(r)}>
                                <td style={{...td,color:'#888780'}}>{r.date_reception?new Date(r.date_reception+'T12:00:00').toLocaleDateString('fr-FR'):'-'}</td>
                                <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{r.fournisseur}</td>
                                <td style={{...td,color:'#5f5e5a',fontSize:12}}>{r.produit_nom||'-'}</td>
                                <td style={{...td,color:'#888780',fontSize:11}}>{r.bon_livraison||'-'}</td>
                                <td style={{...td,fontSize:11}}>
                                  {lTemp.length>0
                                    ? lTemp.map((l,i)=>{
                                        const configs={frais:4,charcuterie:8,surgele:-18,chaud:63}
                                        const max=configs[l.type]
                                        const t=parseFloat(l.temperature)
                                        const ok=l.type==='sec'?true:isNaN(t)?true:(l.type==='chaud'?t>=max:t<=max)
                                        return <span key={i} style={{display:'inline-flex',gap:3,fontSize:10,padding:'1px 6px',borderRadius:6,background:ok?'#eaf3de':'#fcebeb',color:ok?'#27500a':'#a32d2d',marginRight:3,marginBottom:2}}>
                                          {tempLabels[l.type]||l.type}{l.temperature?': '+l.temperature+'C':''}
                                        </span>
                                      })
                                    : r.temperature!=null?r.temperature+'C':'-'
                                  }
                                </td>
                                <td style={td}>
                                  {retours.length>0
                                    ? <span style={{fontSize:11,color:'#a32d2d',fontWeight:500}}>{retours.length} retour(s)</span>
                                    : '-'}
                                </td>
                                <td style={td}>
                                  <span style={badge(r.conforme)}>{r.conforme?'Conforme':'Non conforme'}</span>
                                  {nonConf.length>0&&<div style={{fontSize:10,color:'#a32d2d',marginTop:2}}>{nonConf.join(', ')}</div>}
                                </td>
                                <td style={td}>
                                  {r.photo_url?<img src={r.photo_url} alt="BL" onClick={e=>{e.stopPropagation();setModalViewPhoto(r.photo_url)}}
                                    style={{width:36,height:36,objectFit:'cover',borderRadius:6,cursor:'pointer',border:'0.5px solid #d3d1c7'}}/>:'-'}
                                </td>
                                <td style={{...td,color:'#5f5e5a'}}>{r.recu_par||'-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='pms' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* Alertes expiration */}
          {(docsExpires.length>0||docsBientot.length>0)&&(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {docsExpires.map(d=>(
                <div key={d.id} style={{background:'#fcebeb',border:'1.5px solid #f09595',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
                  <i className="ti ti-alert-triangle" style={{color:'#a32d2d',fontSize:18,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#a32d2d'}}>Document expiré : {d.nom}</div>
                    <div style={{fontSize:11,color:'#791f1f'}}>Expiré le {d.date_expiration?new Date(d.date_expiration+'T12:00:00').toLocaleDateString('fr-FR'):''} — À renouveler immédiatement</div>
                  </div>
                </div>
              ))}
              {docsBientot.filter(d=>!estExpire(d.date_expiration)).map(d=>(
                <div key={d.id} style={{background:'#faeeda',border:'1.5px solid #fac775',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
                  <i className="ti ti-clock" style={{color:'#854f0b',fontSize:18,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#854f0b'}}>Expire bientôt : {d.nom}</div>
                    <div style={{fontSize:11,color:'#633806'}}>Expire le {d.date_expiration?new Date(d.date_expiration+'T12:00:00').toLocaleDateString('fr-FR'):''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info PMS */}
          <div style={{...card,background:'#eeedfe',borderColor:'#afa9ec'}}>
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <i className="ti ti-info-circle" style={{fontSize:20,color:'#534ab7',flexShrink:0,marginTop:1}}/>
              <div style={{fontSize:13,color:'#3c3489',lineHeight:1.7}}>
                <strong>Documents obligatoires PMS :</strong> formation HACCP du personnel, contrat dératisation, analyses microbiologiques, GBPH, fiches produits nettoyants, plan de locaux, agréments sanitaires. Un inspecteur peut les demander à tout moment.
              </div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Formulaire ajout document */}
            <div style={card}>
              <div style={{...ct,marginBottom:14}}>Ajouter un document</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Nom du document *</div>
                  <input value={formDoc.nom} onChange={e=>setFormDoc({...formDoc,nom:e.target.value})}
                    placeholder="Ex: Formation HACCP Rafael, Contrat Rentokil..." style={inp}/>
                </div>
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Catégorie</div>
                  <select value={formDoc.categorie} onChange={e=>setFormDoc({...formDoc,categorie:e.target.value})} style={inp}>
                    <option value="">Sélectionner...</option>
                    <option value="formation">Formation HACCP / Hygiène</option>
                    <option value="nuisibles">Lutte contre les nuisibles</option>
                    <option value="analyses">Analyses microbiologiques</option>
                    <option value="nettoyage">Produits de nettoyage (FDS)</option>
                    <option value="eau">Contrôle de l eau</option>
                    <option value="agrement">Agrément sanitaire</option>
                    <option value="plan">Plan des locaux</option>
                    <option value="gbph">GBPH / Guide bonnes pratiques</option>
                    <option value="medical">Aptitude médicale personnel</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Date d expiration (optionnel)</div>
                  <input type="date" value={formDoc.date_expiration} onChange={e=>setFormDoc({...formDoc,date_expiration:e.target.value})} style={inp}/>
                  {formDoc.date_expiration&&(()=>{
                    const d=new Date(formDoc.date_expiration+'T12:00:00')
                    const jours=Math.ceil((d-new Date())/86400000)
                    return <div style={{fontSize:11,marginTop:4,color:jours<0?'#a32d2d':jours<30?'#854f0b':'#27500a'}}>
                      {jours<0?'Déjà expiré !':jours<30?'Expire dans '+jours+' jours':'Valide '+jours+' jours'}
                    </div>
                  })()}
                </div>
                {formDoc.categorie==='autre'&&(
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Précisez la catégorie *</div>
                    <input value={formDoc.categorie_autre||''} onChange={e=>setFormDoc({...formDoc,categorie_autre:e.target.value})}
                      placeholder="Ex: Agrément bio, Certification ISO..." style={inp}/>
                  </div>
                )}
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Notes / Commentaire</div>
                  <input value={formDoc.commentaire||''} onChange={e=>setFormDoc({...formDoc,commentaire:e.target.value})}
                    placeholder="Ex: Renouvellement prévu en mars, contact: 01 23 45 67..." style={inp}/>
                </div>
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Importer le document (PDF, image)</div>
                  <label style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,border:'1.5px dashed #d3d1c7',cursor:'pointer',background:'#f8f7f4'}}>
                    <i className="ti ti-upload" style={{color:'#534ab7',fontSize:18}}/>
                    <span style={{fontSize:13,color:pmsUploadFile?'#534ab7':'#888780'}}>
                      {pmsUploadFile?pmsUploadFile.name:'Cliquez pour importer un fichier'}
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{display:'none'}}
                      onChange={e=>setPmsUploadFile(e.target.files[0]||null)}/>
                  </label>
                  {pmsUploadFile&&<div style={{fontSize:11,color:'#534ab7',marginTop:4}}>
                    Fichier sélectionné : {(pmsUploadFile.size/1024).toFixed(0)} Ko
                  </div>}
                </div>
                <div>
                  <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Responsable</div>
                  <select value={formDoc.responsable||''} onChange={e=>setFormDoc({...formDoc,responsable:e.target.value})} style={inp}>
                    <option value="">Sélectionner...</option>
                    {equipe.map(m=><option key={m.id} value={m.nom}>{m.nom}</option>)}
                  </select>
                </div>
                <button onClick={async()=>{
                  if(!formDoc.nom){showToast('Nom requis','err');return}
                  setPmsUploading(true)
                  let fileUrl = null
                  if(pmsUploadFile) fileUrl = await uploadDocPms(pmsUploadFile)
                  setPmsUploading(false)
                  const catFinale = formDoc.categorie==='autre' ? (formDoc.categorie_autre||'autre') : formDoc.categorie
                  const {error}=await supabase.from('haccp_documents').insert({
                    nom:formDoc.nom, categorie:catFinale,
                    date_expiration:formDoc.date_expiration||null,
                    commentaire:formDoc.commentaire||null,
                    responsable:formDoc.responsable||null,
                    fichier_url:fileUrl||null,
                    etablissement_id:etabId
                  })
                  if(error){showToast('Erreur: '+error.message,'err');return}
                  setFormDoc({nom:'',categorie:'',date_expiration:'',commentaire:'',responsable:'',categorie_autre:''})
                  setPmsUploadFile(null)
                  charger(); showToast('Document ajouté !')
                }} style={{...btnP,padding:12,justifyContent:'center',marginTop:4}}>
                  <i className="ti ti-plus"/>Ajouter ce document
                </button>
              </div>
            </div>

            {/* Liste documents */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {/* Checklist obligatoire */}
              <div style={card}>
                <div style={{...ct,marginBottom:12}}>Checklist PMS obligatoire</div>
                {[
                  {label:'Formation HACCP personnel',cat:'formation'},
                  {label:'Contrat dératisation/désinsectisation',cat:'nuisibles'},
                  {label:'Analyses microbiologiques',cat:'analyses'},
                  {label:'Fiches de données sécurité (nettoyants)',cat:'nettoyage'},
                  {label:'Guide Bonnes Pratiques Hygiéniques',cat:'gbph'},
                ].map(item=>{
                  const present=documents.some(d=>d.categorie===item.cat&&!estExpire(d.date_expiration))
                  return (
                    <div key={item.cat} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'0.5px solid #f1efe8'}}>
                      <div style={{width:20,height:20,borderRadius:6,background:present?'#639922':'#e2e0d8',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {present&&<i className="ti ti-check" style={{color:'#fff',fontSize:10}}/>}
                      </div>
                      <span style={{fontSize:12,color:present?'#27500a':'#a32d2d',flex:1}}>{item.label}</span>
                      {!present&&<span style={{fontSize:10,color:'#a32d2d'}}>Manquant</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Tableau documents */}
          <div style={card}>
            <div style={{...ct,marginBottom:14}}>{documents.length} document(s) enregistré(s)</div>
            {documents.length===0
              ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun document — commencez par ajouter vos documents obligatoires</div>
              : (()=>{
                  const cats = {formation:'Formation',nuisibles:'Nuisibles',analyses:'Analyses',nettoyage:'Nettoyage',eau:'Eau',agrement:'Agrément',plan:'Plan',gbph:'GBPH',medical:'Médical',autre:'Autre','':'Autre'}
                  const grouped = {}
                  documents.forEach(d=>{const cat=d.categorie||'autre'; if(!grouped[cat]) grouped[cat]=[]; grouped[cat].push(d)})
                  return Object.entries(grouped).map(([cat,docs])=>(
                    <div key={cat} style={{marginBottom:16}}>
                      <div style={{fontSize:11,fontWeight:600,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>{cats[cat]||cat}</div>
                      {docs.map(d=>{
                        const expire=estExpire(d.date_expiration)
                        const bientot=!expire&&expireBientot(d.date_expiration)
                        const jours=d.date_expiration?Math.ceil((new Date(d.date_expiration+'T12:00:00')-new Date())/86400000):null
                        return (
                          <div key={d.id} onClick={()=>setModalDocDetail(d)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:10,cursor:'pointer',
                            background:expire?'#fff0f0':bientot?'#fffbf0':'#fff',
                            border:`0.5px solid ${expire?'#f09595':bientot?'#fac775':'#e2e0d8'}`,marginBottom:6}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a',display:'flex',alignItems:'center',gap:6}}>
                                {d.fichier_url&&<i className="ti ti-file" style={{color:'#534ab7',fontSize:14}}/>}
                                {d.nom}
                              </div>
                              <div style={{fontSize:11,color:'#888780',marginTop:2,display:'flex',gap:12,flexWrap:'wrap'}}>
                                {d.responsable&&<span>👤 {d.responsable}</span>}
                                {d.commentaire&&<span>💬 {d.commentaire}</span>}
                                {d.date_expiration&&<span style={{color:expire?'#a32d2d':bientot?'#854f0b':'#27500a',fontWeight:500}}>
                                  {expire?'Expire':bientot?'Expire dans '+jours+'j':'Valide jusqu au'} {new Date(d.date_expiration+'T12:00:00').toLocaleDateString('fr-FR')}
                                </span>}
                              </div>
                            </div>
                            <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                              {expire&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:8,background:'#fcebeb',color:'#a32d2d',fontWeight:600}}>Expiré</span>}
                              {bientot&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:8,background:'#faeeda',color:'#854f0b',fontWeight:600}}>Bientôt</span>}
                              {!expire&&!bientot&&d.date_expiration&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:8,background:'#eaf3de',color:'#27500a',fontWeight:500}}>Valide</span>}
                              {d.fichier_url&&(
                                <a href={d.fichier_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                                  style={{...btnSm,color:'#0c447c',borderColor:'#85b7eb',background:'#e6f1fb',padding:'5px 7px',textDecoration:'none'}}>
                                  <i className="ti ti-download"/>
                                </a>
                              )}
                              <button onClick={e=>{e.stopPropagation();setModalConfirm({title:'Supprimer ce document ?',message:d.nom,onConfirm:async()=>{
                                  await supabase.from('haccp_documents').delete().eq('id',d.id)
                                  charger(); showToast('Document supprimé')
                                }})
                              }} style={{...btnSm,color:'#a32d2d',borderColor:'#f09595',background:'#fcebeb',padding:'5px 7px'}}><i className="ti ti-trash"/></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                })()
            }
          </div>
        </div>
      )}

      {tab==='huiles' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Info */}
          <div style={{...card,background:'#faeeda',borderColor:'#fac775'}}>
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <i className="ti ti-droplet" style={{fontSize:20,color:'#854f0b',flexShrink:0,marginTop:1}}/>
              <div style={{fontSize:13,color:'#633806',lineHeight:1.7}}>
                <strong>Reglementation huiles de friture :</strong><br/>
                Mesurer le taux de composes polaires (TGP) regulierement. Seuil legal : <strong>25%</strong>.<br/>
                Changer l'huile si TGP superieur a 25%, aspect visuellement degrade ou odeur anormale.<br/>
                Conserver les enregistrements pour les inspections sanitaires.
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={ct}>Suivi des huiles de friture</div>
              <button onClick={()=>setModalAddHuile(true)} style={btnP}><i className="ti ti-plus"/>Nouvel enregistrement</button>
            </div>
            {huiles.length===0
              ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun enregistrement — cliquez sur "Nouvel enregistrement"</div>
              : <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr>
                      {['Date','Heure','Bac/Friteuse','Type','TGP (%)','Statut','Fait par','Commentaire'].map(h=><th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {huiles.map(h=>(
                        <tr key={h.id} style={{background:h.tgp_ok?'#fff':'#fff8f8'}}>
                          <td style={{...td,color:'#888780'}}>{h.fait_le?new Date(h.fait_le).toLocaleDateString('fr-FR'):'-'}</td>
                          <td style={{...td,color:'#888780'}}>{h.fait_le?new Date(h.fait_le).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'-'}</td>
                          <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{h.nom}</td>
                          <td style={td}>
                            <span style={{fontSize:11,padding:'2px 8px',borderRadius:8,fontWeight:500,
                              background:h.type==='changement'?'#eaf3de':h.type==='filtrage'?'#eeedfe':'#faeeda',
                              color:h.type==='changement'?'#27500a':h.type==='filtrage'?'#3c3489':'#854f0b'}}>
                              {h.type==='changement'?'Changement':h.type==='filtrage'?'Filtrage':'Mesure TGP'}
                            </span>
                          </td>
                          <td style={{...td,fontFamily:'monospace',fontWeight:500,color:h.tgp_valeur>25?'#a32d2d':'#2c2c2a'}}>
                            {h.tgp_valeur!=null?h.tgp_valeur+'%':'-'}
                          </td>
                          <td style={td}><span style={{fontSize:11,padding:'2px 8px',borderRadius:8,fontWeight:500,background:h.tgp_ok?'#eaf3de':'#fcebeb',color:h.tgp_ok?'#27500a':'#a32d2d'}}>{h.tgp_ok?'Conforme':'Non conforme'}</span></td>
                          <td style={{...td,color:'#5f5e5a'}}>{h.fait_par||'-'}</td>
                          <td style={{...td,color:'#888780',fontSize:11,maxWidth:150}}>{h.commentaire||'-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {modalAddEquip&&(
        <Modal onClose={()=>{setModalAddEquip(false);setEditEquip(null)}} title={editEquip?'Modifier '+editEquip.nom:'Ajouter un équipement'}
          footer={<>
            <button onClick={()=>{setModalAddEquip(false);setEditEquip(null)}} style={btn}>Annuler</button>
            <button onClick={editEquip?updateEquipement:ajouterEquipement} style={btnP}>{editEquip?'Enregistrer':'Ajouter'}</button>
          </>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Nom de l'équipement *</div>
              <input placeholder="Ex: Chambre froide positive, Frigo viandes…" value={formEquip.nom} onChange={e=>setFormEquip({...formEquip,nom:e.target.value})} style={inp}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Type</div>
              <select value={formEquip.type} onChange={e=>setFormEquip({...formEquip,type:e.target.value})} style={inp}>
                <option value="froid">Froid (réfrigération / congélation)</option>
                <option value="chaud">Chaud (bain-marie, étuve)</option>
                <option value="plonge">Plonge (lave-vaisselle)</option>
                <option value="sec">Stockage sec / Ambiant</option>
              </select>
            </div>
            {formEquip.type==='sec'
              ? <div style={{background:'#f8f7f4',borderRadius:8,padding:'10px 12px',fontSize:12,color:'#888780'}}>
                  Stockage sec — pas de plage de température requise. Le relevé notera juste l'état du local (propre, rangé, sans nuisibles).
                </div>
              : <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Temp. min (°C)</div>
                    <input type="number" step="0.5" placeholder="Ex: 0" value={formEquip.temp_min} onChange={e=>setFormEquip({...formEquip,temp_min:e.target.value})} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Temp. max (°C)</div>
                    <input type="number" step="0.5" placeholder="Ex: 4" value={formEquip.temp_max} onChange={e=>setFormEquip({...formEquip,temp_max:e.target.value})} style={inp}/>
                  </div>
                </div>
            }
            <div style={{background:'#f8f7f4',borderRadius:10,padding:12}}>
              <div style={{fontSize:12,fontWeight:500,color:'#5f5e5a',marginBottom:10}}>Fréquence de relevé</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <div style={{fontSize:11,color:'#888780',marginBottom:5}}>Fois par jour</div>
                  <select value={formEquip.frequence_fois} onChange={e=>setFormEquip({...formEquip,frequence_fois:parseInt(e.target.value)})} style={inp}>
                    {[1,2,3,4].map(n=><option key={n} value={n}>{n}x / jour</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,color:'#888780',marginBottom:5}}>Tous les N jours</div>
                  <select value={formEquip.frequence_jours} onChange={e=>setFormEquip({...formEquip,frequence_jours:parseInt(e.target.value)})} style={inp}>
                    {[1,2,3,7,14].map(n=><option key={n} value={n}>tous les {n} jour{n>1?'s':''}</option>)}
                  </select>
                </div>
              </div>
              <div style={{fontSize:11,color:'#888780',marginTop:8}}>
                → {formEquip.frequence_fois}x/jour, tous les {formEquip.frequence_jours} jour(s)
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modalTemp&&(
        <Modal onClose={()=>{setModalTemp(null);setTempVal('');setTempActionCorrective('')}} title={modalTemp.nom} subtitle={'Plage autorisée : '+modalTemp.temp_min+'°C → '+modalTemp.temp_max+'°C'} maxWidth={480}
          footer={<><button onClick={()=>{setModalTemp(null);setTempVal('');setTempActionCorrective('')}} style={btn}>Annuler</button><button onClick={()=>validerTemperature()} style={btnP}>Enregistrer</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:16,background:'#f8f7f4',borderRadius:10}}>
              <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px'}}>Température mesurée</div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <input value={tempVal} onChange={e=>setTempVal(e.target.value)} type="number" step="0.1" placeholder="—"
                  style={{fontSize:36,fontWeight:500,textAlign:'center',border:'none',background:'transparent',width:120,color:'#2c2c2a',outline:'none'}} autoFocus/>
                <span style={{fontSize:18,color:'#888780'}}>°C</span>
              </div>
              {tempVal&&(()=>{ const t=parseFloat(tempVal),ok=t>=modalTemp.temp_min&&t<=modalTemp.temp_max; return (
                <span style={{fontSize:12,padding:'3px 12px',borderRadius:8,fontWeight:500,background:ok?'#eaf3de':'#fcebeb',color:ok?'#27500a':'#a32d2d'}}>{ok?'✓ Conforme':'✗ Hors norme'}</span>
              )})()}
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:8}}>Moment du relevé</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {['Matin','Midi','Soir','Nuit','Service'].map(m=>(
                  <button key={m} onClick={()=>setTempMoment(m)}
                    style={{padding:'6px 14px',borderRadius:8,fontSize:13,cursor:'pointer',fontWeight:tempMoment===m?600:400,
                      border:'1px solid '+(tempMoment===m?'#534ab7':'#d3d1c7'),
                      background:tempMoment===m?'#534ab7':'#fff',
                      color:tempMoment===m?'#fff':'#5f5e5a'}}>
                    {m}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:'#888780',marginTop:6}}>
                Saisie rétroactive possible — ex: relevé du Matin fait maintenant le soir
              </div>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Relevé par</div>
              <div style={{...inp,background:'#f8f7f4',color:userConnecte?'#2c2c2a':'#b4b2a9',cursor:'default'}}>
                {userConnecte||'Utilisateur non connecté'}
              </div>
            </div>
            {tempVal&&parseFloat(tempVal)<modalTemp.temp_min||tempVal&&parseFloat(tempVal)>modalTemp.temp_max?(
              <div style={{background:'#fcebeb',borderRadius:8,padding:12}}>
                <div style={{fontSize:12,fontWeight:500,color:'#a32d2d',marginBottom:5}}><i className="ti ti-alert-triangle" style={{marginRight:4}}/>Action corrective requise</div>
                <input placeholder="Ex: Appel technicien, transfert des produits…" value={tempActionCorrective} onChange={e=>setTempActionCorrective(e.target.value)} style={{...inp,borderColor:'#f09595'}}/>
              </div>
            ):null}
          </div>
        </Modal>
      )}

      {modalAddZoneNett&&(
        <Modal onClose={()=>{setModalAddZoneNett(false);setEditZoneNett(null)}} title={editZoneNett?"Modifier la zone":"Nouvelle zone de nettoyage"}
          footer={<><button onClick={()=>{setModalAddZoneNett(false);setEditZoneNett(null)}} style={btn}>Annuler</button><button onClick={editZoneNett?updateZoneNett:ajouterZoneNett} style={btnP}>{editZoneNett?'Modifier':'Créer'}</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Nom de la zone *</div>
              <input placeholder="Ex: Cuisine, Salle, Vestiaires…" value={formZoneNett.nom} onChange={e=>setFormZoneNett({...formZoneNett,nom:e.target.value})} style={inp}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Description (optionnel)</div>
              <input placeholder="Ex: Zone de préparation froide" value={formZoneNett.description} onChange={e=>setFormZoneNett({...formZoneNett,description:e.target.value})} style={inp}/>
            </div>
          </div>
        </Modal>
      )}

      {modalAddTache&&(
        <Modal onClose={()=>{setModalAddTache(null);setEditTache(null)}} title={editTache?"Modifier la tache":"Nouvelle tache de nettoyage"}
          footer={<><button onClick={()=>{setModalAddTache(null);setEditTache(null)}} style={btn}>Annuler</button><button onClick={editTache?updateTache:ajouterTache} style={btnP}>{editTache?'Modifier':'Créer'}</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Nom de la tâche *</div>
              <input placeholder="Ex: Désinfecter le plan de travail, Nettoyer le sol…" value={formTache.nom} onChange={e=>setFormTache({...formTache,nom:e.target.value})} style={inp}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Fréquence</div>
              <div style={{display:'flex',gap:8}}>
                <select value={['2x/jour','quotidien','2jours','hebdomadaire','2semaines','mensuel'].includes(formTache.frequence)?formTache.frequence:'custom'}
                  onChange={e=>setFormTache({...formTache,frequence:e.target.value==='custom'?'custom':e.target.value})} style={inp}>
                  <option value="2x/jour">2x par jour</option>
                  <option value="quotidien">1x par jour (quotidien)</option>
                  <option value="2jours">Tous les 2 jours</option>
                  <option value="hebdomadaire">Hebdomadaire (7 jours)</option>
                  <option value="2semaines">Toutes les 2 semaines</option>
                  <option value="mensuel">Mensuel (30 jours)</option>
                  <option value="custom">Personnalise...</option>
                </select>
                {(formTache.frequence==='custom'||(!['2x/jour','quotidien','2jours','hebdomadaire','2semaines','mensuel'].includes(formTache.frequence)&&formTache.frequence!==''))&&(
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                    <span style={{fontSize:12,color:'#888780',whiteSpace:'nowrap'}}>Tous les</span>
                    <input type="number" min="1" max="365"
                      value={formTache.frequence.startsWith('custom')||!parseInt(formTache.frequence)?'':formTache.frequence.replace('j','')}
                      onChange={e=>setFormTache({...formTache,frequence:e.target.value+'j'})}
                      style={{width:60,padding:'7px 8px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',textAlign:'center'}}/>
                    <span style={{fontSize:12,color:'#888780'}}>jours</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:4}}>Etapes de validation (optionnel)</div>
              <div style={{fontSize:11,color:'#888780',marginBottom:5}}>Separez chaque etape par un point-virgule ; — elles devront toutes etre cochees lors de la validation.</div>
              <textarea value={formTache.description} onChange={e=>setFormTache({...formTache,description:e.target.value})}
                placeholder="Ex: Desinfecter le plan de travail ; Rincer abondamment ; Secher avec un papier absorbant"
                style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',boxSizing:'border-box',minHeight:80,resize:'vertical',fontFamily:'inherit'}}/>
            </div>
          </div>
        </Modal>
      )}

      {modalAddZone&&(
        <Modal onClose={()=>setModalAddZone(false)} title="Ajouter une zone de nettoyage"
          footer={<><button onClick={()=>setModalAddZone(false)} style={btn}>Annuler</button><button onClick={ajouterZone} style={btnP}>Ajouter</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <input placeholder="Nom de la zone (ex: Plan de travail cuisine)" value={formZone.nom} onChange={e=>setFormZone({...formZone,nom:e.target.value})} style={inp}/>
            <select value={formZone.frequence} onChange={e=>setFormZone({...formZone,frequence:e.target.value})} style={inp}>
              <option value="quotidien">Quotidien</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="mensuel">Mensuel</option>
            </select>
          </div>
        </Modal>
      )}

      {modalDoc&&(
        <Modal onClose={()=>setModalDoc(false)} title="Nouveau document PMS"
          footer={<><button onClick={()=>setModalDoc(false)} style={btn}>Annuler</button><button onClick={ajouterDocument} style={btnP}>Ajouter</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <input placeholder="Nom du document *" value={formDoc.nom} onChange={e=>setFormDoc({...formDoc,nom:e.target.value})} style={inp}/>
            <input placeholder="Catégorie (ex: Protocole, Agrément, Formation…)" value={formDoc.categorie} onChange={e=>setFormDoc({...formDoc,categorie:e.target.value})} style={inp}/>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Date d'expiration (optionnel)</div>
              <input type="date" value={formDoc.date_expiration} onChange={e=>setFormDoc({...formDoc,date_expiration:e.target.value})} style={inp}/>
            </div>
          </div>
        </Modal>
      )}

      {modalValiderZone&&(
        <Modal onClose={()=>setModalValiderZone(null)} title={'Valider — '+modalValiderZone.nom} subtitle="Confirmez qui a effectué ce nettoyage."
          footer={<><button onClick={()=>setModalValiderZone(null)} style={btn}>Annuler</button><button onClick={validerNettoyage} style={btnP}><i className="ti ti-check"/>Valider</button></>}>
          <div>
            <div style={{fontSize:12,color:'#888780',marginBottom:8}}>Validé par</div>
            <select value={validerPar} onChange={e=>setValiderPar(e.target.value)} style={inp}>
              <option value="">Sélectionner…</option>
              {equipe.map(m=><option key={m.id} value={m.nom}>{m.nom}</option>)}
              <option value="Gérant">Gérant</option>
            </select>
          </div>
        </Modal>
      )}

      {modalValiderTache&&(
        <Modal onClose={()=>{setModalValiderTache(null);setChecklistDone([])}}
          title={"Valider : "+modalValiderTache.nom}
          subtitle={modalValiderTache.description?"Cochez les etapes avant de valider :":null}
          footer={<>
            <button onClick={()=>{setModalValiderTache(null);setChecklistDone([])}} style={btn}>Annuler</button>
            <button onClick={()=>{
              if(modalValiderTache.description){
                const steps=modalValiderTache.description.split(/[;,]+/).map(s=>s.trim()).filter(Boolean)
                if(checklistDone.length<steps.length){showToast("Cochez toutes les etapes","err");return}
              }
              validerTache(modalValiderTache)
              setModalValiderTache(null)
              setChecklistDone([])
            }} style={btnP}><i className="ti ti-check"/>Confirmer la validation</button>
          </>}>
          {modalValiderTache.description?(()=>{
            const steps=modalValiderTache.description.split(/[;,]+/).map(s=>s.trim()).filter(Boolean)
            return (
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:8}}>
                {steps.map((s,i)=>(
                  <label key={i} onClick={()=>setChecklistDone(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i])}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,border:`0.5px solid ${checklistDone.includes(i)?'#97c459':'#e2e0d8'}`,background:checklistDone.includes(i)?'#eaf3de':'#f8f7f4',cursor:'pointer'}}>
                    <div style={{width:20,height:20,borderRadius:6,border:`1.5px solid ${checklistDone.includes(i)?'#639922':'#d3d1c7'}`,background:checklistDone.includes(i)?'#639922':'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {checklistDone.includes(i)&&<i className="ti ti-check" style={{color:'#fff',fontSize:11}}/>}
                    </div>
                    <span style={{fontSize:13,color:'#2c2c2a'}}>{s}</span>
                  </label>
                ))}
              </div>
            )
          })():<div style={{fontSize:13,color:'#888780',padding:'12px 0'}}>Cliquez sur "Confirmer" pour valider cette tâche.</div>}
        </Modal>
      )}

      {modalAddModele&&(
        <Modal onClose={()=>setModalAddModele(false)} title="Créer un modèle d'étiquette"
          subtitle="Ce modèle apparaîtra dans la liste de suggestions avec sa DLC préconfigurée."
          footer={<><button onClick={()=>setModalAddModele(false)} style={btn}>Annuler</button><button onClick={ajouterModeleEtiq} style={btnP}>Créer</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Nom du produit *</div>
              <input placeholder="Ex: Mousse au chocolat, Fond de veau…" value={formModele.nom} onChange={e=>setFormModele({...formModele,nom:e.target.value})} style={inp}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:8}}>DLC par défaut</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {[1,2,3,5,7,14,30].map(j=>(
                  <button key={j} onClick={()=>setFormModele({...formModele,dlc_jours:j})}
                    style={{...btnSm,background:formModele.dlc_jours===j?'#eeedfe':'#fff',borderColor:formModele.dlc_jours===j?'#afa9ec':'#d3d1c7',color:formModele.dlc_jours===j?'#3c3489':'#5f5e5a',fontWeight:formModele.dlc_jours===j?600:400}}>
                    J+{j}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                <span style={{fontSize:12,color:'#888780'}}>Ou saisir manuellement :</span>
                <input type="number" min="1" max="365" value={formModele.dlc_jours} onChange={e=>setFormModele({...formModele,dlc_jours:parseInt(e.target.value)||1})}
                  style={{width:70,padding:'5px 8px',borderRadius:6,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',textAlign:'center'}}/>
                <span style={{fontSize:12,color:'#888780'}}>jours</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modalAddHuile&&(
        <Modal onClose={()=>setModalAddHuile(false)} title="Enregistrement huile de friture"
          footer={<><button onClick={()=>setModalAddHuile(false)} style={btn}>Annuler</button><button onClick={enregistrerHuile} style={btnP}>Enregistrer</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Bac / Friteuse *</div>
              <input placeholder="Ex: Friteuse 1, Bac A, Grande friteuse..." value={formHuile.nom} onChange={e=>setFormHuile({...formHuile,nom:e.target.value})} style={inp}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:8}}>Type d operation</div>
              <div style={{display:'flex',gap:8}}>
                {[{v:'changement',l:'Changement huile'},{v:'filtrage',l:'Filtrage'},{v:'mesure',l:'Mesure TGP seule'}].map(t=>(
                  <button key={t.v} onClick={()=>setFormHuile({...formHuile,type:t.v})}
                    style={{flex:1,padding:'8px 4px',borderRadius:8,fontSize:11,cursor:'pointer',fontWeight:formHuile.type===t.v?600:400,
                      border:'0.5px solid '+(formHuile.type===t.v?'#534ab7':'#d3d1c7'),
                      background:formHuile.type===t.v?'#eeedfe':'#fff',
                      color:formHuile.type===t.v?'#3c3489':'#5f5e5a',textAlign:'center'}}>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Taux TGP mesure (%) — optionnel</div>
              <input type="number" step="0.1" min="0" max="100" placeholder="Ex: 18.5" value={formHuile.tgp_valeur} onChange={e=>{
                const v=parseFloat(e.target.value)
                setFormHuile({...formHuile,tgp_valeur:e.target.value,tgp_ok:isNaN(v)||v<=25})
              }} style={inp}/>
              {formHuile.tgp_valeur&&(
                <div style={{marginTop:6,fontSize:12,fontWeight:500,color:parseFloat(formHuile.tgp_valeur)>25?'#a32d2d':'#27500a',padding:'6px 10px',borderRadius:8,background:parseFloat(formHuile.tgp_valeur)>25?'#fcebeb':'#eaf3de'}}>
                  {parseFloat(formHuile.tgp_valeur)>25?'ATTENTION : TGP superieur a 25% — Changement huile obligatoire':'TGP conforme (inferieur a 25%)'}
                </div>
              )}
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:8}}>Conformite generale</div>
              <div style={{display:'flex',gap:8}}>
                {[{v:true,l:'Conforme'},{v:false,l:'Non conforme'}].map(opt=>(
                  <button key={String(opt.v)} onClick={()=>setFormHuile({...formHuile,tgp_ok:opt.v})}
                    style={{flex:1,padding:'8px',borderRadius:8,fontSize:13,cursor:'pointer',
                      border:'0.5px solid '+(formHuile.tgp_ok===opt.v?(opt.v?'#97c459':'#f09595'):'#d3d1c7'),
                      background:formHuile.tgp_ok===opt.v?(opt.v?'#eaf3de':'#fcebeb'):'#fff',
                      color:formHuile.tgp_ok===opt.v?(opt.v?'#27500a':'#a32d2d'):'#5f5e5a',fontWeight:formHuile.tgp_ok===opt.v?600:400}}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Commentaire (optionnel)</div>
              <input placeholder="Ex: Huile fortement coloree, odeur de brulee..." value={formHuile.commentaire} onChange={e=>setFormHuile({...formHuile,commentaire:e.target.value})} style={inp}/>
            </div>
            <div style={{fontSize:11,color:'#888780',padding:'8px 12px',background:'#f8f7f4',borderRadius:8}}>
              Fait par : <strong>{userConnecte||'Equipe'}</strong> — {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
            </div>
          </div>
        </Modal>
      )}

      {modalTerminerTimer&&(
        <div onClick={e=>e.target===e.currentTarget&&setModalTerminerTimer(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:16}}>
          <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:440}}>
            <div style={{fontSize:16,fontWeight:500,color:'#2c2c2a',marginBottom:4}}>Terminer — {modalTerminerTimer.produit_nom}</div>
            <div style={{fontSize:13,color:'#888780',marginBottom:16}}>
              {modalTerminerTimer.type==='refroidissement'?'Refroidissement':'Remise en temp.'} — Durée : <strong>{formatTimer(modalTerminerTimer.elapsed)}</strong> — Départ : <strong>{modalTerminerTimer.temp_depart}°C</strong>
            </div>
            <div style={{fontSize:12,color:'#888780',marginBottom:8}}>Température finale mesurée (°C)</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:16,background:'#f8f7f4',borderRadius:12,marginBottom:12}}>
              <input type="number" step="0.1" placeholder="—" value={refroidTempFinale} onChange={e=>setRefroidTempFinale(e.target.value)} autoFocus
                style={{fontSize:38,fontWeight:600,textAlign:'center',border:'none',background:'transparent',width:110,color:'#2c2c2a',outline:'none'}}/>
              <span style={{fontSize:20,color:'#888780'}}>°C</span>
            </div>
            {refroidTempFinale&&(()=>{
              const tFin=parseFloat(refroidTempFinale)
              const dureeMin=Math.floor(modalTerminerTimer.elapsed/60)
              const tm=modalTerminerTimer
              const lim=tm.limiteMin||120
              const rows=tm.type==="remise"
                ?[{label:"Départ ≤ 10°C (produit froid)",ok:tm.temp_depart<=10,val:tm.temp_depart+"°C"},{label:"Finale ≥ 63°C",ok:tFin>=63,val:tFin+"°C"},{label:"Durée ≤ 1h",ok:dureeMin<=60,val:dureeMin+" min"}]
                :[{label:"Départ ≥ 63°C",ok:tm.temp_depart>=63,val:tm.temp_depart+"°C"},{label:"Finale ≤ 10°C",ok:tFin<=10,val:tFin+"°C"},{label:"Durée ≤ 2h",ok:dureeMin<=lim,val:dureeMin+" min"}]
              const conforme=rows.every(r=>r.ok)
              return (
                <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:12}}>
                  {rows.map(r=>(
                    <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 12px',borderRadius:8,background:r.ok?'#eaf3de':'#fcebeb'}}>
                      <span style={{fontSize:12,color:r.ok?'#27500a':'#a32d2d'}}>{r.label}</span>
                      <span style={{fontSize:12,fontWeight:600,color:r.ok?'#27500a':'#a32d2d'}}>{r.val} {r.ok?'✓':'✗'}</span>
                    </div>
                  ))}
                  <div style={{textAlign:'center',padding:'9px',borderRadius:8,background:conforme?'#eaf3de':'#fcebeb'}}>
                    <span style={{fontSize:14,fontWeight:700,color:conforme?'#27500a':'#a32d2d'}}>{conforme?'CONFORME':'NON CONFORME'}</span>
                  </div>
                </div>
              )
            })()}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setModalTerminerTimer(null)} style={{...btn,flex:1,justifyContent:'center'}}>Annuler</button>
              <button onClick={terminerRefroid} style={{...btnP,flex:1,justifyContent:'center'}}><i className="ti ti-check"/>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal envoi bon de retour par mail */}
      {modalEnvoiRetour&&(
        <div onClick={e=>e.target===e.currentTarget&&setModalEnvoiRetour(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:600,padding:16}}>
          <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:400}}>
            <div style={{fontSize:16,fontWeight:600,color:'#2c2c2a',marginBottom:4}}>Envoyer le bon de retour</div>
            <div style={{fontSize:13,color:'#888780',marginBottom:16}}>
              {modalEnvoiRetour.retours.length} retour(s) — {modalEnvoiRetour.r.fournisseur}
            </div>
            <div style={{marginBottom:10}}>
                <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Membre de l'équipe :</div>
                <select value={membreRetourId} onChange={e=>{setMembreRetourId(e.target.value);setEmailRetour('')}}
                  style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',boxSizing:'border-box'}}>
                  <option value="">— Sélectionner un membre —</option>
                  {equipe.map(m=><option key={m.id} value={m.id} disabled={!m.email}>{m.nom}{m.email?' ('+m.email+')':' (pas d email)'}</option>)}
                </select>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Ou saisir un email manuellement :</div>
              <input type="email" value={emailRetour} onChange={e=>{setEmailRetour(e.target.value);setMembreRetourId('')}}
                placeholder="fournisseur@exemple.com"
                style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{fontSize:11,color:'#888780',background:'#f8f7f4',borderRadius:8,padding:'8px 12px',marginBottom:16}}>
              Le mail contiendra le bon de retour avec les produits, quantités et raisons.
              {modalEnvoiRetour.r.photo_url&&' La photo du BL sera incluse.'}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setModalEnvoiRetour(null);setEmailRetour('')}}
                style={{flex:1,padding:'10px',borderRadius:10,border:'0.5px solid #d3d1c7',background:'#fff',color:'#5f5e5a',fontSize:13,cursor:'pointer'}}>
                Annuler
              </button>
              {(()=>{ const destEmail = membreRetourId ? equipe.find(m=>m.id===membreRetourId)?.email : emailRetour; return (
              <button disabled={sendingRetour||!destEmail||!destEmail.includes('@')}
                onClick={async()=>{
                  setSendingRetour(true)
                  try {
                    const res = await fetch('/api/envoyer-bon-retour',{
                      method:'POST',
                      headers:{'Content-Type':'application/json'},
                      body:JSON.stringify({to:membreRetourId?equipe.find(m=>m.id===membreRetourId)?.email:emailRetour,reception:modalEnvoiRetour.r,retours:modalEnvoiRetour.retours,etabNom})
                    })
                    const data = await res.json()
                    if(data.error) { showToast('Erreur: '+data.error,'err') }
                    else { showToast('Mail envoyé !'); setModalEnvoiRetour(null); setEmailRetour(''); setMembreRetourId('') }
                  } catch(e) { showToast('Erreur envoi mail','err') }
                  setSendingRetour(false)
                }}
                style={{flex:1,padding:'10px',borderRadius:10,border:'none',background:sendingRetour||!destEmail||!destEmail.includes('@')?'#d3d1c7':'#534ab7',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                {sendingRetour?'Envoi...':'Envoyer'}
              </button>)})()}
            </div>
          </div>
        </div>
      )}

      {modalRecepDetail&&(()=>{
        const r=modalRecepDetail
        let lTemp=[]; try{lTemp=JSON.parse(r.lignes_temp||'[]')}catch(e){}
        let retours=[]; try{retours=JSON.parse(r.retours||'[]')}catch(e){}
        let checks={}; try{checks=JSON.parse(r.checks||'{}')}catch(e){}
        const checkLabels={emballage:'Emballage intact',dlc:'DLC valide',odeur:'Odeur normale',aspect:'Aspect correct',vehicule:'Vehicule propre',etiquetage:'Etiquetage conforme'}
        const tempLabels={sec:'Sec',frais:'Frais',charcuterie:'Charcuterie',surgele:'Surgele',chaud:'Chaud'}
        return (
          <div onClick={e=>e.target===e.currentTarget&&setModalRecepDetail(null)}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:16}}>
            <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div>
                  <div style={{fontSize:16,fontWeight:600,color:'#2c2c2a'}}>{r.fournisseur}</div>
                  <div style={{fontSize:12,color:'#888780'}}>{r.date_reception?new Date(r.date_reception+'T12:00:00').toLocaleDateString('fr-FR'):''} {r.bon_livraison?'— '+r.bon_livraison:''}</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  {retours.length>0&&(
                    <div style={{display:'flex',gap:6}}>
                      {/* Télécharger PDF via jsPDF */}
                      <button onClick={async()=>{
                        try {
                          const {default:jsPDF} = await import('jspdf')
                          const doc = new jsPDF({orientation:'portrait',unit:'mm',format:'a4'})
                          const pageW = doc.internal.pageSize.getWidth()
                          // Header
                          doc.setFillColor(163,45,45)
                          doc.rect(0,0,pageW,28,'F')
                          doc.setTextColor(255,255,255)
                          doc.setFontSize(16); doc.setFont('helvetica','bold')
                          doc.text('Bon de retour fournisseur',14,12)
                          doc.setFontSize(10); doc.setFont('helvetica','normal')
                          doc.text(etabNom||'',14,20)
                          doc.text('Genere le '+new Date().toLocaleDateString('fr-FR'),pageW-14,20,{align:'right'})
                          // Infos
                          doc.setTextColor(44,44,42)
                          doc.setFontSize(11); doc.setFont('helvetica','bold')
                          doc.text('Fournisseur : '+r.fournisseur,14,38)
                          doc.setFont('helvetica','normal')
                          doc.text('Date : '+(r.date_reception?new Date(r.date_reception+'T12:00:00').toLocaleDateString('fr-FR'):''),14,46)
                          doc.text('N° BL : '+(r.bon_livraison||'—'),14,54)
                          doc.text('Recu par : '+(r.recu_par||'—'),14,62)
                          // Table retours
                          let y = 72
                          doc.setFillColor(248,247,244)
                          doc.rect(14,y,pageW-28,8,'F')
                          doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(136,135,128)
                          doc.text('PRODUIT',16,y+5.5)
                          doc.text('QUANTITE',100,y+5.5)
                          doc.text('RAISON',130,y+5.5)
                          y += 10
                          doc.setFont('helvetica','normal'); doc.setTextColor(44,44,42)
                          retours.forEach((ret,i)=>{
                            if(y > 270) { doc.addPage(); y = 20 }
                            if(i%2===0){doc.setFillColor(252,252,252);doc.rect(14,y-4,pageW-28,9,'F')}
                            doc.setFontSize(10)
                            doc.text(ret.produit_nom||'',16,y+1)
                            doc.text(String(ret.quantite||''),100,y+1)
                            doc.setFontSize(9); doc.setTextColor(136,135,128)
                            doc.text(ret.raison||'',130,y+1)
                            doc.setTextColor(44,44,42)
                            y += 9
                          })
                          // Photo BL si dispo
                          if(r.photo_url){
                            doc.addPage()
                            doc.setFontSize(14); doc.setFont('helvetica','bold')
                            doc.text('Photo du bon de livraison',14,20)
                            try {
                              const img = new Image(); img.crossOrigin='anonymous'
                              await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=r.photo_url})
                              const canvas=document.createElement('canvas'); canvas.width=img.width; canvas.height=img.height
                              canvas.getContext('2d').drawImage(img,0,0)
                              const imgData=canvas.toDataURL('image/jpeg',0.8)
                              doc.addImage(imgData,'JPEG',14,28,pageW-28,120,'','MEDIUM')
                            } catch(e) { doc.text('(Image non disponible)',14,40) }
                          }
                          doc.save('bon-retour-'+r.fournisseur.replace(/[^a-z0-9]/gi,'_')+'-'+new Date().toISOString().slice(0,10)+'.pdf')
                          showToast('PDF téléchargé !')
                        } catch(e) { showToast('Erreur PDF: '+e.message,'err') }
                      }} style={{padding:'6px 12px',borderRadius:8,border:'0.5px solid #f09595',background:'#fcebeb',color:'#a32d2d',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                        <i className="ti ti-file-type-pdf"/>Télécharger PDF
                      </button>
                      {/* Envoyer par mail via Resend */}
                      <button onClick={()=>setModalEnvoiRetour({r,retours})}
                        style={{padding:'6px 12px',borderRadius:8,border:'0.5px solid #85b7eb',background:'#e6f1fb',color:'#0c447c',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                        <i className="ti ti-mail"/>Envoyer par mail
                      </button>
                    </div>
                  )}
                  <button onClick={()=>setModalRecepDetail(null)} style={{padding:'6px 10px',borderRadius:8,border:'0.5px solid #d3d1c7',background:'#fff',cursor:'pointer'}}><i className="ti ti-x"/></button>
                </div>
              </div>
              <div style={{padding:'10px 14px',borderRadius:10,background:r.conforme?'#eaf3de':'#fcebeb',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                <i className={'ti '+(r.conforme?'ti-check':'ti-alert-triangle')} style={{color:r.conforme?'#27500a':'#a32d2d',fontSize:18}}/>
                <span style={{fontSize:14,fontWeight:600,color:r.conforme?'#27500a':'#a32d2d'}}>{r.conforme?'Reception conforme':'Reception non conforme'}</span>
                {r.recu_par&&<span style={{fontSize:12,color:'#888780',marginLeft:'auto'}}>par {r.recu_par}</span>}
              </div>
              {lTemp.length>0&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Temperatures</div>
                  {lTemp.map((l,i)=>{
                    const configs={frais:4,charcuterie:8,surgele:-18,chaud:63}
                    const max=configs[l.type]; const t=parseFloat(l.temperature)
                    const ok=l.type==='sec'?true:isNaN(t)?true:(l.type==='chaud'?t>=max:t<=max)
                    return <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 12px',borderRadius:8,background:ok?'#eaf3de':'#fcebeb',marginBottom:4}}>
                      <span style={{fontSize:13,color:'#2c2c2a'}}>{tempLabels[l.type]||l.type}</span>
                      <span style={{fontSize:13,fontWeight:600,color:ok?'#27500a':'#a32d2d'}}>{l.type==='sec'?'Pas de releve':l.temperature?l.temperature+'C':'Non mesure'} {l.temperature&&l.type!=='sec'?(ok?'✓':'✗'):''}</span>
                    </div>
                  })}
                </div>
              )}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Checklist</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                  {Object.entries(checkLabels).map(([k,label])=>{
                    const val=checks[k]
                    return <div key={k} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:8,background:val===true?'#eaf3de':val===false?'#fcebeb':'#f8f7f4'}}>
                      <i className={'ti '+(val===true?'ti-check':val===false?'ti-x':'ti-minus')} style={{color:val===true?'#27500a':val===false?'#a32d2d':'#b4b2a9',fontSize:12}}/>
                      <span style={{fontSize:12,color:'#2c2c2a'}}>{label}</span>
                    </div>
                  })}
                </div>
              </div>
              {retours.length>0&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Retours ({retours.length})</div>
                  {retours.map((ret,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:8,background:'#fff5f5',border:'0.5px solid #f09595',marginBottom:4}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{ret.produit_nom}</div>
                        <div style={{fontSize:11,color:'#888780'}}>{ret.raison}</div>
                      </div>
                      {ret.quantite&&<span style={{fontSize:13,fontWeight:600,color:'#a32d2d'}}>x{ret.quantite}</span>}
                    </div>
                  ))}
                </div>
              )}
              {r.commentaire&&<div style={{background:'#faeeda',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#854f0b',marginBottom:14}}><i className="ti ti-message" style={{marginRight:6}}/>{r.commentaire}</div>}
              {r.photo_url&&<div><div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Photo BL</div><img src={r.photo_url} alt="BL" onClick={()=>setModalViewPhoto(r.photo_url)} style={{width:'100%',borderRadius:10,cursor:'pointer',border:'0.5px solid #d3d1c7',maxHeight:200,objectFit:'contain'}}/></div>}
            </div>
          </div>
        )
      })()}

      {/* Modal detail document PMS */}
      {modalDocDetail&&(()=>{
        const d = modalDocDetail
        const expire = estExpire(d.date_expiration)
        const bientot = !expire && expireBientot(d.date_expiration)
        const jours = d.date_expiration ? Math.ceil((new Date(d.date_expiration+'T12:00:00')-new Date())/86400000) : null
        const catLabels = {formation:'Formation HACCP / Hygiene',nuisibles:'Lutte contre les nuisibles',analyses:'Analyses microbiologiques',nettoyage:'Produits de nettoyage',eau:'Controle de l eau',agrement:'Agrement sanitaire',plan:'Plan des locaux',gbph:'GBPH',medical:'Aptitude medicale',autre:'Autre'}
        // Historique = tous les docs de meme categorie + meme nom de base, triés par date
        const historique = documents
          .filter(x => x.categorie === d.categorie && x.id !== d.id)
          .sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0))
        return (
          <div onClick={e=>e.target===e.currentTarget&&setModalDocDetail(null)}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:16}}>
            <div style={{background:'#fff',borderRadius:16,padding:0,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}}>
              {/* Header */}
              <div style={{background:expire?'#a32d2d':bientot?'#854f0b':'#534ab7',borderRadius:'16px 16px 0 0',padding:'20px 24px',color:'#fff'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>{d.nom}</div>
                    <div style={{fontSize:12,opacity:0.85}}>{catLabels[d.categorie]||d.categorie}</div>
                  </div>
                  <button onClick={()=>setModalDocDetail(null)} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:8,padding:'6px 10px',cursor:'pointer',flexShrink:0}}>
                    <i className="ti ti-x"/>
                  </button>
                </div>
                {d.date_expiration&&(
                  <div style={{marginTop:12,background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'8px 12px',fontSize:13}}>
                    {expire ? 'Expire depuis le ' : bientot ? 'Expire le ' : 'Valide jusquau '}
                    <strong>{new Date(d.date_expiration+'T12:00:00').toLocaleDateString('fr-FR')}</strong>
                    {jours !== null && !expire && <span style={{opacity:0.8}}> ({jours} jours restants)</span>}
                    {expire && jours !== null && <span style={{opacity:0.8}}> (il y a {Math.abs(jours)} jours)</span>}
                  </div>
                )}
              </div>

              <div style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
                {/* Infos */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {d.responsable&&(
                    <div style={{background:'#f8f7f4',borderRadius:10,padding:'10px 14px'}}>
                      <div style={{fontSize:10,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Responsable</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{d.responsable}</div>
                    </div>
                  )}
                  {d.commentaire&&(
                    <div style={{background:'#f8f7f4',borderRadius:10,padding:'10px 14px'}}>
                      <div style={{fontSize:10,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Notes</div>
                      <div style={{fontSize:13,color:'#5f5e5a'}}>{d.commentaire}</div>
                    </div>
                  )}
                </div>

                {/* Fichier */}
                {d.fichier_url&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Document importé</div>
                    <a href={d.fichier_url} target="_blank" rel="noreferrer"
                      style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:10,border:'0.5px solid #afa9ec',background:'#eeedfe',textDecoration:'none',color:'#534ab7'}}>
                      <i className="ti ti-file" style={{fontSize:20}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500}}>Ouvrir / Télécharger le document</div>
                        <div style={{fontSize:11,opacity:0.7}}>Cliquez pour ouvrir dans un nouvel onglet</div>
                      </div>
                      <i className="ti ti-external-link" style={{fontSize:16}}/>
                    </a>
                  </div>
                )}

                {/* Renouvellement */}
                {(expire||bientot)&&(
                  <div style={{background:expire?'#fcebeb':'#faeeda',borderRadius:12,padding:'14px 16px',border:`0.5px solid ${expire?'#f09595':'#fac775'}`}}>
                    <div style={{fontSize:13,fontWeight:600,color:expire?'#a32d2d':'#854f0b',marginBottom:8}}>
                      {expire?'Ce document est expiré — renouvelez-le':'Ce document expire bientôt — anticipez le renouvellement'}
                    </div>
                    <button onClick={()=>{
                      setModalDocDetail(null)
                      // Pré-remplir le formulaire avec les infos du doc à renouveler
                      setFormDoc({nom:d.nom,categorie:d.categorie,date_expiration:'',commentaire:'Renouvellement de: '+d.nom,responsable:d.responsable||'',categorie_autre:''})
                      setPmsUploadFile(null)
                      showToast('Formulaire pré-rempli pour le renouvellement')
                    }} style={{...btnP,justifyContent:'center',width:'100%',background:expire?'#a32d2d':'#854f0b'}}>
                      <i className="ti ti-refresh"/>Renouveler ce document
                    </button>
                    <div style={{fontSize:11,color:expire?'#791f1f':'#633806',marginTop:8,textAlign:'center'}}>
                      L ancien document sera conservé dans l historique ci-dessous
                    </div>
                  </div>
                )}

                {/* Historique même catégorie */}
                {historique.length>0&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>
                      Historique — {historique.length} version(s) precedente(s)
                    </div>
                    {historique.map(h=>{
                      const hExpire = estExpire(h.date_expiration)
                      return (
                        <div key={h.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:'#f8f7f4',border:'0.5px solid #e2e0d8',marginBottom:6,opacity:0.8}}>
                          <i className="ti ti-history" style={{color:'#888780',fontSize:14,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:500,color:'#2c2c2a'}}>{h.nom}</div>
                            <div style={{fontSize:11,color:'#888780'}}>
                              {h.date_expiration&&<span style={{color:hExpire?'#a32d2d':'#888780'}}>
                                {hExpire?'Expire le ':'Valide jusqu au '}{new Date(h.date_expiration+'T12:00:00').toLocaleDateString('fr-FR')}
                              </span>}
                              {h.responsable&&<span> • {h.responsable}</span>}
                            </div>
                          </div>
                          {h.fichier_url&&(
                            <a href={h.fichier_url} target="_blank" rel="noreferrer"
                              style={{...btnSm,padding:'4px 8px',color:'#534ab7',borderColor:'#afa9ec',background:'#eeedfe',textDecoration:'none',fontSize:11}}>
                              <i className="ti ti-download"/>
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal carousel photos */}
      {modalCarousel&&(
        <div onClick={e=>e.target===e.currentTarget&&setModalCarousel(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:800,padding:16}}>
          <div style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:12,maxWidth:'90vw'}}>
            {/* Image principale */}
            <img src={modalCarousel.urls[modalCarousel.idx]} alt="photo"
              style={{maxWidth:'85vw',maxHeight:'75vh',objectFit:'contain',borderRadius:8}}/>
            {/* Compteur */}
            <div style={{color:'#fff',fontSize:13,fontWeight:500}}>
              {modalCarousel.idx+1} / {modalCarousel.urls.length}
            </div>
            {/* Navigation */}
            {modalCarousel.urls.length>1&&(
              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>setModalCarousel(p=>({...p,idx:(p.idx-1+p.urls.length)%p.urls.length}))}
                  style={{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:18,cursor:'pointer'}}>←</button>
                <button onClick={()=>setModalCarousel(p=>({...p,idx:(p.idx+1)%p.urls.length}))}
                  style={{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:18,cursor:'pointer'}}>→</button>
              </div>
            )}
            {/* Miniatures */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',maxWidth:'85vw'}}>
              {modalCarousel.urls.map((u,i)=>(
                <img key={i} src={u} onClick={()=>setModalCarousel(p=>({...p,idx:i}))}
                  style={{width:48,height:48,objectFit:'cover',borderRadius:6,cursor:'pointer',
                    border:i===modalCarousel.idx?'2px solid #534ab7':'2px solid transparent',opacity:i===modalCarousel.idx?1:0.6}}/>
              ))}
            </div>
            <button onClick={()=>setModalCarousel(null)}
              style={{position:'absolute',top:-12,right:-12,width:32,height:32,borderRadius:'50%',background:'#fff',border:'none',cursor:'pointer',fontSize:16}}>✕</button>
          </div>
        </div>
      )}

      {/* Modal view photo */}
      {modalViewPhoto&&(
        <div onClick={()=>setModalViewPhoto(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:16,cursor:'pointer'}}>
          <div style={{position:'relative',maxWidth:'90vw',maxHeight:'90vh'}}>
            <img src={modalViewPhoto} alt="photo tracabilite"
              style={{maxWidth:'100%',maxHeight:'85vh',objectFit:'contain',borderRadius:8}}/>
            <button onClick={()=>setModalViewPhoto(null)}
              style={{position:'absolute',top:-12,right:-12,width:32,height:32,borderRadius:'50%',background:'#fff',border:'none',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
              ✕
            </button>
            <a href={modalViewPhoto} download target="_blank"
              style={{position:'absolute',bottom:-40,left:'50%',transform:'translateX(-50%)',padding:'6px 16px',borderRadius:8,background:'#534ab7',color:'#fff',fontSize:12,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
              <i className="ti ti-download"/>Telecharger
            </a>
          </div>
        </div>
      )}

      {/* Modal confirmation jolie */}
      {modalConfirm&&(
        <div onClick={e=>e.target===e.currentTarget&&setModalConfirm(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:600,padding:16}}>
          <div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:380,textAlign:'center'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'#fcebeb',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <i className="ti ti-alert-triangle" style={{color:'#a32d2d',fontSize:24}}/>
            </div>
            <div style={{fontSize:16,fontWeight:600,color:'#2c2c2a',marginBottom:8}}>{modalConfirm.title}</div>
            <div style={{fontSize:13,color:'#888780',marginBottom:24,lineHeight:1.6}}>{modalConfirm.message}</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setModalConfirm(null)} style={{flex:1,padding:'10px',borderRadius:10,border:'0.5px solid #d3d1c7',background:'#fff',color:'#5f5e5a',fontSize:13,fontWeight:500,cursor:'pointer'}}>Annuler</button>
              <button onClick={()=>{modalConfirm.onConfirm();setModalConfirm(null)}} style={{flex:1,padding:'10px',borderRadius:10,border:'none',background:'#a32d2d',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal liste modeles etiquettes */}
      {modalListModeles&&(
        <Modal onClose={()=>{setModalListModeles(false);setSearchMod('')}} title="Mes etiquettes enregistrees" maxWidth={520}>
          <input value={searchMod} onChange={e=>setSearchMod(e.target.value)} placeholder="Rechercher un modele..."
            style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',boxSizing:'border-box',marginBottom:12}}/>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12,maxHeight:320,overflowY:'auto'}}>
            {etiqModeles.filter(m=>m.nom.toLowerCase().includes(searchMod.toLowerCase())).length===0&&(
              <div style={{textAlign:'center',color:'#b4b2a9',padding:16,fontSize:13}}>Aucun modele trouve</div>
            )}
            {etiqModeles.filter(m=>m.nom.toLowerCase().includes(searchMod.toLowerCase())).map(m=>(
              <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,border:'0.5px solid #e2e0d8',background:'#f8f7f4'}}>
                {editModele?.id===m.id?(
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
                    <input value={formEditModele.nom} onChange={e=>setFormEditModele({...formEditModele,nom:e.target.value})}
                      style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',boxSizing:'border-box'}} placeholder="Nom"/>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {[1,2,3,5,7,14,30].map(j=>(
                        <button key={j} onClick={()=>setFormEditModele({...formEditModele,dlc_jours:j,dlc_libre:''})}
                          style={{padding:'4px 10px',borderRadius:6,fontSize:11,cursor:'pointer',
                            border:'0.5px solid '+(formEditModele.dlc_jours===j&&!formEditModele.dlc_libre?'#534ab7':'#d3d1c7'),
                            background:formEditModele.dlc_jours===j&&!formEditModele.dlc_libre?'#eeedfe':'#fff',
                            color:formEditModele.dlc_jours===j&&!formEditModele.dlc_libre?'#3c3489':'#5f5e5a'}}>
                          J+{j}
                        </button>
                      ))}
                    </div>
                    <input type="date" value={formEditModele.dlc_libre}
                      onChange={e=>setFormEditModele({...formEditModele,dlc_libre:e.target.value})}
                      style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'0.5px solid #d3d1c7',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setEditModele(null)} style={{flex:1,padding:'6px',borderRadius:8,border:'0.5px solid #d3d1c7',background:'#fff',color:'#5f5e5a',fontSize:12,cursor:'pointer'}}>Annuler</button>
                      <button onClick={updateModeleEtiq} style={{flex:1,padding:'6px',borderRadius:8,border:'none',background:'#534ab7',color:'#fff',fontSize:12,cursor:'pointer'}}>Enregistrer</button>
                    </div>
                  </div>
                ):(
                  <>
                    <div style={{flex:1,cursor:'pointer'}} onClick={()=>{setFormEtiq(prev=>({...prev,produit_nom:m.nom,jours_dlc:m.dlc_jours||3,dlc_libre:''}));setModalListModeles(false);setSearchMod('')}}>
                      <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{m.nom}</div>
                      <div style={{fontSize:11,color:'#534ab7'}}>DLC : J+{m.dlc_jours}</div>
                    </div>
                    <button onClick={()=>{setEditModele(m);setFormEditModele({nom:m.nom,dlc_jours:m.dlc_jours||3,dlc_libre:''})}}
                      style={{padding:'5px 8px',borderRadius:8,border:'0.5px solid #d3d1c7',background:'#fff',color:'#5f5e5a',fontSize:11,cursor:'pointer'}}>
                      <i className="ti ti-edit"/>
                    </button>
                    <button onClick={()=>supprimerModeleEtiq(m.id)}
                      style={{padding:'5px 8px',borderRadius:8,border:'0.5px solid #f09595',background:'#fcebeb',color:'#a32d2d',fontSize:11,cursor:'pointer'}}>
                      <i className="ti ti-trash"/>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <button onClick={()=>{setModalAddModele(true);setModalListModeles(false)}}
            style={{width:'100%',padding:'10px',borderRadius:10,border:'1.5px dashed #d3d1c7',background:'transparent',color:'#888780',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <i className="ti ti-plus"/>Creer un nouveau modele
          </button>
        </Modal>
      )}

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  )
}