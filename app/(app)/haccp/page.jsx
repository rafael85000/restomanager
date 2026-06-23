'use client'
import { useState, useEffect } from 'react'
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
  {id:'f1',nom:'Standard',dim:'62×29mm',imprimante:'Brother QL'},
  {id:'f2',nom:'Large',dim:'62×50mm',imprimante:'Brother QL'},
  {id:'f3',nom:'Petite',dim:'29×19mm',imprimante:'Brother QL'},
  {id:'f4',nom:'Zebra S',dim:'57×32mm',imprimante:'Zebra ZD'},
  {id:'f5',nom:'Zebra L',dim:'102×50mm',imprimante:'Zebra ZD'},
  {id:'f6',nom:'Dymo',dim:'89×36mm',imprimante:'Dymo LabelWriter'},
]

export default function HACCP() {
  const etabId = getEtablissementActif()
  const [tab,setTab] = useState('etiquetage')
  const [loading,setLoading] = useState(true)
  const [toast,setToast] = useState({msg:'',type:'ok'})
  const [recettes,setRecettes] = useState([])
  const [produits,setProduits] = useState([])
  const [fournisseurs,setFournisseurs] = useState([])
  const [equipements,setEquipements] = useState([])
  const [zones,setZones] = useState([])
  const [etiquettes,setEtiquettes] = useState([])
  const [cuissons,setCuissons] = useState([])
  const [lots,setLots] = useState([])
  const [receptions,setReceptions] = useState([])
  const [documents,setDocuments] = useState([])
  const [nettoyageLog,setNettoyageLog] = useState([])

  const [userConnecte,setUserConnecte] = useState('')
  // Etiquetage
  const [formEtiq,setFormEtiq] = useState({produit_nom:'',date_fabrication:new Date().toISOString().split('T')[0],jours_dlc:3,dlc_libre:'',format_id:'f1',nb_exemplaires:1})
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
  // Nettoyage
  const [nettoyageTab,setNettoyageTab] = useState('planning')
  const [modalAddZone,setModalAddZone] = useState(false)
  const [formZone,setFormZone] = useState({nom:'',frequence:'quotidien'})
  const [modalValiderZone,setModalValiderZone] = useState(null) // zone object
  const [validerPar,setValiderPar] = useState('')
  // Cuissons
  const [cuissonTab,setCuissonTab] = useState('saisie')
  const [formCuisson,setFormCuisson] = useState({produit_nom:'',type:'cuisson',temperature:'',commentaire:''})
  // Traçabilité
  const [tracaTab,setTracaTab] = useState('saisie')
  const [formLot,setFormLot] = useState({numero_lot:'',produit_id:'',produit_nom:'',recette_id:'',date_production:new Date().toISOString().split('T')[0]})
  const [searchLot,setSearchLot] = useState('')
  // Réception
  const [recepTab,setRecepTab] = useState('nouvelle')
  const [formRec,setFormRec] = useState({fournisseur_id:'',temperature_camion:'',emballage_ok:true,dlc_ok:true,commentaire:''})
  // PMS
  const [modalDoc,setModalDoc] = useState(false)
  const [formDoc,setFormDoc] = useState({nom:'',categorie:'',date_expiration:''})

  const showToast=(m,t='ok')=>{ setToast({msg:m,type:t}); setTimeout(()=>setToast({msg:'',type:'ok'}),3000) }

  useEffect(()=>{
    charger()
    try { const m=JSON.parse(localStorage.getItem('membre_actif')||'{}'); setUserConnecte(m.prenom&&m.nom?m.prenom+' '+m.nom:m.prenom||m.nom||m.email||'') } catch(e){}
  },[])

  const charger = async () => {
    setLoading(true)
    const todayStr = new Date().toISOString().split('T')[0]
    const [{data:rec},{data:prod},{data:fourn},{data:eq},{data:zn},{data:etiq},{data:cuiss},{data:lotsD},{data:recepts},{data:docs},{data:logToday},{data:eqp},{data:relTous}] = await Promise.all([
      supabase.from('recettes').select('id,nom').eq('etablissement_id',etabId).order('nom'),
      supabase.from('produits').select('id,nom').eq('etablissement_id',etabId).order('nom'),
      supabase.from('fournisseurs').select('id,nom').eq('etablissement_id',etabId).order('nom'),
      supabase.from('haccp_equipements').select('*').eq('etablissement_id',etabId),
      supabase.from('haccp_zones_nettoyage').select('*').eq('etablissement_id',etabId),
      supabase.from('haccp_etiquettes').select('*').eq('etablissement_id',etabId).order('created_at',{ascending:false}).limit(15),
      supabase.from('haccp_cuissons').select('*').eq('etablissement_id',etabId).order('date_releve',{ascending:false}).limit(30),
      supabase.from('haccp_lots').select('*,produits(nom),recettes(nom)').eq('etablissement_id',etabId).order('created_at',{ascending:false}),
      supabase.from('haccp_receptions').select('*,fournisseurs(nom)').eq('etablissement_id',etabId).order('date_reception',{ascending:false}).limit(30),
      supabase.from('haccp_documents').select('*').eq('etablissement_id',etabId).order('date_expiration',{ascending:true}),
      supabase.from('haccp_nettoyage_log').select('*').eq('etablissement_id',etabId).gte('created_at',todayStr+'T00:00:00'),
      supabase.from('equipe').select('id,nom,prenom,etablissement_id').order('prenom'),
      supabase.from('haccp_releves_temperature').select('*').order('id', {ascending: false}).limit(200)
    ])
    setRecettes(rec||[]); setProduits(prod||[]); setFournisseurs(fourn||[])
    const eqIds = (eq||[]).map(e=>e.id)
    setEquipements(eq||[]); setZones(zn||[]); setEtiquettes(etiq||[])
    setCuissons(cuiss||[]); setLots(lotsD||[]); setReceptions(recepts||[])
    setDocuments(docs||[]); setNettoyageLog(logToday||[])
    setEquipe((eqp||[]).filter(m=>!m.etablissement_id||m.etablissement_id===etabId))
    const relevesFiltered = (relTous||[]).filter(r=>eqIds.includes(r.equipement_id))
    const todayReleves = relevesFiltered.filter(r=>r.releve_le&&r.releve_le.substring(0,10)===todayStr)
    setRelevesAujourdhui(todayReleves)
   console.log('relTous:', relTous)
console.log('eqIds:', eqIds)
console.log('relevesFiltered:', relevesFiltered)
console.log('todayStr:', todayStr)
console.log('todayReleves:', todayReleves)
    setRelevesTous(relevesFiltered)
    setLoading(false)
  }

  const dlcDate=(fab,j)=>{ const d=new Date(fab); d.setDate(d.getDate()+parseInt(j)); return d.toISOString().split('T')[0] }
  const fmt=(s)=>s?new Date(s).toLocaleDateString('fr-FR'):'-'
  const estValide=(zid)=>nettoyageLog.some(l=>l.zone_id===zid)
  const estExpire=(d)=>d&&new Date(d)<new Date()
  const expireBientot=(d)=>{ if(!d) return false; const j=(new Date(d)-new Date())/86400000; return j>0&&j<30 }
  const genNumLot=()=>{ const d=new Date(); return 'L'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+Math.floor(Math.random()*900+100) }

  const imprimerEtiquette = async () => {
    if (!formEtiq.produit_nom) { showToast('Saisissez un nom','err'); return }
    const dlc = formEtiq.dlc_libre || dlcDate(formEtiq.date_fabrication, formEtiq.jours_dlc)
    const format = FORMATS_ETIQ.find(f=>f.id===formEtiq.format_id) || FORMATS_ETIQ[0]
    const fmt_nom = format.nom + ' ' + format.dim
    const nb = formEtiq.nb_exemplaires || 1
    const fabFr = new Date(formEtiq.date_fabrication).toLocaleDateString('fr-FR')
    const dlcFr = new Date(dlc).toLocaleDateString('fr-FR')

    // Save to DB
    await supabase.from('haccp_etiquettes').insert([{produit_nom:formEtiq.produit_nom,date_fabrication:formEtiq.date_fabrication,date_dlc:dlc,etablissement_id:etabId,responsable:userConnecte,format_nom:fmt_nom,nb_exemplaires:nb}])
    await supabase.from('dlc_produits').insert([{nom:formEtiq.produit_nom,type:'preparation',date_ouverture:formEtiq.date_fabrication,date_dlc:dlc,statut:'ok',etablissement_id:etabId}])

    // Open print window with nb copies
    const etiqHTML = '<div style="border:1.5px solid #2c2c2a;border-radius:4px;overflow:hidden;width:220px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin-bottom:8px">' +
      '<div style="background:#2c2c2a;padding:8px 12px"><div style="color:#fff;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">' + formEtiq.produit_nom + '</div></div>' +
      '<div style="padding:10px 12px">' +
        '<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:5px"><span style="font-size:9px;font-weight:600;color:#888780;text-transform:uppercase;width:70px;flex-shrink:0">Fabriqué le</span><span style="font-size:12px;font-weight:500;color:#2c2c2a">' + fabFr + '</span></div>' +
        '<div style="display:flex;align-items:baseline;gap:6px"><span style="font-size:9px;font-weight:600;color:#888780;text-transform:uppercase;width:70px;flex-shrink:0">DLC</span><span style="font-size:15px;font-weight:700;color:#a32d2d">' + dlcFr + '</span></div>' +
      '</div>' +
      '<div style="background:#f8f7f4;border-top:0.5px solid #e2e0d8;padding:4px 12px;font-size:9px;color:#888780;display:flex;justify-content:space-between"><span>' + format.dim + '</span><span>' + format.imprimante + '</span></div>' +
    '</div>'
    const copies = Array(nb).fill(etiqHTML).join('')
    const win = window.open('', '_blank')
    win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Étiquette</title><style>')
    win.document.write('* { box-sizing:border-box; margin:0; padding:0; }')
    win.document.write('body { font-family:-apple-system,BlinkMacSystemFont,sans-serif; padding:12px; background:#fff; display:flex; flex-wrap:wrap; gap:8px; }')
    win.document.write('@page { size:' + format.dim.replace('×','mm ') + 'mm; margin:0; }')
    win.document.write('@media print { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }')
    win.document.write('</style></head><body>' + copies + '</body></html>')
    win.document.close()
    win.onload = () => { win.focus(); win.print() }

    showToast('Impression lancée (' + nb + ' exemplaire(s)) !')
    setFormEtiq(prev=>({...prev,produit_nom:'',date_fabrication:new Date().toISOString().split('T')[0],jours_dlc:3,dlc_libre:'',nb_exemplaires:1}))
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
    if (!confirm('Supprimer cet équipement ? Les relevés associés seront aussi supprimés.')) return
    await supabase.from('haccp_releves_temperature').delete().eq('equipement_id',id)
    await supabase.from('haccp_equipements').delete().eq('id',id)
    charger(); showToast('Équipement supprimé')
  }

  const ajouterEquipement = async () => {
    if (!formEquip.nom||formEquip.temp_min===''||formEquip.temp_max==='') { showToast('Remplissez tous les champs','err'); return }
    const freq = (formEquip.frequence_fois||2)+'x/jour tous les '+(formEquip.frequence_jours||1)+' jour(s)'
    await supabase.from('haccp_equipements').insert([{nom:formEquip.nom,type:formEquip.type,temp_min:parseFloat(formEquip.temp_min),temp_max:parseFloat(formEquip.temp_max),frequence:freq,etablissement_id:etabId}])
    setModalAddEquip(false); setFormEquip({nom:'',type:'froid',temp_min:'',temp_max:'',frequence_jours:1,frequence_fois:2}); charger(); showToast('Équipement ajouté !')
  }

  const validerTemperature = async () => {
    if (!tempVal || !modalTemp) { showToast('Saisissez une température','err'); return }
    const t = parseFloat(tempVal)
    if (isNaN(t)) { showToast('Température invalide','err'); return }
    const conforme = t >= parseFloat(modalTemp.temp_min) && t <= parseFloat(modalTemp.temp_max)
    // Fermer le modal IMMÉDIATEMENT avant tout le reste
    const equipId = modalTemp.id
    setModalTemp(null)
    setTempVal('')
    setTempMoment('Matin')
    setTempActionCorrective('')
    // Insérer en arrière-plan
    const res = await supabase.from('haccp_releves_temperature').insert({
      equipement_id: equipId,
      temperature: t,
      conforme: conforme,
      moment: tempMoment,
      releve_par: userConnecte || 'Équipe',
      releve_le: new Date().toISOString()
    })
    if (res.error) {
      showToast('Erreur enregistrement: ' + res.error.message, 'err')
      console.error('Releve error:', res.error)
      return
    }
    showToast(conforme ? '✓ Relevé enregistré !' : '⚠️ Température hors norme !')
    // Recharger silencieusement — si ça plante ça ne bloque plus rien
    try { charger() } catch(e) { console.error('charger error:', e) }
  }

  const ajouterZone = async () => {
    if (!formZone.nom) { showToast('Saisissez un nom','err'); return }
    await supabase.from('haccp_zones_nettoyage').insert([{...formZone,etablissement_id:etabId}])
    setModalAddZone(false); setFormZone({nom:'',frequence:'quotidien'}); charger(); showToast('Zone ajoutée !')
  }

  const exporterRelevesCSV = (releves, eqList) => {
    const sep = ';'
    const nl = String.fromCharCode(10)
    const headers = ['Date','Moment','Equipement','Temperature (C)','Plage min','Plage max','Conforme','Releve par','Action corrective'].join(sep)
    const rows = releves.map(r => {
      const eq = eqList.find(e => e.id === r.equipement_id)
      return [
        r.releve_le ? new Date(r.releve_le).toLocaleDateString('fr-FR') : '',
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
    const fname = 'releves_temperature_' + new Date().toISOString().slice(0, 10) + '.csv'
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

  const enregistrerCuisson = async () => {
    if (!formCuisson.produit_nom||!formCuisson.temperature) { showToast('Remplissez tous les champs','err'); return }
    const t = parseFloat(formCuisson.temperature)
    const conforme = formCuisson.type==='refroidissement' ? t<=10 : t>=63
    await supabase.from('haccp_cuissons').insert([{produit_nom:formCuisson.produit_nom,type:formCuisson.type,temperature:t,conforme,etablissement_id:etabId}])
    setFormCuisson({produit_nom:'',type:'cuisson',temperature:'',commentaire:''})
    setCuissonTab('historique'); charger()
    conforme ? showToast('Relevé enregistré !') : showToast('⚠️ Non-conformité détectée !','err')
  }

  const creerLot = async () => {
    if (!formLot.produit_id&&!formLot.produit_nom) { showToast('Sélectionnez ou saisissez un produit','err'); return }
    const num = formLot.numero_lot||genNumLot()
    const p = produits.find(x=>x.id===formLot.produit_id)
    await supabase.from('haccp_lots').insert([{numero_lot:num,produit_id:formLot.produit_id||null,produit_nom:p?p.nom:formLot.produit_nom,recette_id:formLot.recette_id||null,date_production:formLot.date_production,etablissement_id:etabId}])
    setFormLot({numero_lot:'',produit_id:'',produit_nom:'',recette_id:'',date_production:new Date().toISOString().split('T')[0]})
    setTracaTab('lots'); charger(); showToast('Lot enregistré !')
  }

  const basculerRappel = async (id,etat) => {
    await supabase.from('haccp_lots').update({rappele:!etat}).eq('id',id)
    charger()
  }

  const enregistrerReception = async () => {
    const conforme = formRec.emballage_ok&&formRec.dlc_ok
    await supabase.from('haccp_receptions').insert([{fournisseur_id:formRec.fournisseur_id||null,temperature_camion:formRec.temperature_camion?parseFloat(formRec.temperature_camion):null,emballage_ok:formRec.emballage_ok,dlc_ok:formRec.dlc_ok,conforme,commentaire:formRec.commentaire,etablissement_id:etabId}])
    setFormRec({fournisseur_id:'',temperature_camion:'',emballage_ok:true,dlc_ok:true,commentaire:''})
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
    // Parse fréquence: "2x/jour tous les 1 jour(s)"
    const match = (eq.frequence||'').match(/(\d+)x\/jour tous les (\d+)/)
    const foisParJour = match ? parseInt(match[1]) : 1
    const tousLesJours = match ? parseInt(match[2]) : 1

    const now = new Date()
    const heure = now.getHours()
    const todayStr = now.toISOString().split('T')[0]

    // Relevés de cet équipement
    const relevesEq = relevesTous.filter(r => r.equipement_id === eq.id)

    // Relevés aujourd'hui
    const relevesAujourd = relevesEq.filter(r => r.releve_le && r.releve_le.startsWith(todayStr))

    // Relevés hier
    const hier = new Date(now); hier.setDate(hier.getDate()-1)
    const hierStr = hier.toISOString().split('T')[0]
    const relevesHier = relevesEq.filter(r => r.releve_le && r.releve_le.startsWith(hierStr))

    // Découper la journée en créneaux selon foisParJour
    // Ex: 2x/jour → matin (avant 14h) et soir (après 14h)
    // Ex: 3x/jour → matin (avant 10h), midi (10-16h), soir (après 16h)
    const creneaux = []
    if (foisParJour === 1) {
      creneaux.push({label:'Journée', debut:6, fin:22})
    } else if (foisParJour === 2) {
      creneaux.push({label:'Matin', debut:6, fin:14})
      creneaux.push({label:'Soir', debut:14, fin:23})
    } else if (foisParJour === 3) {
      creneaux.push({label:'Matin', debut:6, fin:11})
      creneaux.push({label:'Midi', debut:11, fin:16})
      creneaux.push({label:'Soir', debut:16, fin:23})
    } else if (foisParJour >= 4) {
      for (let i=0; i<foisParJour; i++) {
        const d = 6 + Math.floor(i * 16/foisParJour)
        const f = 6 + Math.floor((i+1) * 16/foisParJour)
        creneaux.push({label:'Créneau '+(i+1), debut:d, fin:f})
      }
    }

    // Creneau actuel
    const creneauActuel = creneaux.find(cr => heure >= cr.debut && heure < cr.fin)

    // Relevé dans le créneau actuel ?
    const releveCreneauActuel = relevesAujourd.find(r => {
      const h = new Date(r.releve_le).getHours()
      return creneauActuel && h >= creneauActuel.debut && h < creneauActuel.fin
    })

    // Créneau précédent non fait ?
    const creneauxPasses = creneaux.filter(cr => cr.fin <= heure)
    const creneauNonFait = creneauxPasses.find(cr => {
      const faitDansCreneau = relevesAujourd.find(r => {
        const h = new Date(r.releve_le).getHours()
        return h >= cr.debut && h < cr.fin
      })
      return !faitDansCreneau
    })

    // Hier non complété (rouge urgent) ?
    if (tousLesJours === 1) {
      const nbRelevesHierAttendus = foisParJour
      if (relevesHier.length < nbRelevesHierAttendus && relevesHier.length === 0) {
        // Pas du tout fait hier → rouge urgent
        return {statut:'urgent', label:'Non fait hier !', creneauActuel, releveCreneauActuel}
      }
    }

    // Créneau passé non fait aujourd'hui → rouge
    if (creneauNonFait) {
      return {statut:'retard', label:creneauNonFait.label+' non fait', creneauActuel, releveCreneauActuel}
    }

    // Créneau actuel fait → gris (ok)
    if (releveCreneauActuel) {
      const dernierReleve = relevesAujourd.sort((a,b)=>new Date(b.releve_le)-new Date(a.releve_le))[0]
      return {statut:'fait', label:'Fait', temp:dernierReleve?.temperature, creneauActuel, releveCreneauActuel}
    }

    // Créneau actuel pas encore fait → orange (à faire)
    if (creneauActuel) {
      return {statut:'afaire', label:creneauActuel.label+' — À relever', creneauActuel, releveCreneauActuel}
    }

    // Hors créneau (trop tôt ou trop tard)
    if (relevesAujourd.length >= foisParJour) {
      return {statut:"fait", label:"Complete", creneauActuel:null, releveCreneauActuel:null}
    }

    return {statut:'afaire', label:"A relever", creneauActuel:null, releveCreneauActuel:null}
  }

  const couleurStatut = (statut) => {
    if (statut==='fait')   return {bg:'#f6fdf0', border:'#97c459', badge:'#eaf3de', badgeC:'#27500a'}
    if (statut==='afaire') return {bg:'#fffbf0', border:'#fac775', badge:'#faeeda', badgeC:'#854f0b'}
    if (statut==='retard') return {bg:'#fff5f5', border:'#f09595', badge:'#fcebeb', badgeC:'#a32d2d'}
    if (statut==='urgent') return {bg:'#fff0f0', border:'#e53e3e', badge:'#fed7d7', badgeC:'#c53030'}
    return {bg:'#f8f7f4', border:'#e2e0d8', badge:'#f1efe8', badgeC:'#888780'}
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
    {id:'temperatures',label:'Températures',icon:'ti-thermometer'},
    {id:'nettoyage',label:'Nettoyage',icon:'ti-wash'},
    {id:'cuissons',label:'Cuissons',icon:'ti-flame'},
    {id:'tracabilite',label:'Traçabilité',icon:'ti-barcode'},
    {id:'reception',label:'Réception',icon:'ti-truck'},
    {id:'pms',label:'PMS',icon:'ti-file-text'},
  ]

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'#888780',fontSize:14}}>Chargement…</div>

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"/>

      <div style={{...card,marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:18,fontWeight:500,color:'#2c2c2a'}}><i className="ti ti-shield-check" style={{marginRight:8,verticalAlign:-2}}/>Module HACCP</div>
          <div style={{fontSize:12,color:'#888780',marginTop:2}}>Gestion de la sécurité alimentaire</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {docsExpires.length>0&&<span style={{fontSize:12,background:'#fcebeb',color:'#a32d2d',padding:'4px 10px',borderRadius:8,fontWeight:500}}>{docsExpires.length} doc(s) expiré(s)</span>}
          {lotsRappeles.length>0&&<span style={{fontSize:12,background:'#fcebeb',color:'#a32d2d',padding:'4px 10px',borderRadius:8,fontWeight:500}}>{lotsRappeles.length} lot(s) rappelé(s)</span>}
        </div>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{...btn,background:tab===t.id?'#534ab7':'#fff',color:tab===t.id?'#fff':'#5f5e5a',borderColor:tab===t.id?'#534ab7':'#d3d1c7'}}>
            <i className={'ti '+t.icon}/>{t.label}
          </button>
        ))}
      </div>

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
                    <input value={formEtiq.produit_nom} onChange={e=>setFormEtiq({...formEtiq,produit_nom:e.target.value})}
                      placeholder="Tapez un nom ou choisissez une recette/produit…" style={inp}
                      list="etiq-suggestions"/>
                    <datalist id="etiq-suggestions">
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
                <div style={{background:'#fff',borderRadius:8,overflow:'hidden',width:220,border:'1.5px solid #2c2c2a',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                  <div style={{background:'#2c2c2a',padding:'8px 12px'}}>
                    <div style={{color:'#fff',fontWeight:700,fontSize:13,textTransform:'uppercase',letterSpacing:'0.5px'}}>{formEtiq.produit_nom||'Nom du produit'}</div>
                  </div>
                  <div style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:7}}>
                    <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                      <span style={{fontSize:9,fontWeight:600,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',width:70,flexShrink:0}}>Fabriqué le</span>
                      <span style={{fontSize:12,fontWeight:500,color:'#2c2c2a'}}>{fmt(formEtiq.date_fabrication)}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                      <span style={{fontSize:9,fontWeight:600,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',width:70,flexShrink:0}}>DLC</span>
                      <span style={{fontSize:15,fontWeight:700,color:'#a32d2d'}}>{fmt(formEtiq.dlc_libre||dlcDate(formEtiq.date_fabrication,formEtiq.jours_dlc))}</span>
                    </div>

                  </div>
                  <div style={{background:'#f8f7f4',borderTop:'0.5px solid #e2e0d8',padding:'4px 12px',fontSize:9,color:'#888780',display:'flex',justifyContent:'space-between'}}>
                    <span>J+{formEtiq.jours_dlc} jours</span>
                    <span>{FORMATS_ETIQ.find(f=>f.id===formEtiq.format_id)?.dim||''}</span>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8,width:'100%'}}>
                  <button onClick={imprimerEtiquette} style={{...btnP,padding:12,justifyContent:'center'}}>
                    <i className="ti ti-printer"/> Imprimer l'étiquette {(formEtiq.nb_exemplaires||1)>1?'('+formEtiq.nb_exemplaires+'×)':''}
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
            {[{id:'releves',label:'Relevés du jour',icon:'ti-thermometer'},{id:'historique',label:'Historique',icon:'ti-history'},{id:'config',label:'Configurer',icon:'ti-settings'}].map(t=>(
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
                : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
                    {equipements.map(eq=>{
                      const info = getStatutEquipement(eq)
                      const col = couleurStatut(info.statut)
                      const typeIcon = eq.type==='froid'?'ti-snowflake':eq.type==='plonge'?'ti-droplet':'ti-flame'
                      const derReleve = relevesAujourdhui.filter(r=>r.equipement_id===eq.id).sort((a,b)=>new Date(b.releve_le)-new Date(a.releve_le))[0]
                      const conforme = derReleve ? (derReleve.temperature>=eq.temp_min&&derReleve.temperature<=eq.temp_max) : null
                      return (
                        <div key={eq.id} style={{border:`1.5px solid ${col.border}`,borderRadius:12,padding:16,background:col.bg}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                            <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a',flex:1}}>{eq.nom}</div>
                            <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:eq.type==='froid'?'#e6f1fb':eq.type==='plonge'?'#eeedfe':'#fcebeb',color:eq.type==='froid'?'#0c447c':eq.type==='plonge'?'#3c3489':'#a32d2d',fontWeight:500}}>
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
                  if(filtered.length===0) return <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun relevé pour ces critères</div>
                  return (
                    <div style={{overflowX:'auto'}}>
                      <div style={{fontSize:12,color:'#888780',marginBottom:10}}>{filtered.length} relevé(s)</div>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                        <thead><tr>
                          {['Date','Moment','Équipement','Température','Plage','Statut','Relevé par','Action corrective'].map(h=><th key={h} style={th}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {filtered.map(r=>{
                            const eq = equipements.find(e=>e.id===r.equipement_id)
                            return (
                              <tr key={r.id} style={{background:r.conforme?'#fff':'#fff8f8'}}>
                                <td style={{...td,color:'#888780'}}>{r.releve_le?new Date(r.releve_le).toLocaleDateString('fr-FR'):'-'}</td>
                                <td style={{...td,color:'#5f5e5a'}}>{r.moment||'—'}</td>
                                <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{eq?.nom||'—'}</td>
                                <td style={{...td,fontFamily:'monospace',fontWeight:500,color:r.conforme?'#27500a':'#a32d2d'}}>{r.temperature}°C</td>
                                <td style={{...td,color:'#888780',fontSize:11}}>{eq?eq.temp_min+'→'+eq.temp_max+'°C':'—'}</td>
                                <td style={td}><span style={badge(r.conforme)}>{r.conforme?'Conforme':'Non conforme'}</span></td>
                                <td style={{...td,color:'#5f5e5a'}}>{r.releve_par||'—'}</td>
                                <td style={{...td,color:r.action_corrective?'#854f0b':'#b4b2a9',fontSize:12}}>{r.action_corrective||'—'}</td>
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
                          <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:eq.type==='froid'?'#e6f1fb':eq.type==='plonge'?'#eeedfe':'#fcebeb',color:eq.type==='froid'?'#0c447c':eq.type==='plonge'?'#3c3489':'#a32d2d',fontWeight:500}}>{eq.type}</span>
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
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[{id:'planning',label:'Planning du jour',icon:'ti-calendar'},{id:'zones',label:'Zones & tâches',icon:'ti-map-pin'},{id:'historique',label:'Historique',icon:'ti-history'}].map(t=>(
              <button key={t.id} onClick={()=>setNettoyageTab(t.id)} style={innerTab(nettoyageTab===t.id)}>
                <i className={'ti '+t.icon}/>{t.label}
              </button>
            ))}
          </div>

          {nettoyageTab==='planning' && (
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:500,color:'#2c2c2a'}}><i className="ti ti-calendar" style={{marginRight:8,verticalAlign:-2}}/>{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
                <div style={{fontSize:12,color:'#888780'}}>{nettoyageLog.length} / {zones.length} validée(s)</div>
              </div>
              {zones.length===0
                ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Allez dans "Zones & tâches" pour configurer</div>
                : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {/* Quotidien */}
                    {['quotidien','hebdomadaire','mensuel'].map(freq=>{
                      const zonesFreq = zones.filter(z=>z.frequence===freq)
                      if (!zonesFreq.length) return null
                      return (
                        <div key={freq} style={{marginBottom:8}}>
                          <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
                            {freq}
                            <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,fontWeight:500,background:freq==='quotidien'?'#fcebeb':freq==='hebdomadaire'?'#faeeda':'#e6f1fb',color:freq==='quotidien'?'#a32d2d':freq==='hebdomadaire'?'#854f0b':'#0c447c'}}>{zonesFreq.length}</span>
                          </div>
                          {zonesFreq.map(z=>{
                            const fait=estValide(z.id)
                            return (
                              <div key={z.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:10,background:fait?'#eaf3de':'#f8f7f4',border:`0.5px solid ${fait?'#97c459':'#e2e0d8'}`,marginBottom:6}}>
                                <div style={{display:'flex',alignItems:'center',gap:12}}>
                                  <div style={{width:22,height:22,borderRadius:6,background:fait?'#534ab7':'#d3d1c7',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    {fait&&<i className="ti ti-check" style={{color:'#fff',fontSize:11}}/>}
                                  </div>
                                  <div>
                                    <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{z.nom}</div>
                                    {fait&&<div style={{fontSize:11,color:'#27500a',marginTop:2}}>Validé aujourd'hui</div>}
                                  </div>
                                </div>
                                {!fait
                                  ? <button onClick={()=>{setModalValiderZone(z);setValiderPar(equipe[0]?equipe[0].prenom+' '+equipe[0].nom:'')}} style={{...btnSmP,fontSize:12}}>Valider</button>
                                  : <span style={{fontSize:12,color:'#27500a',fontWeight:500}}>✓</span>
                                }
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}

          {nettoyageTab==='zones' && (
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div style={ct}>Zones configurées</div>
                <button onClick={()=>setModalAddZone(true)} style={btnSmP}><i className="ti ti-plus"/>Ajouter une zone</button>
              </div>
              {zones.length===0
                ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucune zone — cliquez sur "Ajouter une zone"</div>
                : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
                    {zones.map(z=>(
                      <div key={z.id} style={{border:'0.5px solid #e2e0d8',borderRadius:12,padding:14}}>
                        <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a',marginBottom:4}}>{z.nom}</div>
                        <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,fontWeight:500,background:z.frequence==='quotidien'?'#fcebeb':z.frequence==='hebdomadaire'?'#faeeda':'#e6f1fb',color:z.frequence==='quotidien'?'#a32d2d':z.frequence==='hebdomadaire'?'#854f0b':'#0c447c'}}>{z.frequence}</span>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {nettoyageTab==='historique' && (
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div style={ct}>Historique des nettoyages</div>
                <button onClick={exporterNettoyageCSV} style={{...btnSm,background:'#eaf3de',color:'#27500a',borderColor:'#97c459'}}>
                  <i className="ti ti-download"/>Télécharger CSV
                </button>
              </div>
              {nettoyageLog.length===0
                ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun nettoyage validé aujourd'hui</div>
                : <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr>
                      {['Date','Heure','Zone','Fréquence','Validé par'].map(h=><th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {nettoyageLog.map(l=>{
                        const z = zones.find(x=>x.id===l.zone_id)
                        const d = new Date(l.valide_le || l.created_at)
                        return (
                          <tr key={l.id}>
                            <td style={{...td,color:'#888780'}}>{d.toLocaleDateString('fr-FR')}</td>
                            <td style={{...td,color:'#888780'}}>{d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</td>
                            <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{z?.nom||'—'}</td>
                            <td style={td}><span style={{fontSize:10,padding:'1px 7px',borderRadius:8,fontWeight:500,background:z?.frequence==='quotidien'?'#fcebeb':z?.frequence==='hebdomadaire'?'#faeeda':'#e6f1fb',color:z?.frequence==='quotidien'?'#a32d2d':z?.frequence==='hebdomadaire'?'#854f0b':'#0c447c'}}>{z?.frequence||'—'}</span></td>
                            <td style={{...td,color:'#5f5e5a'}}>{l.valide_par||'—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
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
                🔵 <strong>Refroidissement rapide</strong> : passer de 63°C à moins de <strong>10°C en moins de 2h</strong><br/>
                🟠 <strong>Remise en température</strong> : atteindre <strong>63°C à cœur en moins d'1h</strong>
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:6}}>
            {[{id:'saisie',label:'Nouveau relevé'},{id:'historique',label:'Historique'}].map(t=>(
              <button key={t.id} onClick={()=>setCuissonTab(t.id)} style={innerTab(cuissonTab===t.id)}>{t.label}</button>
            ))}
          </div>

          {cuissonTab==='saisie' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={card}>
                <div style={{...ct,marginBottom:14}}>Type d'opération</div>
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
                <div style={{...ct,marginBottom:14}}>Température à cœur</div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:16,background:'#f8f7f4',borderRadius:10,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:500,color:'#888780',textTransform:'uppercase',letterSpacing:'0.5px'}}>Température mesurée</div>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <input type="number" step="0.1" placeholder="—" value={formCuisson.temperature} onChange={e=>setFormCuisson({...formCuisson,temperature:e.target.value})}
                      style={{fontSize:42,fontWeight:500,textAlign:'center',border:'none',background:'transparent',width:140,color:'#2c2c2a',outline:'none'}}/>
                    <span style={{fontSize:18,color:'#888780'}}>°C</span>
                  </div>
                  {formCuisson.temperature && (()=>{
                    const t=parseFloat(formCuisson.temperature)
                    const ok=formCuisson.type==='refroidissement'?t<=10:t>=63
                    return <span style={{fontSize:12,padding:'3px 12px',borderRadius:8,fontWeight:500,background:ok?'#eaf3de':'#fcebeb',color:ok?'#27500a':'#a32d2d'}}>{ok?'✓ Conforme':'✗ Non conforme'}</span>
                  })()}
                </div>
                <button onClick={enregistrerCuisson} style={{...btnP,width:'100%',justifyContent:'center',padding:12}}>
                  <i className="ti ti-check"/>Valider et archiver
                </button>
              </div>
            </div>
          )}

          {cuissonTab==='historique' && (
            <div style={card}>
              {cuissons.length===0
                ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun relevé enregistré</div>
                : <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr>
                      {['Produit','Type','Température','Statut','Date'].map(h=><th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {cuissons.map(c=>(
                        <tr key={c.id}>
                          <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{c.produit_nom}</td>
                          <td style={td}>
                            <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,fontWeight:500,background:c.type==='cuisson'?'#fcebeb':c.type==='refroidissement'?'#e6f1fb':'#faeeda',color:c.type==='cuisson'?'#a32d2d':c.type==='refroidissement'?'#0c447c':'#854f0b'}}>
                              {c.type==='cuisson'?'Cuisson':c.type==='refroidissement'?'Refroidissement':'Remise en temp.'}
                            </span>
                          </td>
                          <td style={{...td,fontFamily:'monospace',fontWeight:500}}>{c.temperature}°C</td>
                          <td style={td}><span style={badge(c.conforme)}>{c.conforme?'Conforme':'Non conforme'}</span></td>
                          <td style={{...td,color:'#888780'}}>{fmt(c.date_releve)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
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
              <div style={card}>
                <div style={{...ct,marginBottom:14}}>Nouveau lot</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>N° de lot <span style={{fontWeight:400}}>(auto-généré si vide)</span></div>
                    <input placeholder="Ex: L20260623-001" value={formLot.numero_lot} onChange={e=>setFormLot({...formLot,numero_lot:e.target.value})} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Produit mercuriale</div>
                    <select value={formLot.produit_id} onChange={e=>setFormLot({...formLot,produit_id:e.target.value})} style={inp}>
                      <option value="">Sélectionner un produit…</option>
                      {produits.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Ou nom libre</div>
                    <input placeholder="Saisie libre" value={formLot.produit_nom} onChange={e=>setFormLot({...formLot,produit_nom:e.target.value})} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Lier à une production (optionnel)</div>
                    <select value={formLot.recette_id} onChange={e=>setFormLot({...formLot,recette_id:e.target.value})} style={inp}>
                      <option value="">Aucune</option>
                      {recettes.map(r=><option key={r.id} value={r.id}>{r.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Date de production</div>
                    <input type="date" value={formLot.date_production} onChange={e=>setFormLot({...formLot,date_production:e.target.value})} style={inp}/>
                  </div>
                  <button onClick={creerLot} style={{...btnP,padding:12,justifyContent:'center',marginTop:4}}>
                    <i className="ti ti-check"/>Enregistrer ce lot
                  </button>
                </div>
              </div>
              {/* Aperçu lot */}
              <div style={{...card,background:'#f8f7f4'}}>
                <div style={{...ct,marginBottom:14}}>Aperçu de la fiche lot</div>
                <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #e2e0d8',padding:16,fontSize:13,display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'#888780',fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px'}}>N° Lot</span>
                    <span style={{fontFamily:'monospace',fontWeight:500,color:'#534ab7'}}>{formLot.numero_lot||genNumLot()}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'#888780',fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px'}}>Produit</span>
                    <span style={{fontWeight:500,color:'#2c2c2a'}}>{produits.find(p=>p.id===formLot.produit_id)?.nom||formLot.produit_nom||'—'}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'#888780',fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px'}}>Production</span>
                    <span style={{color:'#5f5e5a'}}>{recettes.find(r=>r.id===formLot.recette_id)?.nom||'—'}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'#888780',fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px'}}>Date</span>
                    <span style={{color:'#5f5e5a'}}>{fmt(formLot.date_production)}</span>
                  </div>
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
                      {['N° Lot','Produit','Production','Date','Statut',''].map(h=><th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {lotsFiltres.map(l=>(
                        <tr key={l.id} style={{background:l.rappele?'#fff8f8':'#fff'}}>
                          <td style={{...td,fontFamily:'monospace',fontWeight:500,color:'#534ab7'}}>{l.numero_lot}</td>
                          <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{l.produits?.nom||l.produit_nom||'—'}</td>
                          <td style={{...td,color:'#888780'}}>{l.recettes?.nom||'—'}</td>
                          <td style={{...td,color:'#888780'}}>{fmt(l.date_production)}</td>
                          <td style={td}><span style={badge(!l.rappele)}>{l.rappele?'Rappelé':'OK'}</span></td>
                          <td style={{...td,textAlign:'right'}}>
                            <button onClick={()=>basculerRappel(l.id,l.rappele)} style={{...btnSm,color:l.rappele?'#27500a':'#a32d2d',borderColor:l.rappele?'#97c459':'#f09595',background:l.rappele?'#eaf3de':'#fcebeb'}}>
                              {l.rappele?'Annuler':'Marquer rappelé'}
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
          <div style={{display:'flex',gap:6}}>
            {[{id:'nouvelle',label:'Nouvelle réception'},{id:'historique',label:'Historique'}].map(t=>(
              <button key={t.id} onClick={()=>setRecepTab(t.id)} style={innerTab(recepTab===t.id)}>{t.label}</button>
            ))}
          </div>

          {recepTab==='nouvelle' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={card}>
                <div style={{...ct,marginBottom:14}}>Informations générales</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Fournisseur</div>
                    <select value={formRec.fournisseur_id} onChange={e=>setFormRec({...formRec,fournisseur_id:e.target.value})} style={inp}>
                      <option value="">Sélectionner…</option>
                      {fournisseurs.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Température du camion (°C)</div>
                    <input type="number" step="0.1" placeholder="Ex: 4.5" value={formRec.temperature_camion} onChange={e=>setFormRec({...formRec,temperature_camion:e.target.value})} style={inp}/>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {[{key:'emballage_ok',label:'Emballage conforme'},{key:'dlc_ok',label:'DLC conforme'}].map(ch=>(
                      <div key={ch.key}>
                        <div style={{fontSize:12,color:'#888780',marginBottom:6}}>{ch.label}</div>
                        <div style={{display:'flex',gap:8}}>
                          {[{v:true,l:'Oui',ok:true},{v:false,l:'Non',ok:false}].map(opt=>(
                            <button key={String(opt.v)} onClick={()=>setFormRec({...formRec,[ch.key]:opt.v})}
                              style={{...btnSm,flex:1,justifyContent:'center',background:formRec[ch.key]===opt.v?(opt.ok?'#eaf3de':'#fcebeb'):'#fff',borderColor:formRec[ch.key]===opt.v?(opt.ok?'#97c459':'#f09595'):'#d3d1c7',color:formRec[ch.key]===opt.v?(opt.ok?'#27500a':'#a32d2d'):'#5f5e5a'}}>
                              {opt.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Commentaire (optionnel)</div>
                    <input placeholder="Observations…" value={formRec.commentaire} onChange={e=>setFormRec({...formRec,commentaire:e.target.value})} style={inp}/>
                  </div>
                  <button onClick={enregistrerReception} style={{...btnP,padding:12,justifyContent:'center',marginTop:4}}>
                    <i className="ti ti-check"/>Valider la réception
                  </button>
                </div>
              </div>
              {/* Récap */}
              <div style={{...card,background:'#f8f7f4',display:'flex',flexDirection:'column',gap:12}}>
                <div style={ct}>Récapitulatif</div>
                <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #e2e0d8',padding:16,display:'flex',flexDirection:'column',gap:8,fontSize:13}}>
                  {[
                    {label:'Fournisseur',val:fournisseurs.find(f=>f.id===formRec.fournisseur_id)?.nom||'—'},
                    {label:'Temp. camion',val:formRec.temperature_camion?formRec.temperature_camion+'°C':'—'},
                    {label:'Emballage',val:formRec.emballage_ok?'✓ Conforme':'✗ Non conforme'},
                    {label:'DLC',val:formRec.dlc_ok?'✓ Conforme':'✗ Non conforme'},
                  ].map(row=>(
                    <div key={row.label} style={{display:'flex',justifyContent:'space-between',paddingBottom:6,borderBottom:'0.5px solid #f1efe8'}}>
                      <span style={{color:'#888780',fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px'}}>{row.label}</span>
                      <span style={{fontWeight:500,color:row.val.includes('✗')?'#a32d2d':row.val.includes('✓')?'#27500a':'#2c2c2a'}}>{row.val}</span>
                    </div>
                  ))}
                  <div style={{textAlign:'center',marginTop:8}}>
                    <span style={{...badge(formRec.emballage_ok&&formRec.dlc_ok),fontSize:13,padding:'4px 16px'}}>
                      {formRec.emballage_ok&&formRec.dlc_ok?'✓ Réception conforme':'⚠ Non-conformité détectée'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {recepTab==='historique' && (
            <div style={card}>
              {receptions.length===0
                ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucune réception enregistrée</div>
                : <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr>
                      {['Fournisseur','Date','Temp. camion','Emballage','DLC','Statut'].map(h=><th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {receptions.map(r=>(
                        <tr key={r.id}>
                          <td style={{...td,fontWeight:500,color:'#2c2c2a'}}>{r.fournisseurs?.nom||'—'}</td>
                          <td style={{...td,color:'#888780'}}>{fmt(r.date_reception)}</td>
                          <td style={{...td,fontFamily:'monospace'}}>{r.temperature_camion?r.temperature_camion+'°C':'—'}</td>
                          <td style={td}>{r.emballage_ok?<i className="ti ti-check" style={{color:'#27500a'}}/>:<i className="ti ti-x" style={{color:'#a32d2d'}}/>}</td>
                          <td style={td}>{r.dlc_ok?<i className="ti ti-check" style={{color:'#27500a'}}/>:<i className="ti ti-x" style={{color:'#a32d2d'}}/>}</td>
                          <td style={td}><span style={badge(r.conforme)}>{r.conforme?'Conforme':'Non conforme'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
          )}
        </div>
      )}

      {/* ── PMS ── */}
      {tab==='pms' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Alertes */}
          {(docsExpires.length>0||docsBientot.length>0)&&(
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={ct}>Documents à mettre à jour</div>
                <span style={{fontSize:11,background:'#fcebeb',color:'#a32d2d',padding:'2px 10px',borderRadius:10,fontWeight:500}}>{docsExpires.length+docsBientot.length} urgent(s)</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {[...docsExpires.map(d=>({...d,urgent:true})),...docsBientot.map(d=>({...d,urgent:false}))].map(d=>(
                  <div key={d.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:d.urgent?'#fcebeb':'#faeeda',border:`0.5px solid ${d.urgent?'#f09595':'#fac775'}`}}>
                    <i className={`ti ${d.urgent?'ti-alert-triangle':'ti-clock'}`} style={{color:d.urgent?'#a32d2d':'#854f0b',fontSize:18,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{d.nom}</div>
                      <div style={{fontSize:11,color:'#888780',marginTop:2}}>{d.categorie||'Sans catégorie'} — {d.urgent?'Expiré':'Expire le '+fmt(d.date_expiration)}</div>
                    </div>
                    <span style={{fontSize:11,padding:'2px 8px',borderRadius:8,fontWeight:500,background:d.urgent?'#a32d2d':'#854f0b',color:'#fff'}}>{d.urgent?'Expiré':'Bientôt'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={card}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={ct}>Plan de Maîtrise Sanitaire</div>
              <button onClick={()=>setModalDoc(true)} style={btnSmP}><i className="ti ti-plus"/>Ajouter un document</button>
            </div>
            {documents.length===0
              ? <div style={{textAlign:'center',color:'#b4b2a9',padding:32,fontSize:13}}>Aucun document enregistré</div>
              : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {documents.map(d=>(
                    <div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderRadius:10,background:estExpire(d.date_expiration)?'#fcebeb':expireBientot(d.date_expiration)?'#faeeda':'#f8f7f4',border:`0.5px solid ${estExpire(d.date_expiration)?'#f09595':expireBientot(d.date_expiration)?'#fac775':'#e2e0d8'}`}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <i className="ti ti-file-text" style={{color:'#888780',fontSize:16}}/>
                        <div>
                          <div style={{fontSize:13,fontWeight:500,color:'#2c2c2a'}}>{d.nom}</div>
                          <div style={{fontSize:11,color:'#888780',marginTop:2}}>
                            {d.categorie||'Sans catégorie'}{d.date_expiration&&' — Expire le '+fmt(d.date_expiration)}
                          </div>
                        </div>
                      </div>
                      {estExpire(d.date_expiration)&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:8,background:'#a32d2d',color:'#fff',fontWeight:500}}>Expiré</span>}
                      {!estExpire(d.date_expiration)&&expireBientot(d.date_expiration)&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:8,background:'#faeeda',color:'#854f0b',fontWeight:500}}>Bientôt</span>}
                      {!estExpire(d.date_expiration)&&!expireBientot(d.date_expiration)&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:8,background:'#eaf3de',color:'#27500a',fontWeight:500}}>À jour</span>}
                    </div>
                  ))}
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
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Temp. min (°C)</div>
                <input type="number" step="0.5" placeholder="Ex: 0" value={formEquip.temp_min} onChange={e=>setFormEquip({...formEquip,temp_min:e.target.value})} style={inp}/>
              </div>
              <div>
                <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Temp. max (°C)</div>
                <input type="number" step="0.5" placeholder="Ex: 4" value={formEquip.temp_max} onChange={e=>setFormEquip({...formEquip,temp_max:e.target.value})} style={inp}/>
              </div>
            </div>
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
              <div style={{fontSize:12,color:'#888780',marginBottom:5}}>Moment du relevé</div>
              <select value={tempMoment} onChange={e=>setTempMoment(e.target.value)} style={inp}>
                {['Matin','Midi','Soir','Nuit','À chaque service'].map(m=><option key={m} value={m}>{m}</option>)}
              </select>
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
              {equipe.map(m=><option key={m.id} value={m.prenom+' '+m.nom}>{m.prenom} {m.nom}</option>)}
              <option value="Gérant">Gérant</option>
            </select>
          </div>
        </Modal>
      )}

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  )
}