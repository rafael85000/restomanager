'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { getEtablissementActif } from '../../../lib/etablissement'

function fmt(n, d) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
}
function today() {
  return new Date().toLocaleDateString('fr-FR')
}
function sauvegarderCache(etabId, recettes, produits) {
  try { localStorage.setItem(`fimc_recettes_${etabId}`, JSON.stringify({ recettes, produits, ts: Date.now() })) } catch (e) {}
}
function lireCache(etabId) {
  try { const raw = localStorage.getItem(`fimc_recettes_${etabId}`); return raw ? JSON.parse(raw) : null } catch (e) { return null }
}

function Toast({ message, type }) {
  if (!message) return null
  return <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: type === 'err' ? '#a32d2d' : '#27500a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{message}</div>
}

function ModalConfirm({ titre, message, onConfirm, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 400 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#a32d2d', marginBottom: 8 }}>⚠️ {titre}</div>
        <div style={{ fontSize: 13, color: '#5f5e5a', marginBottom: 20, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a' }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: '#a32d2d', color: '#fff' }}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

function ChampPoids({ value, onChange }) {
  const [local, setLocal] = useState('')
  const [focus, setFocus] = useState(false)
  const prevValue = useRef(null)

  useEffect(() => {
    if (!focus && value !== prevValue.current) {
      prevValue.current = value
      setLocal(value === 0 ? '' : String(value).replace('.', ','))
    }
  }, [value, focus])

  const handleFocus = () => {
    setFocus(true)
    setLocal(value === 0 ? '' : String(value).replace('.', ','))
  }

  const handleBlur = () => {
    setFocus(false)
    const num = parseFloat((local || '').replace(',', '.'))
    if (!isNaN(num)) {
      prevValue.current = num
      onChange(num)
      setLocal(num.toFixed(3).replace('.', ','))
    } else {
      onChange(0)
      setLocal('')
    }
  }

  return (
    <input
      type="text" inputMode="decimal" value={local} placeholder="0,000"
      onFocus={handleFocus} onBlur={handleBlur}
      onChange={e => {
        const raw = e.target.value; setLocal(raw)
        const num = parseFloat(raw.replace(',', '.'))
        if (!isNaN(num)) onChange(num)
      }}
      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #534ab7', fontSize: 14, fontWeight: 500, textAlign: 'right', outline: 'none', background: '#f0effe', color: '#2c2c2a' }}
    />
  )
}

const SEPARATEUR_MARKER = -1

const buildIngRow = (item, recetteId, etabId, index) => ({
  recette_id: recetteId,
  produit_id: item.type === 'produit' ? item.produit_id : null,
  recette_id_lie: item.type === 'recette' ? item.recette_id : null,
  sous_recette_id: null,
  poids: item.type === 'vide' ? 0 : (Number(item.poids) || 0),
  quantite: item.type === 'vide' ? 0 : (Number(item.poids) || 0),
  unite: 'kg',
  ordre: index,
  etablissement_id: etabId
})

export default function FichesPage() {
  const etabId = getEtablissementActif()

  const [recettes, setRecettes] = useState([])
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [horsLigne, setHorsLigne] = useState(false)

  const [recetteActive, setRecetteActive] = useState(null)
  const [nomRecette, setNomRecette] = useState('')
  const [procede, setProcede] = useState('')
  const [composition, setComposition] = useState([])
  const [modifie, setModifie] = useState(false)

  const [view, setView] = useState('accueil')
  const [toast, setToast] = useState({ message: '', type: 'ok' })
  const [modalConfirm, setModalConfirm] = useState(null)
  const [showFinancier, setShowFinancier] = useState(true)
  const [searchRecette, setSearchRecette] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [searchIng, setSearchIng] = useState('')
  const [showIngDrop, setShowIngDrop] = useState(false)

  const [modeImpression, setModeImpression] = useState('gestion')
  const [searchPrint, setSearchPrint] = useState('')
  const [showPrintDrop, setShowPrintDrop] = useState(false)
  const [printRecetteId, setPrintRecetteId] = useState(null)
  const [poidsDispos, setPoidsDispos] = useState([0.5, 1, 2.5, 5])
  const [poidsSel, setPoidsSel] = useState(new Set([0.5, 1, 2.5]))
  const [nouveauPoids, setNouveauPoids] = useState('')

  const dropRef = useRef(null)
  const ingDropRef = useRef(null)
  const printDropRef = useRef(null)

  const showToast = useCallback((message, type = 'ok') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: 'ok' }), 3000)
  }, [])

  useEffect(() => {
  if (!etabId) return
  chargerDonnees()
  try {
    const saved = localStorage.getItem(`fimc_poids_${etabId}`)
    if (saved) {
      const { dispos, sel } = JSON.parse(saved)
      setPoidsDispos(dispos)
      setPoidsSel(new Set(sel))
    }
  } catch (e) {}
}, [etabId])

  const chargerDonnees = async () => {
    setLoading(true)
    try {
      const { data: prods, error: eP } = await supabase
        .from('produits').select('id, nom, prix_ht, unite_facturation')
        .eq('etablissement_id', etabId).order('nom')
      if (eP) console.error('Erreur produits:', eP)

      let recs = []
      const { data, error: eR } = await supabase
        .from('recettes').select('*')
        .eq('etablissement_id', etabId).order('nom')
      if (eR) { console.error('Erreur recettes:', eR); recs = [] }
      else { recs = data || [] }

      if (recs.length) {
        const { data: ings } = await supabase
          .from('recette_ingredients')
          .select('id, poids, quantite, produit_id, recette_id_lie, recette_id, ordre')
          .in('recette_id', recs.map(r => r.id))
        if (ings) {
          recs = recs.map(r => ({
            ...r,
            recette_ingredients: ings
              .filter(i => i.recette_id === r.id)
              .sort((a, b) => (Number(a.ordre) ?? 0) - (Number(b.ordre) ?? 0))
          }))
        }
      }

      setRecettes(recs); setProduits(prods || []); setHorsLigne(false)
      sauvegarderCache(etabId, recs, prods || [])
    } catch (e) {
      console.error('Erreur réseau:', e)
      const cache = lireCache(etabId)
      if (cache) { setRecettes(cache.recettes || []); setProduits(cache.produits || []); setHorsLigne(true); showToast('Mode hors ligne', 'err') }
    }
    setLoading(false)
  }

  const calcCoutKgRecette = useCallback((ings) => {
    const valides = ings.filter(i => Number(i.ordre) !== SEPARATEUR_MARKER && (i.produit_id || i.recette_id_lie))
    const poids = valides.reduce((s, i) => s + Number(i.poids || 0), 0)
    const cout = valides.reduce((s, i) => {
      if (i.produit_id) {
        const prod = produits.find(p => p.id === i.produit_id)
        return s + Number(i.poids || 0) * Number(prod?.prix_ht || 0)
      }
      if (i.recette_id_lie) {
        const sousRec = recettes.find(r => r.id === i.recette_id_lie)
        const prixKgSous = sousRec ? calcCoutKgRecette(sousRec.recette_ingredients || []) : 0
        return s + Number(i.poids || 0) * prixKgSous
      }
      return s
    }, 0)
    return poids > 0 ? cout / poids : 0
  }, [produits, recettes])

  const getPrixKg = (item) => {
    if (item.type === 'produit') { const p = produits.find(x => x.id === item.produit_id); return p ? Number(p.prix_ht) : 0 }
    if (item.type === 'recette') {
      const id = item.recette_id || item.recette_id_lie
      const r = recettes.find(x => x.id === id)
      return r ? calcCoutKgRecette(r.recette_ingredients || []) : 0
    }
    return 0
  }
  const getNom = (item) => {
    if (item.type === 'produit') return produits.find(x => x.id === item.produit_id)?.nom || ''
    if (item.type === 'recette') return recettes.find(x => x.id === (item.recette_id || item.recette_id_lie))?.nom || ''
    return ''
  }

  const poidsNet = composition.filter(i => i.type !== 'vide').reduce((s, i) => s + Number(i.poids || 0), 0)
  const coutTotal = composition.filter(i => i.type !== 'vide').reduce((s, i) => s + Number(i.poids || 0) * getPrixKg(i), 0)
  const coutKg = poidsNet > 0 ? coutTotal / poidsNet : 0

  const charger = async () => {
    const nom = searchRecette.trim()
    if (!nom) { showToast('Sélectionnez une recette', 'err'); return }
    const r = recettes.find(x => x.nom.toLowerCase() === nom.toLowerCase())
    if (!r) { showToast(`Recette "${nom}" introuvable`, 'err'); return }
    if (modifie && !window.confirm('Modifications non enregistrées. Continuer ?')) return
    setRecetteActive(r.id); setNomRecette(r.nom); setProcede(r.procede || '')
    setComposition((r.recette_ingredients || [])
      .sort((a, b) => Number(a.ordre) - Number(b.ordre))
      .map(ri => {
        if (!ri.produit_id && !ri.recette_id_lie)
          return { type: 'vide', produit_id: null, recette_id: null, poids: 0 }
        return {
          id: ri.id,
          type: ri.produit_id ? 'produit' : 'recette',
          produit_id: ri.produit_id || null,
          recette_id: ri.recette_id_lie || null,
          poids: Number(ri.poids || ri.quantite || 0)
        }
      }))
    setModifie(false); setShowDrop(false)
    showToast(`Recette "${r.nom}" chargée`)
  }

  const creer = async () => {
    const nom = nomRecette.trim()
    if (!nom) { showToast('Entrez un nom de recette', 'err'); return }
    if (recettes.find(r => r.nom.toLowerCase() === nom.toLowerCase())) { showToast('Ce nom existe déjà', 'err'); return }
    const compoSnap = [...composition]; const procedeSnap = procede
    try {
      const { data: newR, error } = await supabase.from('recettes')
        .insert({ nom, procede: procedeSnap, etablissement_id: etabId }).select().single()
      if (error) throw error
      const rows = compoSnap.map((i, idx) => buildIngRow(i, newR.id, etabId, idx))
      if (rows.length) {
        const { error: eIng } = await supabase.from('recette_ingredients').insert(rows)
        if (eIng) console.error('Erreur ingrédients:', JSON.stringify(eIng))
      }
      setRecetteActive(newR.id); setSearchRecette(nom); setModifie(false)
      await chargerDonnees(); showToast(`Recette "${nom}" créée !`)
    } catch (err) { showToast('Erreur : ' + err.message, 'err') }
  }

  const enregistrer = async () => {
    if (!recetteActive) { showToast('Aucune recette chargée', 'err'); return }
    const nom = nomRecette.trim()
    if (!nom) { showToast('Le nom est obligatoire', 'err'); return }
    const idActif = recetteActive; const compoSnap = [...composition]; const procedeSnap = procede
    try {
      const { error: eUpd } = await supabase.from('recettes').update({ nom, procede: procedeSnap }).eq('id', idActif)
      if (eUpd) throw eUpd
      await supabase.from('recette_ingredients').delete().eq('recette_id', idActif)
      const rows = compoSnap.map((i, idx) => buildIngRow(i, idActif, etabId, idx))
      if (rows.length) {
        const { error: eIng } = await supabase.from('recette_ingredients').insert(rows)
        if (eIng) { console.error('Erreur ingrédients:', JSON.stringify(eIng)); showToast('Erreur ingrédients : ' + eIng.message, 'err'); return }
      }
      setModifie(false); await chargerDonnees(); showToast('Modifications enregistrées !')
    } catch (err) { showToast('Erreur : ' + err.message, 'err') }
  }

  const nettoyer = () => {
    if (modifie && !window.confirm('Modifications non enregistrées. Continuer ?')) return
    setRecetteActive(null); setNomRecette(''); setProcede(''); setComposition([]); setSearchRecette(''); setModifie(false)
    showToast('Formulaire vidé')
  }

  const supprimerRecette = async () => {
    if (!recetteActive) return
    try {
      await supabase.from('recette_ingredients').delete().eq('recette_id', recetteActive)
      await supabase.from('recettes').delete().eq('id', recetteActive)
      await chargerDonnees(); nettoyer(); setModalConfirm(null); showToast('Recette supprimée')
    } catch (err) { showToast('Erreur : ' + err.message, 'err') }
  }

  const ajouterIngredient = (type, id) => {
    setComposition(prev => [...prev, { type, produit_id: type === 'produit' ? id : null, recette_id: type === 'recette' ? id : null, poids: 0 }])
    setSearchIng(''); setShowIngDrop(false); setModifie(true)
  }
  const ajouterLigneVide = () => { setComposition(prev => [...prev, { type: 'vide', produit_id: null, recette_id: null, poids: 0 }]); setModifie(true) }
  const changerPoids = (idx, val) => { setComposition(prev => prev.map((i, n) => n === idx ? { ...i, poids: val } : i)); setModifie(true) }
  const supprimerLigne = (idx) => { setComposition(prev => prev.filter((_, n) => n !== idx)); setModifie(true) }

  const suggIngredients = searchIng.length >= 1 ? [
    ...recettes.filter(r => r.id !== recetteActive && r.nom.toLowerCase().includes(searchIng.toLowerCase())).map(r => ({ type: 'recette', id: r.id, nom: r.nom, prix: calcCoutKgRecette(r.recette_ingredients || []) })),
    ...produits.filter(p => p.nom.toLowerCase().includes(searchIng.toLowerCase())).map(p => ({ type: 'produit', id: p.id, nom: p.nom, prix: Number(p.prix_ht) }))
  ] : []

  const suggRecettes = recettes.filter(r => r.nom.toLowerCase().includes(searchRecette.toLowerCase()))

  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target)) setShowDrop(false)
      if (!ingDropRef.current?.contains(e.target)) setShowIngDrop(false)
      if (!printDropRef.current?.contains(e.target)) setShowPrintDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const printRecette = recettes.find(r => r.id === printRecetteId)
  const printCoutKg = printRecette ? calcCoutKgRecette(printRecette.recette_ingredients || []) : 0

  // ── PDF : reproduit exactement l'aperçu web via html2canvas ──
  // On capture #print-apercu et on le met dans le PDF
  const exporterPDF = async (recetteId, mode) => {
    const r = recettes.find(x => x.id === recetteId)
    if (!r) return
    showToast('Génération du PDF…')

    // Forcer le bon mode avant la capture
    const el = document.getElementById('print-apercu')
    if (!el) { showToast('Prévisualisez la recette d\'abord', 'err'); return }

    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 10
      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width

      doc.addImage(imgData, 'PNG', margin, margin, imgW, Math.min(imgH, pageH - margin * 2))
      doc.save(`fiche_${r.nom.replace(/\s+/g, '_')}.pdf`)
      showToast('PDF téléchargé !')
    } catch (err) {
      console.error('Erreur PDF:', err)
      showToast('Erreur PDF : ' + err.message, 'err')
    }
  }

  const card = { background: '#fff', borderRadius: 12, border: '0.5px solid #e2e0d8', padding: 16 }
  const inp = { padding: '7px 10px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%' }
  const btn = { padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }
  const btnP = { ...btn, background: '#534ab7', color: '#fff', border: 'none' }
  const ct = { fontSize: 11, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
  const drop = { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '0.5px solid #d3d1c7', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 200, marginTop: 3, maxHeight: 220, overflowY: 'auto' }
  const sg = { padding: '4px 10px', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', background: '#f8f7f4' }
  const si = { padding: '8px 10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderBottom: '0.5px solid #f1efe8', color: '#2c2c2a' }
  const badge = (type) => ({ fontSize: 10, padding: '1px 5px', borderRadius: 8, fontWeight: 500, whiteSpace: 'nowrap', background: type === 'recette' ? '#eeedfe' : '#e6f1fb', color: type === 'recette' ? '#3c3489' : '#0c447c' })
  const chip = (on) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: on ? '#eeedfe' : '#fff', border: `0.5px solid ${on ? '#afa9ec' : '#d3d1c7'}`, color: on ? '#3c3489' : '#5f5e5a', fontWeight: on ? 500 : 400 })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#888780', fontSize: 14 }}>Chargement…</div>
if (view === 'accueil') return (
  <div style={{ background: '#f8f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 32, maxWidth: 700, width: '100%' }}>
      <div onClick={() => setView('edition')} style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e2e0d8', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(83,74,183,0.12)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ width: 64, height: 64, background: '#eeedfe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🍽️</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#2c2c2a', marginBottom: 6 }}>Fiches recettes</div>
          <div style={{ fontSize: 13, color: '#888780', lineHeight: 1.5 }}>Créer, modifier et gérer vos recettes</div>
        </div>
      </div>
      <div onClick={() => setView('impression')} style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e2e0d8', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(83,74,183,0.12)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ width: 64, height: 64, background: '#eaf3de', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🖨️</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#2c2c2a', marginBottom: 6 }}>Imprimer / Télécharger</div>
          <div style={{ fontSize: 13, color: '#888780', lineHeight: 1.5 }}>Exporter vos fiches en PDF</div>
        </div>
      </div>
    </div>
  </div>
)
  return (
    <div style={{ background: '#f8f7f4', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* CSS impression — 1 seule page */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body * { visibility: hidden !important; }
          #print-apercu { visibility: visible !important; position: absolute; top: 0; left: 0; width: 100%; background: #fff !important; border-radius: 0 !important; border: none !important; }
          #print-apercu * { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>

      {view === 'edition' && (
        <div style={{ background: '#fff', borderBottom: '0.5px solid #e2e0d8', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 46, height: 46, border: '1.5px dashed #d3d1c7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontSize: 9, color: '#888780', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🍽️</span><span style={{ fontSize: 8 }}>Logo</span>
          </div>
          <div ref={dropRef} style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <input value={searchRecette} onChange={e => { setSearchRecette(e.target.value); setShowDrop(true) }} onFocus={() => setShowDrop(true)}
              placeholder="Rechercher une recette…" style={{ ...inp, fontSize: 15, fontWeight: 500, paddingRight: 36 }} autoComplete="off" />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#888780', pointerEvents: 'none' }}>▾</span>
            {showDrop && (
              <div style={drop}>
                {suggRecettes.length > 0 && <>
                  <div style={sg}>Recettes — sélectionner puis cliquer Charger</div>
                  {suggRecettes.map(r => (
                    <div key={r.id} style={si} onMouseEnter={e => e.currentTarget.style.background = '#f8f7f4'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      onClick={() => { setSearchRecette(r.nom); setShowDrop(false) }}>
                      <span>{r.nom}</span>
                      <span style={{ fontSize: 11, color: '#888780' }}>{fmt(calcCoutKgRecette(r.recette_ingredients || []), 2)} €/kg</span>
                    </div>
                  ))}
                </>}
                {searchRecette.trim() && !recettes.find(r => r.nom.toLowerCase() === searchRecette.toLowerCase()) && (
                  <div style={{ padding: '8px 10px', fontSize: 12, color: '#534ab7', background: '#f8f7f4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, borderTop: '0.5px solid #e2e0d8' }}
                    onClick={() => { setNomRecette(searchRecette.trim()); setProcede(''); setComposition([]); setRecetteActive(null); setModifie(false); setShowDrop(false) }}>
                    ＋ Préparer la création de "{searchRecette.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>
          {horsLigne && <span style={{ fontSize: 11, background: '#fcebeb', color: '#a32d2d', padding: '3px 8px', borderRadius: 8, fontWeight: 500 }}>📶 Hors ligne</span>}
          {modifie && <span style={{ fontSize: 11, background: '#faeeda', color: '#854f0b', padding: '3px 8px', borderRadius: 8, fontWeight: 500 }}>● Non enregistré</span>}
        </div>
      )}

      {view === 'edition' && (
        <>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '7px 20px', background: '#fff', borderBottom: '0.5px solid #e2e0d8', alignItems: 'center' }}>
            <button onClick={() => setView('accueil')} style={{ ...btn, fontSize: 13 }}>← Accueil</button>
            <button onClick={creer} style={btnP}>＋ Créer</button>
            <button onClick={charger} style={{ ...btn, background: '#eeedfe', color: '#3c3489', border: '0.5px solid #afa9ec' }}>📂 Charger</button>
            <button onClick={enregistrer} style={{ ...btn, background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #85b7eb' }}>💾 Enregistrer</button>
            <button onClick={nettoyer} style={btn}>🧹 Nettoyer</button>
            <button onClick={() => recetteActive && setModalConfirm({ action: supprimerRecette, titre: `Supprimer "${nomRecette}" ?`, message: 'Cette action est irréversible.' })} style={{ ...btn, background: '#fcebeb', color: '#a32d2d', border: '0.5px solid #f09595' }}>🗑 Supprimer</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setView('impression')} style={{ ...btn, background: '#eaf3de', color: '#27500a', border: '0.5px solid #97c459' }}>🖨 Imprimer / Exporter</button>
          </div>

          <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={card}>
                  <div style={ct}>Informations</div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#5f5e5a', marginBottom: 3, display: 'block' }}>Nom de la recette *</label>
                  <input value={nomRecette} onChange={e => { setNomRecette(e.target.value); setModifie(true) }} placeholder="Ex : Mousse Praliné…" style={inp} />
                </div>

                <div style={card}>
                  <div style={ct}>
                    <span>Ingrédients</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#5f5e5a', cursor: 'pointer', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      <input type="checkbox" checked={showFinancier} onChange={e => setShowFinancier(e.target.checked)} style={{ accentColor: '#534ab7' }} /> Afficher prix
                    </label>
                  </div>
                  <div ref={ingDropRef} style={{ position: 'relative', marginBottom: 8 }}>
                    <input value={searchIng} onChange={e => { setSearchIng(e.target.value); setShowIngDrop(true) }} onFocus={() => setShowIngDrop(true)}
                      placeholder="Rechercher un produit ou sous-recette…" style={{ ...inp, fontSize: 12 }} autoComplete="off" />
                    {showIngDrop && suggIngredients.length > 0 && (
                      <div style={drop}>
                        {suggIngredients.filter(x => x.type === 'recette').length > 0 && <>
                          <div style={sg}>Sous-recettes</div>
                          {suggIngredients.filter(x => x.type === 'recette').map(e => (
                            <div key={e.id} style={si} onMouseEnter={ev => ev.currentTarget.style.background = '#f8f7f4'} onMouseLeave={ev => ev.currentTarget.style.background = '#fff'} onClick={() => ajouterIngredient('recette', e.id)}>
                              <span>{e.nom} <span style={badge('recette')}>Recette</span></span>
                              <span style={{ fontSize: 11, color: '#888780' }}>{fmt(e.prix, 2)} €/kg</span>
                            </div>
                          ))}
                        </>}
                        {suggIngredients.filter(x => x.type === 'produit').length > 0 && <>
                          <div style={sg}>Produits mercuriale</div>
                          {suggIngredients.filter(x => x.type === 'produit').map(e => (
                            <div key={e.id} style={si} onMouseEnter={ev => ev.currentTarget.style.background = '#f8f7f4'} onMouseLeave={ev => ev.currentTarget.style.background = '#fff'} onClick={() => ajouterIngredient('produit', e.id)}>
                              <span>{e.nom} <span style={badge('produit')}>Produit</span></span>
                              <span style={{ fontSize: 11, color: '#888780' }}>{fmt(e.prix, 2)} €/kg</span>
                            </div>
                          ))}
                        </>}
                      </div>
                    )}
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', borderBottom: '0.5px solid #e2e0d8', width: '40%' }}>Ingrédient</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', borderBottom: '0.5px solid #e2e0d8', width: 120 }}>Poids (kg)</th>
                        {showFinancier && <>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', borderBottom: '0.5px solid #e2e0d8', width: 70 }}>€/kg</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', borderBottom: '0.5px solid #e2e0d8', width: 65 }}>Coût</th>
                        </>}
                        <th style={{ width: 28, borderBottom: '0.5px solid #e2e0d8' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {composition.length === 0 && (
                        <tr><td colSpan={showFinancier ? 5 : 3} style={{ padding: 20, textAlign: 'center', color: '#b4b2a9', fontSize: 12 }}>Aucun ingrédient — recherchez ci-dessus</td></tr>
                      )}
                      {composition.map((item, idx) => {
                        const estVide = item.type === 'vide'
                        const prix = estVide ? 0 : getPrixKg(item)
                        const cout = estVide ? 0 : Number(item.poids || 0) * prix
                        const nom = estVide ? '' : getNom(item)
                        return (
                          <tr key={idx} style={{ borderBottom: '0.5px solid #f1efe8', background: estVide ? '#fafaf8' : undefined }}>
                            <td style={{ padding: '6px 8px' }}>
                              {estVide
                                ? <span style={{ color: '#d3d1c7', fontSize: 11, fontStyle: 'italic' }}>— séparateur —</span>
                                : <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ flex: 1, fontSize: 12, color: '#2c2c2a', fontWeight: 500 }}>{nom || <span style={{ color: '#b4b2a9' }}>—</span>}</span>
                                    {nom && <span style={badge(item.type)}>{item.type === 'recette' ? 'Recette' : 'Produit'}</span>}
                                  </div>
                              }
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                              {!estVide && <ChampPoids value={Number(item.poids) || 0} onChange={val => changerPoids(idx, val)} />}
                            </td>
                            {showFinancier && <>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, color: '#5f5e5a' }}>{!estVide && nom ? fmt(prix, 2) + ' €' : ''}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, color: '#5f5e5a' }}>{!estVide && nom ? fmt(cout, 2) + ' €' : ''}</td>
                            </>}
                            <td style={{ padding: '6px 8px' }}>
                              <button onClick={() => supprimerLigne(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d', fontSize: 13, padding: 3 }}>✕</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <button onClick={ajouterLigneVide} style={{ width: '100%', padding: 6, border: '1.5px dashed #d3d1c7', borderRadius: 8, background: 'transparent', color: '#888780', fontSize: 11, cursor: 'pointer', marginTop: 6 }}>＋ Ajouter un séparateur</button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                    {[['Poids masse net', fmt(poidsNet, 3) + ' kg'], ['Coût total', fmt(coutTotal, 2) + ' €']].map(([l, v]) => (
                      <div key={l} style={{ background: '#f8f7f4', borderRadius: 10, padding: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 18, fontWeight: 500, color: '#2c2c2a' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={card}>
                  <div style={ct}>Procédé</div>
                  <textarea value={procede} onChange={e => { setProcede(e.target.value); setModifie(true) }}
                    placeholder="1. Faire fondre le praliné...&#10;2. Monter la crème..."
                    style={{ ...inp, minHeight: 100, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#534ab7', color: '#fff', borderRadius: 12, padding: 18 }}>
                  {[['Poids total', Math.round(poidsNet * 1000) + ' g', false], ['Coût total', fmt(coutTotal, 2) + ' €', false], ['Coût au kg', fmt(coutKg, 2) + ' €', true]].map(([l, v, big], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: i < 2 ? '0.5px solid rgba(255,255,255,0.15)' : 'none' }}>
                      <span style={{ fontSize: 12, opacity: 0.85 }}>{l}</span>
                      <span style={{ fontSize: big ? 20 : 13, fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <div style={ct}>Détail du coût</div>
                  {composition.filter(i => i.type !== 'vide').length === 0
                    ? <p style={{ fontSize: 12, color: '#888780' }}>Ajoutez des ingrédients.</p>
                    : composition.filter(i => i.type !== 'vide').map((item, idx) => {
                        const prix = getPrixKg(item); const cout = Number(item.poids || 0) * prix; const nom = getNom(item)
                        return (
                          <React.Fragment key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#5f5e5a', borderBottom: '0.5px solid #f1efe8' }}>
                              <span>{nom || '?'} ({Math.round(Number(item.poids || 0) * 1000)}g)</span>
                              <span>{fmt(cout, 2)} €</span>
                            </div>
                            {item.type === 'recette' && <div style={{ paddingLeft: 12, fontSize: 11, color: '#888780' }}>↳ coût/kg : {fmt(prix, 2)} €</div>}
                          </React.Fragment>
                        )
                      })
                  }
                </div>
                {recettes.length > 0 && (
                  <div style={card}>
                    <div style={ct}>Mes recettes ({recettes.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                      {recettes.map(r => (
                        <div key={r.id} onClick={() => setSearchRecette(r.nom)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: recetteActive === r.id ? '#eeedfe' : '#f8f7f4', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: recetteActive === r.id ? '#3c3489' : '#2c2c2a', fontWeight: recetteActive === r.id ? 500 : 400 }}>
                          <span>{r.nom}</span>
                          <span style={{ fontSize: 11, color: '#888780' }}>{fmt(calcCoutKgRecette(r.recette_ingredients || []), 2)} €/kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ background: '#eeedfe', border: '0.5px solid #cecbf6', borderRadius: 10, padding: 10, display: 'flex', gap: 7 }}>
                  <span style={{ fontSize: 14, color: '#534ab7', flexShrink: 0 }}>ℹ️</span>
                  <p style={{ fontSize: 11, color: '#3c3489', lineHeight: 1.6, margin: 0 }}>Les ingrédients de type <strong>Recette</strong> utilisent le coût/kg de la sous-recette, mis à jour automatiquement.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'impression' && (
        <>
          <div style={{ background: '#fff', borderBottom: '0.5px solid #e2e0d8', padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div ref={printDropRef} style={{ width: 260, position: 'relative', flexShrink: 0 }}>
              <input value={searchPrint} onChange={e => { setSearchPrint(e.target.value); setShowPrintDrop(true) }} onFocus={() => setShowPrintDrop(true)}
                placeholder="Sélectionner une recette…" style={{ ...inp, fontSize: 13, paddingRight: 30 }} autoComplete="off" />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#888780', pointerEvents: 'none', fontSize: 12 }}>▾</span>
              {showPrintDrop && (
                <div style={drop}>
                  <div style={sg}>Cliquer pour charger</div>
                  {recettes.filter(r => r.nom.toLowerCase().includes(searchPrint.toLowerCase())).map(r => (
                    <div key={r.id} style={si} onMouseEnter={e => e.currentTarget.style.background = '#f8f7f4'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      onClick={() => { setPrintRecetteId(r.id); setSearchPrint(r.nom); setShowPrintDrop(false) }}>
                      <span>{r.nom}</span>
                      <span style={{ fontSize: 11, color: '#888780' }}>{fmt(calcCoutKgRecette(r.recette_ingredients || []), 2)} €/kg</span>
                    </div>
                  ))}
                  {recettes.filter(r => r.nom.toLowerCase().includes(searchPrint.toLowerCase())).length === 0 && (
                    <div style={{ ...si, color: '#b4b2a9' }}>Aucune recette trouvée</div>
                  )}
                </div>
              )}
            </div>
            <div style={{ width: 1, height: 28, background: '#e2e0d8', flexShrink: 0 }} />
            <button onClick={() => setModeImpression('gestion')} style={{ ...btn, padding: '8px 14px', fontSize: 13, ...(modeImpression === 'gestion' ? { background: '#534ab7', color: '#fff', border: 'none' } : {}) }}>📊 Mode Gestion</button>
            <button onClick={() => setModeImpression('cuisine')} style={{ ...btn, padding: '8px 14px', fontSize: 13, ...(modeImpression === 'cuisine' ? { background: '#534ab7', color: '#fff', border: 'none' } : {}) }}>👨‍🍳 Mode Cuisine</button>
            <div style={{ width: 1, height: 28, background: '#e2e0d8', flexShrink: 0 }} />
            {/* Poids — chips cochables + boutons supprimer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                {poidsDispos.map(p => (
                  <label key={p} style={chip(poidsSel.has(p))}>
                    <input type="checkbox" checked={poidsSel.has(p)} onChange={() => { const n = new Set(poidsSel); n.has(p) ? n.delete(p) : n.add(p); setPoidsSel(n) }} style={{ display: 'none' }} />
                    {fmt(p, p < 1 ? 3 : (p % 1 === 0 ? 0 : 1))} kg
                  </label>
                ))}
                <input type="text" inputMode="decimal" value={nouveauPoids} onChange={e => setNouveauPoids(e.target.value)} placeholder="kg…" style={{ width: 52, padding: '5px 7px', borderRadius: 7, border: '0.5px solid #d3d1c7', fontSize: 12, outline: 'none' }} />
                <button onClick={() => {
                  const val = parseFloat(nouveauPoids.replace(',', '.'))
                  if (!val || val <= 0) return
                 const newDispos = poidsDispos.includes(val) ? poidsDispos : [...poidsDispos, val].sort((a, b) => a - b)
                  const newSel = new Set([...poidsSel, val])
                  setPoidsDispos(newDispos); setPoidsSel(newSel); setNouveauPoids('')
                  try { localStorage.setItem(`fimc_poids_${etabId}`, JSON.stringify({ dispos: newDispos, sel: [...newSel] })) } catch (e) {}
                }} style={{ ...btn, padding: '5px 10px', fontSize: 12 }}>+ Ajouter</button>
              </div>
              {/* Boutons supprimer poids */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {poidsDispos.map(p => (
                  <button key={p} onClick={() => {
                    const newDispos = poidsDispos.filter(x => x !== p)
                    const newSel = new Set(poidsSel); newSel.delete(p)
                    setPoidsDispos(newDispos); setPoidsSel(newSel)
                    try { localStorage.setItem(`fimc_poids_${etabId}`, JSON.stringify({ dispos: newDispos, sel: [...newSel] })) } catch (e) {}
                  }} style={{ ...btn, padding: '2px 7px', fontSize: 10, background: '#fcebeb', color: '#a32d2d', border: '0.5px solid #f09595' }}>
                    ✕ {fmt(p, p < 1 ? 3 : (p % 1 === 0 ? 0 : 1))} kg
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }} />
           <button onClick={() => setView('accueil')} style={{ ...btn, padding: '8px 14px', fontSize: 13 }}>← Retour</button>
            <button onClick={() => window.print()} style={{ ...btn, background: '#eaf3de', color: '#27500a', border: '0.5px solid #97c459', padding: '8px 14px', fontSize: 13 }}>🖨 Imprimer</button>
            <button onClick={() => printRecetteId && exporterPDF(printRecetteId, modeImpression)} style={{ ...btn, background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #85b7eb', padding: '8px 14px', fontSize: 13 }}>⬇ Télécharger PDF</button>
          </div>

          <div style={{ maxWidth: 900, margin: '16px auto', padding: '0 16px 32px' }}>
            {!printRecette
              ? <div style={{ textAlign: 'center', color: '#888780', padding: 40, fontSize: 13 }}>Sélectionnez une recette ci-dessus pour prévisualiser</div>
              : (
                <div id="print-apercu" style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e2e0d8', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px', borderBottom: '2px solid #2c2c2a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '0.5px solid #e2e0d8', padding: 10 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #2c2c2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 500, color: '#2c2c2a', textAlign: 'center', lineHeight: 1.3 }}>
                        <span style={{ fontSize: 6 }}>2026</span><span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>LOGO</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', textAlign: 'center' }}>
                      <h1 style={{ fontSize: 20, fontWeight: 500, color: '#2c2c2a', margin: 0 }}>{printRecette.nom}</h1>
                    </div>
                    <div style={{ borderLeft: '0.5px solid #e2e0d8', padding: '10px 12px', fontSize: 10, color: '#888780', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</span><span style={{ fontWeight: 500, color: '#2c2c2a' }}>{today()}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>Réf.</span><span style={{ fontWeight: 500, color: '#2c2c2a' }}>R-{String(recettes.indexOf(printRecette) + 1).padStart(3, '0')}</span></div>
                    </div>
                  </div>
                  <div style={{ background: '#2c2c2a', color: '#fff', fontSize: 12, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 16px' }}>Composition</div>
                  {(() => {
                  const ings = (printRecette.recette_ingredients || [])
  .sort((a, b) => Number(a.ordre) - Number(b.ordre))
                    const pArr = [...poidsDispos].filter(p => poidsSel.has(p)).sort((a, b) => a - b)
                    const pN = ings.reduce((s, i) => s + Number(i.poids || 0), 0)
                    const coef = pN > 0 ? 1 / pN : 0
                    const ths = { padding: '7px 9px', textAlign: 'center', fontSize: 10, fontWeight: 500, color: '#5f5e5a', textTransform: 'uppercase', borderBottom: '1.5px solid #2c2c2a', background: '#f8f7f4' }
                    const tds = { textAlign: 'center', padding: '6px 9px', borderBottom: '0.5px solid #f1efe8', fontSize: 12 }
                    return (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th style={{ ...ths, textAlign: 'left' }}>Ingrédients</th>
                            {pArr.map(p => <th key={p} style={ths}>{fmt(p, p < 1 ? 3 : (p % 1 === 0 ? 0 : 1))} kg</th>)}
                            {modeImpression === 'gestion' && <th style={{ ...ths, color: '#3c3489', background: '#eeedfe' }}>€/kg</th>}
                          </tr>
                        </thead>
                        <tbody>
                         {ings.map((ing, i) => {
  if (!ing.produit_id && !ing.recette_id_lie) return (
    <tr key={i}>
      <td colSpan={pArr.length + 1 + (modeImpression === 'gestion' ? 1 : 0)} style={{ padding: '4px 9px', borderBottom: '0.5px solid #e2e0d8', background: '#f8f7f4' }}>
        <div style={{ height: 1, background: '#e2e0d8' }} />
      </td>
    </tr>
  )
  const prod = produits.find(p => p.id === ing.produit_id)
                            const sousRec = recettes.find(r => r.id === ing.recette_id_lie)
                            const nom = prod?.nom || sousRec?.nom || '—'
                            const prix = prod ? Number(prod.prix_ht || 0) : (sousRec ? calcCoutKgRecette(sousRec.recette_ingredients || []) : 0)
  const poids = Number(ing.poids || 0)
  return (
    <tr key={i}>
      <td style={{ ...tds, textAlign: 'left', fontWeight: 500 }}>{nom}</td>
      {pArr.map(p => <td key={p} style={tds}>{fmt(poids * coef * p, 3)}</td>)}
      {modeImpression === 'gestion' && <td style={{ ...tds, color: '#3c3489', fontWeight: 500, background: '#fbfaf9' }}>{fmt(prix, 2)} €</td>}
    </tr>
  )
})}
                          {[0, 1, 2].map(i => (
                            <tr key={'e' + i}>
                              <td style={{ ...tds, textAlign: 'left', color: '#d3d1c7' }}>—</td>
                              {pArr.map(p => <td key={p} style={{ ...tds, color: '#d3d1c7' }}>—</td>)}
                              {modeImpression === 'gestion' && <td style={{ ...tds, color: '#d3d1c7', background: '#fbfaf9' }}>—</td>}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td style={{ padding: '8px 9px', fontWeight: 500, fontSize: 12, background: '#f1efe8', borderTop: '2px solid #2c2c2a' }}>Poids de masse net</td>
                            {pArr.map(p => <td key={p} style={{ textAlign: 'center', padding: '8px 9px', fontWeight: 500, fontSize: 12, background: '#f1efe8', borderTop: '2px solid #2c2c2a' }}>{fmt(p, p < 1 ? 3 : (p % 1 === 0 ? 0 : 1))}</td>)}
                            {modeImpression === 'gestion' && <td style={{ textAlign: 'center', padding: '8px 9px', background: '#eeedfe', borderTop: '2px solid #2c2c2a', color: '#3c3489' }}>—</td>}
                          </tr>
                        </tfoot>
                      </table>
                    )
                  })()}
                  {modeImpression === 'gestion' && (
                    <div style={{ background: '#eeedfe', padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#534ab7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Coût / kg fini</div>
                      <div style={{ fontSize: 26, fontWeight: 500, color: '#3c3489' }}>{fmt(printCoutKg, 2)} €</div>
                    </div>
                  )}
                  {printRecette.procede && (
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Procédé</div>
                      <div style={{ fontSize: 12, color: '#2c2c2a', lineHeight: 1.8 }}>
                        {printRecette.procede.split('\n').map((l, i) => <div key={i}>{l}</div>)}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '7px 16px', fontSize: 10, color: '#b4b2a9', textAlign: 'center', borderTop: '0.5px solid #e2e0d8' }}>
                    FIMC — Fiche générée le {today()} — Gestion food & métiers de bouche
                  </div>
                </div>
              )
            }
          </div>
        </>
      )}

      {modalConfirm && <ModalConfirm titre={modalConfirm.titre} message={modalConfirm.message} onConfirm={modalConfirm.action} onClose={() => setModalConfirm(null)} />}
      <Toast message={toast.message} type={toast.type} />
    </div>
  )
}